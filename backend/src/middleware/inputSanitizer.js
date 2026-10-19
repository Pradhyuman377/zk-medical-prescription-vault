/**
 * Input Validation & Sanitization Middleware
 * Defense-in-depth protection against Cross-Site Scripting (XSS),
 * HTML tag injection, and malicious payload embedding in prescription or user input fields.
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // 1. Strip script tags and content between them
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 2. Strip HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // 3. Strip javascript: pseudo-protocol and dangerous URI schemes
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:\s*text\/html/gi, '');
  
  // 4. Strip inline event handlers like onload=, onerror=, onclick=
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized.trim();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      sanitized[key] = sanitizeString(val);
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeObject(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = inputSanitizer;
