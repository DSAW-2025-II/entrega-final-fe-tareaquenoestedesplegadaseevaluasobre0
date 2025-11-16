import client from './client';

// Admin actions API helpers

/**
 * List users with filters and pagination
 * @param {Object} filters - Filter options
 * @param {string} [filters.role] - Filter by role (passenger, driver, admin)
 * @param {string} [filters.status] - Filter by status (active, suspended)
 * @param {string} [filters.search] - Search by name or email
 * @param {string} [filters.createdFrom] - Filter by creation date from (ISO string)
 * @param {string} [filters.createdTo] - Filter by creation date to (ISO string)
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=25] - Items per page
 * @param {string} [filters.sort=-createdAt] - Sort field and direction
 * @returns {Promise<Object>} - { items, page, pageSize, total, totalPages }
 */
export async function listUsers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
  if (filters.createdTo) params.append('createdTo', filters.createdTo);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/users?${params.toString()}`);
  return response.data;
}

/**
 * List trips with filters and pagination
 * @param {Object} filters - Filter options
 * @param {string|string[]} [filters.status] - Filter by status
 * @param {string} [filters.driverId] - Filter by driver ID
 * @param {string} [filters.from] - Filter by origin text
 * @param {string} [filters.to] - Filter by destination text
 * @param {string} [filters.departureFrom] - Filter by departure date from (ISO string)
 * @param {string} [filters.departureTo] - Filter by departure date to (ISO string)
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=25] - Items per page
 * @param {string} [filters.sort=-departureAt] - Sort field and direction
 * @returns {Promise<Object>} - { items, page, pageSize, total, totalPages }
 */
export async function listTrips(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', filters.status);
    }
  }
  if (filters.driverId) params.append('driverId', filters.driverId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.departureFrom) params.append('departureFrom', filters.departureFrom);
  if (filters.departureTo) params.append('departureTo', filters.departureTo);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/trips?${params.toString()}`);
  return response.data;
}

/**
 * List bookings with filters and pagination
 * @param {Object} filters - Filter options
 * @param {string} [filters.tripId] - Filter by trip ID
 * @param {string} [filters.passengerId] - Filter by passenger ID
 * @param {string|string[]} [filters.status] - Filter by status
 * @param {boolean} [filters.paid] - Filter by payment status
 * @param {string} [filters.createdFrom] - Filter by creation date from (ISO string)
 * @param {string} [filters.createdTo] - Filter by creation date to (ISO string)
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=25] - Items per page
 * @param {string} [filters.sort=-createdAt] - Sort field and direction
 * @returns {Promise<Object>} - { items, page, pageSize, total, totalPages }
 */
export async function listBookings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.tripId) params.append('tripId', filters.tripId);
  if (filters.passengerId) params.append('passengerId', filters.passengerId);
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', filters.status);
    }
  }
  if (filters.paid !== undefined) params.append('paid', filters.paid);
  if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
  if (filters.createdTo) params.append('createdTo', filters.createdTo);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/bookings?${params.toString()}`);
  return response.data;
}

export async function suspendUser(userId, suspend, reason) {
  // suspend: true => suspend, false => unsuspend
  const action = suspend ? 'suspend' : 'unsuspend';
  const response = await client.patch(`/admin/users/${userId}/suspension`, { action, reason });
  return response.data;
}

export async function forceCancelTrip(tripId, reason) {
  const response = await client.post(`/admin/trips/${tripId}/force-cancel`, { reason });
  return response.data;
}

export async function correctBookingState(bookingId, targetState, reason, refund) {
  const body = { targetState, reason };
  if (refund) body.refund = refund;
  const response = await client.post(`/admin/bookings/${bookingId}/correct-state`, body);
  return response.data;
}

export async function setDriverPublishBan(driverId, banUntil, reason) {
  // banUntil: ISO date string or null to remove ban
  const response = await client.patch(`/admin/drivers/${driverId}/publish-ban`, { banUntil, reason });
  return response.data;
}

export async function createModerationUploadUrl(meta) {
  const response = await client.post('/admin/moderation/evidence/upload-url', meta);
  return response.data;
}

export async function createModerationNote(entity, entityId, category, reason, evidence) {
  const response = await client.post('/admin/moderation/notes', { entity, entityId, category, reason, evidence });
  return response.data;
}

/**
 * List reports with filters and pagination
 * @param {Object} filters - Filter options
 * @param {string} [filters.status] - Filter by status (pending, reviewed, resolved)
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.reportedUserId] - Filter by reported user ID
 * @param {string} [filters.reporterId] - Filter by reporter ID
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=25] - Items per page
 * @param {string} [filters.sort=-createdAt] - Sort field and direction
 * @returns {Promise<Object>} - { items, page, pageSize, total, totalPages }
 */
export async function listReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.reportedUserId) params.append('reportedUserId', filters.reportedUserId);
  if (filters.reporterId) params.append('reporterId', filters.reporterId);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/reports?${params.toString()}`);
  return response.data;
}

/**
 * Update report status
 * @param {string} reportId - Report ID
 * @param {string} status - New status (pending, reviewed, resolved)
 * @param {string} [reason] - Optional reason for status change
 * @returns {Promise<Object>} - Updated report data
 */
export async function updateReportStatus(reportId, status, reason) {
  const response = await client.patch(`/admin/reports/${reportId}/status`, { status, reason });
  return response.data;
}

/**
 * Send message to reported user
 * @param {string} reportId - Report ID
 * @param {string} title - Message title
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Response data
 */
export async function sendMessageToReportedUser(reportId, title, message) {
  const response = await client.post(`/admin/reports/${reportId}/send-message`, { title, message });
  return response.data;
}
