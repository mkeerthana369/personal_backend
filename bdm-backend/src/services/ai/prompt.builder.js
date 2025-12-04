// ============================================
// FILE: src/services/ai/prompt.builder.js
// Prompt templates (~150 lines)
// ============================================

class PromptBuilder {
  
  buildClausePrompt(documentType, context = {}) {
    const contextStr = Object.keys(context).length > 0
      ? `\n\nContext Information:\n${JSON.stringify(context, null, 2)}`
      : '';
    
    const suggestions = this.getClauseSuggestions(documentType);
    
    return `Generate all necessary clauses for a ${documentType} document.${contextStr}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - start with { and end with }
2. Each clause "content" MUST be valid HTML
3. Use proper HTML tags for structure
4. Use placeholders like [Company Name], [Employee Name] inside HTML
5. No markdown, no code blocks, no explanations - just raw JSON

EXAMPLE FORMAT:
{
  "clauses": [
    {
      "clause_type": "header",
      "content": "<h1>[Company Name]</h1><p>[Company Address]</p>",
      "category": "${documentType}"
    }
  ]
}

${suggestions}

NOW GENERATE THE DOCUMENT IN THIS EXACT JSON FORMAT WITH HTML CONTENT.`;
  }
  
  buildSingleClausePrompt(clauseType, category, context = {}) {
    const contextStr = Object.keys(context).length > 0
      ? `\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : '';
    
    return `Generate ONE professional clause with HTML content.

Type: ${clauseType}
Category: ${category}${contextStr}

Return ONLY JSON in this exact format (start with { and end with }):
{
  "clause": {
    "clause_type": "${clauseType}",
    "content": "<valid HTML here>"
  }
}

No explanations, no markdown blocks, just the raw JSON object.`;
  }
  
  buildTranslationPrompt(text, targetLang) {
    const isHTML = /<[a-z][\s\S]*>/i.test(text);
    
    if (isHTML) {
      return `Translate this HTML content to ${targetLang}.

RULES:
1. Preserve ALL HTML tags EXACTLY
2. Translate ONLY text content inside tags
3. Keep ALL placeholders like [Company Name]
4. Return the complete translated HTML

SOURCE HTML:
${text}

TRANSLATED HTML:`;
    } else {
      return `Translate this text to ${targetLang}.

RULES:
1. Preserve ALL placeholders like [Company Name]
2. Maintain formatting
3. Professional tone

SOURCE:
${text}

TRANSLATED:`;
    }
  }
  
  getClauseSuggestions(documentType) {
    const suggestions = {
      offer_letter: `Generate clauses with HTML:
1. header - <h1> for company name
2. greeting - "Dear [Candidate Name],"
3. position_details - <h2> and <p>
4. compensation - HTML <table> with structure
5. benefits - <ul> list
6. terms - <ol> or <p>
7. closing - Professional close
8. signature - Signature block`,
      
      nda: `Generate with HTML:
1. header - <h1>
2. parties - <p> or <ul>
3. definitions - <h2> and list
4. confidential_information - <p> with <strong>
5. obligations - <ol>
6. remedies - <p> or <ul>
7. signature - Blocks`,
      
      default: `Generate with proper HTML structure:
- <h1> for title
- <h2> for sections
- <table> for tabular data
- <ul>/<ol> for lists
- <p> for paragraphs`
    };
    
    return suggestions[documentType] || suggestions.default;
  }
}

module.exports = new PromptBuilder();