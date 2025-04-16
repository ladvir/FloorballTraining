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
    if (dom.textInputContainer) dom.textInputContainer.style.display = 'none'; // Hide instead of remove?

    const fieldContent = dom.fieldLayer.innerHTML;
    const elementsContent = dom.contentLayer.innerHTML;
    // Find current field ID to save it
    const currentFieldElement = dom.fieldLayer.querySelector('[data-field-id]');
    const currentFieldId = currentFieldElement ? currentFieldElement.dataset.fieldId : 'none';

    const savedData = {
        field: fieldContent,
        elements: elementsContent,
        selectedFieldId: currentFieldId // Save the ID
    };

    try {
        localStorage.setItem("svgDrawing", JSON.stringify(savedData));
        alert("Drawing saved to browser storage!");
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        alert("Failed to save drawing. Storage might be full or disabled.");
    }


    // Put temporary elements back (ensure they exist before trying to insert)
    // Use insertAdjacentHTML which is generally safer than direct innerHTML manipulation
    if (selectionRectHTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', selectionRectHTML);
    if (tempArrowHTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', tempArrowHTML);
    if (tempArrow2HTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', tempArrow2HTML);
    if (tempFreehandHTML) dom.svgCanvas?.insertAdjacentHTML('beforeend', tempFreehandHTML);
    if (textInputHTML && dom.textInputContainer) { // Re-add the container if it was removed
        // This might be tricky if it was fully removed. Hiding might be better.
        // For now, let's assume it was just hidden.
        // If it needs re-adding: dom.svgCanvas?.insertAdjacentHTML('beforeend', textInputHTML);
    }
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

            // Restore field background using the saved ID, don't save state here
            const fieldIdToLoad = savedData.selectedFieldId || 'none';
            setFieldBackground(fieldIdToLoad, false); // Don't save state during load

            // Restore elements into the content layer
            if (savedData.elements) {
                // Use a temporary container to parse and append nodes safely
                const tempContainer = document.createElementNS(SVG_NS, 'g');
                tempContainer.innerHTML = savedData.elements;
                while (tempContainer.firstChild) {
                    // Import node might be needed if content comes from external source,
                    // but for localStorage, direct append should be fine.
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
            // Don't clear history if load failed
        }
    } else {
        alert("No saved drawing found in browser storage!");
    }
}

/** Exports the current canvas content as an SVG file. */
export function exportDrawing() {
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    // Clone the main SVG element
    const svgExport = dom.svgCanvas.cloneNode(false); // Clone without children initially
    svgExport.removeAttribute('style'); // Remove inline styles if any

    // Add necessary attributes for standalone SVG
    svgExport.setAttribute("xmlns", SVG_NS);
    svgExport.setAttribute("version", "1.1");

    // Copy viewBox and dimensions if they exist
    if (!svgExport.hasAttribute('viewBox') && dom.svgCanvas.hasAttribute('viewBox')) {
        svgExport.setAttribute('viewBox', dom.svgCanvas.getAttribute('viewBox'));
    }
    if (!svgExport.hasAttribute('width')) svgExport.setAttribute('width', dom.svgCanvas.getAttribute('width') || '800');
    if (!svgExport.hasAttribute('height')) svgExport.setAttribute('height', dom.svgCanvas.getAttribute('height') || '600');

    // Clone and append DEFS
    const defs = dom.svgCanvas.querySelector('defs');
    if (defs) {
        svgExport.appendChild(defs.cloneNode(true));
    }

    // Clone and append Field Layer
    const fieldLayerClone = dom.fieldLayer.cloneNode(true);
    svgExport.appendChild(fieldLayerClone);

    // Clone Content Layer and clean it up
    const contentLayerClone = dom.contentLayer.cloneNode(true);
    // Remove selection outlines and collision indicators
    contentLayerClone.querySelectorAll('.selected-outline, .collision-indicator-rect').forEach(el => el.remove());
    // Remove selection/collision classes
    contentLayerClone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    contentLayerClone.querySelectorAll('.collision-indicator').forEach(el => el.classList.remove('collision-indicator'));
    svgExport.appendChild(contentLayerClone);

    // Serialize the cleaned SVG
    const svgData = new XMLSerializer().serializeToString(svgExport);
    const svgFileContent = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgData;

    // Create download link
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

            // Find and import layers (more robustly)
            const importedFieldLayer = rootElement.querySelector('#field-layer') || rootElement.querySelector('g[id="field-layer"]');
            const importedContentLayer = rootElement.querySelector('#content-layer') || rootElement.querySelector('g[id="content-layer"]');
            let importedFieldId = 'none';

            if (importedFieldLayer) {
                while (importedFieldLayer.firstChild) {
                    // Use importNode to ensure nodes are owned by the current document
                    dom.fieldLayer.appendChild(document.importNode(importedFieldLayer.firstChild, true));
                }
                // Find the field ID from the imported content
                const fieldElement = dom.fieldLayer.querySelector('[data-field-id]');
                importedFieldId = fieldElement ? fieldElement.dataset.fieldId : 'none';
            }
            // Restore field background using ID, don't save state here
            setFieldBackground(importedFieldId, false);


            const elementsToReinit = [];
            if (importedContentLayer) {
                while (importedContentLayer.firstChild) {
                    const importedNode = document.importNode(importedContentLayer.firstChild, true);
                    // Only append element nodes
                    if (importedNode.nodeType === Node.ELEMENT_NODE) {
                        dom.contentLayer.appendChild(importedNode);
                        // Check if it's a canvas element for re-initialization
                        if (importedNode.classList?.contains('canvas-element')) {
                            elementsToReinit.push(importedNode);
                        }
                    }
                }
            } else {
                // Fallback: Import top-level groups if layers aren't found
                console.warn("Imported SVG missing #field-layer or #content-layer. Importing top-level groups.");
                Array.from(rootElement.children).forEach(node => {
                    // Skip defs and known temporary elements
                    if (node.nodeName !== 'defs' && node.id !== 'field-layer' && node.id !== 'content-layer' && node.id !== 'selection-rectangle' && !node.classList?.contains('temp-preview-line') && node.id !== 'text-input-container') {
                        const importedNode = document.importNode(node, true);
                        if (importedNode.nodeType === Node.ELEMENT_NODE) {
                            dom.contentLayer.appendChild(importedNode); // Add to content layer
                            if (importedNode.classList?.contains('canvas-element')) {
                                elementsToReinit.push(importedNode);
                            }
                        }
                    }
                });
            }

            // Re-initialize all imported canvas elements
            elementsToReinit.forEach(element => {
                const elementType = element.dataset.elementType;
                const isPlayer = elementType === 'player';
                ensureHandles(element, null, null, isPlayer);
                makeElementInteractive(element);
            });

            // Update canvas viewBox if present in the imported file
            if (rootElement.hasAttribute('viewBox')) {
                dom.svgCanvas.setAttribute('viewBox', rootElement.getAttribute('viewBox'));
            }

            // Clear history stacks after successful import
            appState.undoStack = [];
            appState.redoStack = [];
            updateUndoRedoButtons(); // Update buttons

            alert("SVG drawing imported successfully!");

            // Call the success callback (for saving the initial state)
            if (onImportSuccessCallback) {
                onImportSuccessCallback();
            }

        } catch (error) {
            console.error("Import error:", error);
            alert(`Failed to import SVG: ${error.message}`);
            // Don't clear history if import failed
        } finally {
            // Clear the file input value to allow importing the same file again
            if (dom.fileInput) dom.fileInput.value = '';
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        if (dom.fileInput) dom.fileInput.value = '';
    };
    reader.readAsText(file);
}