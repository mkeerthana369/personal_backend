// ============================================
// FILE: src/utils/sanitizer.js
// Data sanitization
// ============================================

const sanitizeHTML = (html) => {
  if (!html) return '';
  
  // Basic XSS prevention (for production, use a library like DOMPurify)
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

const escapeHTML = (text) => {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
};

const sanitizeFilename = (filename) => {
  if (!filename) return 'untitled';
  
  return String(filename)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
};

module.exports = {
  sanitizeHTML,
  escapeHTML,
  sanitizeFilename
};
