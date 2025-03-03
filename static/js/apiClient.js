// API client for server communication

// Upload photos to the server
export async function uploadPhotos(files) {
  if (!files || files.length === 0) {
      throw new Error('No files selected');
  }
  
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
  }
  
  const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
  });
  
  if (!response.ok) {
      throw new Error('Upload failed');
  }
  
  return response.json();
}

// Check if a session exists
export async function checkSession(sessionCode) {
  const response = await fetch(`/api/session/${sessionCode}`);
  
  if (!response.ok) {
      throw new Error('Session not found');
  }
  
  return response.json();
}

// Get files for a session
export async function getSessionFiles(sessionCode) {
  const response = await fetch(`/api/session/${sessionCode}/files`);
  
  if (!response.ok) {
      throw new Error('Failed to fetch files');
  }
  
  return response.json();
}

// Download favorites as a zip file
export function downloadFavorites(sessionCode) {
  window.location.href = `/api/session/${sessionCode}/download_favorites`;
}