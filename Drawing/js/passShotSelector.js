// js/passShotSelector.js
import { dom } from './dom.js';
import {
    drawingTools,
    drawingToolMap,
    SVG_NS,
    ARROW_COLOR,
    // Import unified constants
    MARKER_ARROW_UNIFIED_ID,
    ARROW_MARKER_SIZE_UNIFIED,
    ARROW_STROKE_WIDTH_UNIFIED,
    MARKER_SHOT_ARROW_ID,
    SHOT_ARROW_SIZE
} from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for pass/shots */
function generatePassShotIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'passShot') return '';

    // Use unified stroke width for icon consistency, but keep it visually distinct
    const strokeWidth = 2.0; // Slightly thicker for icon visibility
    const midY = height / 2;
    const startX = width * 0.15; const endX = width * 0.85;
    const color = ARROW_COLOR;

    // Use the unified marker ID and size constants
    let markerId = `icon-${MARKER_ARROW_UNIFIED_ID}`; // Use unified ID base
    let markerSize = ARROW_MARKER_SIZE_UNIFIED * 1.5; // Scale unified size for icon
    // ***** MODIFIED: Set refX for shot icon marker to match config *****
    let markerRefX = 0; // Standard refX for the unified marker (pass)


    let lines = '';

    // Differentiate icon visually for shot (double line) vs pass (single line)
    if (tool.isDoubleLine) {
        const offset = strokeWidth * 1.5; // Visual offset for icon double line
        markerId = `icon-${MARKER_SHOT_ARROW_ID}`; // Use shot ID base for shot icon
        markerSize = SHOT_ARROW_SIZE * 1.5; // Scale shot size for icon
        // ***** MODIFIED: Set refX for shot icon marker to match config *****
        markerRefX = 4; // Match the increased refX from config.js
        lines = `
            <line x1="${startX}" y1="${midY - offset/2}" x2="${endX-6}" y2="${midY - offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY + offset/2}" x2="${endX-6}" y2="${midY + offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY}" x2="${endX-6}" y2="${midY}" stroke="none" stroke-width="1" marker-end="url(#${markerId})" />
            `;
    } else { // Pass (single line)
        markerId = `icon-${MARKER_ARROW_UNIFIED_ID}`; // Use unified ID base
        markerSize = ARROW_MARKER_SIZE_UNIFIED * 1.5; // Scale unified size for icon
        markerRefX = 8; // Standard refX for pass
        lines = `<line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                       stroke="${color}" stroke-width="${strokeWidth}"
                       marker-end="url(#${markerId})" />`;
    }

    // Define the unified marker locally within the icon SVG
    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <defs>
                <marker id="${markerId}" viewBox="0 0 10 10" refX="${markerRefX}" refY="5"
                        markerUnits="strokeWidth" markerWidth="${markerSize}" markerHeight="${markerSize}"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}" />
                </marker>
            </defs>
            ${lines}
        </svg>`;
}


/** Updates the content of the pass/shot trigger button AND description */
export function updatePassShotTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customPassShotSelectTrigger;
    const descriptionSpan = dom.passShotDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'passShot') {
            const iconSvg = generatePassShotIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            const firstTool = drawingTools.find(t => t.category === 'passShot');
            if (firstTool) {
                const iconSvg = generatePassShotIconSvg(firstTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstTool.label;
                triggerButton.dataset.value = firstTool.toolId;
                descriptionSpan.textContent = firstTool.label;
                descriptionSpan.title = firstTool.label;
            } else {
                triggerButton.innerHTML = `<span class="passShot-option-icon">?</span>`;
                triggerButton.title = 'Select Pass/Shot Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'N/A';
                descriptionSpan.title = '';
            }
        }
    }
}

/** Toggles the visibility of the custom pass/shot dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customPassShotSelectOptions || !dom.customPassShotSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

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
    let firstToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'passShot') return;
        if (firstToolId === null) firstToolId = tool.toolId;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generatePassShotIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="passShot-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updatePassShotTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.passShotOptionsList.appendChild(li);
    });
    updatePassShotTriggerDisplay(firstToolId);
}

/** Initializes event listeners for the custom pass/shot dropdown */
export function initCustomPassShotSelector() {
    dom.customPassShotSelectTrigger?.addEventListener('click', (e) => { toggleDropdown(); e.stopPropagation(); });
    document.addEventListener('click', (e) => { if (isDropdownOpen && !dom.passShotToolSelector?.contains(e.target)) { toggleDropdown(false); } });
    dom.customPassShotSelectTrigger?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); } else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); } });
}