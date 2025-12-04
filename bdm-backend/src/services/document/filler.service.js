class FillerService {
  
  async fillClauses(clauses, context) {
    return clauses.map(clause => this.fillClause(clause, context));
  }
  
  fillClause(clause, context) {
    let content = clause.content || '';
    let content_html = clause.content_html || null;
    
    // Fill plain text content
    Object.keys(context).forEach(key => {
      const value = context[key] || `[${key}]`;
      const regex = new RegExp(`\\[${this.escapeRegex(key)}\\]`, 'g');
      content = content.replace(regex, value);
      if (content_html) {
        content_html = content_html.replace(regex, value);
      }
    });
    
    return {
      ...clause,
      content,
      content_html: content_html || content
    };
  }
  
  escapeRegex(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  
  extractPlaceholders(text) {
    const matches = text.match(/\[([^\]]+)\]/g);
    if (!matches) return [];
    return matches.map(m => m.substring(1, m.length - 1).trim());
  }
  
  extractFromTemplate(template) {
    const placeholders = new Set();
    
    if (template && Array.isArray(template.clauses)) {
      template.clauses.forEach(clause => {
        if (clause.content) {
          const found = this.extractPlaceholders(clause.content);
          found.forEach(p => placeholders.add(p));
        }
        if (clause.content_html) {
          const found = this.extractPlaceholders(clause.content_html);
          found.forEach(p => placeholders.add(p));
        }
      });
    }
    
    return Array.from(placeholders);
  }
}

module.exports = new FillerService();