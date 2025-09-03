//***** js/history.js ******
// js/history.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { SVG_NS } from './config.js';
import { ensureHandles } from './elements.js';
import { makeElementInteractive } from './interactions.js';
import { clearSelection } from './selection.js';
import { setFieldBackground } from './fieldSelector.js';
import { initZoom } from './zoom.js';

const MAX_HISTORY_SIZE = 50;

export function saveStateForUndo() {
    const fieldContent = dom.fieldLayer.innerHTML;
    const elementsContent = dom.contentLayer.innerHTML;
    const currentFieldElement = dom.fieldLayer.querySelector('[data-field-id]');
    const currentFieldId = currentFieldElement ? currentFieldElement.dataset.fieldId : 'Empty';
    const currentViewBox = { ...appState.viewBox };

    const state = {
        fieldHTML: fieldContent,
        contentHTML: elementsContent,
        fieldId: currentFieldId,
        viewBox: currentViewBox,
    };

    const lastState = appState.undoStack[appState.undoStack.length - 1];
    if (lastState &&
        lastState.contentHTML === state.contentHTML &&
        lastState.fieldHTML === state.fieldHTML &&
        JSON.stringify(lastState.viewBox) === JSON.stringify(state.viewBox)
    ) {
        return;
    }
    clearSelection();
    appState.undoStack.push(state);
    if (appState.undoStack.length > MAX_HISTORY_SIZE) appState.undoStack.shift();
    if (appState.redoStack.length > 0) appState.redoStack = [];
    if (appState.undoStack.length > 1) appState.isDrawingModified = true;
    updateUndoRedoButtons();
}

function restoreState(state) {
    if (!state) return;
    clearSelection();

    // Step 1: Set field background, using 'fieldIntrinsic' mode.
    // This sets canvas pixel size and a basic viewBox for the field itself.
    setFieldBackground(state.fieldId || 'Empty', false, 'fieldIntrinsic');

    // Step 2: Restore Content
    dom.contentLayer.innerHTML = state.contentHTML || '';
    dom.contentLayer.querySelectorAll(".canvas-element").forEach(element => {
        const elementType = element.dataset.elementType;
        const isPlayer = elementType === 'player';
        ensureHandles(element, null, null, isPlayer);
        makeElementInteractive(element);
    });

    // Step 3: Set the final viewBox based on saved state or fit content
    if (state.viewBox && state.viewBox.width > 0 && state.viewBox.height > 0) {
        appState.viewBox = { ...state.viewBox };
        appState.initialViewBox = { ...state.viewBox };
        dom.svgCanvas.setAttribute('viewBox', `${state.viewBox.x.toFixed(3)} ${state.viewBox.y.toFixed(3)} ${state.viewBox.width.toFixed(3)} ${state.viewBox.height.toFixed(3)}`);
    } else {
        // If no specific viewBox was saved, recalculate to fit field and content.
        // setFieldBackground will update appState.viewBox and appState.initialViewBox.
        setFieldBackground(state.fieldId || 'Empty', false, 'fitFieldAndContent');
    }

    initZoom();

    appState.isDrawingModified = appState.undoStack.length > 1;
    updateUndoRedoButtons();
}

export function undo() {
    if (appState.undoStack.length <= 1) return;
    const currentState = appState.undoStack.pop();
    appState.redoStack.push(currentState);
    const previousState = appState.undoStack[appState.undoStack.length - 1];
    restoreState(previousState);
}

export function redo() {
    if (appState.redoStack.length === 0) return;
    const stateToRedo = appState.redoStack.pop();
    appState.undoStack.push(stateToRedo);
    restoreState(stateToRedo);
}

export function updateUndoRedoButtons() {
    if (dom.undoButton) {
        dom.undoButton.disabled = appState.undoStack.length <= 1;
    }
    if (dom.redoButton) {
        dom.redoButton.disabled = appState.redoStack.length === 0;
    }
}