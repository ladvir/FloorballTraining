import { useState, useCallback } from 'react';
import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine, TextItem, NumberItem } from '../DrawingTypes';
import type { SelectedItems } from '../utils/selectionUtils';

export interface DrawingState {
    lines: Line[];
    freehandLines: FreehandLine[];
    players: PlayerOnCanvas[];
    equipment: EquipmentOnCanvas[];
    texts: TextItem[];
    numbers: NumberItem[];
    selectedItems: SelectedItems;
}

export interface UndoRedoHook {
    history: DrawingState[];
    redoStack: DrawingState[];
    saveHistory: (state: DrawingState) => void;
    undo: (currentState: DrawingState) => DrawingState | null;
    redo: (currentState: DrawingState) => DrawingState | null;
    clearHistory: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

/**
 * Custom hook for managing undo/redo functionality
 */
export function useUndoRedo(): UndoRedoHook {
    const [history, setHistory] = useState<DrawingState[]>([]);
    const [redoStack, setRedoStack] = useState<DrawingState[]>([]);

    const saveHistory = useCallback((state: DrawingState) => {
        setHistory(prev => [...prev, state]);
        setRedoStack([]);
    }, []);

    const undo = useCallback((currentState: DrawingState): DrawingState | null => {
        if (history.length === 0) return null;
        setRedoStack(prev => [...prev, currentState]);
        const prevState = history[history.length - 1];
        setHistory(h => h.slice(0, h.length - 1));
        return prevState;
    }, [history]);

    const redo = useCallback((currentState: DrawingState): DrawingState | null => {
        if (redoStack.length === 0) return null;
        setHistory(prev => [...prev, currentState]);
        const nextState = redoStack[redoStack.length - 1];
        setRedoStack(r => r.slice(0, r.length - 1));
        return nextState;
    }, [redoStack]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setRedoStack([]);
    }, []);

    return {
        history,
        redoStack,
        saveHistory,
        undo,
        redo,
        clearHistory,
        canUndo: history.length > 0,
        canRedo: redoStack.length > 0
    };
}


