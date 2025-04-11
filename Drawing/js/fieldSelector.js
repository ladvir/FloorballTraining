// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js'; // May need state later for saving selection

let isDropdownOpen = false;
let currentFieldId = 'none'; // Default to no field

/** Helper function to generate the small SVG icon markup for fields */
function generateFieldIconSvg(field, width = 40, height = 30) { // Wider icon
    if (!field || !field.svgMarkup) {
        // Icon for "No Field"
        return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="lightgrey" stroke-width="1" rx="3" ry="3"/><line x1="5" y1="5" x2="${width-5}" y2="${height-5}" stroke="lightgrey" stroke-width="2"/><line x1="5" y1="${height-5}" x2="${width-5}" y2="5" stroke="lightgrey" stroke-width="2"/></svg>`;
    }
    // Use a wrapper SVG to scale the field markup into the icon size
    // Important: The field markup uses absolute coordinates, we need viewBox to scale it
    // We need to guess the original viewBox or size of the field markup
    let originalViewBox = "0 0 400 400"; // Default guess
    if (field.id === 'full-rink') originalViewBox = "0 0 600 400";
    if (field.id === 'empty-rink') originalViewBox = "0 0 400 300";

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
        dom.customFieldSelectTrigger.innerHTML = `
            <span class="field-option-icon">${iconSvg}</span>
            <span>${field.label}</span>
        `;
        dom.customFieldSelectTrigger.dataset.value = fieldId;
    } else if (dom.customFieldSelectTrigger) {
        // Fallback if field not found (shouldn't happen often)
        const noField = fieldOptionsMap.get('none');
        const iconSvg = generateFieldIconSvg(noField);
        dom.customFieldSelectTrigger.innerHTML = `
            <span class="field-option-icon">${iconSvg}</span>
            <span>${noField.label}</span>
        `;
        dom.customFieldSelectTrigger.dataset.value = 'none';
    }
}

/** Sets the background field on the canvas */
function setFieldBackground(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    if (!dom.fieldLayer || !field) return;

    console.log(`Setting field background to: ${fieldId}`);
    dom.fieldLayer.innerHTML = field.svgMarkup || ''; // Set innerHTML or clear it
    currentFieldId = fieldId;
    // Optional: Persist selected field ID (e.g., in appState or localStorage)
    // appState.selectedFieldId = fieldId;
    // localStorage.setItem('selectedField', fieldId);

    // Adjust main SVG viewBox if needed (basic example, might need refinement)
    // This is tricky as elements are placed relative to the original viewBox
    /*
    let viewW = 800, viewH = 600; // Default
    if (fieldId === 'full-rink') { viewW = 600; viewH = 400; }
    else if (fieldId === 'half-rink') { viewW = 400; viewH = 400; }
    else if (fieldId === 'empty-rink') { viewW = 400; viewH = 300; }
    dom.svgCanvas.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
    */
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
        const iconSvg = generateFieldIconSvg(field);
        li.innerHTML = `<span class="field-option-icon">${iconSvg}</span><span>${field.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedFieldId = e.currentTarget.dataset.value;
            updateFieldTriggerDisplay(selectedFieldId);
            setFieldBackground(selectedFieldId); // Apply the selected field
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });
    // Set initial display and background
    // const savedField = localStorage.getItem('selectedField') || 'none';
    const initialFieldId = 'none'; // Start with no field
    updateFieldTriggerDisplay(initialFieldId);
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