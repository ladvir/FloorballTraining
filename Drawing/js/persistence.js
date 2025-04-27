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
import { getTransformedBBox } from './utils.js'; // Import utility for BBox calculation


/** Exports the current canvas content as an SVG file, fitted to content. */
export function exportDrawing() {
    clearSelection();
    clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    // Calculate the bounding box of all visible content elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const padding = 20; // Add some padding around the content

    const contentElements = dom.contentLayer.querySelectorAll('.canvas-element');

    // Iterate through all content elements to find the combined bounding box
    contentElements.forEach(element => {
        const bbox = getTransformedBBox(element);
        if (bbox) {
            minX = Math.min(minX, bbox.left);
            minY = Math.min(minY, bbox.top);
            maxX = Math.max(maxX, bbox.right);
            maxY = Math.max(maxY, bbox.bottom);
        }
    });

    // Also consider the field layer's bounding box if it exists
    const fieldElement = dom.fieldLayer.querySelector('[data-field-id]:not([data-field-id="none"])');
    if (fieldElement) {
        const fieldBBox = getTransformedBBox(fieldElement);
        if (fieldBBox) {
            minX = Math.min(minX, fieldBBox.left);
            minY = Math.min(minY, fieldBBox.top);
            maxX = Math.max(maxX, fieldBBox.right);
            maxY = Math.max(maxY, fieldBBox.bottom);
        }
    }


    let exportViewBox;
    if (minX === Infinity) {
        // Canvas is empty or only contains non-renderable elements, export default canvas size
        console.log("Canvas is empty, exporting default viewbox.");
        const width = parseFloat(dom.svgCanvas.getAttribute('width') || '800');
        const height = parseFloat(dom.svgCanvas.getAttribute('height') || '600');
        exportViewBox = `0 0 ${width} ${height}`;
    } else {
        // Calculate the content bounding box dimensions and add padding
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        const viewBoxX = minX - padding;
        const viewBoxY = minY - padding;
        const viewBoxWidth = contentWidth + padding * 2;
        const viewBoxHeight = contentHeight + padding * 2;

        // Ensure width/height are not zero or negative, use default if they are
        if (viewBoxWidth <= 0 || viewBoxHeight <= 0) {
            console.warn("Calculated viewBox dimensions invalid, exporting default viewbox.");
            const width = parseFloat(dom.svgCanvas.getAttribute('width') || '800');
            const height = parseFloat(dom.svgCanvas.getAttribute('height') || '600');
            exportViewBox = `0 0 ${width} ${height}`;
        } else {
            exportViewBox = `${viewBoxX.toFixed(3)} ${viewBoxY.toFixed(3)} ${viewBoxWidth.toFixed(3)} ${viewBoxHeight.toFixed(3)}`;
            console.log("Exporting with fitted viewbox:", exportViewBox);
        }
    }


    const svgExport = dom.svgCanvas.cloneNode(false);
    svgExport.removeAttribute('style');

    svgExport.setAttribute("xmlns", SVG_NS);
    svgExport.setAttribute("version", "1.1");
    // Set the calculated or default viewBox
    svgExport.setAttribute('viewBox', exportViewBox);


    const defs = dom.svgCanvas.querySelector('defs');
    if (defs) {
        svgExport.appendChild(defs.cloneNode(true));
    }

    // Clone and append layers
    const fieldLayerClone = dom.fieldLayer.cloneNode(true);
    svgExport.appendChild(fieldLayerClone);

    const contentLayerClone = dom.contentLayer.cloneNode(true);
    // Remove temporary/interactive elements from the cloned content layer
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

            // The checkUnsavedChanges function in app.js now handles the confirmation
            // based on canvas content or modified state *before* calling this function.
            // So we can proceed directly with import here.


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
                Array.from(importedContentLayer.children).forEach(node => { // Iterate over children
                    const importedNode = document.importNode(node, true);
                    if (importedNode.nodeType === Node.ELEMENT_NODE) {
                        dom.contentLayer.appendChild(importedNode);
                        if (importedNode.classList?.contains('canvas-element')) {
                            elementsToReinit.push(importedNode);
                        }
                    }
                });
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