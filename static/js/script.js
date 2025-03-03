// Main application script
import { setupPinInputs, getPin, resetPin } from './pin.js';
import { initializeSocket, joinSession, updateFileStatus } from './socketManager.js';
import { 
    showScreen, updateSelectorView, updateResultsView, 
    setupFileInput, showUploadProgress, updateSessionCode,
    updateConnectionStatus, resetFileInput
} from './uiManager.js';
import { uploadPhotos, checkSession, downloadFavorites } from './apiClient.js';

// Global variables
let currentSessionCode = '';
let currentRole = '';
let currentFiles = [];

// Handle session updates from socket
function handleSessionUpdate(data) {
    currentFiles = data.files;
    
    if (currentRole === 'selector') {
        updateSelectorView(currentFiles, handleFileStatusChange);
    } else if (currentRole === 'uploader' && document.getElementById('results-screen').classList.contains('active')) {
        updateResultsView(currentFiles);
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
        updateResultsView(currentFiles);
    }
}

// Handle when a selector joins
function handleSelectorJoined(data) {
    updateConnectionStatus(true);
}

// Handle file status change by the selector
function handleFileStatusChange(fileId, status) {
    updateFileStatus(currentSessionCode, fileId, status);
    
    // Update UI without waiting for server response
    const file = currentFiles.find(f => f.id === fileId);
    if (file) {
        file.status = status;
        updateSelectorView(currentFiles, handleFileStatusChange);
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
    
    // Show appropriate screen
    if (role === 'selector') {
        showScreen('selector');
    }
}

// Reset app state
function resetApp() {
    currentSessionCode = '';
    currentRole = '';
    currentFiles = [];
    
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
    
    document.getElementById('view-results-btn').addEventListener('click', () => {
        showScreen('results');
        updateResultsView(currentFiles);
    });
    
    document.getElementById('download-favorites-btn').addEventListener('click', () => {
        downloadFavorites(currentSessionCode);
    });
    
    document.getElementById('back-to-home-btn').addEventListener('click', resetApp);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);