// js/movementSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE, ARROW_COLOR } from './config.js'; // Added ARROW_COLOR
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 30;
const ICON_HEIGHT = 30;

/** Helper function to generate the small SVG icon markup for movements */
function generateMovementIconSvg(tool, width = ICON_WIDTH, height = ICON_HEIGHT) {
    if (!tool || tool.category !== 'movement') return '';

    const strokeWidth = 2;
    const midY = height / 2;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const markerSize = ARROW_MARKER_SIZE * 1.2;
    const color = ARROW_COLOR; // Use defined color

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
            const iconSvg = generateMovementIconSvg(tool);
            dom.customMovementSelectTrigger.innerHTML = `<span class="movement-option-icon">${iconSvg}</span>`;
            dom.customMovementSelectTrigger.title = tool.label;
            dom.customMovementSelectTrigger.dataset.value = toolId;
        } else {
            dom.customMovementSelectTrigger.innerHTML = `<span class="movement-option-icon"></span>`;
            dom.customMovementSelectTrigger.title = 'Select Movement Tool';
            dom.customMovementSelectTrigger.dataset.value = '';
        }
    }
}

/** Toggles the visibility of the custom movement dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customMovementSelectOptions || !dom.customMovementSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
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
    drawingTools.forEach(tool => {
        if (tool.category !== 'movement') return;
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generateMovementIconSvg(tool);
        li.innerHTML = `<span class="movement-option-icon">${iconSvg}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updateMovementTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.movementOptionsList.appendChild(li);
    });
    updateMovementTriggerDisplay(null);
}

/** Initializes event listeners for the custom movement dropdown */
export function initCustomMovementSelector() {
    dom.customMovementSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.movementToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customMovementSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}