// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js'; // May need state later for saving selection

let isDropdownOpen = false;
let currentFieldId = 'none'; // Default to no field
const ICON_WIDTH = 40;
const ICON_HEIGHT = 30;

/** Helper function to generate the small SVG icon markup for fields */
function generateFieldIconSvg(field, width = ICON_WIDTH, height = ICON_HEIGHT) {
    if (!field || !field.svgMarkup) {
        // Icon for "No Field"
        return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="lightgrey" stroke-width="1" rx="3" ry="3"/><line x1="5" y1="5" x2="${width-5}" y2="${height-5}" stroke="lightgrey" stroke-width="2"/><line x1="5" y1="${height-5}" x2="${width-5}" y2="5" stroke="lightgrey" stroke-width="2"/></svg>`;
    }
    // Extract original viewBox for aspect ratio calculation
    let originalViewBox = "0 0 400 400"; // Default guess
    const vbMatch = field.svgMarkup.match(/viewBox=["']([^"']+)["']/);
    if (vbMatch && vbMatch[1]) {
        originalViewBox = vbMatch[1];
    } else if (field.id === 'full-rink') {
        originalViewBox = "0 0 600 400"; // Fallback from config if no viewBox in markup
    } else if (field.id === 'empty-rink') {
        originalViewBox = "0 0 400 300"; // Fallback
    }

    return `
        <svg viewBox="${originalViewBox}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="border: 1px solid #ccc; background-color: white;">
            ${field.svgMarkup}
        </svg>`;
}

/** Updates the content of the field trigger button */
export function updateFieldTriggerDisplay(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    if (dom.customFieldSelectTrigger && field) {
        const iconSvg = generateFieldIconSvg(field);
        dom.customFieldSelectTrigger.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        dom.customFieldSelectTrigger.title = field.label;
        dom.customFieldSelectTrigger.dataset.value = fieldId;
    } else if (dom.customFieldSelectTrigger) {
        const noField = fieldOptionsMap.get('none');
        const iconSvg = generateFieldIconSvg(noField);
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
    dom.fieldLayer.innerHTML = ''; // Clear previous field first

    if (field.svgMarkup) {
        // Create a temporary element to parse the SVG and get dimensions
        const tempDiv = document.createElement('div');
        // Wrap markup in SVG tag to allow parsing
        tempDiv.innerHTML = `<svg>${field.svgMarkup}</svg>`;
        const innerSvgGroup = tempDiv.querySelector('svg > g'); // Get the <g> element

        if (innerSvgGroup) {
            let fieldWidth = 400; // Default width
            let fieldHeight = 400; // Default height

            // Try to get dimensions from the group's content (might need getBBox)
            // For simplicity, use predefined sizes based on ID for now
            if (field.id === 'full-rink') { fieldWidth = 600; fieldHeight = 400; }
            else if (field.id === 'empty-rink') { fieldWidth = 400; fieldHeight = 300; }
            else if (field.id === 'half-rink') { fieldWidth = 400; fieldHeight = 400; } // Assuming square based on markup


            const canvasWidth = dom.svgCanvas.clientWidth || 800;
            const canvasHeight = dom.svgCanvas.clientHeight || 600;

            // Calculate scale factor to fit (meet)
            const scaleX = canvasWidth / fieldWidth;
            const scaleY = canvasHeight / fieldHeight;
            const scale = Math.min(scaleX, scaleY);

            // Calculate translation to center
            const scaledWidth = fieldWidth * scale;
            const scaledHeight = fieldHeight * scale;
            const translateX = (canvasWidth - scaledWidth) / 2;
            const translateY = (canvasHeight - scaledHeight) / 2;

            // Apply transform to the group before appending
            innerSvgGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
            dom.fieldLayer.appendChild(innerSvgGroup); // Append the transformed group
        } else {
            console.error("Could not find group element within field SVG markup.");
            dom.fieldLayer.innerHTML = field.svgMarkup; // Fallback to raw markup insertion (no scaling)
        }
    }

    currentFieldId = fieldId;
    updateFieldTriggerDisplay(fieldId);
    // localStorage.setItem('selectedField', fieldId);
}


/** Toggles the visibility of the custom field dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customFieldSelectOptions || !dom.customFieldSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen) {
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
        li.title = field.label;
        const iconSvg = generateFieldIconSvg(field);
        li.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        li.addEventListener('click', (e) => {
            const selectedFieldId = e.currentTarget.dataset.value;
            setFieldBackground(selectedFieldId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });

    const initialFieldId = 'none';
    setFieldBackground(initialFieldId);
}

/** Initializes event listeners for the custom field dropdown */
export function initCustomFieldSelector() {
    dom.customFieldSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.fieldSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customFieldSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}