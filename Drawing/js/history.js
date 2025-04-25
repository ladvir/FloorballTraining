// js/history.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { SVG_NS } from './config.js';
import { ensureHandles } from './elements.js';
import { makeElementInteractive } from './interactions.js';
import { clearSelection } from './selection.js';
import { setFieldBackground } from './fieldSelector.js'; // Import to restore field

const MAX_HISTORY_SIZE = 50; // Limit the number of undo steps

/**
 * Captures the current state of the canvas for undo.
 * Clears the redo stack.
 */
export function saveStateForUndo() {
    // Only save state if the content or field has changed since the last saved state
    // This check needs to happen *before* clearing selection or modifying the DOM for the save.

    const fieldContent = dom.fieldLayer.innerHTML;
    const elementsContent = dom.contentLayer.innerHTML;
    const currentFieldElement = dom.fieldLayer.querySelector('[data-field-id]');
    const currentFieldId = currentFieldElement ? currentFieldElement.dataset.fieldId : 'none';

    const state = {
        fieldHTML: fieldContent,
        contentHTML: elementsContent,
        fieldId: currentFieldId,
    };

    // Prevent saving identical consecutive states
    const lastState = appState.undoStack[appState.undoStack.length - 1];
    if (lastState && lastState.contentHTML === state.contentHTML && lastState.fieldHTML === state.fieldHTML) {
        // console.log("Undo state identical to previous, skipping save.");
        return;
    }

    clearSelection(); // Clear selection before saving state

    appState.undoStack.push(state);

    // Limit history size
    if (appState.undoStack.length > MAX_HISTORY_SIZE) {
        appState.undoStack.shift(); // Remove the oldest state
    }

    // Clear redo stack whenever a new action is performed
    if (appState.redoStack.length > 0) {
        appState.redoStack = [];
    }

    // Mark the drawing as modified after a state is saved (unless it's the very first state)
    if (appState.undoStack.length > 1) {
        appState.isDrawingModified = true;
    }


    console.log(`State saved. Undo: ${appState.undoStack.length}, Redo: ${appState.redoStack.length}, Modified: ${appState.isDrawingModified}`);
    updateUndoRedoButtons();
}

/**
 * Restores the canvas layers from a given state object.
 * Re-attaches necessary event listeners.
 */
function restoreState(state) {
    if (!state) return;

    console.log("Restoring state...");
    clearSelection(); // Clear current selection

    // Restore Field
    dom.fieldLayer.innerHTML = state.fieldHTML || '';
    // We need to ensure the field selector trigger matches the restored field
    // Call setFieldBackground with shouldSaveState = false to prevent saving this restoration as a new undo state
    setFieldBackground(state.fieldId || 'none', false);

    // Restore Content
    dom.contentLayer.innerHTML = state.contentHTML || '';

    // Re-initialize elements in the restored content layer
    dom.contentLayer.querySelectorAll(".canvas-element").forEach(element => {
        const elementType = element.dataset.elementType;
        const isPlayer = elementType === 'player';
        // Ensure handles and visual state (like rotation data) are correct
        ensureHandles(element, null, null, isPlayer);
        // Re-attach interaction listeners
        makeElementInteractive(element);
    });

    // When restoring, the drawing is now in the state it was when it was saved.
    // If this state is the initial empty state (undoStack.length === 1), it's not modified.
    // Otherwise, it is considered modified.
    appState.isDrawingModified = appState.undoStack.length > 1;


    console.log(`State restored. Undo: ${appState.undoStack.length}, Redo: ${appState.redoStack.length}, Modified: ${appState.isDrawingModified}`);
}

/**
 * Performs the Undo action.
 */
export function undo() {
    if (appState.undoStack.length <= 1) { // Need at least one state to undo *to*
        console.log("Nothing to undo.");
        return;
    }

    // Move the current state (the one being undone) to the redo stack
    const currentState = appState.undoStack.pop();
    appState.redoStack.push(currentState);

    // Get the previous state from the undo stack
    const previousState = appState.undoStack[appState.undoStack.length - 1];

    // Restore the previous state
    restoreState(previousState);

    // Modified state is set within restoreState now
    updateUndoRedoButtons();
}

/**
 * Performs the Redo action.
 */
export function redo() {
    if (appState.redoStack.length === 0) {
        console.log("Nothing to redo.");
        return;
    }

    // Move the state to redo back to the undo stack
    const stateToRedo = appState.redoStack.pop();
    appState.undoStack.push(stateToRedo);

    // Restore the redone state
    restoreState(stateToRedo);

    // Modified state is set within restoreState now
    updateUndoRedoButtons();
}

/**
 * Updates the enabled/disabled state of the Undo and Redo buttons.
 */
export function updateUndoRedoButtons() {
    if (dom.undoButton) {
        // Can undo if there's more than one state (the initial state + at least one action)
        dom.undoButton.disabled = appState.undoStack.length <= 1;
    }
    if (dom.redoButton) {
        // Can redo if there's anything in the redo stack
        dom.redoButton.disabled = appState.redoStack.length === 0;
    }
}