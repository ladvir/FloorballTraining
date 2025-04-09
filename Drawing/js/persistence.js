// js/persistence.js
import { dom } from './dom.js';
import { SVG_NS } from './config.js';
import { clearSelection } from './selection.js';
import { clearCollisionHighlights } from './collisions.js';
import { ensureHandles } from './elements.js';
import { makeElementInteractive } from './interactions.js';


/** Saves the current canvas content to localStorage. */
export function saveDrawing() {
    clearSelection();
    clearCollisionHighlights(); // Pass the set if required: clearCollisionHighlights(appState.currentlyHighlightedCollisions);

    const selectionRectHTML = dom.selectionRect.outerHTML;
    dom.selectionRect.remove(); // Temporarily remove

    localStorage.setItem("svgDrawing", dom.svgCanvas.innerHTML);

    // Put selection rect back
    dom.svgCanvas.insertAdjacentHTML('afterbegin', selectionRectHTML);

    alert("Drawing saved to browser storage!");
}

/** Loads canvas content from localStorage. */
export function loadDrawing() {
    const savedData = localStorage.getItem("svgDrawing");
    if (savedData) {
        if (!confirm("Loading will replace the current drawing. Continue?")) {
            return;
        }
        clearSelection();
        dom.svgCanvas.querySelectorAll(".canvas-element").forEach(el => el.remove());

        const tempContainer = document.createElementNS(SVG_NS, 'g');
        tempContainer.innerHTML = savedData;
        while(tempContainer.firstChild) {
            dom.svgCanvas.appendChild(tempContainer.firstChild);
        }

        // Re-initialize loaded elements
        dom.svgCanvas.querySelectorAll(".canvas-element").forEach(element => {
            const isPlayer = element.classList.contains('player-element');
            ensureHandles(element, null, null, isPlayer); // Pass element, null dimensions, isPlayer flag
            makeElementInteractive(element); // Add interaction listeners
        });
        alert("Drawing loaded from browser storage!");
    } else {
        alert("No saved drawing found in browser storage!");
    }
}

/** Exports the current canvas content as an SVG file. */
export function exportDrawing() {
    clearSelection();
    clearCollisionHighlights(); // Pass the set if required

    const svgExport = dom.svgCanvas.cloneNode(true);
    svgExport.querySelector('#selection-rectangle')?.remove();
    svgExport.querySelectorAll('.selected-outline, .move-handle, .collision-indicator-rect').forEach(el => el.remove());
    svgExport.querySelectorAll('.collision-indicator').forEach(el => el.classList.remove('collision-indicator'));

    svgExport.setAttribute("xmlns", SVG_NS);
    svgExport.setAttribute("version", "1.1");

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
            dom.svgCanvas.querySelectorAll(".canvas-element").forEach(el => el.remove());

            Array.from(rootElement.children).forEach(node => {
                const importedNode = document.importNode(node, true);
                if (importedNode.nodeType === Node.ELEMENT_NODE && importedNode.id !== 'selection-rectangle') {
                    dom.svgCanvas.appendChild(importedNode);
                    if (importedNode.classList?.contains('canvas-element')) {
                        const isPlayer = importedNode.classList.contains('player-element');
                        ensureHandles(importedNode, null, null, isPlayer); // Pass element, null dimensions, isPlayer flag
                        makeElementInteractive(importedNode); // Add interaction listeners
                    }
                }
            });
            alert("SVG drawing imported successfully!");
        } catch (error) {
            console.error("Import error:", error);
            alert(`Failed to import SVG: ${error.message}`);
        } finally {
            dom.fileInput.value = ''; // Reset file input
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        dom.fileInput.value = '';
    };
    reader.readAsText(file);
}