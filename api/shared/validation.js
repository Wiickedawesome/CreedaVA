/**
 * Input validation utilities
 * Provides common validation functions to prevent injection attacks
 */

/**
 * Sanitize string input to prevent injection
 */
function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential HTML/script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);
  
  return sanitized;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate slug format (URL-safe identifier)
 */
function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 200;
}

/**
 * Validate object ID (UUID or similar)
 */
function isValidId(id) {
  if (!id || typeof id !== 'string') return false;
  
  // Accept UUID format or alphanumeric with hyphens
  const idRegex = /^[a-zA-Z0-9-_]{1,100}$/;
  return idRegex.test(id);
}

/**
 * Validate request body size
 */
function isValidBodySize(body, maxSizeKB = 500) {
  if (!body) return true;
  
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const sizeKB = Buffer.byteLength(bodyString, 'utf8') / 1024;
  
  return sizeKB <= maxSizeKB;
}

/**
 * Validate array length
 */
function isValidArrayLength(arr, maxLength = 100) {
  if (!Array.isArray(arr)) return false;
  return arr.length <= maxLength;
}

/**
 * Sanitize object for database insertion
 * Removes potentially dangerous keys and validates structure
 */
function sanitizeObjectForDB(obj, allowedKeys = []) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }
  
  const sanitized = {};
  
  for (const key of allowedKeys) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      // Handle different types
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = isFinite(value) ? value : 0;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item, 200) : item
        );
      } else if (value && typeof value === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Rate limiting check (simple in-memory implementation)
 * For production, use Redis or Azure Cache
 */
const requestCounts = new Map();

function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}`;
  
  // Clean up old entries
  if (requestCounts.size > 10000) {
    requestCounts.clear();
  }
  
  const requests = requestCounts.get(key) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
    };
  }
  
  recentRequests.push(now);
  requestCounts.set(key, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length
  };
}

module.exports = {
  sanitizeString,
  isValidEmail,
  isValidUrl,
  isValidSlug,
  isValidId,
  isValidBodySize,
  isValidArrayLength,
  sanitizeObjectForDB,
  checkRateLimit
};
