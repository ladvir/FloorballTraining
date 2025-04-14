// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js';

let isDropdownOpen = false;
let currentFieldId = 'none';
// Define NEW icon size constants based on CSS (.custom-select-trigger size)
const ICON_WIDTH = 40; // Width for the icon display area
const ICON_HEIGHT = 40; // Height for the icon display area
const LI_ICON_WIDTH = 40; // Width for icons in the list
const LI_ICON_HEIGHT = 30; // Height for icons in the list

/** Helper function to generate the SVG icon markup for fields */
function generateFieldIconSvg(field, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) { // Default to list item size
    if (!field || !field.svgMarkup) {
        // Icon for "No Field"
        return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="lightgrey" stroke-width="1" rx="3" ry="3"/><line x1="5" y1="5" x2="${width-5}" y2="${height-5}" stroke="lightgrey" stroke-width="2"/><line x1="5" y1="${height-5}" x2="${width-5}" y2="5" stroke="lightgrey" stroke-width="2"/></svg>`;
    }
    let originalViewBox = "0 0 400 400";
    const vbMatch = field.svgMarkup.match(/viewBox=["']([^"']+)["']/);
    if (vbMatch && vbMatch[1]) { originalViewBox = vbMatch[1]; }
    else if (field.id === 'full-rink') { originalViewBox = "0 0 600 400"; }
    else if (field.id === 'empty-rink') { originalViewBox = "0 0 400 300"; }

    return `
        <svg viewBox="${originalViewBox}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="border: 1px solid #ccc; background-color: white;">
            ${field.svgMarkup}
        </svg>`;
}

/** Updates the content of the field trigger button */
export function updateFieldTriggerDisplay(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    if (dom.customFieldSelectTrigger && field) {
        // Use larger size for the trigger button display
        const iconSvg = generateFieldIconSvg(field, ICON_WIDTH, ICON_HEIGHT);
        dom.customFieldSelectTrigger.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        dom.customFieldSelectTrigger.title = field.label;
        dom.customFieldSelectTrigger.dataset.value = fieldId;
    } else if (dom.customFieldSelectTrigger) {
        const noField = fieldOptionsMap.get('none');
        const iconSvg = generateFieldIconSvg(noField, ICON_WIDTH, ICON_HEIGHT); // Larger icon for trigger
        dom.customFieldSelectTrigger.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        dom.customFieldSelectTrigger.title = noField.label;
        dom.customFieldSelectTrigger.dataset.value = 'none';
    }
}

/** Sets the background field on the canvas, scaling it */
export function setFieldBackground(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    if (!dom.fieldLayer || !field) {
        console.warn(`setFieldBackground called with invalid fieldId: ${fieldId}`);
        if (dom.fieldLayer) dom.fieldLayer.innerHTML = '';
        currentFieldId = 'none';
        updateFieldTriggerDisplay('none');
        return;
    }

    console.log(`Setting field background to: ${fieldId}`);
    dom.fieldLayer.innerHTML = '';

    if (field.svgMarkup) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<svg>${field.svgMarkup}</svg>`;
        const innerSvgGroup = tempDiv.querySelector('svg > g');

        if (innerSvgGroup) {
            let fieldWidth = 400, fieldHeight = 400;
            if (field.id === 'full-rink') { fieldWidth = 600; fieldHeight = 400; }
            else if (field.id === 'empty-rink') { fieldWidth = 400; fieldHeight = 300; }
            else if (field.id === 'half-rink') { fieldWidth = 400; fieldHeight = 400; }

            const canvasWidth = dom.svgCanvas.clientWidth || 800;
            const canvasHeight = dom.svgCanvas.clientHeight || 600;
            const scaleX = canvasWidth / fieldWidth; const scaleY = canvasHeight / fieldHeight;
            const scale = Math.min(scaleX, scaleY);
            const scaledWidth = fieldWidth * scale; const scaledHeight = fieldHeight * scale;
            const translateX = (canvasWidth - scaledWidth) / 2; const translateY = (canvasHeight - scaledHeight) / 2;

            innerSvgGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
            dom.fieldLayer.appendChild(innerSvgGroup);
        } else {
            console.error("Could not find group element within field SVG markup.");
            dom.fieldLayer.innerHTML = field.svgMarkup;
        }
    }

    currentFieldId = fieldId;
    updateFieldTriggerDisplay(fieldId);
}


/** Toggles the visibility of the custom field dropdown options */
function toggleDropdown(forceOpen = null) {
    // This function will now be controlled by mouseenter/leave
    if (!dom.customFieldSelectOptions || !dom.customFieldSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;

    // Only proceed if state is changing
    if (shouldBeOpen === isDropdownOpen) return;

    if (shouldBeOpen) {
        // Close other dropdowns potentially
        // closeOtherDropdowns('field'); // Implement this helper if needed
        dom.customFieldSelectOptions.classList.add('open');
        dom.customFieldSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customFieldSelectOptions.classList.remove('open');
        dom.customFieldSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom field select dropdown list (ul) */
export function populateCustomFieldSelector() {
    if (!dom.fieldOptionsList) return;
    dom.fieldOptionsList.innerHTML = '';
    fieldOptions.forEach(field => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = field.id;
        li.title = field.label; // Tooltip for list item
        // Use standard LI icon size
        const iconSvg = generateFieldIconSvg(field, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Generate structure with text below icon
        li.innerHTML = `
            <span class="field-option-icon">${iconSvg}</span>
            <span class="option-label">${field.label}</span>`; // Text label
        li.addEventListener('click', (e) => {
            const selectedFieldId = e.currentTarget.dataset.value;
            setFieldBackground(selectedFieldId); // This updates trigger too
            // toggleDropdown(false); // Close handled by mouseleave now
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });

    // Set initial display and background to the first option ('none')
    const initialFieldId = fieldOptions[0]?.id || 'none';
    setFieldBackground(initialFieldId);
}

/** Initializes event listeners for the custom field dropdown */
export function initCustomFieldSelector() {
    const container = dom.fieldSelector; // Use the container for hover events
    if (!container) return;

    // REMOVE click listener from trigger
    // dom.customFieldSelectTrigger?.addEventListener('click', ...);

    // ADD mouseenter/mouseleave to the container
    container.addEventListener('mouseenter', () => {
        toggleDropdown(true); // Force open
    });
    container.addEventListener('mouseleave', () => {
        toggleDropdown(false); // Force close
    });

    // Keep keydown for basic accessibility
    dom.customFieldSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); } // Toggle on Enter/Space
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}