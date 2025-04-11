// js/persistence.js
import { dom } from './dom.js';
import { SVG_NS } from './config.js';
import { clearSelection } from './selection.js';
import { clearCollisionHighlights } from './collisions.js';
import { ensureHandles } from './elements.js';
import { makeElementInteractive } from './interactions.js';
// Import field selector functions to potentially restore state
import { setFieldBackground, updateFieldTriggerDisplay } from './fieldSelector.js';
import { appState } from './state.js'; // If saving field ID to state

/** Saves the current canvas content (including field) to localStorage. */
export function saveDrawing() {
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions); // Pass the set

    const selectionRectHTML = dom.selectionRect.outerHTML;
    const tempArrowHTML = dom.tempArrowPreview.outerHTML;
    const textInputHTML = dom.textInputContainer.outerHTML;

    dom.selectionRect.remove();
    dom.tempArrowPreview.remove();
    dom.textInputContainer.style.display = 'none'; // Hide instead of removing

    // Save the combined content of field and content layers
    const fieldContent = dom.fieldLayer.innerHTML;
    const elementsContent = dom.contentLayer.innerHTML;
    const savedData = {
        field: fieldContent,
        elements: elementsContent,
        // Optional: Save selected field ID if stored in appState
        // selectedFieldId: appState.selectedFieldId || 'none'
    };

    localStorage.setItem("svgDrawing", JSON.stringify(savedData));

    // Put temporary elements back
    dom.svgCanvas.insertAdjacentHTML('beforeend', selectionRectHTML);
    dom.svgCanvas.insertAdjacentHTML('beforeend', tempArrowHTML);
    // Text input container remains, just hidden

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
            // Clear existing content
            dom.fieldLayer.innerHTML = '';
            dom.contentLayer.innerHTML = ''; // Clear elements

            // Restore field background
            if (savedData.field) {
                dom.fieldLayer.innerHTML = savedData.field;
                // Update selector display based on restored field ID
                const fieldElement = dom.fieldLayer.querySelector('[data-field-id]');
                const fieldId = fieldElement ? fieldElement.dataset.fieldId : 'none';
                updateFieldTriggerDisplay(fieldId); // Update dropdown trigger
                // Optional: Update appState if storing field ID there
                // appState.selectedFieldId = fieldId;
            } else {
                updateFieldTriggerDisplay('none'); // Default to none if not saved
            }


            // Restore elements into the content layer
            if (savedData.elements) {
                const tempContainer = document.createElementNS(SVG_NS, 'g');
                tempContainer.innerHTML = savedData.elements;
                while (tempContainer.firstChild) {
                    dom.contentLayer.appendChild(tempContainer.firstChild); // Append to content layer
                }
            }

            // Re-initialize loaded elements
            dom.contentLayer.querySelectorAll(".canvas-element").forEach(element => {
                const elementType = element.dataset.elementType;
                const isPlayer = elementType === 'player';
                // Pass null dimensions, ensureHandles will try to get from bgRect or default
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
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    // Clone the necessary parts of the main SVG
    const svgExport = dom.svgCanvas.cloneNode(false); // Clone SVG tag itself, not children initially
    svgExport.removeAttribute('style'); // Remove any inline styles

    // Re-add defs
    const defs = dom.svgCanvas.querySelector('defs');
    if (defs) {
        svgExport.appendChild(defs.cloneNode(true));
    }

    // Add field layer content
    const fieldLayerClone = dom.fieldLayer.cloneNode(true);
    svgExport.appendChild(fieldLayerClone);

    // Add content layer content, cleaning elements within it
    const contentLayerClone = dom.contentLayer.cloneNode(true);
    contentLayerClone.querySelectorAll('.selected-outline, .move-handle, .collision-indicator-rect').forEach(el => el.remove());
    contentLayerClone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    contentLayerClone.querySelectorAll('.collision-indicator').forEach(el => el.classList.remove('collision-indicator'));
    svgExport.appendChild(contentLayerClone);


    // Ensure essential attributes are present
    svgExport.setAttribute("xmlns", SVG_NS);
    svgExport.setAttribute("version", "1.1");
    // Keep viewBox if present
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
            // Clear existing layers
            dom.fieldLayer.innerHTML = '';
            dom.contentLayer.innerHTML = '';

            // Import content, separating field and elements if possible
            const importedFieldLayer = rootElement.querySelector('#field-layer');
            const importedContentLayer = rootElement.querySelector('#content-layer');

            if (importedFieldLayer) {
                // Import field content
                while (importedFieldLayer.firstChild) {
                    dom.fieldLayer.appendChild(document.importNode(importedFieldLayer.firstChild, true));
                }
                // Update selector display
                const fieldElement = dom.fieldLayer.querySelector('[data-field-id]');
                const fieldId = fieldElement ? fieldElement.dataset.fieldId : 'none';
                updateFieldTriggerDisplay(fieldId);
            } else {
                updateFieldTriggerDisplay('none'); // Default if no field layer found
            }


            const elementsToReinit = [];
            if (importedContentLayer) {
                // Import elements into content layer
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
                // Fallback: Import all direct children of SVG root (except defs, field) into content layer
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

            // Re-initialize imported elements
            elementsToReinit.forEach(element => {
                const elementType = element.dataset.elementType;
                const isPlayer = elementType === 'player';
                ensureHandles(element, null, null, isPlayer);
                makeElementInteractive(element);
            });

            // Apply viewBox from imported SVG
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