import { useEffect, useState } from 'react';
import { useClauses } from '../../hooks/useClauses';
import { useNotification } from '../../hooks/useNotification';

import { Card, Notification } from '../common';
import { ClauseForm } from './ClauseForm';
import { ClauseList } from './ClauseList';
import { MergeControls } from './MergeControls';
import { ClausePreview } from './ClausePreview';

import { clausesAPI } from '../../services/api';
import '../../styles/ClauseManager.css';

export default function ClauseManager() {
    const {
        clauses,
        loading,
        loadClauses,
        createClause,
        updateClause,
        deleteClause,
        mergeClauses,
        toggleSample,
        cloneSample,
        generateAI,
        generateSingleAI
    } = useClauses();

    const { notification, showNotification } = useNotification();

    const [formData, setFormData] = useState(null);
    const [mergeMode, setMergeMode] = useState(false);
    const [selectedForMerge, setSelectedForMerge] = useState([]);
    const [previewClause, setPreviewClause] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [view, setView] = useState('normal');
    const [pendingMerge, setPendingMerge] = useState(null);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiSingleLoading, setAiSingleLoading] = useState(false);

    // Load all clauses on mount
    useEffect(() => {
        loadClauses();
    }, [loadClauses]);

    /* ------------------------------------------------------------------
     * CRUD + ACTION HANDLERS
     * ------------------------------------------------------------------ */

    const handleSave = async (data) => {
        const result = data.id
            ? await updateClause(data.id, data)
            : await createClause(data);

        if (result.success) {
            showNotification(
                data.id ? 'Clause updated successfully!' : 'Clause created successfully!',
                'success'
            );
            setFormData(null);
        } else {
            showNotification(result.error, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this clause?')) return;

        const result = await deleteClause(id);

        if (result.success) {
            showNotification('Clause deleted', 'success');
            if (formData?.id === id) setFormData(null);
        } else {
            showNotification(result.error, 'error');
        }
    };

    const handleToggleSample = async (clause) => {
        const result = await toggleSample(clause.id, !clause.is_sample);

        if (result.success) {
            showNotification(
                clause.is_sample ? 'Unmarked as sample' : 'Marked as sample',
                'success'
            );
        } else {
            showNotification(result.error, 'error');
        }
    };

    const handleCloneSample = async (clause) => {
        const newCategory = window.prompt(
            'Enter category for cloned clause:',
            clause.category
        );
        if (!newCategory) return;

        const result = await cloneSample(clause.id, { category: newCategory });

        if (result.success) {
            showNotification('Sample cloned successfully', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    };

    /* ------------------------------------------------------------------
     * MERGE HANDLING
     * ------------------------------------------------------------------ */

    const toggleMergeSelection = (clause) => {
        setSelectedForMerge((prev) =>
            prev.some((c) => c.id === clause.id)
                ? prev.filter((c) => c.id !== clause.id)
                : [...prev, clause]
        );
    };

    const handleMergeSelected = () => {
        if (selectedForMerge.length < 2) {
            return showNotification('Select at least 2 clauses to merge', 'error');
        }

        const clauseTypes = selectedForMerge.map((c) => c.clause_type);

        const clause_type =
            clauseTypes.length > 3
                ? `${clauseTypes.slice(0, 3).join(', ')} and ${
                      clauseTypes.length - 3
                  } others`
                : clauseTypes.join('_and_');

        const category = `merged_${selectedForMerge[0].category || 'general'}`;

        setPendingMerge({
            clause_ids: selectedForMerge.map((c) => c.id),
            clause_type,
            category,
            sources: selectedForMerge
        });
    };

    const confirmMerge = async () => {
        if (!pendingMerge) return;

        const result = await mergeClauses({
            clause_ids: pendingMerge.clause_ids,
            clause_type: pendingMerge.clause_type,
            category: pendingMerge.category,
            is_sample: false
        });

        if (result.success) {
            showNotification('Clauses merged successfully!', 'success');
            exitMergeMode();
        } else {
            showNotification(result.error, 'error');
        }
    };

    const exitMergeMode = () => {
        setMergeMode(false);
        setSelectedForMerge([]);
        setPendingMerge(null);
    };

    /* ------------------------------------------------------------------
     * AI GENERATION
     * ------------------------------------------------------------------ */

    const handleAIGenerateFullSet = async () => {
        const docType = window.prompt('Enter document type (e.g., offer_letter, nda):');
        if (!docType) return showNotification("Document type required", "error");

        try {
            setAiLoading(true);

            const result = await generateAI({
                document_type: docType,
                category: docType
            });

            if (result.success && result.data.clauses?.length > 0) {
                const preview = result.data.clauses
                    .map(
                        (c, i) =>
                            `${i + 1}. ${c.clause_type}: ${(c.content || '').substring(
                                0,
                                80
                            )}...`
                    )
                    .join('\n\n');

                const confirm = window.confirm(
                    `Generated ${result.data.clauses.length} clauses for "${docType}":\n\n${preview}\n\nSave these clauses?`
                );

                if (confirm) {
                    await clausesAPI.saveAIGenerated(result.data.clauses);
                    loadClauses();
                    showNotification('AI clauses saved!', 'success');
                }
            } else {
                showNotification("AI generated no clauses for this document type.", "info");
            }
        } catch (error) {
            showNotification("AI generation failed", "error");
        } finally {
            setAiLoading(false);
        }
    };

    const handleAIGenerateSingle = async () => {
        const clause_type = window.prompt('Enter clause type (e.g., Confidentiality):');
        if (!clause_type) return showNotification("Clause type required", "error");

        const category = window.prompt('Enter category (e.g., nda):');
        if (!category) return showNotification("Category required", "error");

        try {
            setAiSingleLoading(true);

            const result = await generateSingleAI({
                clause_type,
                category
            });

            if (result.success) {
                showNotification(`AI clause "${clause_type}" saved!`, 'success');
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            showNotification("AI generation failed", "error");
        } finally {
            setAiSingleLoading(false);
        }
    };

    /* ------------------------------------------------------------------
     * RENDER
     * ------------------------------------------------------------------ */

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                ðŸ“œ Clause Manager
                {mergeMode && (
                    <span
                        style={{
                            marginLeft: '1rem',
                            fontSize: '0.875rem',
                            padding: '0.25rem 0.75rem',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '9999px'
                        }}
                    >
                        MERGE MODE
                    </span>
                )}
            </h1>

            {/* Notifications */}
            {notification && <Notification {...notification} />}

            {/* Pending merge banner */}
            {pendingMerge && (
                <div
                    style={{
                        background: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div>
                        <strong>Merge Ready:</strong>{' '}
                        {pendingMerge.sources.map((s) => s.clause_type).join(' + ')} â†’{' '}
                        <em>{pendingMerge.clause_type}</em>
                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                            (category: {pendingMerge.category})
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setPendingMerge(null)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button onClick={confirmMerge} className="btn btn-success">
                            Confirm Merge
                        </button>
                    </div>
                </div>
            )}

            {/* Merge controls + AI */}
            <MergeControls
                mergeMode={mergeMode}
                selectedCount={selectedForMerge.length}
                onToggle={() => (mergeMode ? exitMergeMode() : setMergeMode(true))}
                onMerge={handleMergeSelected}
                onAIGenerateFullSet={handleAIGenerateFullSet}
                onAIGenerateSingle={handleAIGenerateSingle}
                aiLoading={aiLoading}
                aiSingleLoading={aiSingleLoading}
            />

            {/* Clause Form */}
            <Card title={formData ? 'âœï¸ Edit Clause' : 'âž• Create New Clause'}>
                <ClauseForm
                    initialData={formData}
                    onSave={handleSave}
                    onCancel={() => setFormData(null)}
                />
            </Card>

            {/* Clause List */}
            <div style={{ marginTop: '2rem' }}>
                {/* View Switch */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className={`btn ${view === 'normal' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('normal')}
                    >
                        Normal Clauses
                    </button>
                    <button
                        className={`btn ${view === 'merged' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('merged')}
                    >
                        Merged Clauses
                    </button>
                </div>

                {/* Category Filter */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: '0.5rem', fontWeight: 600 }}>
                        {view === 'merged'
                            ? 'Filter Merged Categories:'
                            : 'Filter Categories:'}
                    </label>

                    <input
                        type="text"
                        placeholder={
                            view === 'merged'
                                ? 'Filter merged_* categories...'
                                : 'Filter categories...'
                        }
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            minWidth: '250px'
                        }}
                    />
                </div>

                {/* List Component */}
                <ClauseList
                    clauses={clauses}
                    loading={loading}
                    view={view}
                    filterCategory={filterCategory}
                    mergeMode={mergeMode}
                    selectedForMerge={selectedForMerge}
                    onEdit={setFormData}
                    onDelete={handleDelete}
                    onPreview={setPreviewClause}
                    onToggleSelect={toggleMergeSelection}
                    onToggleSample={handleToggleSample}
                    onCloneSample={handleCloneSample}
                />
            </div>

            {/* Preview Modal */}
            {previewClause && (
                <ClausePreview
                    clause={previewClause}
                    onClose={() => setPreviewClause(null)}
                />
            )}
        </div>
    );
}

