// js/persistence.js
import { dom } from './dom.js';
import { SVG_NS } from './config.js';
import { clearSelection } from './selection.js';
import { clearCollisionHighlights } from './collisions.js';
import { ensureHandles } from './elements.js';
import { makeElementInteractive } from './interactions.js';
// Import setFieldBackground to properly restore field
import { setFieldBackground } from './fieldSelector.js';
import { appState } from './state.js';
// Import history functions to clear stacks on load/import
import { updateUndoRedoButtons } from './history.js';
// Import zoom functions to potentially reset/initialize zoom state
import { initZoom, resetZoom } from './zoom.js';


/** Saves the current canvas content (including field) to localStorage. */
export function saveDrawing() {
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    // Temporarily remove volatile elements (like previews, selection rect)
    const selectionRectHTML = dom.selectionRect ? dom.selectionRect.outerHTML : '';
    const tempArrowHTML = dom.tempArrowPreview ? dom.tempArrowPreview.outerHTML : '';
    const tempArrow2HTML = dom.tempArrowPreview2 ? dom.tempArrowPreview2.outerHTML : '';
    const tempFreehandHTML = dom.tempFreehandPreview ? dom.tempFreehandPreview.outerHTML : '';
    const textInputHTML = dom.textInputContainer ? dom.textInputContainer.outerHTML : '';

    dom.selectionRect?.remove();
    dom.tempArrowPreview?.remove();
    dom.tempArrowPreview2?.remove();
    dom.tempFreehandPreview?.remove();
    if (dom.textInputContainer) dom.textInputContainer.style.display = 'none';

    const fieldContent = dom.fieldLayer.innerHTML;
    const elementsContent = dom.contentLayer.innerHTML;
    // Find current field ID to save it
    const currentFieldElement = dom.fieldLayer.querySelector('[data-field-id]');
    const currentFieldId = currentFieldElement ? currentFieldElement.dataset.fieldId : 'none';
    // Get current viewBox to save it
    const currentViewBox = dom.svgCanvas.getAttribute('viewBox');

    const savedData = {
        field: fieldContent,
        elements: elementsContent,
        selectedFieldId: currentFieldId,
        viewBox: currentViewBox // Save the viewBox string
    };

    try {
        localStorage.setItem("svgDrawing", JSON.stringify(savedData));
        alert("Drawing saved to browser storage!");
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        alert("Failed to save drawing. Storage might be full or disabled.");
    }


    // Put temporary elements back
    if (selectionRectHTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', selectionRectHTML);
    if (tempArrowHTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', tempArrowHTML);
    if (tempArrow2HTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', tempArrow2HTML);
    if (tempFreehandHTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', tempFreehandHTML);
    // Text input container visibility is handled separately
}

/** Loads canvas content from localStorage. */
export function loadDrawing() {
    const savedJson = localStorage.getItem("svgDrawing");
    if (savedJson) {
        if (!confirm("Loading will replace the current drawing and clear undo history. Continue?")) {
            return;
        }
        try {
            const savedData = JSON.parse(savedJson);
            clearSelection();
            dom.fieldLayer.innerHTML = '';
            dom.contentLayer.innerHTML = '';

            // Restore viewBox *before* initializing zoom state
            if (savedData.viewBox) {
                dom.svgCanvas.setAttribute('viewBox', savedData.viewBox);
            } else {
                // Reset to default if saved data has no viewBox (older save?)
                const width = parseFloat(dom.svgCanvas.getAttribute('width') || '800');
                const height = parseFloat(dom.svgCanvas.getAttribute('height') || '600');
                dom.svgCanvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }
            // Note: initZoom() will be called by the caller (app.js) after this function

            // Restore field background using the saved ID, don't save state here
            const fieldIdToLoad = savedData.selectedFieldId || 'none';
            setFieldBackground(fieldIdToLoad, false); // Don't save state during load

            // Restore elements into the content layer
            if (savedData.elements) {
                const tempContainer = document.createElementNS(SVG_NS, 'g');
                tempContainer.innerHTML = savedData.elements;
                while (tempContainer.firstChild) {
                    dom.contentLayer.appendChild(tempContainer.firstChild);
                }
            }

            // Re-initialize loaded elements
            dom.contentLayer.querySelectorAll(".canvas-element").forEach(element => {
                const elementType = element.dataset.elementType;
                const isPlayer = elementType === 'player';
                ensureHandles(element, null, null, isPlayer);
                makeElementInteractive(element);
            });

            // Clear history stacks after successful load
            appState.undoStack = [];
            appState.redoStack = [];
            updateUndoRedoButtons(); // Update buttons (will disable them)

            alert("Drawing loaded from browser storage!");
            // The initial state after load will be saved by the caller in app.js

        } catch (e) {
            console.error("Error parsing or loading saved drawing:", e);
            alert("Failed to load drawing. Data might be corrupt.");
        }
    } else {
        alert("No saved drawing found in browser storage!");
    }
}

/** Exports the current canvas content as an SVG file. */
export function exportDrawing() {
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    const svgExport = dom.svgCanvas.cloneNode(false);
    svgExport.removeAttribute('style');

    svgExport.setAttribute("xmlns", SVG_NS);
    svgExport.setAttribute("version", "1.1");

    // Ensure viewBox and dimensions are present (already handled by cloning)
    // if (!svgExport.hasAttribute('viewBox') && dom.svgCanvas.hasAttribute('viewBox')) {
    //     svgExport.setAttribute('viewBox', dom.svgCanvas.getAttribute('viewBox'));
    // }
    // if (!svgExport.hasAttribute('width')) svgExport.setAttribute('width', dom.svgCanvas.getAttribute('width') || '800');
    // if (!svgExport.hasAttribute('height')) svgExport.setAttribute('height', dom.svgCanvas.getAttribute('height') || '600');

    const defs = dom.svgCanvas.querySelector('defs');
    if (defs) {
        svgExport.appendChild(defs.cloneNode(true));
    }

    const fieldLayerClone = dom.fieldLayer.cloneNode(true);
    svgExport.appendChild(fieldLayerClone);

    const contentLayerClone = dom.contentLayer.cloneNode(true);
    contentLayerClone.querySelectorAll('.selected-outline, .collision-indicator-rect').forEach(el => el.remove());
    contentLayerClone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    contentLayerClone.querySelectorAll('.collision-indicator').forEach(el => el.classList.remove('collision-indicator'));
    svgExport.appendChild(contentLayerClone);


    const svgData = new XMLSerializer().serializeToString(svgExport);
    const svgFileContent = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgData;

    const blob = new Blob([svgFileContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** Handles reading and importing an SVG file to replace canvas content.
 *  Accepts an optional callback to execute after successful import. */
export function handleImportFileRead(file, onImportSuccessCallback) { // Added callback
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const fileContent = e.target.result;
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(fileContent, "image/svg+xml");
            const parseError = svgDoc.querySelector('parsererror');
            const rootElement = svgDoc.documentElement;

            if (parseError || !rootElement || rootElement.nodeName !== 'svg') {
                let errorMsg = `Invalid SVG file structure.`;
                if (parseError) errorMsg += ` ${parseError.textContent}`;
                throw new Error(errorMsg);
            }

            if (!confirm("Importing will replace the current drawing and clear undo history. Continue?")) {
                return;
            }

            clearSelection();
            dom.fieldLayer.innerHTML = '';
            dom.contentLayer.innerHTML = '';

            // Update canvas viewBox *before* initializing zoom state
            if (rootElement.hasAttribute('viewBox')) {
                dom.svgCanvas.setAttribute('viewBox', rootElement.getAttribute('viewBox'));
            } else {
                // Reset to default if imported SVG has no viewBox
                const width = parseFloat(dom.svgCanvas.getAttribute('width') || '800');
                const height = parseFloat(dom.svgCanvas.getAttribute('height') || '600');
                dom.svgCanvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }
            // Note: initZoom() will be called by the caller (app.js) after this function


            // Find and import layers
            const importedFieldLayer = rootElement.querySelector('#field-layer') || rootElement.querySelector('g[id="field-layer"]');
            const importedContentLayer = rootElement.querySelector('#content-layer') || rootElement.querySelector('g[id="content-layer"]');
            let importedFieldId = 'none';

            if (importedFieldLayer) {
                while (importedFieldLayer.firstChild) {
                    dom.fieldLayer.appendChild(document.importNode(importedFieldLayer.firstChild, true));
                }
                const fieldElement = dom.fieldLayer.querySelector('[data-field-id]');
                importedFieldId = fieldElement ? fieldElement.dataset.fieldId : 'none';
            }
            // Restore field background using ID, don't save state here
            setFieldBackground(importedFieldId, false);


            const elementsToReinit = [];
            if (importedContentLayer) {
                while (importedContentLayer.firstChild) {
                    const importedNode = document.importNode(importedContentLayer.firstChild, true);
                    if (importedNode.nodeType === Node.ELEMENT_NODE) {
                        dom.contentLayer.appendChild(importedNode);
                        if (importedNode.classList?.contains('canvas-element')) {
                            elementsToReinit.push(importedNode);
                        }
                    }
                }
            } else {
                console.warn("Imported SVG missing #field-layer or #content-layer. Importing top-level groups.");
                Array.from(rootElement.children).forEach(node => {
                    if (node.nodeName !== 'defs' && node.id !== 'field-layer' && node.id !== 'content-layer' && node.id !== 'selection-rectangle' && !node.classList?.contains('temp-preview-line') && node.id !== 'text-input-container') {
                        const importedNode = document.importNode(node, true);
                        if (importedNode.nodeType === Node.ELEMENT_NODE) {
                            dom.contentLayer.appendChild(importedNode);
                            if (importedNode.classList?.contains('canvas-element')) {
                                elementsToReinit.push(importedNode);
                            }
                        }
                    }
                });
            }

            elementsToReinit.forEach(element => {
                const elementType = element.dataset.elementType;
                const isPlayer = elementType === 'player';
                ensureHandles(element, null, null, isPlayer);
                makeElementInteractive(element);
            });


            // Clear history stacks after successful import
            appState.undoStack = [];
            appState.redoStack = [];
            updateUndoRedoButtons(); // Update buttons

            alert("SVG drawing imported successfully!");

            // Call the success callback (for saving the initial state and initZoom)
            if (onImportSuccessCallback) {
                onImportSuccessCallback();
            }

        } catch (error) {
            console.error("Import error:", error);
            alert(`Failed to import SVG: ${error.message}`);
        } finally {
            if (dom.fileInput) dom.fileInput.value = '';
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        if (dom.fileInput) dom.fileInput.value = '';
    };
    reader.readAsText(file);
}