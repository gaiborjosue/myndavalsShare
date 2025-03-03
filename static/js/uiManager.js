// UI Management functions

// Show a specific screen and hide others
export function showScreen(screenName) {
  const screens = {
      home: document.getElementById('home-screen'),
      upload: document.getElementById('upload-screen'),
      sessionCode: document.getElementById('session-code-screen'),
      selector: document.getElementById('selector-screen'),
      results: document.getElementById('results-screen')
  };
  
  // Hide all screens
  Object.values(screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
  });
  
  // Show the requested screen
  if (screens[screenName]) {
      screens[screenName].classList.add('active');
  }
}

// Update the selector view with photos to choose from
export function updateSelectorView(files, onFileStatusUpdate) {
  const photosContainer = document.getElementById('photos-to-select');
  if (!photosContainer) return;
  
  photosContainer.innerHTML = '';
  
  // Filter undecided files
  const undecidedFiles = files.filter(file => file.status === 'undecided');
  
  if (undecidedFiles.length === 0) {
      photosContainer.innerHTML = '<p style="text-align:center;">No photos to select</p>';
      return;
  }
  
  undecidedFiles.forEach(file => {
      const photoDiv = document.createElement('div');
      photoDiv.classList.add('photo-item');
      
      // Use data_url if available, otherwise fallback to API endpoint
      const imgSrc = file.data_url || `/api/images/${file.image_id}`;
      
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = 'Photo';
      
      const actionButtons = document.createElement('div');
      actionButtons.classList.add('action-buttons');
      
      const favoriteBtn = document.createElement('button');
      favoriteBtn.classList.add('action-button', 'favorite');
      favoriteBtn.textContent = 'Favorite';
      favoriteBtn.onclick = () => onFileStatusUpdate(file.id, 'favorite');
      
      const discardBtn = document.createElement('button');
      discardBtn.classList.add('action-button', 'discard');
      discardBtn.textContent = 'Discard';
      discardBtn.onclick = () => onFileStatusUpdate(file.id, 'discard');
      
      actionButtons.appendChild(favoriteBtn);
      actionButtons.appendChild(discardBtn);
      
      photoDiv.appendChild(img);
      photoDiv.appendChild(actionButtons);
      
      photosContainer.appendChild(photoDiv);
  });
}

// Update the results view with favorite and discarded photos
export function updateResultsView(files) {
  const favoritesContainer = document.getElementById('favorites-container');
  const discardedContainer = document.getElementById('discarded-container');
  
  if (!favoritesContainer || !discardedContainer) return;
  
  favoritesContainer.innerHTML = '';
  discardedContainer.innerHTML = '';
  
  // Add favorite images
  const favorites = files.filter(file => file.status === 'favorite');
  if (favorites.length === 0) {
      favoritesContainer.innerHTML = '<p style="text-align:center;">No favorites yet</p>';
  } else {
      favorites.forEach(file => {
          const photoDiv = document.createElement('div');
          photoDiv.classList.add('photo-item');
          
          // Use data_url if available, otherwise fallback to API endpoint
          const imgSrc = file.data_url || `/api/images/${file.image_id}`;
          
          const img = document.createElement('img');
          img.src = imgSrc;
          img.alt = 'Favorite photo';
          
          const status = document.createElement('div');
          status.classList.add('status', 'favorite-status');
          status.textContent = 'Favorite';
          
          photoDiv.appendChild(img);
          photoDiv.appendChild(status);
          
          favoritesContainer.appendChild(photoDiv);
      });
  }
  
  // Add discarded images
  const discarded = files.filter(file => file.status === 'discard');
  if (discarded.length === 0) {
      discardedContainer.innerHTML = '<p style="text-align:center;">No discards yet</p>';
  } else {
      discarded.forEach(file => {
          const photoDiv = document.createElement('div');
          photoDiv.classList.add('photo-item');
          
          // Use data_url if available, otherwise fallback to API endpoint
          const imgSrc = file.data_url || `/api/images/${file.image_id}`;
          
          const img = document.createElement('img');
          img.src = imgSrc;
          img.alt = 'Discarded photo';
          
          const status = document.createElement('div');
          status.classList.add('status', 'discard-status');
          status.textContent = 'Discard';
          
          photoDiv.appendChild(img);
          photoDiv.appendChild(status);
          
          discardedContainer.appendChild(photoDiv);
      });
  }
  
  // Show/hide download button
  const downloadBtn = document.getElementById('download-favorites-btn');
  if (downloadBtn) {
      downloadBtn.style.display = favorites.length > 0 ? 'block' : 'none';
  }
}

// Update selected files count for file input
export function setupFileInput() {
  const fileInput = document.getElementById('file-input');
  if (!fileInput) return;
  
  fileInput.addEventListener('change', function() {
      const count = this.files.length;
      const display = document.getElementById('selected-files-count');
      
      if (display) {
          if (count > 0) {
              display.textContent = `${count} ${count === 1 ? 'photo' : 'photos'} selected`;
          } else {
              display.textContent = '';
          }
      }
  });
}

// Show upload progress
export function showUploadProgress(show) {
  const form = document.getElementById('upload-form');
  const progress = document.getElementById('upload-progress');
  
  if (form) form.style.display = show ? 'none' : 'block';
  if (progress) progress.style.display = show ? 'block' : 'none';
}

// Update session code display
export function updateSessionCode(code) {
  const display = document.getElementById('session-code-display');
  if (display) {
      display.textContent = code;
  }
}

// Update connection status
export function updateConnectionStatus(selectorConnected) {
  const status = document.getElementById('selector-status');
  const resultsBtn = document.getElementById('view-results-btn');
  
  if (status) {
      status.textContent = selectorConnected ? 'Friend is connected!' : 'Waiting for friend to join...';
  }
  
  if (resultsBtn) {
      resultsBtn.style.display = selectorConnected ? 'block' : 'none';
  }
}

// Reset the file input
export function resetFileInput() {
  const fileInput = document.getElementById('file-input');
  const filesCount = document.getElementById('selected-files-count');
  
  if (fileInput) fileInput.value = '';
  if (filesCount) filesCount.textContent = '';
}