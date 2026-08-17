//***** js/fieldSelector.js ******
// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS } from './config.js';
import { appState } from './state.js';
import { saveStateForUndo } from './history.js';
import { initZoom } from './zoom.js';
import { getTransformedBBox } from './utils.js';

let isDropdownOpen = false;
let currentFieldId = 'Empty';
const ICON_WIDTH = 40;
const ICON_HEIGHT = 30;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 30;

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;
const VIEWBOX_PADDING = 50; // Controls the space around the field markings

function generateFieldIconSvg(field, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    const displayField = field && typeof field === 'object' ? field : { id: 'error', label: 'Error', svgMarkup: '' };
    const labelText = displayField.label || 'N/A';
    let iconContent = `<rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="lightgrey" stroke-width="1" rx="3" ry="3"/><line x1="5" y1="5" x2="${width-5}" y2="${height-5}" stroke="lightgrey" stroke-width="2"/><line x1="5" y1="${height-5}" x2="${width-5}" y2="5" stroke="lightgrey" stroke-width="2"/><text x="${width/2}" y="${height/2}" dominant-baseline="central" text-anchor="middle" font-size="10" fill="grey">${labelText}</text>`;
    if (displayField.id !== 'Empty' && displayField.id !== 'error' && displayField.svgMarkup) {
        iconContent = `
            <svg viewBox="0 0 800 600" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="border: 1px solid #ccc; background-color: white; overflow: hidden;">
                ${displayField.svgMarkup}
            </svg>`;
    } else if (displayField.id === 'Empty') {
        iconContent = `<rect x="1" y="1" width="${width-2}" height="${height-2}" fill="#f8f8f8" stroke="lightgrey" stroke-width="1" rx="3" ry="3"/><text x="${width/2}" y="${height/2}" dominant-baseline="central" text-anchor="middle" font-size="9" fill="#aaa">${labelText}</text>`;
    }
    return `<svg width="${width}" height="${height}">${iconContent}</svg>`;
}

export function updateFieldTriggerDisplay(fieldIdToDisplay) {
    let effectiveFieldId = fieldIdToDisplay;
    let fieldToUse = fieldOptionsMap.get(effectiveFieldId);
    if (!fieldToUse) {
        effectiveFieldId = 'Empty';
        fieldToUse = fieldOptionsMap.get(effectiveFieldId);
    }
    if (!fieldToUse) {
        fieldToUse = { id: 'error_placeholder', label: 'Field Error', svgMarkup: '' };
        effectiveFieldId = fieldToUse.id;
    }
    const triggerButton = dom.customFieldSelectTrigger;
    const descriptionSpan = dom.fieldDescription;
    if (triggerButton && descriptionSpan) {
        const iconSvg = generateFieldIconSvg(fieldToUse, ICON_WIDTH, ICON_HEIGHT);
        triggerButton.innerHTML = `<span class="field-option-icon">${iconSvg}</span>`;
        triggerButton.title = fieldToUse.label;
        triggerButton.dataset.value = effectiveFieldId;
        descriptionSpan.textContent = fieldToUse.label;
        descriptionSpan.title = fieldToUse.label;
    }
}

function measureIntrinsicFieldBBox(elementToMeasure) {
    if (!(elementToMeasure instanceof SVGElement)) return null;
    const tempSvg = document.createElementNS(SVG_NS, 'svg');
    tempSvg.style.position = 'absolute';
    tempSvg.style.visibility = 'hidden';
    tempSvg.style.width = '1px';
    tempSvg.style.height = '1px';
    document.body.appendChild(tempSvg);

    const clone = elementToMeasure.cloneNode(true);
    tempSvg.appendChild(clone);

    let bbox = null;
    try {
        bbox = getTransformedBBox(clone);
    } catch (e) {
        console.warn("Error measuring intrinsic BBox:", e);
    }

    document.body.removeChild(tempSvg);
    return bbox;
}

export function setFieldBackground(fieldId, shouldSaveState = true) {
    let effectiveFieldId = fieldId;
    if (!fieldOptionsMap.has(effectiveFieldId) && effectiveFieldId !== null && effectiveFieldId !== undefined) {
        effectiveFieldId = 'Empty';
    } else if (effectiveFieldId === null || effectiveFieldId === undefined) {
        effectiveFieldId = 'Empty';
    }

    const field = fieldOptionsMap.get(effectiveFieldId);

    if (!field) {
        console.error(`Critical error: Field definition for '${effectiveFieldId}' missing.`);
        updateFieldTriggerDisplay('error_placeholder');
        return;
    }
    if (!dom.fieldLayer || !dom.svgCanvas || !dom.drawingArea) {
        console.error("DOM elements missing for field background setting.");
        return;
    }

    const changed = currentFieldId !== effectiveFieldId;
    dom.fieldLayer.innerHTML = '';

    // --- 1. Sizing and Coordinate System Setup ---
    // Get responsive canvas size based on config and parent width.
    const maxAllowedWidth = dom.drawingArea.parentElement.clientWidth;
    const desiredWidth = field.width && field.width > 0 ? field.width : DEFAULT_CANVAS_WIDTH;
    const desiredHeight = field.height && field.height > 0 ? field.height : DEFAULT_CANVAS_HEIGHT;
    let canvasPixelWidth, canvasPixelHeight;

    if (desiredWidth > maxAllowedWidth) {
        const scaleFactor = maxAllowedWidth / desiredWidth;
        canvasPixelWidth = maxAllowedWidth;
        canvasPixelHeight = desiredHeight * scaleFactor;
    } else {
        canvasPixelWidth = desiredWidth;
        canvasPixelHeight = desiredHeight;
    }

    // Apply final size to container and SVG element.
    dom.drawingArea.style.width = `${canvasPixelWidth.toFixed(3)}px`;
    dom.drawingArea.style.height = `${canvasPixelHeight.toFixed(3)}px`;
    dom.svgCanvas.setAttribute('width', String(canvasPixelWidth));
    dom.svgCanvas.setAttribute('height', String(canvasPixelHeight));

    // GUARANTEE a positive coordinate system for the user by matching viewBox to the canvas size.
    const viewBox = { x: 0, y: 0, width: canvasPixelWidth, height: canvasPixelHeight };
    dom.svgCanvas.setAttribute('viewBox', `0 0 ${viewBox.width.toFixed(3)} ${viewBox.height.toFixed(3)}`);
    appState.viewBox = { ...viewBox };
    appState.initialViewBox = { ...viewBox };

    // Reset transforms on layers. They will inherit the clean coordinate system.
    dom.fieldLayer.setAttribute('transform', '');
    dom.contentLayer.setAttribute('transform', '');

    // --- 2. Field SVG Processing ---
    let intrinsicFieldBBox = null;
    let fieldRootElementSource = null;

    if (field && field.svgMarkup) {
        const tempParser = new DOMParser();
        const doc = tempParser.parseFromString(`<svg xmlns="${SVG_NS}">${field.svgMarkup.trim()}</svg>`, "image/svg+xml");

        if (doc.documentElement.nodeName.toLowerCase() !== 'parsererror' && doc.documentElement.firstElementChild) {
            fieldRootElementSource = doc.documentElement.firstElementChild;
            if (fieldRootElementSource instanceof SVGElement) {
                intrinsicFieldBBox = measureIntrinsicFieldBBox(fieldRootElementSource);
            }
        }
    }

    // If no field content, we're done. The canvas is already a clean, positive space.
    if (!intrinsicFieldBBox || intrinsicFieldBBox.width <= 0 || intrinsicFieldBBox.height <= 0) {
        currentFieldId = effectiveFieldId;
        updateFieldTriggerDisplay(effectiveFieldId);
        if (changed && shouldSaveState) { saveStateForUndo(); }
        return;
    }

    // Add the visual element to the DOM.
    const fieldElementInDOM = fieldRootElementSource.cloneNode(true);
    fieldElementInDOM.dataset.fieldId = effectiveFieldId;
    dom.fieldLayer.appendChild(fieldElementInDOM);

    // --- 3. Transform Calculation for Field Layer ---
    // Define the area of the field's content we want to make visible, including padding.
    const contentToFit = {
        x: intrinsicFieldBBox.left,
        y: intrinsicFieldBBox.top,
        width: intrinsicFieldBBox.width,
        height: intrinsicFieldBBox.height
    };

    // Define the available drawing area inside the canvas, accounting for padding.
    const availableSpace = {
        width: viewBox.width - (VIEWBOX_PADDING * 2),
        height: viewBox.height - (VIEWBOX_PADDING * 2)
    };

    // If padding makes the available space negative, we can't draw the field.
    if (availableSpace.width <= 0 || availableSpace.height <= 0) {
        dom.fieldLayer.innerHTML = ''; // Hide field
        currentFieldId = effectiveFieldId;
        updateFieldTriggerDisplay(effectiveFieldId);
        if (changed && shouldSaveState) { saveStateForUndo(); }
        return;
    }

    // Calculate scale needed to fit the content into the available space.
    const scaleX = availableSpace.width / contentToFit.width;
    const scaleY = availableSpace.height / contentToFit.height;
    const scale = Math.min(scaleX, scaleY); // Use 'min' to ensure it fits completely.

    // Calculate the final size of the scaled content.
    const scaledContentWidth = contentToFit.width * scale;
    const scaledContentHeight = contentToFit.height * scale;

    // Calculate translation needed to center the scaled content within the overall viewBox.
    const translateX = (viewBox.width - scaledContentWidth) / 2;
    const translateY = (viewBox.height - scaledContentHeight) / 2;

    // Construct the final transform string. SVG transforms are applied right-to-left:
    // a. Translate the field's content so its native top-left corner is at the origin.
    // b. Scale it down to fit within the padded area.
    // c. Translate it to its final centered position on the canvas.
    const transformString = `translate(${translateX.toFixed(3)}, ${translateY.toFixed(3)}) scale(${scale.toFixed(6)}) translate(${-contentToFit.x.toFixed(3)}, ${-contentToFit.y.toFixed(3)})`;

    // Apply this single, combined transform to the field's <g> layer.
    dom.fieldLayer.setAttribute('transform', transformString);

    // --- 4. Finalize ---
    currentFieldId = effectiveFieldId;
    updateFieldTriggerDisplay(effectiveFieldId);
    if (changed && shouldSaveState) {
        saveStateForUndo();
    }
}

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
            initZoom();
            toggleDropdown(false);
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });
    const initialFieldId = fieldOptionsMap.has(currentFieldId) ? currentFieldId : 'Empty';
    setFieldBackground(initialFieldId, false);
    initZoom();
}

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