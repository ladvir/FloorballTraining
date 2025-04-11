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
    let originalViewBox = "0 0 400 400";
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

/** Sets the background field on the canvas */
// **** ADD export KEYWORD ****
export function setFieldBackground(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    if (!dom.fieldLayer || !field) {
        console.warn(`setFieldBackground called with invalid fieldId: ${fieldId}`);
        // Ensure field layer is cleared if ID is invalid or 'none'
        if (dom.fieldLayer) dom.fieldLayer.innerHTML = '';
        currentFieldId = 'none';
        updateFieldTriggerDisplay('none'); // Update trigger to show 'none'
        return;
    }

    console.log(`Setting field background to: ${fieldId}`);
    dom.fieldLayer.innerHTML = field.svgMarkup || ''; // Set innerHTML or clear it
    currentFieldId = fieldId;

    // Update the trigger display to match the newly set field
    updateFieldTriggerDisplay(fieldId);

    // Optional: Persist selected field ID
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
            // updateFieldTriggerDisplay(selectedFieldId); // setFieldBackground now handles this
            setFieldBackground(selectedFieldId);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });

    // Set initial display and background on page load
    const initialFieldId = 'none'; // Always start with no field unless loaded from storage
    // If loading from storage is implemented later, retrieve the saved ID here
    // const savedFieldId = localStorage.getItem('selectedField') || 'none';
    setFieldBackground(initialFieldId); // This also updates the trigger display
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