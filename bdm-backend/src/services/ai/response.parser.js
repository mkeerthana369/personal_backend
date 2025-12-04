// ============================================
// FILE: src/services/ai/response.parser.js
// FIXED: Better JSON extraction with error recovery
// ============================================

class ResponseParser {
  
  extractJSON(raw) {
    const trimmed = raw.trim();
    
    // Remove markdown code blocks
    let cleaned = trimmed;
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }
    
    // Find first { and last }
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    
    if (first === -1 || last === -1 || last <= first) {
      console.error('❌ No JSON object found:', cleaned.substring(0, 600));
      throw new Error('AI response contains no valid JSON object');
    }
    
    let jsonStr = cleaned.substring(first, last + 1);
    
    // FIX: Escape unescaped newlines in string values
    // This handles the "Bad control character" error
    jsonStr = this.fixControlCharacters(jsonStr);
    
    return jsonStr;
  }
  
  fixControlCharacters(jsonStr) {
    // Fix newlines inside string values (not in keys)
    // Replace literal newlines in strings with \n
    let inString = false;
    let isKey = false;
    let result = '';
    let i = 0;
    
    while (i < jsonStr.length) {
      const char = jsonStr[i];
      const prev = i > 0 ? jsonStr[i - 1] : '';
      
      if (char === '"' && prev !== '\\') {
        inString = !inString;
        if (inString) {
          // Check if this is a key or value
          let j = i - 1;
          while (j >= 0 && /\s/.test(jsonStr[j])) j--;
          isKey = jsonStr[j] === '{' || jsonStr[j] === ',';
        }
        result += char;
      } else if (inString && !isKey && (char === '\n' || char === '\r' || char === '\t')) {
        // Replace control characters in string values
        if (char === '\n') result += '\\n';
        else if (char === '\r') result += '\\r';
        else if (char === '\t') result += '\\t';
      } else {
        result += char;
      }
      
      i++;
    }
    
    return result;
  }
  
  parse(raw) {
    const extracted = this.extractJSON(raw);
    
    try {
      return JSON.parse(extracted);
    } catch (e) {
      console.error('❌ JSON parse failed:', extracted.substring(0, 800));
      
      // Try aggressive cleanup as last resort
      try {
        const aggressive = this.aggressiveCleanup(extracted);
        return JSON.parse(aggressive);
      } catch (e2) {
        throw new Error(`Invalid JSON from AI: ${e.message}`);
      }
    }
  }
  
  aggressiveCleanup(jsonStr) {
    // Remove all literal newlines and excessive whitespace in string values
    return jsonStr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
      return match
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ');
    });
  }
  
  validateClauses(response) {
    if (!response.clauses || !Array.isArray(response.clauses)) {
      throw new Error('AI response missing "clauses" array');
    }
    
    if (response.clauses.length === 0) {
      throw new Error('AI generated empty clauses array');
    }
    
    for (const clause of response.clauses) {
      if (!clause.clause_type || !clause.content) {
        console.error('Invalid clause:', clause);
        throw new Error('Clause missing required fields (clause_type, content)');
      }
      
      // Auto-add category if missing
      if (!clause.category) {
        clause.category = 'general';
      }
    }
    
    return true;
  }
  
  validateClause(response) {
    if (!response.clause || !response.clause.content) {
      throw new Error('AI response missing "clause" object with content');
    }
    return true;
  }
}

module.exports = new ResponseParser();