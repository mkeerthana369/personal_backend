// ============================================
// FILE: src/utils/helpers.js
// General helper functions
// ============================================

const extractPlaceholders = (template) => {
  const placeholders = new Set();
  
  if (!template || !template.clauses) return [];
  
  template.clauses.forEach(clause => {
    const content = clause.content || '';
    const contentHTML = clause.content_html || '';
    
    const combined = content + ' ' + contentHTML;
    const matches = combined.match(/\[([^\]]+)\]/g);
    
    if (matches) {
      matches.forEach(match => {
        const placeholder = match.substring(1, match.length - 1).trim();
        placeholders.add(placeholder);
      });
    }
  });
  
  return Array.from(placeholders);
};

const normalizeKey = (key) => {
  if (!key) return '';
  
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
};

const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  extractPlaceholders,
  normalizeKey,
  formatDate,
  sleep
};