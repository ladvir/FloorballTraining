// js/equipmentSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, BALL_RADIUS, GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH, BARRIER_CORNER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;
const LI_ICON_WIDTH = 40;
const LI_ICON_HEIGHT = 40;

/** Helper function to generate the SVG icon markup for equipment */
function generateEquipmentIconSvg(tool, width = LI_ICON_WIDTH, height = LI_ICON_HEIGHT) {
    if (!tool || tool.category !== 'equipment') return '';
    const strokeWidth = 1.5;
    const halfW = width / 2; const halfH = height / 2;
    const ballR = (Math.min(halfW, halfH) - strokeWidth)/2;
    switch (tool.toolId) {
        case 'ball':
            
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><circle cx="${halfW}" cy="${halfH}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;

        case 'many-balls':

            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
                <circle cx="${halfW-5}" cy="${halfH-2}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/>
                <circle cx="${halfW+2}" cy="${halfH+2}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/>
                <circle cx="${halfW+5}" cy="${halfH-5}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/>
                <circle cx="${halfW}" cy="${halfH}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/>
                
                </svg>`;


        case 'gate':
            const gateW = width * 0.4;
            const gateH = height * 0.8;
            const gateX = (width - gateW) / 2;
            const gateY = (height - gateH) / 2;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${gateX}" y="${gateY}" width="${gateW}" height="${gateH}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'cone':
            const coneBaseW = width * 0.6;
            const coneH = height * 0.7;
            const coneTipX = halfW;
            const coneY = height * 0.15;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><polygon points="${coneTipX},${coneY} ${width - (width - coneBaseW) / 2},${height - strokeWidth * 2} ${(width - coneBaseW) / 2},${height - strokeWidth * 2}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'barrier-line':
            const lineY = halfH;
            const lineX1 = width * 0.1;
            const lineX2 = width * 0.9;
            const lineStroke = Math.max(2, width * 0.15);
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><line x1="${lineX1}" y1="${lineY}" x2="${lineX2}" y2="${lineY}" stroke="${tool.stroke}" stroke-width="${lineStroke}" stroke-linecap="round"/></svg>`;
        case 'barrier-corner':
            const cornerR = Math.min(halfW, halfH) * 1.8;
            const cornerStroke = Math.max(2, width * 0.15);
            const cornerOffsetX = width - cornerR + cornerStroke / 2;
            const cornerOffsetY = height - cornerR + cornerStroke / 2;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="M ${width - cornerStroke / 2} ${cornerOffsetY} A ${cornerR - cornerStroke} ${cornerR - cornerStroke} 0 0 0 ${cornerOffsetX} ${height - cornerStroke / 2}" fill="none" stroke="${tool.stroke}" stroke-width="${cornerStroke}" stroke-linecap="round"/></svg>`;
        default:
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${strokeWidth}" y="${strokeWidth}" width="${width - strokeWidth * 2}" height="${height - strokeWidth * 2}" fill="lightgrey" stroke="black" stroke-width="${strokeWidth}"/></svg>`;
    }
}

/** Updates the content of the equipment trigger button AND description */
export function updateEquipmentTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    const triggerButton = dom.customEquipmentSelectTrigger;
    const descriptionSpan = dom.equipmentDescription;

    if (triggerButton && descriptionSpan) {
        if (tool && tool.category === 'equipment') {
            const iconSvg = generateEquipmentIconSvg(tool, ICON_WIDTH, ICON_HEIGHT);
            triggerButton.innerHTML = `<span class="equipment-option-icon">${iconSvg}</span>`;
            triggerButton.title = tool.label;
            triggerButton.dataset.value = toolId;
            descriptionSpan.textContent = tool.label;
            descriptionSpan.title = tool.label;
        } else {
            const firstEquipTool = drawingTools.find(t => t.category === 'equipment');
            if (firstEquipTool) {
                const iconSvg = generateEquipmentIconSvg(firstEquipTool, ICON_WIDTH, ICON_HEIGHT);
                triggerButton.innerHTML = `<span class="equipment-option-icon">${iconSvg}</span>`;
                triggerButton.title = firstEquipTool.label;
                triggerButton.dataset.value = firstEquipTool.toolId;
                descriptionSpan.textContent = firstEquipTool.label;
                descriptionSpan.title = firstEquipTool.label;
            } else {
                triggerButton.innerHTML = `<span class="equipment-option-icon">?</span>`;
                triggerButton.title = 'Select Equipment Tool';
                triggerButton.dataset.value = '';
                descriptionSpan.textContent = 'N/A';
                descriptionSpan.title = '';
            }
        }
    }
}

/** Toggles the visibility of the custom equipment dropdown options */
function toggleDropdown(forceOpen = null) {
    if (!dom.customEquipmentSelectOptions || !dom.customEquipmentSelectTrigger) return;
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isDropdownOpen;
    if (shouldBeOpen === isDropdownOpen) return;

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
    let firstEquipToolId = null;

    drawingTools.forEach(tool => {
        if (tool.category !== 'equipment') return;
        if (firstEquipToolId === null) firstEquipToolId = tool.toolId;

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;
        li.title = tool.label;
        const iconSvg = generateEquipmentIconSvg(tool, LI_ICON_WIDTH, LI_ICON_HEIGHT);
        li.innerHTML = `
            <span class="equipment-option-icon">${iconSvg}</span>
            <span class="option-label">${tool.label}</span>`;
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
    updateEquipmentTriggerDisplay(firstEquipToolId);
}

/** Initializes event listeners for the custom equipment dropdown */
export function initCustomEquipmentSelector() {
    // Use click listener on trigger
    dom.customEquipmentSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation();
    });

    // Outside click listener
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.equipmentToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Keydown listener
    dom.customEquipmentSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
        else if (e.key === 'Escape' && isDropdownOpen) { toggleDropdown(false); }
    });
}