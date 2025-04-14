// js/movementSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE, ARROW_COLOR } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
// Define NEW icon size constants based on CSS
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for movements */
function generateMovementIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) { // Default to list item size
    if (!tool || tool.category !== 'movement') return '';
    const strokeWidth = 2.5; // Slightly thicker for visibility
    const midY = height / 2;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const markerSize = ARROW_MARKER_SIZE * 1.5; // Larger marker for larger icon
    const color = ARROW_COLOR;

    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <defs>
                <marker id="icon-${tool.markerEndId}" viewBox="0 0 10 10" refX="8" refY="5"
                        markerUnits="strokeWidth" markerWidth="${markerSize}" markerHeight="${markerSize}"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}" />
                </marker>
            </defs>
            <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                  stroke="${color}"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${tool.strokeDasharray || 'none'}"
                  marker-end="url(#icon-${tool.markerEndId})" />
        </svg>`;
}

/** Updates the content of the movement trigger button */
export function updateMovementTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customMovementSelectTrigger) {
        if (tool && tool.category === 'movement') {
            // Use larger size for trigger
            const iconSvg = generateMovementIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            dom.customMovementSelectTrigger.innerHTML = `<span class="movement-option-icon">${iconSvg}</span>`;
            dom.customMovementSelectTrigger.title = tool.label;
            dom.customMovementSelectTrigger.dataset.value = toolId;
        } else {
            // Show first movement icon as default
            const firstMoveTool = drawingTools.find(t => t.category === 'movement');
            if (firstMoveTool) {
                const iconSvg = generateMovementIconSvg(firstMoveTool, ICON_WIDTH, ICON_HEIGHT);
                dom.customMovementSelectTrigger.innerHTML = `<span class="movement-option-icon">${iconSvg}</span>`;
                dom.customMovementSelectTrigger.title = firstMoveTool.label;
                dom.customMovementSelectTrigger.dataset.value = firstMoveTool.toolId;
            } else {
                dom.customMovementSelectTrigger.innerHTML = `<span class="movement-option-icon">?</span>`;
                dom.customMovementSelectTrigger.title = 'Select Movement Tool';
                dom.customMovementSelectTrigger.dataset.value = '';
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
        // Use standard LI icon size
        const iconSvg = generateMovementIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Generate structure with text below icon
        li.innerHTML = `
            <span class="movement-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updateMovementTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            // Close handled by mouseleave
            e.stopPropagation();
        });
        dom.movementOptionsList.appendChild(li);
    });
    // Set initial trigger display to the first movement tool found
    updateMovementTriggerDisplay(firstMoveToolId);
}

/** Initializes event listeners for the custom movement dropdown */
export function initCustomMovementSelector() {
    const container = dom.movementToolSelector;
    if (!container) return;

    container.addEventListener('mouseenter', () => toggleDropdown(true));
    container.addEventListener('mouseleave', () => toggleDropdown(false));

    dom.customMovementSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}