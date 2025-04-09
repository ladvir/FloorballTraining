// js/sidebarLibrary.js
import { appState } from './state.js';
import { dom } from './dom.js';
import { createGhostPreview } from './dragDrop.js';
import { DEFAULT_GHOST_WIDTH, DEFAULT_GHOST_HEIGHT, MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from './config.js';


/** Loads SVG library from localStorage, populating the sidebar. */
export function loadSvgLibrary() {
    dom.svgLibraryList.querySelectorAll('.library-item').forEach(item => item.remove());

    let storedLibrary = localStorage.getItem("svgLibrary");
    let parsedLibrary = null;
    if (storedLibrary) {
        try {
            parsedLibrary = JSON.parse(storedLibrary);
            if (!Array.isArray(parsedLibrary)) {
                console.warn("Stored SVG library data is not an array. Resetting.");
                parsedLibrary = [];
            }
            // Filter for valid items
            parsedLibrary = parsedLibrary.filter(item => item && typeof item.name === 'string' && typeof item.content === 'string');
        } catch (e) {
            console.error("Error parsing stored SVG library:", e, "Resetting.");
            parsedLibrary = [];
        }
    }

    appState.svgLibrary = parsedLibrary || [];
    localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary)); // Save corrected

    // Populate UI
    appState.svgLibrary.forEach((svgItem, index) => {
        addSvgToLibraryUI(svgItem.name, svgItem.content, index);
    });
}

/** Adds a single SVG item to the library UI list. */
function addSvgToLibraryUI(name, svgContent, index) {
    const item = document.createElement("div");
    item.className = "sidebar-item-base library-item";
    item.draggable = true;
    item.dataset.svgContent = svgContent;
    item.dataset.svgName = name || `SVG ${index + 1}`;

    const svgPreview = document.createElement("div");
    svgPreview.className = "library-item-preview";
    try {
        svgPreview.innerHTML = svgContent;
    } catch (e) {
        console.error("Error setting SVG preview HTML:", e);
        svgPreview.textContent = "[Invalid SVG]";
    }

    const svgElement = svgPreview.querySelector('svg');
    if (svgElement) {
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        svgElement.style.display = 'block';
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '40px';
    } else {
        svgPreview.textContent = "[SVG Preview Error]";
    }
    item.appendChild(svgPreview);

    const nameSpan = document.createElement("span");
    nameSpan.className = "item-name";
    nameSpan.textContent = item.dataset.svgName;
    item.appendChild(nameSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Remove";
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Remove "${item.dataset.svgName}" from library?`)) {
            appState.svgLibrary.splice(index, 1);
            localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary));
            loadSvgLibrary(); // Refresh UI
        }
    };
    item.appendChild(deleteBtn);

    item.addEventListener("dragstart", handleLibraryDragStart); // Exported function below
    dom.svgLibraryList.appendChild(item);
}

/** Handles reading files selected for the SVG library. */
export function handleLibraryFileRead(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const svgContent = e.target.result;
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
            const parseError = svgDoc.querySelector('parsererror');
            const svgElement = svgDoc.documentElement;

            if (parseError || !svgElement || svgElement.nodeName !== "svg") {
                let errorMsg = `File ${file.name} is not valid SVG`;
                if (parseError) errorMsg += `: ${parseError.textContent}`;
                else if (!svgElement || svgElement.nodeName !== "svg") errorMsg += ` (missing root <svg> element).`;
                throw new Error(errorMsg);
            }

            svgElement.removeAttribute('id'); // Clean up ID
            const cleanedSvgContent = svgElement.outerHTML;
            const baseName = file.name.endsWith('.svg') ? file.name.slice(0, -4) : file.name;

            appState.svgLibrary.push({ name: baseName, content: cleanedSvgContent });
            localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary));
            loadSvgLibrary(); // Reload the library UI
        } catch (error) {
            console.error(`Error processing library file ${file.name}:`, error);
            alert(`Could not add ${file.name}: ${error.message}`);
        }
    };
    reader.onerror = () => alert(`Error reading file: ${file.name}`);
    reader.readAsText(file);
}

/** Sets up dataTransfer and ghost preview for dragging a library item. */
export function handleLibraryDragStart(event) {
    const itemElement = event.target.closest('.library-item');
    if (!itemElement) return;

    const svgName = itemElement.dataset.svgName || "";
    const svgContent = itemElement.dataset.svgContent || "";

    if (svgContent) {
        event.dataTransfer.setData("text/plain", svgName);
        event.dataTransfer.setData("application/svg+xml", svgContent);
        event.dataTransfer.setData("application/source", "library");
        event.dataTransfer.effectAllowed = "copy";

        // Determine size for ghost/drop
        let ghostWidth = DEFAULT_GHOST_WIDTH;
        let ghostHeight = DEFAULT_GHOST_HEIGHT;
        try {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
            const svgRoot = svgDoc.documentElement;
            if (svgRoot && svgRoot.nodeName === 'svg') {
                const vb = svgRoot.viewBox?.baseVal;
                const wAttr = svgRoot.getAttribute('width');
                const hAttr = svgRoot.getAttribute('height');
                if (vb && vb.width > 0 && vb.height > 0) {
                    ghostWidth = vb.width; ghostHeight = vb.height;
                } else if (wAttr && hAttr) {
                    ghostWidth = parseFloat(wAttr) || ghostWidth;
                    ghostHeight = parseFloat(hAttr) || ghostHeight;
                }
                ghostWidth = Math.min(Math.max(ghostWidth, MIN_ELEMENT_WIDTH), 400);
                ghostHeight = Math.min(Math.max(ghostHeight, MIN_ELEMENT_HEIGHT), 400);
            }
        } catch (e) { console.warn("Could not parse SVG for ghost dimensions:", e); }

        appState.currentDraggingItemInfo = {
            type: 'library',
            width: ghostWidth, height: ghostHeight,
            svgContent: svgContent, name: svgName
        };
        createGhostPreview(event); // Function from dragDrop.js
    } else {
        console.error("Library item has no SVG content to drag.");
        event.preventDefault();
    }
}