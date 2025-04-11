// js/equipmentSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, BALL_RADIUS, GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH, BARRIER_CORNER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 30; // Define icon size
const ICON_HEIGHT = 30;

/** Helper function to generate the small SVG icon markup for equipment */
function generateEquipmentIconSvg(tool, width = ICON_WIDTH, height = ICON_HEIGHT) {
    if (!tool || tool.category !== 'equipment') return '';

    const strokeWidth = 1.5; // Keep stroke relative thin for icon
    const halfW = width / 2;
    const halfH = height / 2;

    // Scale internal features based on the new icon size
    switch (tool.toolId) {
        case 'ball':
        case 'many-balls':
            const ballR = Math.min(halfW, halfH) - strokeWidth;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><circle cx="${halfW}" cy="${halfH}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'gate':
            const gateW = width * 0.4;
            const gateH = height * 0.8;
            const gateX = (width - gateW) / 2;
            const gateY = (height - gateH) / 2;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${gateX}" y="${gateY}" width="${gateW}" height="${gateH}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'cone':
            const coneBaseW = width * 0.6; // Adjust base width
            const coneH = height * 0.7;
            const coneTipX = halfW;
            const coneY = height * 0.15; // Start slightly lower
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><polygon points="${coneTipX},${coneY} ${width - (width-coneBaseW)/2},${height-strokeWidth*2} ${(width-coneBaseW)/2},${height-strokeWidth*2}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'barrier-line':
            const lineY = halfH;
            const lineX1 = width * 0.1;
            const lineX2 = width * 0.9;
            const lineStroke = Math.max(2, width * 0.15); // Thicker line for icon
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><line x1="${lineX1}" y1="${lineY}" x2="${lineX2}" y2="${lineY}" stroke="${tool.stroke}" stroke-width="${lineStroke}" stroke-linecap="round"/></svg>`;
        case 'barrier-corner':
            const cornerR = Math.min(halfW, halfH) * 1.8;
            const cornerStroke = Math.max(2, width * 0.15);
            const cornerOffsetX = width - cornerR + cornerStroke / 2;
            const cornerOffsetY = height - cornerR + cornerStroke / 2;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="M ${width - cornerStroke/2} ${cornerOffsetY} A ${cornerR - cornerStroke} ${cornerR - cornerStroke} 0 0 0 ${cornerOffsetX} ${height - cornerStroke/2}" fill="none" stroke="${tool.stroke}" stroke-width="${cornerStroke}" stroke-linecap="round"/></svg>`;
        default:
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${strokeWidth}" y="${strokeWidth}" width="${width - strokeWidth*2}" height="${height - strokeWidth*2}" fill="lightgrey" stroke="black" stroke-width="${strokeWidth}"/></svg>`;
    }
}

/** Updates the content of the equipment trigger button */
export function updateEquipmentTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customEquipmentSelectTrigger) {
        if (tool && tool.category === 'equipment') {
            const iconSvg = generateEquipmentIconSvg(tool);
            // Set innerHTML to only the icon span
            dom.customEquipmentSelectTrigger.innerHTML = `<span class="equipment-option-icon">${iconSvg}</span>`;
            // Set the title attribute for tooltip
            dom.customEquipmentSelectTrigger.title = tool.label;
            dom.customEquipmentSelectTrigger.dataset.value = toolId;
        } else {
            // Reset with a placeholder
            dom.customEquipmentSelectTrigger.innerHTML = `<span class="equipment-option-icon"></span>`; // Placeholder
            dom.customEquipmentSelectTrigger.title = 'Select Equipment Tool';
            dom.customEquipmentSelectTrigger.dataset.value = '';
        }
    }
}

/** Toggles the visibility of the custom equipment dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customEquipmentSelectOptions || !dom.customEquipmentSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen) {
        dom.customEquipmentSelectOptions.classList.add('open');
        dom.customEquipmentSelectTrigger.setAttribute('aria-expanded', 'true');
        isDropdownOpen = true;
    } else {
        dom.customEquipmentSelectOptions.classList.remove('open');
        dom.customEquipmentSelectTrigger.setAttribute('aria-expanded', 'false');
        isDropdownOpen = false;
    }
}

/** Populates the custom equipment select dropdown list (ul) */
export function populateCustomEquipmentSelector() {
    if (!dom.equipmentOptionsList) return;
    dom.equipmentOptionsList.innerHTML = '';
    drawingTools.forEach(tool => {
        if (tool.category !== 'equipment') return;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        // Set title for tooltip
        li.title = tool.label;
        const iconSvg = generateEquipmentIconSvg(tool);
        // Set innerHTML to only the icon span
        li.innerHTML = `<span class="equipment-option-icon">${iconSvg}</span>`;
        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updateEquipmentTriggerDisplay(selectedToolId);
                setActiveTool(selectedToolId);
                toggleDropdown(false);
            }
            e.stopPropagation();
        });
        dom.equipmentOptionsList.appendChild(li);
    });
    updateEquipmentTriggerDisplay(null); // Initial state
}

/** Initializes event listeners for the custom equipment dropdown */
export function initCustomEquipmentSelector() {
    dom.customEquipmentSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.equipmentToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });
    dom.customEquipmentSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}