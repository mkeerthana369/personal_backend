import React, { useMemo } from 'react';
import { Loading, EmptyState } from '../common';
import { ClauseCard } from './ClauseCard';
import { FileText } from 'lucide-react';

export function ClauseList({
  clauses,
  loading,
  view,
  filterCategory,
  mergeMode,
  selectedForMerge,
  onEdit,
  onDelete,
  onPreview,
  onToggleSelect,
  onToggleSample,
  onCloneSample
}) {
  const groupedClauses = useMemo(() => {
    let filtered = clauses;
    
    // Filter by category text
    if (filterCategory) {
      filtered = clauses.filter(c => 
        c.category?.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }

    // Filter by view (normal vs merged)
    filtered = filtered.filter(c => {
      if (view === 'merged') {
        return c.category?.startsWith('merged_');
      }
      return !c.category?.startsWith('merged_');
    });

    // Group by category
    return filtered.reduce((acc, clause) => {
      const category = clause.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(clause);
      return acc;
    }, {});
  }, [clauses, filterCategory, view]);

  if (loading) {
    return <Loading text="Loading clauses..." />;
  }

  if (Object.keys(groupedClauses).length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No clauses found"
        message={filterCategory ? 'No clauses match your filter' : 'Create your first clause to get started'}
      />
    );
  }

  return (
    <div className="clause-groups">
      {Object.keys(groupedClauses)
        .sort()
        .map((category) => (
          <details key={category} open className="clause-category-group">
            <summary
              style={{
                fontWeight: 600,
                fontSize: '1.1rem',
                padding: '0.75rem',
                cursor: 'pointer',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '0.75rem'
              }}
            >
              {category} ({groupedClauses[category].length})
            </summary>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem'
              }}
            >
              {groupedClauses[category].map(clause => (
                <ClauseCard
                  key={clause.id}
                  clause={clause}
                  mergeMode={mergeMode}
                  isSelected={selectedForMerge.some(c => c.id === clause.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPreview={onPreview}
                  onToggleSelect={onToggleSelect}
                  onToggleSample={onToggleSample}
                  onCloneSample={onCloneSample}
                />
              ))}
            </div>
          </details>
        ))}
    </div>
  );
}