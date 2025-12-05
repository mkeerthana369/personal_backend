import React from 'react';
import { Pencil, Trash2, Eye, Star, Copy } from 'lucide-react';
import { Button, Badge } from '../common';

export function ClauseCard({
  clause,
  mergeMode,
  isSelected,
  onEdit,
  onDelete,
  onPreview,
  onToggleSelect,
  onToggleSample,
  onCloneSample
}) {
  const handleClick = () => {
    if (mergeMode) {
      onToggleSelect(clause);
    }
  };

  return (
    <div
      className="card"
      onClick={handleClick}
      style={{
        cursor: mergeMode ? 'pointer' : 'default',
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        background: isSelected ? '#eff6ff' : 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontWeight: 600, margin: 0 }}>{clause.clause_type}</h3>
        
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {clause.is_ai_generated && (
            <Badge variant="primary" style={{ background: '#dbeafe', color: '#1e40af' }}>
              AI
            </Badge>
          )}
          {clause.is_sample && (
            <Badge variant="warning" style={{ background: '#fef3c7', color: '#92400e' }}>
              ⭐ Sample
            </Badge>
          )}
          {(clause.parent_clause_ids || clause.category?.startsWith('merged_')) && (
            <Badge style={{ background: '#f3e8ff', color: '#6b21a8' }}>
              🔗 Merged
            </Badge>
          )}
        </div>
      </div>

      <div
        style={{
          color: '#475569',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          maxHeight: '100px',
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{
          __html: (clause.content_html || clause.content).substring(0, 200) +
            ((clause.content_html || clause.content).length > 200 ? '...' : '')
        }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={(e) => { e.stopPropagation(); onPreview(clause); }}
        >
          Preview
        </Button>

        <Button
          variant="warning"
          size="sm"
          icon={Pencil}
          onClick={(e) => { e.stopPropagation(); onEdit(clause); }}
        >
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={Star}
          onClick={(e) => { e.stopPropagation(); onToggleSample(clause); }}
        >
          {clause.is_sample ? 'Unmark' : 'Sample'}
        </Button>

        {clause.is_sample && (
          <Button
            variant="success"
            size="sm"
            icon={Copy}
            onClick={(e) => { e.stopPropagation(); onCloneSample(clause); }}
          >
            Clone
          </Button>
        )}

        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={(e) => { e.stopPropagation(); onDelete(clause.id); }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
