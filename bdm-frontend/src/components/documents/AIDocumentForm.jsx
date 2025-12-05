import React, { useState } from 'react';
import { Save, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Card, FormGroup } from '../common';
import { clausesAPI, documentsAPI } from '../../services/api';
import { extractPlaceholders } from '../../utils/formatters';

export function AIDocumentForm({ onSuccess, showNotification }) {
    const [step, setStep] = useState(1);
    const [docType, setDocType] = useState('');
    const [initialContext, setInitialContext] = useState('');
    const [generatedClauses, setGeneratedClauses] = useState([]);
    const [placeholders, setPlaceholders] = useState([]);
    const [placeholderValues, setPlaceholderValues] = useState({});
    const [documentName, setDocumentName] = useState('');
    const [generating, setGenerating] = useState(false);

    // AI Bulk Excel state
    const [aiExcelFile, setAiExcelFile] = useState(null);
    const [aiBulkLoading, setAiBulkLoading] = useState(false);

    const handleGenerateClauses = async (e) => {
        e.preventDefault();
        if (!docType) return showNotification('Please enter document type', 'error');

        let parsedContext = {};
        if (initialContext) {
            try {
                parsedContext = JSON.parse(initialContext);
            } catch (err) {
                return showNotification('Invalid JSON in initial context.', 'error');
            }
        }

        setGenerating(true);
        try {
            // Call the AI generation endpoint
            const res = await clausesAPI.generateAI({
                document_type: docType,
                category: docType,
                context: parsedContext
            });

            // Extract clauses from response - backend returns {success, clauses, ...}
            const data = res.data.data || res.data;
            const clauses = data.clauses || [];
            
            if (!Array.isArray(clauses) || clauses.length === 0) {
                throw new Error("AI did not return valid clauses.");
            }

            setGeneratedClauses(clauses);

            // Extract placeholders from generated clauses
            const foundPlaceholders = new Set();
            clauses.forEach(clause => {
                if (clause && typeof clause.content === 'string') {
                    const extracted = extractPlaceholders(clause.content);
                    extracted.forEach(p => foundPlaceholders.add(p));
                }
                // Also check content_html
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
            setDocumentName(`${docType}_AI_${Date.now()}`);
            setStep(2);

            showNotification(`AI generated ${clauses.length} clauses. Fill ${placeholderArray.length} placeholders.`, 'success');
        } catch (err) {
            console.error('AI Generation Error:', err);
            showNotification(`Failed to generate clauses: ${err.message}`, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveDocument = async (e) => {
        if (e) e.preventDefault();

        if (!documentName || !Array.isArray(generatedClauses) || generatedClauses.length === 0) {
            return showNotification('Missing document name or generated clauses.', 'error');
        }

        // Fill placeholders in clauses
        const finalClauses = generatedClauses.map(clause => {
            let filledContent = String(clause?.content || '');
            let filledContentHtml = String(clause?.content_html || filledContent);
            
            placeholders.forEach(placeholder => {
                const value = placeholderValues[placeholder] || `[${placeholder}]`;
                const escapedPlaceholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`\\[${escapedPlaceholder}\\]`, 'g');
                filledContent = filledContent.replace(regex, value);
                filledContentHtml = filledContentHtml.replace(regex, value);
            });
            
            return { 
                ...clause, 
                content: filledContent,
                content_html: filledContentHtml
            };
        });

        setGenerating(true);

        try {
            // Use the document generate endpoint
            await documentsAPI.generate({
                document_name: documentName,
                document_type: docType,
                content_json: { clauses: finalClauses },
                variables: placeholderValues
            });

            onSuccess?.();
            resetForm();
            showNotification('Document saved successfully!', 'success');
        } catch (err) {
            console.error('Save Error:', err);
            showNotification(`Failed to save: ${err.response?.data?.error || err.message}`, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleAiBulkGenerate = async () => {
        try {
            if (!aiExcelFile) {
                return showNotification('Please upload an Excel file for AI bulk generation.', 'error');
            }
            if (!docType) {
                return showNotification('Please enter document type before AI bulk generation.', 'error');
            }

            setAiBulkLoading(true);
            showNotification('Starting AI bulk generation. Please wait...', 'info');

            const response = await documentsAPI.aiBulkGenerateFromExcel(docType, aiExcelFile);

            // Download the ZIP file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `AI_Bulk_Documents_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showNotification('AI bulk documents generated successfully. ZIP downloaded.', 'success');
            setAiExcelFile(null);
            const fileInput = document.getElementById('aiExcelInput');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            console.error('AI Bulk Error:', error);
            const msg = error?.response?.data?.error || error?.response?.data?.message || error.message || 'Failed to generate AI bulk documents';
            showNotification(msg, 'error');
        } finally {
            setAiBulkLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setDocType('');
        setInitialContext('');
        setGeneratedClauses([]);
        setPlaceholders([]);
        setPlaceholderValues({});
        setDocumentName('');
        setAiExcelFile(null);
        const fileInput = document.getElementById('aiExcelInput');
        if (fileInput) fileInput.value = '';
    };

    return (
        <>
            {step === 1 && (
                <Card title="⚡ Quick AI Generate - Step 1">
                    <form onSubmit={handleGenerateClauses}>
                        <FormGroup label="Document Type" required>
                            <input
                                type="text"
                                placeholder="e.g., offer_letter, nda, contract"
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="form-input"
                                required
                            />
                            <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                                Examples: offer_letter, nda, contract, invoice, agreement
                            </small>
                        </FormGroup>

                        <FormGroup label="Optional Initial Context (JSON format)">
                            <textarea
                                placeholder='e.g., {"company": "Acme Corp", "position": "Engineer"}'
                                value={initialContext}
                                onChange={(e) => setInitialContext(e.target.value)}
                                className="form-textarea"
                                rows="3"
                            />
                        </FormGroup>

                        <Button type="submit" variant="primary" loading={generating} icon={ArrowRight}>
                            {generating ? 'Generating...' : 'Generate Clauses'}
                        </Button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>
                            🤖 AI Bulk Document Generation from Excel
                        </h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#64748b' }}>
                            Uses the same Document Type as above and row values from Excel as context for AI.
                        </p>

                        <input
                            id="aiExcelInput"
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={(e) => setAiExcelFile(e.target.files?.[0] || null)}
                        />

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="secondary"
                                onClick={() => document.getElementById('aiExcelInput')?.click()}
                                disabled={aiBulkLoading}
                            >
                                {aiExcelFile ? `${aiExcelFile.name} ✔` : 'Choose Excel File'}
                            </Button>

                            <Button
                                variant="success"
                                icon={Sparkles}
                                onClick={handleAiBulkGenerate}
                                disabled={!aiExcelFile || !docType || aiBulkLoading}
                                loading={aiBulkLoading}
                            >
                                Generate AI PDFs from Excel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {step === 2 && (
                <Card
                    title={`⚡ Step 2: Fill Placeholders for "${docType}"`}
                    actions={
                        <Button variant="secondary" onClick={resetForm}>
                            Start Over
                        </Button>
                    }
                >
                    <form onSubmit={handleSaveDocument}>
                        <FormGroup label="Document Name" required>
                            <input
                                type="text"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </FormGroup>

                        {placeholders.length > 0 && (
                            <>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '1rem' }}>
                                    Fill Placeholders ({placeholders.length})
                                </h3>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                                    {placeholders.map(placeholder => (
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

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button type="submit" variant="success" icon={Save} loading={generating}>
                                {generating ? 'Saving...' : 'Save Document'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </>
    );
}