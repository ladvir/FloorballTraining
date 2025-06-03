import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS } from './config.js';
import { setActiveTool } from './tools.js';
import { appState } from './state.js'; // Needed for current color

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for shapes */
function generateShapeIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'shape') return '';

    const stroke = tool.stroke || '#333333'; // Use tool default or fallback
    const strokeWidth = tool.strokeWidth || 1.5;
    const fill = tool.isFilled ? (tool.fill || '#cccccc') : 'none'; // Use tool default or grey if filled, else none

    // Center coordinates and basic dimensions
    const cx = width / 2;
    const cy = height / 2;
    const padding = strokeWidth * 2;
    const rectW = width - padding * 2;
    const rectH = height - padding * 2;
    const rectX = padding;
    const rectY = padding;
    const radius = Math.min(rectW, rectH) / 2;

    let shapeElement = '';

    switch (tool.shapeType) {
        case 'rectangle':
            shapeElement = `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="2" ry="2"/>`;
            break;
        case 'square':
            const side = Math.min(rectW, rectH);
            const squareX = (width - side) / 2;
            const squareY = (height - side) / 2;
            shapeElement = `<rect x="${squareX}" y="${squareY}" width="${side}" height="${side}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="2" ry="2"/>`;
            break;
        case 'circle':
            shapeElement = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
            break;
        case 'triangle':
            const triY = padding;
            const triBaseY = height - padding;
            const triW = width - padding * 2;
            shapeElement = `<polygon points="${cx},${triY} ${width - padding},${triBaseY} ${padding},${triBaseY}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
            break;
        default:
            shapeElement = `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="lightgrey" stroke="grey" stroke-width="1"/>`; // Fallback
    }

    return `
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            ${shapeElement}
        </svg>`;
}

/** Updates the content of the shape trigger button AND description */
export function updateShapeTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customShapeSelectTrigger;
    const descriptionSpan = dom.shapeDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'shape') {
            const iconSvg = generateShapeIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="shape-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            // Find the first available shape tool as default if none provided or invalid
            const firstShapeTool = drawingTools.find(t => t.category === 'shape');
            if (firstShapeTool) {
                const iconSvg = generateShapeIconSvg(firstShapeTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="shape-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstShapeTool.label;
                triggerButton.dataset.value = firstShapeTool.toolId;
                descriptionSpan.textContent = firstShapeTool.label;
                descriptionSpan.title = firstShapeTool.label;
            } else { // Fallback if absolutely no shape tools defined
                triggerButton.innerHTML = `<span class="shape-option-icon">?</span>`;
                triggerButton.title = 'Select Shape Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'Shape';
                descriptionSpan.title = 'Shape';
            }
        }
    }
}

/** Toggles the visibility of the custom shape dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customShapeSelectOptions || !dom.customShapeSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        dom.customShapeSelectOptions.classList.add('open');
        dom.customShapeSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customShapeSelectOptions.classList.remove('open');
        dom.customShapeSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom shape select dropdown list (ul) */
export function populateCustomShapeSelector() {
    if (!dom.shapeOptionsList) return;
    dom.shapeOptionsList.innerHTML = '';
    let firstShapeToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'shape') return;
        if (firstShapeToolId === null) firstShapeToolId = tool.toolId;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generateShapeIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="shape-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updateShapeTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.shapeOptionsList.appendChild(li);
    });
    updateShapeTriggerDisplay(firstShapeToolId); // Set initial display
}

/** Initializes event listeners for the custom shape dropdown */
export function initCustomShapeSelector() {
    // Use click listener on trigger
    dom.customShapeSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    // Outside click listener
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.shapeToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keydown listener
    dom.customShapeSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}