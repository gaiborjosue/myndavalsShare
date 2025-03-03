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

// Update the results view with favorite photos only
export function updateResultsView(favorites) {
  const favoritesContainer = document.getElementById('favorites-container');
  
  if (!favoritesContainer) return;
  
  favoritesContainer.innerHTML = '';
  
  // If no favorites, show a message
  if (favorites.length === 0) {
      favoritesContainer.innerHTML = '<p style="text-align:center;">No favorites yet</p>';
      
      // Hide download button
      const downloadBtn = document.getElementById('download-favorites-btn');
      if (downloadBtn) {
          downloadBtn.style.display = 'none';
      }
      return;
  }
  
  // Add favorite images
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
      
      photoDiv.appendChild(img);
      photoDiv.appendChild(status);
      
      favoritesContainer.appendChild(photoDiv);
  });
  
  // Show download button
  const downloadBtn = document.getElementById('download-favorites-btn');
  if (downloadBtn) {
      downloadBtn.style.display = 'block';
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
  
  if (status) {
      status.textContent = selectorConnected ? 'Friend is connected!' : 'Waiting for friend to join...';
  }
}

// Reset the file input
export function resetFileInput() {
  const fileInput = document.getElementById('file-input');
  const filesCount = document.getElementById('selected-files-count');
  
  if (fileInput) fileInput.value = '';
  if (filesCount) filesCount.textContent = '';
}