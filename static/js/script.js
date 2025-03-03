// Main application script
import { setupPinInputs, getPin, resetPin } from './pin.js';
import { initializeSocket, joinSession, updateFileStatus } from './socketManager.js';
import { 
    showScreen, updateResultsView, 
    setupFileInput, showUploadProgress, updateSessionCode,
    updateConnectionStatus, resetFileInput
} from './uiManager.js';
import { uploadPhotos, checkSession, downloadFavorites } from './apiClient.js';
import { initTinder } from './tinder.js';

// Global variables
let currentSessionCode = '';
let currentRole = '';
let currentFiles = [];
let tinderInstance = null;

// Handle session updates from socket
function handleSessionUpdate(data) {
    currentFiles = data.files;
    
    if (currentRole === 'selector') {
        console.log('Selector received files:', currentFiles);
        
        // Filter only undecided files
        const undecidedFiles = currentFiles.filter(file => file.status === 'undecided');
        console.log('Undecided files:', undecidedFiles.length);
        
        // Make sure we're showing the selector screen
        if (!document.getElementById('selector-screen').classList.contains('active')) {
            showScreen('selector');
        }
        
        // Update tinder view with undecided files
        if (tinderInstance) {
            tinderInstance.refresh(undecidedFiles);
            
            // Check if there are no more files to select
            if (undecidedFiles.length === 0) {
                // Show a message
                const tinderCards = document.querySelector('.tinder--cards');
                if (tinderCards) {
                    tinderCards.innerHTML = '<div class="empty-message">No more photos to select</div>';
                }
            }
        } else {
            // If tinderInstance doesn't exist yet, create it
            tinderInstance = initTinder(handleFavorite, handleDiscard);
            tinderInstance.refresh(undecidedFiles);
        }
    } else if (currentRole === 'uploader') {
        // Update results view with favorites
        const favorites = currentFiles.filter(file => file.status === 'favorite');
        
        // Update favorites count
        const favoritesCount = document.getElementById('favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = `${favorites.length} ${favorites.length === 1 ? 'photo' : 'photos'}`;
        }
        
        // If selector is connected and we're in the session code screen, show results screen
        if (data.selector_connected && document.getElementById('session-code-screen').classList.contains('active')) {
            showScreen('results');
        }
        
        updateResultsView(favorites);
    }
}

// Handle file status updates from socket
function handleFileStatusUpdate(data) {
    // Update the status in our local files array
    const file = currentFiles.find(f => f.id === data.file_id);
    if (file) {
        file.status = data.status;
    }
    
    if (currentRole === 'uploader') {
        // Only show favorites in results view
        const favorites = currentFiles.filter(file => file.status === 'favorite');
        
        // Update favorites count
        const favoritesCount = document.getElementById('favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = `${favorites.length} ${favorites.length === 1 ? 'photo' : 'photos'}`;
        }
        
        updateResultsView(favorites);
    }
}

// Handle when a selector joins
function handleSelectorJoined(data) {
    updateConnectionStatus(true);
    
    if (currentRole === 'uploader') {
        // Show the results screen for the uploader
        showScreen('results');
        
        // Only show favorites in results view
        const favorites = currentFiles.filter(file => file.status === 'favorite');
        updateResultsView(favorites);
    }
}

// Handle favorite selection
function handleFavorite(fileId) {
    updateFileStatus(currentSessionCode, fileId, 'favorite');
    
    // Update UI without waiting for server response
    const file = currentFiles.find(f => f.id === fileId);
    if (file) {
        file.status = 'favorite';
    }
}

// Handle discard selection
function handleDiscard(fileId) {
    updateFileStatus(currentSessionCode, fileId, 'discard');
    
    // Update UI without waiting for server response
    const file = currentFiles.find(f => f.id === fileId);
    if (file) {
        file.status = 'discard';
    }
}

// Upload photos handler
async function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('Please select at least one photo to upload');
        return;
    }
    
    try {
        showUploadProgress(true);
        
        const data = await uploadPhotos(files);
        currentSessionCode = data.session_code;
        updateSessionCode(currentSessionCode);
        
        // Join the session as uploader
        await initiateSession(currentSessionCode, 'uploader');
        
        // Show session code screen
        showScreen('sessionCode');
    } catch (error) {
        console.error('Error:', error);
        alert('Upload failed: ' + error.message);
        showUploadProgress(false);
    }
}

// Join session handler
async function handleJoinSession() {
    const pin = getPin();
    
    if (pin.length !== 4) {
        alert('Please enter a valid 4-digit PIN');
        return;
    }
    
    try {
        await initiateSession(pin, 'selector');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to join session: ' + error.message);
    }
}

// Initiate a session (either as uploader or selector)
async function initiateSession(sessionCode, role) {
    currentSessionCode = sessionCode;
    currentRole = role;
    
    // Check if session exists
    await checkSession(sessionCode);
    
    // Join the socket session
    joinSession(sessionCode, role);
    
    // Show appropriate screen based on role
    if (role === 'selector') {
        // Make sure we show the selector screen first
        showScreen('selector');
        
        // Make sure the Tinder component is visible
        const tinderComponent = document.querySelector('.tinder');
        if (tinderComponent) {
            tinderComponent.style.display = 'flex';
        }
        
        // Initialize Tinder component
        console.log('Initializing Tinder component for selector');
        tinderInstance = initTinder(handleFavorite, handleDiscard);
    } else if (role === 'uploader') {
        // For uploader, show session code screen
        showScreen('sessionCode');
    }
}

// Reset app state
function resetApp() {
    currentSessionCode = '';
    currentRole = '';
    currentFiles = [];
    tinderInstance = null;
    
    // Reset UI elements
    resetFileInput();
    resetPin();
    showUploadProgress(false);
    
    // Show home screen
    showScreen('home');
}

// Initialize the application
function initApp() {
    // Setup PIN inputs
    setupPinInputs();
    
    // Setup file input
    setupFileInput();
    
    // Initialize socket connection
    initializeSocket(handleSessionUpdate, handleFileStatusUpdate, handleSelectorJoined);
    
    // Setup event listeners
    document.getElementById('upload-btn').addEventListener('click', () => {
        showScreen('upload');
    });
    
    document.getElementById('join-session-btn').addEventListener('click', handleJoinSession);
    
    document.getElementById('upload-form').addEventListener('submit', handleUpload);
    
    document.getElementById('download-favorites-btn').addEventListener('click', () => {
        downloadFavorites(currentSessionCode);
    });
    
    document.getElementById('back-to-home-btn').addEventListener('click', resetApp);
    
    // Add close button functionality for tinder view
    const closeButton = document.getElementById('close-tinder');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            // Go back to home screen
            resetApp();
        });
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);