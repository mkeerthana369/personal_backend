const { pool } = require('../connection');

class TranslateModel {
  
  async createPreview(data) {
    const {
      preview_id,
      original_id,
      original_type,
      lang,
      translated_content,
      created_by,
      expires_at
    } = data;
    
    await pool.execute(
      `INSERT INTO translation_previews
       (preview_id, original_id, original_type, lang, translated_content, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [preview_id, original_id, original_type, lang, translated_content, created_by, expires_at]
    );
    
    return this.findPreview(preview_id);
  }
  
  async findPreview(preview_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM translation_previews WHERE preview_id = ? AND expires_at > NOW()',
      [preview_id]
    );
    
    return rows.length > 0 ? rows[0] : null;
  }
  
  async confirmPreview(preview_id, userId) {
    const preview = await this.findPreview(preview_id);
    if (!preview) throw new Error('Preview not found or expired');
    
    await pool.execute(
      `INSERT INTO translations 
       (original_id, original_type, lang, content, status, created_by, verified_by)
       VALUES (?, ?, ?, ?, 'confirmed', ?, ?)
       ON DUPLICATE KEY UPDATE 
         content = VALUES(content),
         status = 'confirmed',
         updated_at = CURRENT_TIMESTAMP,
         verified_by = VALUES(verified_by)`,
      [
        preview.original_id,
        preview.original_type,
        preview.lang,
        preview.translated_content,
        preview.created_by,
        userId || preview.created_by
      ]
    );
    
    await pool.execute(
      'UPDATE translation_previews SET confirmed = TRUE WHERE preview_id = ?',
      [preview_id]
    );
    
    const [rows] = await pool.execute(
      'SELECT id FROM translations WHERE original_id = ? AND original_type = ? AND lang = ?',
      [preview.original_id, preview.original_type, preview.lang]
    );
    
    return rows[0]?.id || null;
  }
  
  async findTranslation(original_id, original_type, lang) {
    const [rows] = await pool.execute(
      `SELECT * FROM translations 
       WHERE original_id = ? AND original_type = ? AND lang = ? AND status = 'confirmed'
       ORDER BY updated_at DESC LIMIT 1`,
      [original_id, original_type, lang]
    );
    
    return rows.length > 0 ? rows[0] : null;
  }
  
  async findAllTranslations(original_id, original_type) {
    const [rows] = await pool.execute(
      `SELECT * FROM translations 
       WHERE original_id = ? AND original_type = ? AND status = 'confirmed'
       ORDER BY lang`,
      [original_id, original_type]
    );
    
    return rows;
  }
}

module.exports = new TranslateModel();