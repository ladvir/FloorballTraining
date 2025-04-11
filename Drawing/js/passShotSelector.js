// js/passShotSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 30; // Define icon size
const ICON_HEIGHT = 30;

/** Helper function to generate the small SVG icon markup for pass/shots */
function generatePassShotIconSvg(tool, width = ICON_WIDTH, height = ICON_HEIGHT) {
    if (!tool || tool.category !== 'passShot') return '';

    const strokeWidth = tool.strokeWidth || 2;
    const midY = height / 2;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const markerSize = ARROW_MARKER_SIZE * 1.2;

    let lines = `<line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                       stroke="${tool.stroke}" stroke-width="${strokeWidth}"
                       marker-end="url(#icon-${tool.markerEndId})" />`;

    if (tool.isDoubleLine) {
        const offset = strokeWidth * 1.2; // Adjust offset slightly for icon size
        lines = `
            <line x1="${startX}" y1="${midY - offset/2}" x2="${endX}" y2="${midY - offset/2}" stroke="${tool.stroke}" stroke-width="${strokeWidth}" marker-end="url(#icon-${tool.markerEndId})" />
            <line x1="${startX}" y1="${midY + offset/2}" x2="${endX}" y2="${midY + offset/2}" stroke="${tool.stroke}" stroke-width="${strokeWidth}" marker-end="url(#icon-${tool.markerEndId})" />`;
    }

    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <defs>
                <marker id="icon-${tool.markerEndId}" viewBox="0 0 10 10" refX="8" refY="5"
                        markerUnits="strokeWidth" markerWidth="${markerSize}" markerHeight="${markerSize}"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${tool.stroke}" />
                </marker>
            </defs>
            ${lines}
        </svg>`;
}

/** Updates the content of the pass/shot trigger button */
export function updatePassShotTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customPassShotSelectTrigger) {
        if (tool && tool.category === 'passShot') {
            const iconSvg = generatePassShotIconSvg(tool);
            // Set innerHTML to only the icon span
            dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
            // Set the title attribute for tooltip
            dom.customPassShotSelectTrigger.title = tool.label;
            dom.customPassShotSelectTrigger.dataset.value = toolId;
        } else {
            // Reset with a placeholder
            dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon"></span>`; // Placeholder
            dom.customPassShotSelectTrigger.title = 'Select Pass/Shot Tool';
            dom.customPassShotSelectTrigger.dataset.value = '';
        }
    }
}

/** Toggles the visibility of the custom pass/shot dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customPassShotSelectOptions || !dom.customPassShotSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen) {
        dom.customPassShotSelectOptions.classList.add('open');
        dom.customPassShotSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customPassShotSelectOptions.classList.remove('open');
        dom.customPassShotSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom pass/shot select dropdown list (ul) */
export function populateCustomPassShotSelector() {
    if (!dom.passShotOptionsList) return;
    dom.passShotOptionsList.innerHTML = '';
    drawingTools.forEach(tool => {
        if (tool.category !== 'passShot') return;
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        // Set title for tooltip
        li.title = tool.label;
        const iconSvg = generatePassShotIconSvg(tool);
        // Set innerHTML to only the icon span
        li.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updatePassShotTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.passShotOptionsList.appendChild(li);
    });
    updatePassShotTriggerDisplay(null); // Initial state
}

/** Initializes event listeners for the custom pass/shot dropdown */
export function initCustomPassShotSelector() {
    dom.customPassShotSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.passShotToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customPassShotSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}