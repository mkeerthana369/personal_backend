-- ============================================
-- TEST SCRIPT: cascade delete verification
-- FILE: database/test_cascade.sql
-- ============================================

-- Ensure we are using the correct database
USE bdm_system_v2;

-- 1. Create a test template
INSERT INTO templates (template_name, document_type, description, is_ai_generated)
VALUES ('Test Template', 'test', 'For testing cascade delete', TRUE);

SET @template_id = LAST_INSERT_ID();

-- 2. Create clauses owned by template
INSERT INTO clauses (clause_type, content, content_html, category, is_ai_generated, template_id)
VALUES 
('header', 'Test Header', '<h1>Test Header</h1>', 'test', TRUE, @template_id),
('body', 'Test Body', '<p>Test Body</p>', 'test', TRUE, @template_id);

-- 3. Check clauses exist
SELECT * FROM clauses WHERE template_id = @template_id;

-- 4. DELETE TEMPLATE (should cascade delete clauses)
DELETE FROM templates WHERE id = @template_id;

-- 5. Verify clauses were deleted (should return 0 rows)
SELECT * FROM clauses WHERE template_id = @template_id;

-- Cleanup any leftover test templates just in case
DELETE FROM templates WHERE document_type = 'test';
-- End of test script