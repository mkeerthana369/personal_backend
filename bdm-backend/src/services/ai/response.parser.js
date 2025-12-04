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
    
    return cleaned.substring(first, last + 1);
  }
  
  parse(raw) {
    const extracted = this.extractJSON(raw);
    
    try {
      return JSON.parse(extracted);
    } catch (e) {
      console.error('❌ JSON parse failed:', extracted.substring(0, 800));
      throw new Error(`Invalid JSON from AI: ${e.message}`);
    }
  }
  
  validateClauses(response) {
    if (!response.clauses || !Array.isArray(response.clauses)) {
      throw new Error('AI response missing "clauses" array');
    }
    
    for (const clause of response.clauses) {
      if (!clause.clause_type || !clause.content || !clause.category) {
        throw new Error('Clause missing required fields (clause_type, content, category)');
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