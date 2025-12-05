import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, FormGroup, Loading, EmptyState } from '../common';
import { documentsAPI, templatesAPI } from '../../services/api';
import { extractPlaceholders } from '../../utils/formatters';

export function TemplateDocumentForm({ templates, onSuccess, showNotification }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [documentName, setDocumentName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Bulk Excel state
  const [bulkExcelFile, setBulkExcelFile] = useState(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const handleSelectTemplate = async (template) => {
    setLoadingTemplate(true);
    setSelectedTemplate(null);
    setPlaceholders([]);
    setPlaceholderValues({});
    setDocumentName('');

    try {
      // Fetch full template details including clauses
      const res = await templatesAPI.getById(template.id);
      const templateData = res.data.data || res.data;

      if (!templateData || !Array.isArray(templateData.clauses)) {
        throw new Error('Invalid template data');
      }

      setSelectedTemplate(templateData);

      // Extract placeholders from all clauses
      const foundPlaceholders = new Set();
      templateData.clauses.forEach(clause => {
        if (clause && typeof clause.content === 'string') {
          const extracted = extractPlaceholders(clause.content);
          extracted.forEach(p => foundPlaceholders.add(p));
        }
        if (clause && typeof clause.content_html === 'string') {
          const extracted = extractPlaceholders(clause.content_html);
          extracted.forEach(p => foundPlaceholders.add(p));
        }
      });

      const placeholderArray = Array.from(foundPlaceholders);
      setPlaceholders(placeholderArray);

      const initialValues = {};
      placeholderArray.forEach(p => initialValues[p] = '');
      setPlaceholderValues(initialValues);
      setDocumentName(`${templateData.template_name}_${Date.now()}`);

      showNotification(`Template selected. Fill ${placeholderArray.length} placeholders.`, 'info');
    } catch (err) {
      console.error('Template Load Error:', err);
      showNotification('Failed to load template', 'error');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    
    if (!selectedTemplate) return showNotification('Please select a template first', 'error');

    const emptyPlaceholders = placeholders.filter(p => !placeholderValues[p]);
    if (emptyPlaceholders.length > 0) {
      const confirmContinue = window.confirm(
        `Warning: ${emptyPlaceholders.length} placeholders are empty:\n- ${emptyPlaceholders.join('\n- ')}\n\nContinue anyway?`
      );
      if (!confirmContinue) return;
    }

    try {
      setGenerating(true);
      
      // Generate document from template
      await documentsAPI.generate({
        template_id: selectedTemplate.id,
        document_name: documentName || `${selectedTemplate.template_name}_${Date.now()}`,
        document_type: selectedTemplate.document_type,
        context: placeholderValues
      });

      onSuccess?.();
      setSelectedTemplate(null);
      showNotification('Document generated successfully!', 'success');
    } catch (err) {
      console.error('Generation Error:', err);
      showNotification(`Generation failed: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedTemplate) {
      return showNotification('Please select a template first', 'error');
    }
    if (!bulkExcelFile) {
      return showNotification('Please upload an Excel file first', 'error');
    }

    try {
      setBulkGenerating(true);
      showNotification('Starting bulk generation. Please wait...', 'info');

      const res = await documentsAPI.bulkGenerateFromExcel(selectedTemplate.id, bulkExcelFile);
      
      // Download ZIP
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_documents_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Bulk documents generated successfully. ZIP downloaded.', 'success');
      setBulkExcelFile(null);
      const fileInput = document.getElementById('excelFileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Bulk Generation Error:', err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Failed to bulk-generate documents';
      showNotification(msg, 'error');
    } finally {
      setBulkGenerating(false);
    }
  };

  if (loadingTemplate) {
    return <Loading text="Loading template..." />;
  }

  return (
    <>
      {!selectedTemplate ? (
        <Card title="📋 Select a Template">
          {templates.length === 0 ? (
            <EmptyState
              title="No templates available"
              message="Create a template first in the Template Builder"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="card" 
                  style={{ 
                    cursor: 'pointer', 
                    border: '1px solid #ddd',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleSelectTemplate(template)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd'}
                >
                  {template.is_ai_generated && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      🤖 AI
                    </span>
                  )}
                  <h3 style={{ marginBottom: '0.5rem', paddingRight: '3rem' }}>{template.template_name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b' }}>📄 {template.document_type}</p>
                  <Button variant="primary" style={{ marginTop: '1rem', width: '100%' }}>
                    Select Template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card
            title={`✏️ Fill Template: ${selectedTemplate.template_name}`}
            actions={
              <Button variant="secondary" onClick={() => setSelectedTemplate(null)}>
                Change Template
              </Button>
            }
          >
            <form onSubmit={handleGenerate}>
              <FormGroup label="Document Name" required>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="form-input"
                  placeholder="Document name"
                  required
                />
              </FormGroup>

              {placeholders.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '1rem' }}>
                    Fill Placeholders ({placeholders.length})
                  </h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {placeholders.map((placeholder) => (
                      <FormGroup key={placeholder} label={placeholder} inline>
                        <input
                          type="text"
                          className="form-input"
                          value={placeholderValues[placeholder] || ''}
                          onChange={(e) => setPlaceholderValues(prev => ({
                            ...prev,
                            [placeholder]: e.target.value
                          }))}
                          placeholder={`Enter ${placeholder}`}
                        />
                      </FormGroup>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit" variant="success" loading={generating} icon={Save}>
                  {generating ? 'Generating...' : 'Generate Document'}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="📊 Bulk Generate from Excel" style={{ marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#64748b' }}>
              Upload an Excel file with placeholder values to generate multiple documents at once.
            </p>

            <input
              id="excelFileInput"
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)}
            />

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                onClick={() => document.getElementById("excelFileInput")?.click()}
                disabled={bulkGenerating}
              >
                {bulkExcelFile ? `${bulkExcelFile.name} ✔` : 'Choose Excel File'}
              </Button>

              <Button
                variant="primary"
                onClick={handleBulkGenerate}
                disabled={bulkGenerating || !bulkExcelFile}
                loading={bulkGenerating}
              >
                {bulkGenerating ? 'Generating...' : 'Generate Documents from Excel'}
              </Button>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#f8fafc', 
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#475569'
            }}>
              <strong>💡 Tips:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>First row should contain placeholder names (matching template placeholders)</li>
                <li>Each subsequent row will generate one document</li>
                <li>Documents will be downloaded as a ZIP file</li>
                <li>Maximum 100 documents per batch</li>
              </ul>
            </div>
          </Card>
        </>
      )}
    </>
  );
}