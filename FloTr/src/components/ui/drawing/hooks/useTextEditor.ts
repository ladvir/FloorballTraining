import { useState, useCallback } from 'react';
import { generateId } from '../utils/idGenerator';

export interface EditingText {
    id?: string;
    x: number;
    y: number;
    draft: string;
    fontSize: number;
    color: string;
    mode: 'create' | 'edit';
}

export interface TextEditorHook {
    editingText: EditingText | null;
    startEditing: (text: EditingText) => void;
    stopEditing: () => void;
    updateDraft: (draft: string) => void;
    handleKeyDown: (e: KeyboardEvent, onSave: (text: EditingText) => void, onDelete?: (id: string) => void) => void;
}

/**
 * Custom hook for managing text editing
 */
export function useTextEditor(): TextEditorHook {
    const [editingText, setEditingText] = useState<EditingText | null>(null);

    const startEditing = useCallback((text: EditingText) => {
        setEditingText(text);
    }, []);

    const stopEditing = useCallback(() => {
        setEditingText(null);
    }, []);

    const updateDraft = useCallback((draft: string) => {
        setEditingText(prev => prev ? { ...prev, draft } : null);
    }, []);

    const handleKeyDown = useCallback((
        e: KeyboardEvent,
        onSave: (text: EditingText) => void,
        onDelete?: (id: string) => void
    ) => {
        if (!editingText) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            stopEditing();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const trimmed = editingText.draft.trim();
            
            if (trimmed) {
                if (editingText.mode === 'create') {
                    const newId = generateId('txt');
                    onSave({ ...editingText, id: newId, draft: trimmed });
                } else if (editingText.mode === 'edit' && editingText.id) {
                    onSave({ ...editingText, draft: trimmed });
                }
            } else if (editingText.mode === 'edit' && editingText.id && onDelete) {
                onDelete(editingText.id);
            }
            
            stopEditing();
        }
    }, [editingText, stopEditing]);

    return {
        editingText,
        startEditing,
        stopEditing,
        updateDraft,
        handleKeyDown
    };
}


