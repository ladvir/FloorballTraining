// js/passShotSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE, ARROW_COLOR, ARROW_MARKER_SIZE_SHOT, MARKER_ARROW_SHOT_LARGE_ID, MARKER_ARROW_PASS_ID } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
// Define NEW icon size constants based on CSS
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for pass/shots */
function generatePassShotIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) { // Default to list item size
    if (!tool || tool.category !== 'passShot') return '';

    const strokeWidth = 2.5; // Thicker for visibility
    const midY = height / 2;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const color = ARROW_COLOR;
    let markerId = `icon-${tool.markerEndId}`;
    let markerSize = ARROW_MARKER_SIZE * 1.5; // Larger marker for larger icon
    let markerRefX = 8;

    let lines = `<line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                       stroke="${color}" stroke-width="${strokeWidth}"
                       marker-end="url(#${markerId})" />`;

    if (tool.isDoubleLine) {
        const offset = strokeWidth * 1.5;
        markerId = `icon-${MARKER_ARROW_SHOT_LARGE_ID}`;
        markerSize = ARROW_MARKER_SIZE_SHOT * 1.2; // Scale large marker for icon
        markerRefX = 1;

        lines = `
            <line x1="${startX}" y1="${midY - offset/2}" x2="${endX}" y2="${midY - offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY + offset/2}" x2="${endX}" y2="${midY + offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}" stroke="none" stroke-width="1" marker-end="url(#${markerId})" />
            `;
    } else {
        markerId = `icon-${MARKER_ARROW_PASS_ID}`;
    }

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

/** Updates the content of the pass/shot trigger button */
export function updatePassShotTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customPassShotSelectTrigger) {
        if (tool && tool.category === 'passShot') {
            // Use larger size for trigger
            const iconSvg = generatePassShotIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
            dom.customPassShotSelectTrigger.title = tool.label;
            dom.customPassShotSelectTrigger.dataset.value = toolId;
        } else {
            // Show first pass/shot icon as default
            const firstTool = drawingTools.find(t => t.category === 'passShot');
            if (firstTool) {
                const iconSvg = generatePassShotIconSvg(firstTool, ICON_WIDTH, ICON_HEIGHT);
                dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon">${iconSvg}</span>`;
                dom.customPassShotSelectTrigger.title = firstTool.label;
                dom.customPassShotSelectTrigger.dataset.value = firstTool.toolId;
            } else {
                dom.customPassShotSelectTrigger.innerHTML = `<span class="passShot-option-icon">?</span>`;
                dom.customPassShotSelectTrigger.title = 'Select Pass/Shot Tool';
                dom.customPassShotSelectTrigger.dataset.value = '';
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
        // Use standard LI icon size
        const iconSvg = generatePassShotIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Generate structure with text below icon
        li.innerHTML = `
            <span class="passShot-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updatePassShotTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            // Close handled by mouseleave
            e.stopPropagation();
        });
        dom.passShotOptionsList.appendChild(li);
    });
    // Set initial trigger display to the first pass/shot tool found
    updatePassShotTriggerDisplay(firstToolId);
}

/** Initializes event listeners for the custom pass/shot dropdown */
export function initCustomPassShotSelector() {
    const container = dom.passShotToolSelector;
    if (!container) return;

    container.addEventListener('mouseenter', () => toggleDropdown(true));
    container.addEventListener('mouseleave', () => toggleDropdown(false));

    dom.customPassShotSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}