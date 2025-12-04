-- FILE: database/schema.sql
-- BDM Backend V2 - Complete Database Schema

-- Create new database
CREATE DATABASE IF NOT EXISTS bdm_system_v2;
USE bdm_system_v2;

-- Drop existing tables (clean slate)
DROP TABLE IF EXISTS ai_generation_logs;
DROP TABLE IF EXISTS translation_previews;
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS template_clauses;
DROP TABLE IF EXISTS clauses;
DROP TABLE IF EXISTS templates;

-- ============================================
-- TEMPLATES TABLE (Create FIRST for foreign keys)
-- ============================================
CREATE TABLE templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL COMMENT 'offer_letter, nda, invoice, etc.',
    description TEXT NULL,
    clause_order JSON NULL COMMENT 'Array of clause IDs in order',
    is_ai_generated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_document_type (document_type),
    INDEX idx_template_name (template_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CLAUSES TABLE (WITH CASCADE DELETE)
-- ============================================
CREATE TABLE clauses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clause_type VARCHAR(100) NOT NULL COMMENT 'header, greeting, compensation, etc.',
    content TEXT NOT NULL COMMENT 'Plain text content (fallback)',
    content_html TEXT NULL COMMENT 'HTML formatted content (PRIMARY)',
    category VARCHAR(100) NOT NULL COMMENT 'offer_letter, nda, contract, etc.',
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_sample BOOLEAN DEFAULT FALSE COMMENT 'Sample clauses for cloning',
    
    -- Merge tracking
    parent_clause_ids JSON NULL COMMENT 'IDs of clauses merged to create this',
    formatting_metadata JSON NULL COMMENT 'Merge metadata',
    merge_order INT NULL COMMENT 'Order in merged clause',
    
    -- CASCADE DELETE: If clause created for template, delete with template
    template_id INT NULL COMMENT 'Template that owns this clause (for auto-generated)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- CASCADE DELETE RULE
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    
    INDEX idx_clause_type (clause_type),
    INDEX idx_category (category),
    INDEX idx_is_sample (is_sample),
    INDEX idx_template_id (template_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TEMPLATE-CLAUSES MAPPING (Many-to-Many)
-- ============================================
CREATE TABLE template_clauses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    clause_id INT NOT NULL,
    position INT NOT NULL COMMENT 'Order position in template',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- CASCADE DELETE: When template deleted, remove mappings
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    -- CASCADE DELETE: When clause deleted, remove mappings
    FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_template_clause (template_id, clause_id),
    INDEX idx_template_id (template_id),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENTS TABLE (Generated Documents)
-- ============================================
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    
    content_json JSON NOT NULL COMMENT 'Complete document with clauses (HTML)',
    variables JSON NULL COMMENT 'Variables used to fill placeholders',
    
    pdf_path VARCHAR(500) NULL COMMENT 'Path to saved PDF',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
    
    INDEX idx_document_type (document_type),
    INDEX idx_document_name (document_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRANSLATIONS TABLE
-- ============================================
CREATE TABLE translations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_id INT NOT NULL COMMENT 'ID from clauses/templates/documents',
    original_type VARCHAR(32) NOT NULL COMMENT 'clause | template | document',
    lang CHAR(2) NOT NULL COMMENT 'ISO 639-1 code (en, es, fr, etc.)',
    
    content TEXT NOT NULL COMMENT 'Translated content (HTML preferred)',
    
    status VARCHAR(20) DEFAULT 'generated' COMMENT 'generated | confirmed | rejected',
    created_by INT NULL COMMENT 'User ID who generated',
    verified_by INT NULL COMMENT 'User ID who verified',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_original_lang (original_id, original_type, lang),
    INDEX idx_original (original_type, original_id),
    INDEX idx_lang (lang),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRANSLATION PREVIEWS (Temporary)
-- ============================================
CREATE TABLE translation_previews (
    preview_id VARCHAR(128) PRIMARY KEY COMMENT 'UUID',
    original_id INT NOT NULL,
    original_type VARCHAR(32) NOT NULL,
    lang CHAR(2) NOT NULL,
    
    translated_content TEXT NOT NULL,
    
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Preview expiration time',
    confirmed BOOLEAN DEFAULT FALSE,
    
    INDEX idx_expires_at (expires_at),
    INDEX idx_original (original_id, original_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AI GENERATION LOGS
-- ============================================
CREATE TABLE ai_generation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_type VARCHAR(50) COMMENT 'clause | template | document | translation',
    prompt TEXT NULL COMMENT 'Prompt sent to AI',
    response_data JSON NULL COMMENT 'AI response metadata',
    
    tokens_used INT DEFAULT 0,
    cost_estimate DECIMAL(10, 6) DEFAULT 0.000000,
    
    provider VARCHAR(50) NULL COMMENT 'ollama | openrouter | openai',
    model VARCHAR(100) NULL COMMENT 'Model used',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_request_type (request_type),
    INDEX idx_provider (provider),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA (HTML-First)
-- ============================================
INSERT INTO clauses (clause_type, content, content_html, category, is_sample) VALUES
('header', 
 'COMPANY LETTERHEAD\n[Company Name]\n[Company Address]\n[City, State ZIP]',
 '<div style="text-align: center; margin-bottom: 20px;">\n    <h1 style="margin: 0; font-size: 24px; color: #333;">[Company Name]</h1>\n    <p style="margin: 5px 0; color: #666;">[Company Address]</p>\n    <p style="margin: 5px 0; color: #666;">[City, State ZIP]</p>\n  </div>',
 'offer_letter',
 TRUE),

('greeting',
 'Dear [Candidate Name],',
 '<p style="margin: 20px 0;">Dear <strong>[Candidate Name]</strong>,</p>',
 'offer_letter',
 TRUE),

('closing',
 'We look forward to welcoming you to our team.\n\nSincerely,\n[Sender Name]\n[Sender Title]',
 '<div style="margin-top: 30px;">\n    <p>We look forward to welcoming you to our team.</p>\n    <p style="margin-top: 20px;">Sincerely,</p>\n    <p style="margin-top: 40px;">\n      <strong>[Sender Name]</strong><br>\n      <em>[Sender Title]</em>\n    </p>\n  </div>',
 'offer_letter',
 TRUE);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Database setup complete!' AS status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bdm_system_v2' 
ORDER BY TABLE_NAME;

