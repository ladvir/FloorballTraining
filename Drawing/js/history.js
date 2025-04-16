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
    clearSelection(); // Clear selection before saving state

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
        console.log("Undo state identical to previous, skipping save.");
        return;
    }

    appState.undoStack.push(state);

    // Limit history size
    if (appState.undoStack.length > MAX_HISTORY_SIZE) {
        appState.undoStack.shift(); // Remove the oldest state
    }

    // Clear redo stack whenever a new action is performed
    if (appState.redoStack.length > 0) {
        appState.redoStack = [];
    }

    console.log(`State saved. Undo: ${appState.undoStack.length}, Redo: ${appState.redoStack.length}`);
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
    setFieldBackground(state.fieldId || 'none'); // This updates the trigger display

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

    console.log("State restored.");
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

    console.log(`Undo performed. Undo: ${appState.undoStack.length}, Redo: ${appState.redoStack.length}`);
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

    console.log(`Redo performed. Undo: ${appState.undoStack.length}, Redo: ${appState.redoStack.length}`);
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