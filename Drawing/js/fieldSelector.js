// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js'; // May need state later for saving selection

let isDropdownOpen = false;
let currentFieldId = 'none'; // Default to no field
// Define NEW icon size constants based on CSS
const ICON_WIDTH = 40; // Width for the icon display area in the trigger
const ICON_HEIGHT = 30; // Height for the icon display area in the trigger
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

    // Wrap in SVG to scale, apply background for visibility
    return `
        <svg viewBox="${originalViewBox}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="border: 1px solid #ccc; background-color: white;">
            ${field.svgMarkup}
        </svg>`;
}

/** Updates the content of the field trigger button AND description */
export function updateFieldTriggerDisplay(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    const triggerButton = dom.customFieldSelectTrigger;
    const descriptionSpan = dom.fieldDescription; // Get reference to description span

    if (triggerButton && descriptionSpan && field) {
        // Use larger size for the trigger button display
        const iconSvg = generateFieldIconSvg(field, ICON_WIDTH, ICON_HEIGHT);
        triggerButton.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        triggerButton.title = field.label; // Keep tooltip
        triggerButton.dataset.value = fieldId;
        descriptionSpan.textContent = field.label; // Set description text
        descriptionSpan.title = field.label; // Tooltip for description
    } else if (triggerButton && descriptionSpan) {
        // Fallback to 'none' field if field not found
        const noField = fieldOptionsMap.get('none');
        const iconSvg = generateFieldIconSvg(noField, ICON_WIDTH, ICON_HEIGHT);
        triggerButton.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        triggerButton.title = noField.label;
        triggerButton.dataset.value = 'none';
        descriptionSpan.textContent = noField.label; // Set description text
        descriptionSpan.title = noField.label;
    }
}

/** Sets the background field on the canvas, scaling it */
export function setFieldBackground(fieldId) {
    const field = fieldOptionsMap.get(fieldId);
    if (!dom.fieldLayer || !field) {
        console.warn(`setFieldBackground called with invalid fieldId: ${fieldId}`);
        if (dom.fieldLayer) dom.fieldLayer.innerHTML = '';
        currentFieldId = 'none';
        updateFieldTriggerDisplay('none'); // Update trigger to show 'none'
        return;
    }

    console.log(`Setting field background to: ${fieldId}`);
    dom.fieldLayer.innerHTML = ''; // Clear previous field first

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
            dom.fieldLayer.innerHTML = field.svgMarkup; // Fallback
        }
    }

    currentFieldId = fieldId;
    updateFieldTriggerDisplay(fieldId); // Update trigger display including description
}


/** Toggles the visibility of the custom field dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customFieldSelectOptions || !dom.customFieldSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return; // No change needed

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
        li.title = field.label; // Tooltip for list item
        const iconSvg = generateFieldIconSvg(field, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        // Generate structure with text below icon
        li.innerHTML = `
            <span class="field-option-icon">${iconSvg}</span>
            <span class="option-label">${field.label}</span>`; // Text label visible in list
        li.addEventListener('click', (e) => {
            const selectedFieldId = e.currentTarget.dataset.value;
            setFieldBackground(selectedFieldId); // This updates trigger too
            toggleDropdown(false); // Close on click
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });

    // Set initial display and background to the first option ('none')
    const initialFieldId = fieldOptions[0]?.id || 'none';
    setFieldBackground(initialFieldId); // This sets the bg AND updates the trigger display
}

/** Initializes event listeners for the custom field dropdown */
export function initCustomFieldSelector() {
    // Revert to click listener on trigger
    dom.customFieldSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown(); // Toggle on click
        e.stopPropagation();
    });

    // Outside click listener
    document.addEventListener('click', (e) => {
        // Check if the click is outside the entire tool-group container
        if (isDropdownOpen && !dom.fieldSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keydown listener
    dom.customFieldSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}