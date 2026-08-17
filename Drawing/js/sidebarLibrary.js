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
            // Filter for valid items and ensure title/description exist
            parsedLibrary = parsedLibrary.filter(item =>
                item && typeof item.name === 'string' && typeof item.content === 'string'
            ).map(item => ({
                ...item,
                title: item.title ?? item.name, // Default title to name if missing
                description: item.description ?? "" // Default description to empty if missing
            }));
        } catch (e) {
            console.error("Error parsing stored SVG library:", e, "Resetting.");
            parsedLibrary = [];
        }
    }

    appState.svgLibrary = parsedLibrary || [];
    // Save back potentially corrected data
    localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary));

    // Populate UI
    appState.svgLibrary.forEach((svgItem, index) => {
        // Pass index to UI function for deletion logic
        addSvgToLibraryUI(svgItem.name, svgItem.title, svgItem.description, svgItem.content, index);
    });
}

/** Adds a single SVG item to the library UI list. */
// Added title, description, index parameters
function addSvgToLibraryUI(name, title, description, svgContent, index) {
    const item = document.createElement("div");
    item.className = "sidebar-item-base library-item";
    item.draggable = true;
    // Store all relevant data
    item.dataset.svgContent = svgContent;
    item.dataset.svgName = name;
    item.dataset.svgTitle = title;
    item.dataset.svgDescription = description;
    item.dataset.index = index; // Store index for deletion

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
    nameSpan.textContent = name; // Display original name in sidebar
    item.appendChild(nameSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Remove";
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        // Use the stored index to remove the correct item
        const itemIndex = parseInt(e.target.closest('.library-item').dataset.index, 10);
        if (!isNaN(itemIndex) && confirm(`Remove "${appState.svgLibrary[itemIndex]?.name}" from library?`)) {
            appState.svgLibrary.splice(itemIndex, 1);
            localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary));
            loadSvgLibrary(); // Refresh UI (recalculates indices)
        }
    };
    item.appendChild(deleteBtn);

    item.addEventListener("dragstart", handleLibraryDragStart);
    // Prepend new items so they appear at the top? Or append? Append is simpler.
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
            // Use filename as default title, empty description
            const title = baseName;
            const description = "";

            appState.svgLibrary.push({ name: baseName, title: title, description: description, content: cleanedSvgContent });
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

    // Retrieve all stored data
    const svgName = itemElement.dataset.svgName || "";
    const svgTitle = itemElement.dataset.svgTitle || svgName; // Fallback title to name
    const svgDescription = itemElement.dataset.svgDescription || "";
    const svgContent = itemElement.dataset.svgContent || "";

    if (svgContent) {
        event.dataTransfer.setData("text/plain", svgName); // Pass name for potential fallback
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
            svgContent: svgContent,
            name: svgName, // Keep original name
            title: svgTitle, // Pass title
            description: svgDescription // Pass description
        };
        createGhostPreview(event); // Function from dragDrop.js
    } else {
        console.error("Library item has no SVG content to drag.");
        event.preventDefault();
    }
}