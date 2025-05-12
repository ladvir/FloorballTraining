//***** js/fieldSelector.js ******
// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js'; // May need state later for saving selection
import { saveStateForUndo } from './history.js'; // Import history save function
import { initZoom } from './zoom.js'; // Import initZoom to update zoom state

let isDropdownOpen = false;
let currentFieldId = 'Empty'; // Default to 'Empty' field
// Define NEW icon size constants based on CSS
const ICON_WIDTH = 40; // Width for the icon display area in the trigger
const ICON_HEIGHT = 30; // Height for the icon display area in the trigger
const LI_ICON_WIDTH = 40; // Width for icons in the list
const LI_ICON_HEIGHT = 30; // Height for icons in the list

/** Helper function to generate the SVG icon markup for fields */
function generateFieldIconSvg(field, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    // Ensure field is an object, even if it's a fallback
    const displayField = field && typeof field === 'object' ? field : { id: 'error', label: 'Error', svgMarkup: '' };

    if (!displayField.svgMarkup || displayField.id === 'Empty' || displayField.id === 'error') {
        // Icon for "Empty" or error state
        const labelText = displayField.label || 'N/A'; // Use field's label or fallback
        return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="lightgrey" stroke-width="1" rx="3" ry="3"/><line x1="5" y1="5" x2="${width-5}" y2="${height-5}" stroke="lightgrey" stroke-width="2"/><line x1="5" y1="${height-5}" x2="${width-5}" y2="5" stroke="lightgrey" stroke-width="2"/><text x="${width/2}" y="${height/2}" dominant-baseline="central" text-anchor="middle" font-size="10" fill="grey">${labelText}</text></svg>`;
    }

    return `
        <svg viewBox="0 0 800 600" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="border: 1px solid #ccc; background-color: white;">
            ${displayField.svgMarkup}
        </svg>`;
}

/** Updates the content of the field trigger button AND description */
export function updateFieldTriggerDisplay(fieldIdToDisplay) {
    let effectiveFieldId = fieldIdToDisplay;
    let fieldToUse = fieldOptionsMap.get(effectiveFieldId);

    if (!fieldToUse) {
        // console.warn(`Field ID "${fieldIdToDisplay}" not found or invalid in updateFieldTriggerDisplay. Defaulting to 'Empty'.`);
        effectiveFieldId = 'Empty';
        fieldToUse = fieldOptionsMap.get(effectiveFieldId);
    }

    // If 'Empty' is also not found (critical config issue), create a hardcoded placeholder
    if (!fieldToUse) {
        fieldToUse = { id: 'error_placeholder', label: 'Field Error', svgMarkup: '' };
        effectiveFieldId = fieldToUse.id; // Use the placeholder ID
        console.error("Critical: 'Empty' field not found in config. Displaying error state for field selector trigger.");
    }

    const triggerButton = dom.customFieldSelectTrigger;
    const descriptionSpan = dom.fieldDescription;

    if (triggerButton && descriptionSpan) {
        // Pass the resolved fieldToUse object to generateFieldIconSvg
        const iconSvg = generateFieldIconSvg(fieldToUse, ICON_WIDTH, ICON_HEIGHT);
        triggerButton.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        triggerButton.title = fieldToUse.label;
        triggerButton.dataset.value = effectiveFieldId;
        descriptionSpan.textContent = fieldToUse.label;
        descriptionSpan.title = fieldToUse.label;
    } else {
        // console.error("Field trigger button or description span not found in DOM for updateFieldTriggerDisplay.");
    }
}


/** Sets the background field on the canvas, adjusting the viewBox.
 *  Accepts an optional shouldSaveState flag to prevent saving the initial load state. */
export function setFieldBackground(fieldId, shouldSaveState = true) {
    let effectiveFieldId = fieldId;
    if (!fieldOptionsMap.has(effectiveFieldId) && effectiveFieldId !== null && effectiveFieldId !== undefined) {
        console.warn(`setFieldBackground: Field ID "${fieldId}" not found. Defaulting to 'Empty'.`);
        effectiveFieldId = 'Empty';
    } else if (effectiveFieldId === null || effectiveFieldId === undefined) {
        // If fieldId is explicitly null or undefined, also default to 'Empty'
        console.warn(`setFieldBackground: Received null/undefined fieldId. Defaulting to 'Empty'.`);
        effectiveFieldId = 'Empty';
    }

    const field = fieldOptionsMap.get(effectiveFieldId);

    // If after defaulting, 'Empty' is still not found, this is a config problem.
    if (!field && effectiveFieldId === 'Empty') {
        console.error("Critical error in setFieldBackground: 'Empty' field definition is missing from config.js. Cannot set field background.");
        // Attempt to update display to show an error, but background setting will fail.
        updateFieldTriggerDisplay('error_placeholder'); // Show error in UI
        return;
    }


    if (!dom.fieldLayer || !dom.svgCanvas) {
        console.error("DOM elements for field layer or canvas not found.");
        return;
    }

    const changed = currentFieldId !== effectiveFieldId;

    // console.log(`Setting field background to: ${effectiveFieldId}`);
    dom.fieldLayer.innerHTML = '';

    let targetViewBox = '0 0 800 600';

    if (field && field.svgMarkup) { // Check if field exists and has markup
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<svg>${field.svgMarkup}</svg>`;
        const tempSvg = tempDiv.querySelector('svg');
        const innerSvgGroup = tempSvg?.querySelector('g');

        if (tempSvg && tempSvg.hasAttribute('viewBox')) {
            targetViewBox = tempSvg.getAttribute('viewBox');
            // console.log(`Using viewBox from root SVG: ${targetViewBox}`);
        } else if (innerSvgGroup && innerSvgGroup.hasAttribute('viewBox')) {
            targetViewBox = innerSvgGroup.getAttribute('viewBox');
            // console.log(`Using viewBox from inner group: ${targetViewBox}`);
        } else if (tempSvg && tempSvg.hasAttribute('width') && tempSvg.hasAttribute('height')) {
            const width = parseFloat(tempSvg.getAttribute('width'));
            const height = parseFloat(tempSvg.getAttribute('height'));
            if (!isNaN(width) && width > 0 && !isNaN(height) && height > 0) {
                targetViewBox = `0 0 ${width} ${height}`;
                // console.log(`Using width/height from root SVG: ${targetViewBox}`);
            }
        } else if (innerSvgGroup) {
            dom.fieldLayer.appendChild(innerSvgGroup);
            try {
                const bbox = innerSvgGroup.getBBox();
                if (bbox && bbox.width > 0 && bbox.height > 0) {
                    targetViewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
                    // console.log(`Using BBox from inner group: ${targetViewBox}`);
                } else {
                    // console.warn("Could not get valid BBox for field group, falling back to default canvas size.");
                    dom.fieldLayer.innerHTML = '';
                }
            } catch(e) {
                // console.warn("Error getting BBox for field group, falling back to default canvas size.", e);
                dom.fieldLayer.innerHTML = '';
            }
        } else {
            // console.warn("Could not parse field SVG markup or find viewBox/dimensions, falling back to default canvas size.");
        }

        if (dom.fieldLayer.innerHTML === '' && innerSvgGroup) {
            innerSvgGroup.dataset.fieldId = effectiveFieldId;
            innerSvgGroup.removeAttribute('transform');
            dom.fieldLayer.appendChild(innerSvgGroup);
        } else if (!innerSvgGroup && field.svgMarkup) {
            dom.fieldLayer.innerHTML = field.svgMarkup;
            const firstChild = dom.fieldLayer.firstElementChild;
            if (firstChild) firstChild.dataset.fieldId = effectiveFieldId;
        } else if (!innerSvgGroup && !field.svgMarkup && effectiveFieldId === 'Empty') {
            // This case is for 'Empty' which has no markup, fieldLayer is already cleared.
        } else if (!innerSvgGroup) {
            //  console.error("Could not find group element within field SVG markup, and no raw markup to append.");
        }
    } else if (effectiveFieldId === 'Empty') {
        // For 'Empty' field, fieldLayer is already cleared, targetViewBox remains default.
        // console.log("Setting 'Empty' field. No markup to append.");
    }


    dom.svgCanvas.setAttribute('viewBox', targetViewBox);
    const vbParts = targetViewBox.split(/[ ,]+/);
    if (vbParts.length === 4) {
        appState.viewBox = {
            x: parseFloat(vbParts[0]),
            y: parseFloat(vbParts[1]),
            width: parseFloat(vbParts[2]),
            height: parseFloat(vbParts[3]),
        };
        appState.initialViewBox = { ...appState.viewBox };
    } else {
        console.error("Failed to parse targetViewBox string:", targetViewBox);
        appState.viewBox = { x: 0, y: 0, width: 800, height: 600 };
        appState.initialViewBox = { ...appState.viewBox };
    }

    currentFieldId = effectiveFieldId;
    updateFieldTriggerDisplay(effectiveFieldId);

    if (changed && shouldSaveState) {
        saveStateForUndo();
    }
}


/** Toggles the visibility of the custom field dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customFieldSelectOptions || !dom.customFieldSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

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
        const iconSvg = generateFieldIconSvg(field, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="field-option-icon">${iconSvg}</span>
            <span class="option-label">${field.label}</span>`;
        li.addEventListener('click', (e) => {
            const selectedFieldId = e.currentTarget.dataset.value;
            setFieldBackground(selectedFieldId, true);
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });

    const initialFieldId = fieldOptionsMap.has(currentFieldId) ? currentFieldId : 'Empty';
    setFieldBackground(initialFieldId, false);
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