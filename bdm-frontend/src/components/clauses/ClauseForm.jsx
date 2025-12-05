import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button, FormGroup } from '../common';
import { RichTextEditor } from './RichTextEditor';

export function ClauseForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      clause_type: '',
      content_html: '',
      category: '',
      is_sample: false
    }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        content_html: initialData.content_html || initialData.content || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clause_type || !formData.category || !formData.content_html) {
      alert('Please fill all required fields (Clause Type, Category, Content)');
      return;
    }

    setSaving(true);
    
    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.content_html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    const payload = {
      ...formData,
      content: plainText
    };

    await onSave(payload);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="clause-form">
      <div className="clause-input-row">
        <FormGroup label="Clause Type" required>
          <input
            type="text"
            placeholder="e.g., compensation, confidentiality"
            className="clause-input"
            value={formData.clause_type}
            onChange={(e) => setFormData({ ...formData, clause_type: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup label="Category" required>
          <input
            type="text"
            placeholder="e.g., offer_letter, nda"
            className="clause-input"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </FormGroup>
      </div>

      <FormGroup label="Clause Content" required>
        <div className="clause-textarea-box">
          <RichTextEditor
            value={formData.content_html}
            onChange={(html) => setFormData({ ...formData, content_html: html })}
            placeholder="Enter clause content..."
          />
        </div>
      </FormGroup>

      <label className="clause-checkbox">
        <input
          type="checkbox"
          checked={formData.is_sample}
          onChange={(e) => setFormData({ ...formData, is_sample: e.target.checked })}
        />
        <span>Mark as sample clause</span>
      </label>

      <div className="clause-actions">
        <button
          type="submit"
          disabled={saving}
          className="clause-btn-primary"
        >
          <PlusCircle size={16} style={{ marginRight: '0.5rem' }} />
          {saving ? 'Saving...' : initialData ? 'Save Changes' : 'Add Clause'}
        </button>
        
        {initialData && (
          <button
            type="button"
            onClick={onCancel}
            className="clause-btn-secondary"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
}