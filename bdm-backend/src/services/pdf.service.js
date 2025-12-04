// ============================================
// FILE: src/services/pdf.service.js
// FIXED: Proper content extraction and display
// ============================================

const puppeteer = require('puppeteer');
const aiService = require('./ai/ai.service');
const translateModel = require('../database/models/translate.model');

class PDFService {
  
  async generatePDF(document) {
    const html = this.buildHTML(document);
    console.log('📄 Generating PDF with', document.content_json?.clauses?.length || 0, 'clauses');
    return this.htmlToPDF(html);
  }
  
  async generateBilingualPDF(document, targetLang) {
    const html = await this.buildBilingualHTML(document, targetLang);
    return this.htmlToPDF(html);
  }
  
  buildHTML(document) {
    const clauses = document.content_json?.clauses || [];
    
    if (clauses.length === 0) {
      console.warn('⚠️ No clauses found in document');
      return this.buildEmptyHTML();
    }
    
    const clausesHTML = clauses.map(clause => {
      // CRITICAL: Use content_html first, fallback to content
      let content = clause.content_html || clause.content || '';
      
      // If content is just plain text, wrap in <p> tag
      if (content && !content.includes('<')) {
        content = `<p>${content}</p>`;
      }
      
      return `
        <div class="clause" data-type="${clause.clause_type || 'unknown'}">
          ${content}
        </div>
      `;
    }).join('\n');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 100%;
    }
    .clause {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 0 0 15px 0;
      text-align: center;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin: 15px 0 10px 0;
    }
    p {
      margin: 8px 0;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table td, table th {
      border: 1px solid #333;
      padding: 10px;
      text-align: left;
    }
    table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    li {
      margin: 5px 0;
    }
    strong {
      font-weight: bold;
    }
    em {
      font-style: italic;
    }
  </style>
</head>
<body>
  ${clausesHTML}
</body>
</html>`;
  }
  
  buildEmptyHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial; padding: 40px; text-align: center; }
    .error { color: #cc0000; font-size: 18pt; }
  </style>
</head>
<body>
  <div class="error">
    <p>⚠️ No content available</p>
    <p style="font-size: 12pt; color: #666;">This document has no clauses.</p>
  </div>
</body>
</html>`;
  }
  
  async buildBilingualHTML(document, targetLang) {
    const clauses = document.content_json?.clauses || [];
    
    const bilingualHTML = [];
    
    for (const clause of clauses) {
      const originalContent = clause.content_html || clause.content || '';
      
      let translatedContent = originalContent;
      
      // Try to get existing translation
      if (clause.id) {
        const existing = await translateModel.findTranslation(
          clause.id,
          'clause',
          targetLang
        );
        
        if (existing) {
          translatedContent = existing.content;
        } else {
          // Generate new translation
          const result = await aiService.translateText(originalContent, targetLang);
          if (result.success) {
            translatedContent = result.translated;
          }
        }
      }
      
      bilingualHTML.push(`
<div class="clause-bilingual">
  <div class="original">
    <h4>Original</h4>
    ${originalContent}
  </div>
  <div class="translated">
    <h4>Translation (${targetLang})</h4>
    ${translatedContent}
  </div>
</div>
      `);
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
    }
    .clause-bilingual {
      margin-bottom: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 20px;
      page-break-inside: avoid;
    }
    .original, .translated {
      margin-bottom: 15px;
    }
    .translated {
      background-color: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #0066cc;
    }
    h4 {
      font-size: 12pt;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #333;
    }
    h1, h2, h3 {
      margin: 10px 0;
    }
    p { margin: 8px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table td, table th {
      border: 1px solid #000;
      padding: 8px;
    }
    ul, ol { padding-left: 25px; }
  </style>
</head>
<body>
  ${bilingualHTML.join('\n')}
</body>
</html>`;
  }
  
  async htmlToPDF(html) {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        }
      });
      
      console.log('✅ PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = new PDFService();