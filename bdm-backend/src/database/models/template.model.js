// ============================================
// FILE: src/database/models/template.model.js
// Template data access (~200 lines)
// ============================================

const { pool } = require('../connection');

class TemplateModel {
  
  async create(data, clauseIds = []) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { template_name, document_type, description, is_ai_generated = false } = data;
      
      const [result] = await connection.execute(
        `INSERT INTO templates 
         (template_name, document_type, description, is_ai_generated, clause_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          template_name,
          document_type,
          description,
          is_ai_generated,
          JSON.stringify(clauseIds)
        ]
      );
      
      const templateId = result.insertId;
      
      if (clauseIds.length > 0) {
        for (let i = 0; i < clauseIds.length; i++) {
          await connection.execute(
            `INSERT INTO template_clauses (template_id, clause_id, position)
             VALUES (?, ?, ?)`,
            [templateId, clauseIds[i], i + 1]
          );
        }
      }
      
      await connection.commit();
      return this.findById(templateId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  async findAll(filters = {}) {
    let query = 'SELECT * FROM templates WHERE 1=1';
    const params = [];
    
    if (filters.document_type) {
      query += ' AND document_type = ?';
      params.push(filters.document_type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
  
  async findById(id) {
    const [templates] = await pool.execute(
      'SELECT * FROM templates WHERE id = ?',
      [id]
    );
    
    if (templates.length === 0) return null;
    
    const template = templates[0];
    
    const [clauses] = await pool.execute(
      `SELECT c.*, tc.position 
       FROM clauses c
       INNER JOIN template_clauses tc ON c.id = tc.clause_id
       WHERE tc.template_id = ?
       ORDER BY tc.position`,
      [id]
    );
    
    template.clauses = clauses;
    return template;
  }
  
  async findByDocumentType(type) {
    return this.findAll({ document_type: type });
  }
  
  async update(id, updateData) {
    const { template_name, document_type, description } = updateData;
    
    await pool.execute(
      `UPDATE templates 
       SET template_name = ?, document_type = ?, description = ?
       WHERE id = ?`,
      [template_name, document_type, description, id]
    );
    
    return this.findById(id);
  }
  
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM templates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  async addClause(templateId, clauseId, position = null) {
    if (position === null) {
      const [rows] = await pool.execute(
        'SELECT MAX(position) as max_pos FROM template_clauses WHERE template_id = ?',
        [templateId]
      );
      position = (rows[0].max_pos || 0) + 1;
    }
    
    await pool.execute(
      `INSERT INTO template_clauses (template_id, clause_id, position)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE position = ?`,
      [templateId, clauseId, position, position]
    );
    
    await this.updateClauseOrder(templateId);
    return this.findById(templateId);
  }
  
  async removeClause(templateId, clauseId) {
    await pool.execute(
      'DELETE FROM template_clauses WHERE template_id = ? AND clause_id = ?',
      [templateId, clauseId]
    );
    
    await this.updateClauseOrder(templateId);
    return this.findById(templateId);
  }
  
  async updateClauseOrder(templateId) {
    const [clauses] = await pool.execute(
      'SELECT clause_id FROM template_clauses WHERE template_id = ? ORDER BY position',
      [templateId]
    );
    
    const clauseIds = clauses.map(c => c.clause_id);
    
    await pool.execute(
      'UPDATE templates SET clause_order = ? WHERE id = ?',
      [JSON.stringify(clauseIds), templateId]
    );
  }
}

module.exports = new TemplateModel();
