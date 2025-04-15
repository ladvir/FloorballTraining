// js/passShotSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, ARROW_MARKER_SIZE, ARROW_COLOR, ARROW_MARKER_SIZE_SHOT, MARKER_ARROW_SHOT_LARGE_ID, MARKER_ARROW_PASS_ID } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for pass/shots */
function generatePassShotIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'passShot') return '';
    const strokeWidth = 2.5;
    const midY = height / 2;
    const startX = width * 0.15; const endX = width * 0.85;
    const color = ARROW_COLOR;
    let markerId = `icon-${tool.markerEndId || MARKER_ARROW_PASS_ID}`; // Use tool's marker ID
    let markerSize = ARROW_MARKER_SIZE * 1.5;
    let markerRefX = 8;
    let lines = '';

    if (tool.isDoubleLine) {
        const offset = strokeWidth * 1.5;
        markerId = `icon-${MARKER_ARROW_SHOT_LARGE_ID}`;
        markerSize = ARROW_MARKER_SIZE_SHOT * 1.2;
        markerRefX = 1;
        lines = `
            <line x1="${startX}" y1="${midY - offset/2}" x2="${endX}" y2="${midY - offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY + offset/2}" x2="${endX}" y2="${midY + offset/2}" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}" stroke="none" stroke-width="1" marker-end="url(#${markerId})" />
            `;
    } else {
        markerId = `icon-${MARKER_ARROW_PASS_ID}`;
        lines = `<line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}"
                       stroke="${color}" stroke-width="${strokeWidth}"
                       marker-end="url(#${markerId})" />`;
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
            toggleDropdown(false); // Close on click
            e.stopPropagation();
        });
        dom.passShotOptionsList.appendChild(li);
    });
    updatePassShotTriggerDisplay(firstToolId); // Set initial state
}

/** Initializes event listeners for the custom pass/shot dropdown */
export function initCustomPassShotSelector() {
    // Revert to click listener on trigger
    dom.customPassShotSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown(); // Toggle on click
        e.stopPropagation();
    });

    // Keep outside click listener
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.passShotToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keep keydown listener
    dom.customPassShotSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}