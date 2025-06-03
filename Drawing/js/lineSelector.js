//***** js/lineSelector.js ******

import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS } from './config.js';
import { setActiveTool } from './tools.js';
import { appState } from './state.js'; // To get current color for icons

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for lines */
function generateLineIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'line') return '';

    const strokeColor = appState.currentDrawingColor || appState.selectedColor || 'black';
    const strokeWidth = tool.strokeWidth || 1;
    const yPos = height / 2;
    const x1 = width * 0.1;
    const x2 = width * 0.9;

    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <line x1="${x1}" y1="${yPos}" x2="${x2}" y2="${yPos}"
                  stroke="${strokeColor}"
                  stroke-width="${strokeWidth}"
                  stroke-linecap="round"/>
        </svg>`;
}

/** Updates the content of the line trigger button AND description */
export function updateLineTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customLineSelectTrigger;
    const descriptionSpan = dom.lineDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'line') {
            const iconSvg = generateLineIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="line-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            const firstLineTool = drawingTools.find(t => t.category === 'line');
            if (firstLineTool) {
                const iconSvg = generateLineIconSvg(firstLineTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="line-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstLineTool.label;
                triggerButton.dataset.value = firstLineTool.toolId;
                descriptionSpan.textContent = firstLineTool.label;
                descriptionSpan.title = firstLineTool.label;
            } else {
                triggerButton.innerHTML = `<span class="line-option-icon">?</span>`;
                triggerButton.title = 'Select Line Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'Line';
                descriptionSpan.title = 'Line';
            }
        }
    }
}

/** Toggles the visibility of the custom line dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customLineSelectOptions || !dom.customLineSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customLineSelectOptions.classList.add('open');
        dom.customLineSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customLineSelectOptions.classList.remove('open');
        dom.customLineSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom line select dropdown list (ul) */
export function populateCustomLineSelector() {
    if (!dom.lineOptionsList) return;
    dom.lineOptionsList.innerHTML = '';
    let firstLineToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'line') return;
        if (firstLineToolId === null) firstLineToolId = tool.toolId;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generateLineIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="line-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updateLineTriggerDisplay(selectedToolId); // Update trigger first
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.lineOptionsList.appendChild(li);
    });
    updateLineTriggerDisplay(firstLineToolId); // Set initial state
}

/** Initializes event listeners for the custom line dropdown */
export function initCustomLineSelector() {
    dom.customLineSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.lineToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    dom.customLineSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}

// Function to update icons when color changes externally
export function updateLineSelectorIcons() {
    // Update the trigger button icon
    const currentToolId = dom.customLineSelectTrigger?.dataset.value;
    if (currentToolId) {
        updateLineTriggerDisplay(currentToolId);
    }

    // Update icons in the dropdown list
    dom.lineOptionsList?.querySelectorAll('li[data-value]').forEach(li => {
        const toolId = li.dataset.value;
        const tool = drawingToolMap.get(toolId);
        if (tool && tool.category === 'line') {
            const iconSpan = li.querySelector('.line-option-icon');
            if (iconSpan) {
                iconSpan.innerHTML = generateLineIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
            }
        }
    });
}