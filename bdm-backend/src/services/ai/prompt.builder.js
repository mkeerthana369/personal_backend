// ============================================
// FILE: src/services/ai/prompt.builder.js
// ENHANCED: Generate 10-12 clauses per document
// ============================================

class PromptBuilder {
  
  buildClausePrompt(documentType, context = {}) {
    const contextStr = Object.keys(context).length > 0
      ? `\nContext: ${JSON.stringify(context)}`
      : '';
    
    const template = this.getTemplateForType(documentType);
    
    return `Generate a complete ${documentType} with ALL required clauses. Return ONLY valid JSON.

REQUIRED: Generate ${template.minClauses} clauses minimum.

${template.structure}

FORMAT (NO explanations, NO markdown):
{"clauses":[{"clause_type":"header","content":"<h1>Text</h1>","category":"${documentType}"}]}

RULES:
- Each clause needs clause_type, content, category
- Use simple HTML: <h1>, <h2>, <p>, <ul>, <ol>, <table>
- Use [Company Name], [Candidate Name] for variables
- NO newlines inside HTML strings
- Generate COMPLETE professional document${contextStr}

Generate JSON now:`;
  }
  
  getTemplateForType(documentType) {
    const templates = {
      offer_letter: {
        minClauses: 12,
        structure: `1. header - Company letterhead with logo area
2. date - Date of offer
3. greeting - Dear [Candidate Name]
4. introduction - We are pleased to offer you...
5. position_details - Job title, department, reporting structure
6. start_date - Expected start date
7. compensation - Base salary with table
8. benefits - Health, dental, retirement, vacation
9. work_schedule - Hours, location, remote policy
10. probation - Probation period details
11. conditions - Background check, drug test if applicable
12. closing - Acceptance deadline
13. signature - Signature blocks for both parties`
      },
      
      nda: {
        minClauses: 10,
        structure: `1. header - NDA title and date
2. parties - Party A and Party B details
3. recitals - Whereas clauses
4. definitions - Define Confidential Information
5. obligations - Duty to protect information
6. exclusions - What is NOT confidential
7. term - Duration of agreement
8. return - Return of materials
9. remedies - Legal remedies for breach
10. general - Governing law, jurisdiction
11. signatures - Both party signatures`
      },
      
      contract: {
        minClauses: 12,
        structure: `1. header - Contract title
2. parties - Full party details
3. recitals - Background and purpose
4. scope - Scope of work
5. deliverables - What will be delivered
6. timeline - Project schedule
7. payment - Payment terms and schedule
8. warranties - Warranties and representations
9. liability - Limitation of liability
10. termination - Termination conditions
11. dispute - Dispute resolution
12. general - General provisions
13. signatures - Execution blocks`
      },
      
      invoice: {
        minClauses: 10,
        structure: `1. header - Invoice header with logo
2. invoice_info - Invoice number and date
3. bill_to - Bill to information
4. ship_to - Ship to information
5. items_table - Itemized list with prices
6. subtotal - Subtotal calculation
7. tax - Tax amount
8. total - Total amount due
9. payment_terms - Payment terms and methods
10. notes - Additional notes or thank you`
      }
    };
    
    return templates[documentType] || {
      minClauses: 10,
      structure: `Generate 10-12 professional clauses appropriate for ${documentType}`
    };
  }
  
  buildSingleClausePrompt(clauseType, category, context = {}) {
    const contextStr = Object.keys(context).length > 0
      ? `Context: ${JSON.stringify(context)}`
      : '';
    
    return `Generate ONE professional ${clauseType} clause with HTML.

Category: ${category}
${contextStr}

Return ONLY this JSON (NO markdown):
{"clause":{"clause_type":"${clauseType}","content":"<p>Professional content here with [Placeholders]</p>"}}

Requirements:
- Professional business tone
- Use proper HTML tags
- Include relevant placeholders
- Keep it concise but complete

Generate:`;
  }
  
  buildTranslationPrompt(text, targetLang) {
    const isHTML = /<[a-z][\s\S]*>/i.test(text);
    
    const langNames = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'it': 'Italian'
    };
    
    const fullLangName = langNames[targetLang] || targetLang;
    
    if (isHTML) {
      return `Translate this business document content to ${fullLangName}.

CRITICAL RULES:
1. Translate ALL text content to ${fullLangName}
2. Keep ALL HTML tags exactly as they are
3. Keep placeholders like [Company Name] unchanged
4. Use professional business language
5. Maintain the same formatting structure

ORIGINAL:
${text}

TRANSLATED TO ${fullLangName.toUpperCase()}:`;
    } else {
      return `Translate this to ${fullLangName}.

RULES:
1. Translate to ${fullLangName} completely
2. Keep [Placeholders] in English
3. Professional business tone
4. Maintain formatting

ORIGINAL:
${text}

${fullLangName.toUpperCase()} TRANSLATION:`;
    }
  }
}

module.exports = new PromptBuilder();
