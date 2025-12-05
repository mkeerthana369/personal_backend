import { Modal, Button } from '../common';

export function ClausePreview({ clause, onClose }) {
  if (!clause) return null;

  return (
    <Modal
      open={!!clause}
      onClose={onClose}
      title={clause.clause_type}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div style={{ padding: '0.5rem' }}>
        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 600, marginRight: '1rem' }}>Category:</span>
          <span style={{ color: '#64748b' }}>{clause.category}</span>
        </div>
        
        <div
          style={{ 
            lineHeight: '1.8',
            fontSize: '1rem',
            color: '#334155'
          }}
          dangerouslySetInnerHTML={{
            __html: clause.content_html || clause.content
          }}
        />
      </div>
    </Modal>
  );
}