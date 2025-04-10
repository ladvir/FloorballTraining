// js/numberSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, NUMBER_FONT_SIZE } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;

/** Helper function to generate the small SVG icon markup for numbers */
function generateNumberIconSvg(tool, width = 20, height = 20) {
    if (!tool || tool.category !== 'number') return '';
    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                  font-size="${height * 0.8}" font-weight="bold" fill="${tool.fill}">
                ${tool.text}
            </text>
        </svg>`;
}

/** Updates the content of the number trigger button */
export function updateNumberTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customNumberSelectTrigger) {
        if (tool && tool.category === 'number') {
            const iconSvg = generateNumberIconSvg(tool);
            dom.customNumberSelectTrigger.innerHTML = `
                <span class="number-option-icon">${iconSvg}</span>
                <span>${tool.label}</span>
            `;
            dom.customNumberSelectTrigger.dataset.value = toolId;
        } else {
            dom.customNumberSelectTrigger.innerHTML = `<span>Select Number...</span>`;
            dom.customNumberSelectTrigger.dataset.value = '';
        }
    }
}

/** Toggles the visibility of the custom number dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customNumberSelectOptions || !dom.customNumberSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
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
    drawingTools.forEach(tool => {
        if (tool.category !== 'number') return;
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        const iconSvg = generateNumberIconSvg(tool);
        li.innerHTML = `<span class="number-option-icon">${iconSvg}</span><span>${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            updateNumberTriggerDisplay(selectedToolId);
            setActiveTool(selectedToolId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.numberOptionsList.appendChild(li);
    });
    updateNumberTriggerDisplay(null); // Initial state
}

/** Initializes event listeners for the custom number dropdown */
export function initCustomNumberSelector() {
    dom.customNumberSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.numberToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customNumberSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}