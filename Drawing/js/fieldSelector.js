//***** js\fieldSelector.js ******
// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js'; // May need state later for saving selection
import { saveStateForUndo } from './history.js'; // Import history save function
import { initZoom } from './zoom.js'; // Import initZoom to update zoom state

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

    // Wrap in SVG to scale, apply background for visibility
    // We don't need to parse the viewBox here just for the icon,
    // simply wrap the markup and let the outer SVG handle scaling to the icon size.
    return `
        <svg viewBox="0 0 800 600" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="border: 1px solid #ccc; background-color: white;">
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

/** Sets the background field on the canvas, adjusting the viewBox.
 *  Accepts an optional shouldSaveState flag to prevent saving the initial load state. */
export function setFieldBackground(fieldId, shouldSaveState = true) { // Added shouldSaveState flag
    const field = fieldOptionsMap.get(fieldId);
    if (!dom.fieldLayer || !dom.svgCanvas) {
        console.error("DOM elements for field layer or canvas not found.");
        return;
    }

    // Only save state if the field actually changes
    const changed = currentFieldId !== fieldId;

    console.log(`Setting field background to: ${fieldId}`);
    dom.fieldLayer.innerHTML = ''; // Clear previous field first

    let targetViewBox = '0 0 800 600'; // Default viewBox

    if (field && field.svgMarkup) {
        const tempDiv = document.createElement('div');
        // Wrap in SVG to handle potential XML declarations or comments
        tempDiv.innerHTML = `<svg>${field.svgMarkup}</svg>`;
        const tempSvg = tempDiv.querySelector('svg');
        const innerSvgGroup = tempSvg?.querySelector('g');

        if (tempSvg && tempSvg.hasAttribute('viewBox')) {
            // If the markup is a full SVG with a viewBox, use that
            targetViewBox = tempSvg.getAttribute('viewBox');
            console.log(`Using viewBox from root SVG: ${targetViewBox}`);
        } else if (innerSvgGroup && innerSvgGroup.hasAttribute('viewBox')) {
            // If the markup is a group with a viewBox, use that
            targetViewBox = innerSvgGroup.getAttribute('viewBox');
            console.log(`Using viewBox from inner group: ${targetViewBox}`);
        } else if (tempSvg && tempSvg.hasAttribute('width') && tempSvg.hasAttribute('height')) {
            // Fallback: If no viewBox but width/height on root SVG, assume 0 0 origin
            const width = parseFloat(tempSvg.getAttribute('width'));
            const height = parseFloat(tempSvg.getAttribute('height'));
            if (!isNaN(width) && width > 0 && !isNaN(height) && height > 0) {
                targetViewBox = `0 0 ${width} ${height}`;
                console.log(`Using width/height from root SVG: ${targetViewBox}`);
            }
        } else if (innerSvgGroup) {
            // Fallback: If no viewBox/width/height, try to get BBox of the group content
            // Append temporarily to get BBox
            dom.fieldLayer.appendChild(innerSvgGroup);
            try {
                const bbox = innerSvgGroup.getBBox();
                if (bbox && bbox.width > 0 && bbox.height > 0) {
                    targetViewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
                    console.log(`Using BBox from inner group: ${targetViewBox}`);
                } else {
                    console.warn("Could not get valid BBox for field group, falling back to default canvas size.");
                    dom.fieldLayer.innerHTML = ''; // Clear the temporarily added group
                }
            } catch(e) {
                console.warn("Error getting BBox for field group, falling back to default canvas size.", e);
                dom.fieldLayer.innerHTML = ''; // Clear the temporarily added group
            }
        } else {
            console.warn("Could not parse field SVG markup or find viewBox/dimensions, falling back to default canvas size.");
        }

        // Re-append the group if it wasn't appended for BBox calculation, or if BBox failed
        if (dom.fieldLayer.innerHTML === '' && innerSvgGroup) {
            // Ensure the group has the field ID data attribute
            innerSvgGroup.dataset.fieldId = fieldId;
            // Remove any existing transform attribute that might have been copied
            innerSvgGroup.removeAttribute('transform');
            dom.fieldLayer.appendChild(innerSvgGroup);
        } else if (!innerSvgGroup) {
            console.error("Could not find group element within field SVG markup.");
            // Fallback: Add raw markup, but scaling won't work correctly
            dom.fieldLayer.innerHTML = field.svgMarkup;
            // Try to add data attribute to the first element if possible
            const firstChild = dom.fieldLayer.firstElementChild;
            if (firstChild) firstChild.dataset.fieldId = fieldId;
        }
    }

    // Set the canvas viewBox to match the field's dimensions
    dom.svgCanvas.setAttribute('viewBox', targetViewBox);

    // Update appState.viewBox and initialViewBox for zoom/pan/reset
    const vbParts = targetViewBox.split(/[ ,]+/);
    if (vbParts.length === 4) {
        appState.viewBox = {
            x: parseFloat(vbParts[0]),
            y: parseFloat(vbParts[1]),
            width: parseFloat(vbParts[2]),
            height: parseFloat(vbParts[3]),
        };
        // Update initialViewBox as well, so resetZoom goes back to the field's native view
        appState.initialViewBox = { ...appState.viewBox }; // Assuming initialViewBox is in appState
    } else {
        console.error("Failed to parse targetViewBox string:", targetViewBox);
        // Fallback to default 800x600 if parsing fails
        appState.viewBox = { x: 0, y: 0, width: 800, height: 600 };
        appState.initialViewBox = { ...appState.viewBox };
    }


    currentFieldId = fieldId;
    updateFieldTriggerDisplay(fieldId); // Update trigger display including description

    // Save state only if the field changed and saving is enabled
    if (changed && shouldSaveState) {
        saveStateForUndo(); /* <--- Save State */
    }
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
            // Call setFieldBackground, allowing it to save state
            setFieldBackground(selectedFieldId, true);
            toggleDropdown(false); // Close on click
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });

    // Set initial display and background WITHOUT saving state initially
    const initialFieldId = fieldOptions[0]?.id || 'none';
    // This call will now set the initial viewBox of the canvas
    setFieldBackground(initialFieldId, false); // Don't save initial state here, app.js will do it
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