//***** js/fieldSelector.js ******
// js/fieldSelector.js
import { dom } from './dom.js';
import { fieldOptions, fieldOptionsMap, SVG_NS, PLACEMENT_GAP } from './config.js';
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
const FIELD_DISPLAY_PADDING = PLACEMENT_GAP * 2;

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

function getCombinedBBoxOfElements(elements) {
    if (!elements || elements.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasValidBBox = false;
    elements.forEach(element => {
        const bbox = getTransformedBBox(element);
        if (bbox) {
            minX = Math.min(minX, bbox.left);
            minY = Math.min(minY, bbox.top);
            maxX = Math.max(maxX, bbox.right);
            maxY = Math.max(maxY, bbox.bottom);
            hasValidBBox = true;
        }
    });
    return hasValidBBox ? { minX, minY, maxX, maxY, width: maxX-minX, height: maxY-minY } : null;
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

export function setFieldBackground(fieldId, shouldSaveState = true, viewMode = 'fitFieldOnly') { // Default viewMode to 'fitFieldOnly'
    let effectiveFieldId = fieldId;
    if (!fieldOptionsMap.has(effectiveFieldId) && effectiveFieldId !== null && effectiveFieldId !== undefined) {
        effectiveFieldId = 'Empty';
    } else if (effectiveFieldId === null || effectiveFieldId === undefined) {
        effectiveFieldId = 'Empty';
    }

    const field = fieldOptionsMap.get(effectiveFieldId);

    if (!field && effectiveFieldId === 'Empty') {
        console.error("Critical error: 'Empty' field definition missing.");
        updateFieldTriggerDisplay('error_placeholder'); return;
    }
    if (!dom.fieldLayer || !dom.svgCanvas || !dom.drawingArea) {
        console.error("DOM elements missing for field background setting."); return;
    }

    const changed = currentFieldId !== effectiveFieldId;
    dom.fieldLayer.innerHTML = '';

    let intrinsicFieldBBox = null;
    let fieldRootElementSource = null;

    if (field && field.svgMarkup) {
        const tempParser = new DOMParser();
        let doc;
        const trimmedMarkup = field.svgMarkup.trim();

        if (trimmedMarkup.toLowerCase().startsWith('<svg')) {
            doc = tempParser.parseFromString(trimmedMarkup, "image/svg+xml");
            if (doc.documentElement.nodeName.toLowerCase() !== 'parsererror') {
                fieldRootElementSource = doc.documentElement;
                const firstG = fieldRootElementSource.querySelector('g');
                if (firstG && firstG.childNodes.length > 0) {
                    let useG = true;
                    for(let child of fieldRootElementSource.childNodes) {
                        if(child !== firstG && child.nodeName !== 'defs' && child instanceof SVGGraphicsElement){
                            useG = false; break;
                        }
                    }
                    if(useG) fieldRootElementSource = firstG;
                }
            }
        }
        if (!fieldRootElementSource) {
            const wrappedMarkup = `<svg xmlns="${SVG_NS}">${trimmedMarkup}</svg>`;
            doc = tempParser.parseFromString(wrappedMarkup, "image/svg+xml");
            if (doc.documentElement.nodeName.toLowerCase() !== 'parsererror') {
                fieldRootElementSource = doc.documentElement.firstElementChild;
            }
        }

        if (fieldRootElementSource && fieldRootElementSource instanceof SVGElement) {
            intrinsicFieldBBox = measureIntrinsicFieldBBox(fieldRootElementSource);
        }
    }

    if (!intrinsicFieldBBox || intrinsicFieldBBox.width <= 0 || intrinsicFieldBBox.height <= 0) {
        intrinsicFieldBBox = { left: 0, top: 0, width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
    }

    if (fieldRootElementSource && fieldRootElementSource instanceof SVGElement) {
        const fieldElementInDOM = fieldRootElementSource.cloneNode(true);
        if (fieldElementInDOM instanceof SVGElement) {
            fieldElementInDOM.dataset.fieldId = effectiveFieldId;
            dom.fieldLayer.appendChild(fieldElementInDOM);
        }
    }

    let targetViewBoxForSVG;
    let canvasPixelWidth, canvasPixelHeight;

    if (viewMode === 'fitFieldOnly') {
        targetViewBoxForSVG = {
            x: intrinsicFieldBBox.left - FIELD_DISPLAY_PADDING,
            y: intrinsicFieldBBox.top - FIELD_DISPLAY_PADDING,
            width: intrinsicFieldBBox.width + FIELD_DISPLAY_PADDING * 2,
            height: intrinsicFieldBBox.height + FIELD_DISPLAY_PADDING * 2,
        };
        canvasPixelWidth = targetViewBoxForSVG.width;
        canvasPixelHeight = targetViewBoxForSVG.height;

    } else if (viewMode === 'fitFieldAndContent') {
        const contentElements = Array.from(dom.contentLayer.children).filter(el => el.classList.contains('canvas-element'));
        const elementsToConsider = [...contentElements];
        elementsToConsider.push({
            getCTM: () => dom.svgCanvas.createSVGMatrix(),
            getBBox: () => ({ x: intrinsicFieldBBox.left, y: intrinsicFieldBBox.top, width: intrinsicFieldBBox.width, height: intrinsicFieldBBox.height })
        });
        const combinedBBox = getCombinedBBoxOfElements(elementsToConsider);

        if (combinedBBox && combinedBBox.width > 0 && combinedBBox.height > 0) {
            targetViewBoxForSVG = {
                x: combinedBBox.minX - FIELD_DISPLAY_PADDING,
                y: combinedBBox.minY - FIELD_DISPLAY_PADDING,
                width: combinedBBox.width + FIELD_DISPLAY_PADDING * 2,
                height: combinedBBox.height + FIELD_DISPLAY_PADDING * 2,
            };
            canvasPixelWidth = targetViewBoxForSVG.width;
            canvasPixelHeight = targetViewBoxForSVG.height;
        } else {
            targetViewBoxForSVG = {
                x: intrinsicFieldBBox.left - FIELD_DISPLAY_PADDING,
                y: intrinsicFieldBBox.top - FIELD_DISPLAY_PADDING,
                width: intrinsicFieldBBox.width + FIELD_DISPLAY_PADDING * 2,
                height: intrinsicFieldBBox.height + FIELD_DISPLAY_PADDING * 2
            };
            canvasPixelWidth = targetViewBoxForSVG.width;
            canvasPixelHeight = targetViewBoxForSVG.height;
        }
    } else { // 'fieldIntrinsic'
        targetViewBoxForSVG = { ...intrinsicFieldBBox };
        canvasPixelWidth = intrinsicFieldBBox.width;
        canvasPixelHeight = intrinsicFieldBBox.height;
    }

    if (canvasPixelWidth <= 0) canvasPixelWidth = DEFAULT_CANVAS_WIDTH;
    if (canvasPixelHeight <= 0) canvasPixelHeight = DEFAULT_CANVAS_HEIGHT;
    if (targetViewBoxForSVG.width <= 0) targetViewBoxForSVG.width = canvasPixelWidth;
    if (targetViewBoxForSVG.height <= 0) targetViewBoxForSVG.height = canvasPixelHeight;

    dom.svgCanvas.setAttribute('width', String(canvasPixelWidth.toFixed(3)));
    dom.svgCanvas.setAttribute('height', String(canvasPixelHeight.toFixed(3)));
    dom.svgCanvas.setAttribute('viewBox', `${targetViewBoxForSVG.x.toFixed(3)} ${targetViewBoxForSVG.y.toFixed(3)} ${targetViewBoxForSVG.width.toFixed(3)} ${targetViewBoxForSVG.height.toFixed(3)}`);

    appState.viewBox = { ...targetViewBoxForSVG };
    appState.initialViewBox = { ...targetViewBoxForSVG };

    currentFieldId = effectiveFieldId;
    updateFieldTriggerDisplay(effectiveFieldId);

    if (changed && shouldSaveState) {
        saveStateForUndo();
    }
}

// --- toggleDropdown function needs to be defined in this scope ---
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
// --- End toggleDropdown ---


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
            setFieldBackground(selectedFieldId, true, 'fitFieldOnly');
            initZoom();
            toggleDropdown(false); // This call was causing the error
            e.stopPropagation();
        });
        dom.fieldOptionsList.appendChild(li);
    });
    const initialFieldId = fieldOptionsMap.has(currentFieldId) ? currentFieldId : 'Empty';
    setFieldBackground(initialFieldId, false, 'fitFieldOnly');
    initZoom();
}

export function initCustomFieldSelector() {
    dom.customFieldSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown(); // This call was causing the error
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.fieldSelector?.contains(e.target)) {
            toggleDropdown(false); // This call was causing the error
        }
    });
    dom.customFieldSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); } // This call was causing the error
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); } // This call was causing the error
    });
}