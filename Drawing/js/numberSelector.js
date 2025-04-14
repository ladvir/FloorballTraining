// js/numberSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, NUMBER_FONT_SIZE } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
// Define NEW icon size constants based on CSS
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for numbers */
function generateNumberIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) { // Default to list item size
    if (!tool || tool.category !== 'number') return '';
    const fontSize = height * 0.7; // Adjust font size based on icon height
    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <rect x="1" y="1" width="${width-2}" height="${height-2}" rx="3" ry="3" fill="white" stroke="#eee"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                  font-size="${fontSize}" font-weight="bold" fill="${tool.fill}">
                ${tool.text}
            </text>
        </svg>`;
}

/** Updates the content of the number trigger button */
export function updateNumberTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customNumberSelectTrigger) {
        if (tool && tool.category === 'number') {
            // Use larger size for trigger
            const iconSvg = generateNumberIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            dom.customNumberSelectTrigger.innerHTML = `<span class="number-option-icon">${iconSvg}</span>`;
            dom.customNumberSelectTrigger.title = tool.label;
            dom.customNumberSelectTrigger.dataset.value = toolId;
        } else {
            // Show first number icon as default
            const firstNumTool = drawingTools.find(t => t.category === 'number');
            if (firstNumTool) {
                const iconSvg = generateNumberIconSvg(firstNumTool, ICON_WIDTH, ICON_HEIGHT);
                dom.customNumberSelectTrigger.innerHTML = `<span class="number-option-icon">${iconSvg}</span>`;
                dom.customNumberSelectTrigger.title = firstNumTool.label;
                dom.customNumberSelectTrigger.dataset.value = firstNumTool.toolId;
            } else {
                dom.customNumberSelectTrigger.innerHTML = `<span class="number-option-icon">#</span>`;
                dom.customNumberSelectTrigger.title = 'Select Number Tool';
                dom.customNumberSelectTrigger.dataset.value = '';
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
        li.title = tool.label;
        // Use standard LI icon size
        const iconSvg = generateNumberIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Generate structure with text below icon
        li.innerHTML = `
            <span class="number-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updateNumberTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            // Close handled by mouseleave
            e.stopPropagation();
        });
        dom.numberOptionsList.appendChild(li);
    });
    // Set initial trigger display to the first number tool found
    updateNumberTriggerDisplay(firstNumToolId);
}

/** Initializes event listeners for the custom number dropdown */
export function initCustomNumberSelector() {
    const container = dom.numberToolSelector;
    if (!container) return;

    container.addEventListener('mouseenter', () => toggleDropdown(true));
    container.addEventListener('mouseleave', () => toggleDropdown(false));

    dom.customNumberSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}