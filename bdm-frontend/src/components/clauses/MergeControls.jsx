
import React from 'react';
import { GitMerge, Sparkles } from 'lucide-react';
import { Button } from '../common';

export function MergeControls({
    mergeMode,
    selectedCount,
    onToggle,
    onMerge,
    onAIGenerateFullSet,
    onAIGenerateSingle,
    aiLoading,
    aiSingleLoading
}) {
    return (
        <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            alignItems: 'center'
        }}>
            <Button
                variant={mergeMode ? 'warning' : 'outline'}
                icon={GitMerge}
                onClick={onToggle}
            >
                {mergeMode ? 'Exit Merge Mode' : 'Merge Mode'}
            </Button>

            {mergeMode && selectedCount >= 2 && (
                <Button
                    variant="success"
                    icon={GitMerge}
                    onClick={onMerge}
                >
                    Merge {selectedCount} Selected
                </Button>
            )}

            <Button
                variant="primary"
                icon={Sparkles}
                onClick={onAIGenerateSingle}
                loading={aiSingleLoading}
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                Generate Single (AI)
            </Button>

            <Button
                variant="primary"
                icon={Sparkles}
                onClick={onAIGenerateFullSet}
                loading={aiLoading}
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                Generate Full Set (AI)
            </Button>
        </div>
    );
}