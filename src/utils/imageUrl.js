/**
 * Utility function to build full image URLs from relative paths
 * @param {string|null|undefined} relativePath - Relative path from backend (e.g., "/uploads/profiles/photo.jpg")
 * @returns {string|null} - Full URL or null if no path provided
 */
export function getImageUrl(relativePath) {
  if (!relativePath) return null;
  
  // If already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Get base URL from environment or default
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Remove trailing slash from baseURL if present
  const cleanBaseURL = baseURL.replace(/\/$/, '');
  
  // Ensure relativePath starts with /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${cleanBaseURL}${cleanPath}`;
}

