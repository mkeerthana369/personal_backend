// ============================================
// FILE: src/database/models/clause.model.js
// Clause data access (~280 lines)
// ============================================

const { pool } = require('../connection');

class ClauseModel {
  
  // Helper: Parse JSON fields
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
  
  // Helper: Get unique clause_type
  async getUniqueClauseType(clause_type, category) {
    const [rows] = await pool.execute(
      'SELECT clause_type FROM clauses WHERE clause_type LIKE ? AND category = ?',
      [`${clause_type}%`, category]
    );
    
    const existing = rows.map(r => r.clause_type);
    
    if (!existing.includes(clause_type)) {
      return clause_type;
    }
    
    let counter = 1;
    let newType = `${clause_type}-${counter}`;
    while (existing.includes(newType)) {
      counter++;
      newType = `${clause_type}-${counter}`;
    }
    
    return newType;
  }
  
  // CREATE OPERATIONS
  
  async create(data) {
    const {
      clause_type,
      content,
      content_html = null,
      category,
      is_ai_generated = false,
      is_sample = false,
      parent_clause_ids = null,
      formatting_metadata = null,
      merge_order = null
    } = data;
    
    const uniqueType = await this.getUniqueClauseType(clause_type, category);
    
    const query = `
      INSERT INTO clauses 
      (clause_type, content, content_html, category, is_ai_generated, is_sample,
       parent_clause_ids, formatting_metadata, merge_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      uniqueType,
      content,
      content_html,
      category,
      is_ai_generated ? 1 : 0,
      is_sample ? 1 : 0,
      parent_clause_ids ? JSON.stringify(parent_clause_ids) : null,
      formatting_metadata ? JSON.stringify(formatting_metadata) : null,
      merge_order
    ]);
    
    return this.findById(result.insertId);
  }
  
  async createMany(clausesArray) {
    const created = [];
    for (const data of clausesArray) {
      const clause = await this.create(data);
      created.push(clause);
    }
    return created;
  }
  
  // MERGE OPERATION
  
  async merge(clause_ids, options = {}) {
    if (!Array.isArray(clause_ids) || clause_ids.length < 2) {
      throw new Error('At least 2 clause IDs required for merge');
    }
    
    const clauses = await this.findByIds(clause_ids);
    if (clauses.length !== clause_ids.length) {
      const found = clauses.map(c => c.id);
      const missing = clause_ids.filter(id => !found.includes(id));
      throw new Error(`Missing clause IDs: ${missing.join(', ')}`);
    }
    
    const orderedClauses = clause_ids.map(id => clauses.find(c => c.id === id));
    const baseClause = orderedClauses[0];
    
    const clause_type = options.clause_type || 
      orderedClauses.map(c => c.clause_type).join('_and_');
    
    const category = options.category || `merged_${baseClause.category}`;
    
    const mergedContent = orderedClauses.map(c => c.content).join('\n\n');
    const mergedHTML = orderedClauses.map(c => c.content_html || c.content).join('<br><br>\n');
    
    const metadata = {
      merged_at: new Date().toISOString(),
      source_count: clause_ids.length,
      sources: orderedClauses.map((c, idx) => ({
        id: c.id,
        clause_type: c.clause_type,
        category: c.category,
        order: idx + 1
      }))
    };
    
    return this.create({
      clause_type,
      content: mergedContent,
      content_html: mergedHTML,
      category,
      is_ai_generated: false,
      is_sample: options.is_sample || false,
      parent_clause_ids: clause_ids,
      formatting_metadata: metadata,
      merge_order: 0
    });
  }
  
  // READ OPERATIONS
  
  async findAll(filters = {}) {
    let query = 'SELECT * FROM clauses WHERE 1=1';
    const params = [];
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.clause_type) {
      query += ' AND clause_type = ?';
      params.push(filters.clause_type);
    }
    
    if (filters.is_sample !== undefined) {
      query += ' AND is_sample = ?';
      params.push(filters.is_sample ? 1 : 0);
    }
    
    if (filters.is_merged === true) {
      query += ' AND parent_clause_ids IS NOT NULL';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({
      ...row,
      parent_clause_ids: this.parseJSON(row.parent_clause_ids),
      formatting_metadata: this.parseJSON(row.formatting_metadata)
    }));
  }
  
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM clauses WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    return {
      ...rows[0],
      parent_clause_ids: this.parseJSON(rows[0].parent_clause_ids),
      formatting_metadata: this.parseJSON(rows[0].formatting_metadata)
    };
  }
  
  async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT * FROM clauses WHERE id IN (${placeholders})`,
      ids
    );
    return rows.map(row => ({
      ...row,
      parent_clause_ids: this.parseJSON(row.parent_clause_ids),
      formatting_metadata: this.parseJSON(row.formatting_metadata)
    }));
  }
  
  async findByCategory(category) {
    return this.findAll({ category });
  }
  
  // UPDATE & DELETE
  
  async update(id, updateData) {
    const allowed = [
      'clause_type', 'content', 'content_html', 'category',
      'is_ai_generated', 'is_sample'
    ];
    
    const fields = [];
    const params = [];
    
    Object.keys(updateData).forEach(key => {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    await pool.execute(
      `UPDATE clauses SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    
    return this.findById(id);
  }
  
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM clauses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  // SAMPLE OPERATIONS
  
  async markAsSample(id, isSample) {
    await pool.execute('UPDATE clauses SET is_sample = ? WHERE id = ?', [isSample ? 1 : 0, id]);
    return this.findById(id);
  }
  
  async findAllSamples(category = null) {
    return this.findAll({ is_sample: true, ...(category && { category }) });
  }
  
  async cloneFromSample(sampleId, newCategory) {
    const sample = await this.findById(sampleId);
    if (!sample) throw new Error('Sample clause not found');
    if (!sample.is_sample) throw new Error('Clause is not marked as sample');
    
    return this.create({
      clause_type: sample.clause_type,
      content: sample.content,
      content_html: sample.content_html,
      category: newCategory || sample.category,
      is_ai_generated: false,
      is_sample: false
    });
  }
}

module.exports = new ClauseModel();