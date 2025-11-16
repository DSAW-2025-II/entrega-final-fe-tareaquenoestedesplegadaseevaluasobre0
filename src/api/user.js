import client from './client';

/**
 * User API endpoints
 */

/**
 * Get current user profile
 * @returns {Promise<Object>} - User profile data
 */
export async function getMyProfile() {
  const response = await client.get('/api/users/me');
  return response.data;
}

/**
 * Toggle user role between passenger and driver
 * @returns {Promise<Object>} - Updated user data with new role
 */
export async function toggleRole() {
  const response = await client.post('/api/users/me/toggle-role');
  return response.data;
}

/**
 * Report a user from a specific trip
 * @param {string} userId - User ID to report
 * @param {Object} reportData - Report data
 * @param {string} reportData.tripId - Trip ID where the incident occurred
 * @param {string} reportData.category - Report category (abuse, harassment, fraud, no_show, unsafe_behavior, other)
 * @param {string} [reportData.reason] - Optional reason (max 500 chars)
 * @returns {Promise<Object>} - Report response
 */
export async function reportUser(userId, reportData) {
  const response = await client.post(`/api/users/${userId}/report`, reportData);
  return response.data;
}

/**
 * Get all reports made about the current user
 * @returns {Promise<Object>} - Reports received by the current user
 */
export async function getMyReportsReceived() {
  const response = await client.get('/api/users/me/reports-received');
  return response.data;
}

/**
 * Update current user profile
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.firstName] - First name
 * @param {string} [profileData.lastName] - Last name
 * @param {string} [profileData.phone] - Phone number
 * @param {File} [profileData.profilePhoto] - Profile photo file (JPEG, PNG, or WebP, max 5MB)
 * @returns {Promise<Object>} - Updated user profile
 */
export async function updateMyProfile(profileData) {
  // Check if profilePhoto is a File object
  const hasFile = profileData.profilePhoto instanceof File;
  
  if (hasFile) {
    // Use FormData for file upload
    const formData = new FormData();
    
    // Add text fields if provided
    if (profileData.firstName) formData.append('firstName', profileData.firstName);
    if (profileData.lastName) formData.append('lastName', profileData.lastName);
    if (profileData.phone) formData.append('phone', profileData.phone);
    
    // Add file
    formData.append('profilePhoto', profileData.profilePhoto);
    
    // Send multipart/form-data request
    // Don't set Content-Type header - let axios set it automatically with boundary
    const response = await client.patch('/api/users/me', formData, {
      headers: {
        'Content-Type': undefined, // Let axios set it automatically
      },
    });
    return response.data;
  } else {
    // Use JSON for text-only updates
    const response = await client.patch('/api/users/me', profileData);
    return response.data;
  }
}

/**
 * Get public user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Public user profile {id, firstName, lastName, profilePhotoUrl, role}
 */
export async function getPublicProfile(userId) {
  const response = await client.get(`/api/users/${userId}/public`);
  return response.data;
}