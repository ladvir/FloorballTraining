// js/numberSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, NUMBER_FONT_SIZE } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for numbers */
function generateNumberIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'number') return '';
    const fontSize = height * 0.7;
    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <rect x="1" y="1" width="${width-2}" height="${height-2}" rx="3" ry="3" fill="white" stroke="#eee"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                  font-size="${fontSize}" font-weight="bold" fill="${tool.fill}">
                ${tool.text}
            </text>
        </svg>`;
}

/** Updates the content of the number trigger button AND description */
export function updateNumberTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customNumberSelectTrigger;
    const descriptionSpan = dom.numberDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'number') {
            const iconSvg = generateNumberIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="number-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label; // Set description to the number itself
            descriptionSpan.title = tool.label;       // Set tooltip
        } else {
            const firstNumTool = drawingTools.find(t => t.category === 'number');
            if (firstNumTool) {
                const iconSvg = generateNumberIconSvg(firstNumTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="number-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstNumTool.label;
                triggerButton.dataset.value = firstNumTool.toolId;
                descriptionSpan.textContent = firstNumTool.label; // Set description
                descriptionSpan.title = firstNumTool.label;
            } else {
                triggerButton.innerHTML = `<span class="number-option-icon">#</span>`;
                triggerButton.title = 'Select Number Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'Num'; // Default text if no numbers exist
                descriptionSpan.title = 'Number';
            }
        }
    }
}

/** Toggles the visibility of the custom number dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customNumberSelectOptions || !dom.customNumberSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customNumberSelectOptions.classList.add('open');
        dom.customNumberSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customNumberSelectOptions.classList.remove('open');
        dom.customNumberSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom number select dropdown list (ul) */
export function populateCustomNumberSelector() {
    if (!dom.numberOptionsList) return;
    dom.numberOptionsList.innerHTML = '';
    let firstNumToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'number') return;
        if (firstNumToolId === null) firstNumToolId = tool.toolId;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.dataset.category = 'number'; // Keep category
        li.title = tool.label;
        const iconSvg = generateNumberIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Add the description span back for numbers in the list
        li.innerHTML = `
            <span class="number-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updateNumberTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.numberOptionsList.appendChild(li);
    });
    updateNumberTriggerDisplay(firstNumToolId);
}

/** Initializes event listeners for the custom number dropdown */
export function initCustomNumberSelector() {
    // Use click listener on trigger
    dom.customNumberSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    // Outside click listener
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.numberToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keydown listener
    dom.customNumberSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}