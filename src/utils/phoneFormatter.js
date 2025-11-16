/**
 * Format phone number from E.164 format (+573001234567) to display format (+57 XXX XXXXXXX)
 * @param {string} phone - Phone number in E.164 format (e.g., +573001234567)
 * @returns {string} - Formatted phone number (e.g., +57 300 1234567)
 */
export function formatPhone(phone) {
  if (!phone) return null;
  
  // Remove any existing spaces
  const cleaned = phone.replace(/\s/g, '');
  
  // Check if it's a Colombian number (+57)
  if (cleaned.startsWith('+57')) {
    const number = cleaned.substring(3); // Remove +57
    if (number.length === 10) {
      // Format: +57 XXX XXXXXXX
      return `+57 ${number.substring(0, 3)} ${number.substring(3)}`;
    }
  }
  
  // If it doesn't match expected format, return as is
  return phone;
}

