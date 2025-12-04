// ============================================
// FILE: src/database/models/document.model.js
// Document data access (~220 lines)
// ============================================

const { pool } = require('../connection');

class DocumentModel {
  
  parseJSON(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error('JSON parse error:', e);
      return null;
    }
  }
  
  async create(data) {
    const {
      template_id = null,
      document_name,
      document_type,
      content_json,
      variables = {},
      pdf_path = null
    } = data;
    
    const query = `
      INSERT INTO documents 
      (template_id, document_name, document_type, content_json, variables, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      template_id,
      document_name,
      document_type,
      JSON.stringify(content_json),
      JSON.stringify(variables),
      pdf_path
    ]);
    
    return this.findById(result.insertId);
  }
  
  async findAll(filters = {}) {
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    
    if (filters.document_type) {
      query += ' AND document_type = ?';
      params.push(filters.document_type);
    }
    
    if (filters.template_id) {
      query += ' AND template_id = ?';
      params.push(filters.template_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({
      ...row,
      content_json: this.parseJSON(row.content_json) || {},
      variables: this.parseJSON(row.variables) || {}
    }));
  }
  
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const doc = rows[0];
    return {
      ...doc,
      content_json: this.parseJSON(doc.content_json) || {},
      variables: this.parseJSON(doc.variables) || {}
    };
  }
  
  async findByDocumentType(type) {
    return this.findAll({ document_type: type });
  }
  
  async update(id, updateData) {
    const fields = [];
    const params = [];
    
    if (updateData.document_name !== undefined) {
      fields.push('document_name = ?');
      params.push(updateData.document_name);
    }
    
    if (updateData.content_json !== undefined) {
      fields.push('content_json = ?');
      params.push(JSON.stringify(updateData.content_json));
    }
    
    if (updateData.variables !== undefined) {
      fields.push('variables = ?');
      params.push(JSON.stringify(updateData.variables));
    }
    
    if (updateData.pdf_path !== undefined) {
      fields.push('pdf_path = ?');
      params.push(updateData.pdf_path);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    await pool.execute(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    
    return this.findById(id);
  }
  
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM documents WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  async logAIGeneration(data) {
    const {
      request_type,
      prompt,
      response_data,
      tokens_used = 0,
      cost_estimate = 0,
      provider = null,
      model = null
    } = data;
    
    await pool.execute(
      `INSERT INTO ai_generation_logs 
       (request_type, prompt, response_data, tokens_used, cost_estimate, provider, model)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        request_type,
        prompt,
        JSON.stringify(response_data),
        tokens_used,
        cost_estimate,
        provider,
        model
      ]
    );
  }
}

module.exports = new DocumentModel();