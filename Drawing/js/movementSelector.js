// js/movementSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE, ARROW_COLOR } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for movements */
function generateMovementIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'movement') return '';
    const strokeWidth = 2.5;
    const midY = height / 2;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const markerSize = ARROW_MARKER_SIZE * 1.5;
    const color = ARROW_COLOR;

    // Use the specific marker ID associated with the tool (e.g., run marker)
    const markerId = `icon-${tool.markerEndId || MARKER_ARROW_RUN_ID}`; // Fallback just in case

    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <defs>
                <marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5"
                        markerUnits="strokeWidth" markerWidth="${markerSize}" markerHeight="${markerSize}"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}" />
                </marker>
            </defs>
            <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                  stroke="${color}"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${tool.strokeDasharray || 'none'}"
                  marker-end="url(#${markerId})" />
        </svg>`;
}

/** Updates the content of the movement trigger button AND description */
export function updateMovementTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customMovementSelectTrigger;
    const descriptionSpan = dom.movementDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'movement') {
            const iconSvg = generateMovementIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="movement-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            const firstMoveTool = drawingTools.find(t => t.category === 'movement');
            if (firstMoveTool) {
                const iconSvg = generateMovementIconSvg(firstMoveTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="movement-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstMoveTool.label;
                triggerButton.dataset.value = firstMoveTool.toolId;
                descriptionSpan.textContent = firstMoveTool.label;
                descriptionSpan.title = firstMoveTool.label;
            } else {
                triggerButton.innerHTML = `<span class="movement-option-icon">?</span>`;
                triggerButton.title = 'Select Movement Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'N/A';
                descriptionSpan.title = '';
            }
        }
    }
}

/** Toggles the visibility of the custom movement dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customMovementSelectOptions || !dom.customMovementSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customMovementSelectOptions.classList.add('open');
        dom.customMovementSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customMovementSelectOptions.classList.remove('open');
        dom.customMovementSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom movement select dropdown list (ul) */
export function populateCustomMovementSelector() {
    if (!dom.movementOptionsList) return;
    dom.movementOptionsList.innerHTML = '';
    let firstMoveToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'movement') return;
        if (firstMoveToolId === null) firstMoveToolId = tool.toolId;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generateMovementIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="movement-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updateMovementTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false); // Close on click
            e.stopPropagation();
        });
        dom.movementOptionsList.appendChild(li);
    });
    updateMovementTriggerDisplay(firstMoveToolId); // Set initial state
}

/** Initializes event listeners for the custom movement dropdown */
export function initCustomMovementSelector() {
    // Use click listener on trigger
    dom.customMovementSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown(); // Toggle on click
        e.stopPropagation();
    });

    // Outside click listener
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.movementToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keydown listener
    dom.customMovementSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}