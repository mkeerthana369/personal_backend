// ============================================
// FILE: src/services/pdf.service.js
// PDF generation using Puppeteer (~250 lines)
// ============================================

const puppeteer = require('puppeteer');
const aiService = require('./ai/ai.service');
const translateModel = require('../database/models/translate.model');

class PDFService {
  
  async generatePDF(document) {
    const html = this.buildHTML(document);
    return this.htmlToPDF(html);
  }
  
  async generateBilingualPDF(document, targetLang) {
    const html = await this.buildBilingualHTML(document, targetLang);
    return this.htmlToPDF(html);
  }
  
  buildHTML(document) {
    const clauses = document.content_json?.clauses || [];
    
    const clausesHTML = clauses.map(clause => {
      const content = clause.content_html || clause.content || '';
      return `<div class="clause">${content}</div>`;
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
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
    }
    .clause {
      margin-bottom: 20px;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 15px 0 10px 0;
    }
    p {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table td, table th {
      border: 1px solid #000;
      padding: 8px;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  ${clausesHTML}
</body>
</html>`;
  }
  
  async buildBilingualHTML(document, targetLang) {
    const clauses = document.content_json?.clauses || [];
    
    const bilingualHTML = [];
    
    for (const clause of clauses) {
      const originalContent = clause.content_html || clause.content || '';
      
      let translatedContent = originalContent;
      
      const existing = await translateModel.findTranslation(
        clause.id || 0,
        'clause',
        targetLang
      );
      
      if (existing) {
        translatedContent = existing.content;
      } else {
        const result = await aiService.translateText(originalContent, targetLang);
        if (result.success) {
          translatedContent = result.translated;
        }
      }
      
      bilingualHTML.push(`
<div class="clause-bilingual">
  <div class="original">
    ${originalContent}
  </div>
  <div class="translated">
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
      border-bottom: 1px solid #ddd;
      padding-bottom: 20px;
    }
    .original {
      margin-bottom: 15px;
    }
    .translated {
      background-color: #f9f9f9;
      padding: 10px;
      border-left: 3px solid #0066cc;
    }
    h1, h2, h3 {
      margin: 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table td, table th {
      border: 1px solid #000;
      padding: 6px;
    }
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
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
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
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = new PDFService();
