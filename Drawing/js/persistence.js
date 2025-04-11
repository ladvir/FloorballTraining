// js/persistence.js
import { dom } from './dom.js';
import { SVG_NS } from './config.js';
import { clearSelection } from './selection.js';
import { clearCollisionHighlights } from './collisions.js';
import { ensureHandles } from './elements.js';
import { makeElementInteractive } from './interactions.js';
// **** IMPORT setFieldBackground ****
import { setFieldBackground, updateFieldTriggerDisplay } from './fieldSelector.js';
import { appState } from './state.js';

/** Saves the current canvas content (including field) to localStorage. */
export function saveDrawing() {
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    const selectionRectHTML = dom.selectionRect.outerHTML;
    const tempArrowHTML = dom.tempArrowPreview.outerHTML;
    const textInputHTML = dom.textInputContainer.outerHTML;

    dom.selectionRect.remove();
    dom.tempArrowPreview.remove();
    dom.textInputContainer.style.display = 'none';

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

    localStorage.setItem("svgDrawing", JSON.stringify(savedData));

    // Put temporary elements back
    dom.svgCanvas.insertAdjacentHTML('beforeend', selectionRectHTML);
    dom.svgCanvas.insertAdjacentHTML('beforeend', tempArrowHTML);

    alert("Drawing saved to browser storage!");
}

/** Loads canvas content from localStorage. */
export function loadDrawing() {
    const savedJson = localStorage.getItem("svgDrawing");
    if (savedJson) {
        if (!confirm("Loading will replace the current drawing. Continue?")) {
            return;
        }
        try {
            const savedData = JSON.parse(savedJson);
            clearSelection();
            dom.fieldLayer.innerHTML = '';
            dom.contentLayer.innerHTML = '';

            // Restore field background using the saved ID
            const fieldIdToLoad = savedData.selectedFieldId || 'none';
            // **** CALL setFieldBackground **** (this also updates the trigger)
            setFieldBackground(fieldIdToLoad);

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
            alert("Drawing loaded from browser storage!");

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
    // ... (export logic remains the same) ...
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    const svgExport = dom.svgCanvas.cloneNode(false);
    svgExport.removeAttribute('style');

    const defs = dom.svgCanvas.querySelector('defs');
    if (defs) {
        svgExport.appendChild(defs.cloneNode(true));
    }

    const fieldLayerClone = dom.fieldLayer.cloneNode(true);
    svgExport.appendChild(fieldLayerClone);

    const contentLayerClone = dom.contentLayer.cloneNode(true);
    contentLayerClone.querySelectorAll('.selected-outline, .move-handle, .collision-indicator-rect').forEach(el => el.remove());
    contentLayerClone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    contentLayerClone.querySelectorAll('.collision-indicator').forEach(el => el.classList.remove('collision-indicator'));
    svgExport.appendChild(contentLayerClone);


    svgExport.setAttribute("xmlns", SVG_NS);
    svgExport.setAttribute("version", "1.1");
    if (!svgExport.hasAttribute('viewBox') && dom.svgCanvas.hasAttribute('viewBox')) {
        svgExport.setAttribute('viewBox', dom.svgCanvas.getAttribute('viewBox'));
    }
    if (!svgExport.hasAttribute('width')) svgExport.setAttribute('width', dom.svgCanvas.getAttribute('width') || '800');
    if (!svgExport.hasAttribute('height')) svgExport.setAttribute('height', dom.svgCanvas.getAttribute('height') || '600');


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

/** Handles reading and importing an SVG file to replace canvas content. */
export function handleImportFileRead(file) {
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

            if (!confirm("Importing will replace the current drawing. Continue?")) {
                return;
            }

            clearSelection();
            dom.fieldLayer.innerHTML = '';
            dom.contentLayer.innerHTML = '';

            const importedFieldLayer = rootElement.querySelector('#field-layer');
            const importedContentLayer = rootElement.querySelector('#content-layer');
            let importedFieldId = 'none';

            if (importedFieldLayer) {
                while (importedFieldLayer.firstChild) {
                    dom.fieldLayer.appendChild(document.importNode(importedFieldLayer.firstChild, true));
                }
                const fieldElement = dom.fieldLayer.querySelector('[data-field-id]');
                importedFieldId = fieldElement ? fieldElement.dataset.fieldId : 'none';
            }
            // **** CALL setFieldBackground **** (this also updates the trigger)
            setFieldBackground(importedFieldId);


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
                Array.from(rootElement.children).forEach(node => {
                    if (node.nodeName !== 'defs' && node.id !== 'field-layer' && node.id !== 'content-layer' && node.id !== 'selection-rectangle' && node.id !== 'temp-arrow-preview' && node.id !== 'text-input-container') {
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

            if (rootElement.hasAttribute('viewBox')) {
                dom.svgCanvas.setAttribute('viewBox', rootElement.getAttribute('viewBox'));
            }

            alert("SVG drawing imported successfully!");
        } catch (error) {
            console.error("Import error:", error);
            alert(`Failed to import SVG: ${error.message}`);
        } finally {
            dom.fileInput.value = '';
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        dom.fileInput.value = '';
    };
    reader.readAsText(file);
}