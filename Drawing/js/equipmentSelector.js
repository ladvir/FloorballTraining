// js/equipmentSelector.js
import { dom } from './dom.js';
import { drawingTools, drawingToolMap, SVG_NS, BALL_RADIUS, GATE_WIDTH, GATE_HEIGHT, CONE_RADIUS, CONE_HEIGHT, BARRIER_STROKE_WIDTH, BARRIER_CORNER_RADIUS } from './config.js';
import { setActiveTool } from './tools.js';

let isDropdownOpen = false;

/** Helper function to generate the small SVG icon markup for equipment */
function generateEquipmentIconSvg(tool, width = 20, height = 20) {
    if (!tool || tool.category !== 'equipment') return '';

    const strokeWidth = 1.5;
    const halfW = width / 2;
    const halfH = height / 2;

    switch (tool.toolId) {
        case 'ball':
        case 'many-balls': // Represent 'many' as single ball in icon
            const ballR = Math.min(halfW, halfH) - strokeWidth;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><circle cx="${halfW}" cy="${halfH}" r="${ballR}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'gate':
            const gateW = width * 0.4;
            const gateH = height * 0.8;
            const gateX = (width - gateW) / 2;
            const gateY = (height - gateH) / 2;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${gateX}" y="${gateY}" width="${gateW}" height="${gateH}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'cone':
            const coneR = halfW * 0.8;
            const coneH = height * 0.7;
            const coneY = height - (height - coneH); // Top Y
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><polygon points="${halfW},${coneY} ${width - coneR/2},${height-strokeWidth} ${coneR/2},${height-strokeWidth}" fill="${tool.fill}" stroke="${tool.stroke}" stroke-width="${strokeWidth}"/></svg>`;
        case 'barrier-line':
            const lineY = halfH;
            const lineX1 = width * 0.1;
            const lineX2 = width * 0.9;
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><line x1="${lineX1}" y1="${lineY}" x2="${lineX2}" y2="${lineY}" stroke="${tool.stroke}" stroke-width="${width * 0.2}" stroke-linecap="round"/></svg>`;
        case 'barrier-corner':
            // Draw a 90-degree arc (top-right quadrant for simplicity)
            const cornerR = Math.min(halfW, halfH) * 1.8; // Make it fill the icon
            const cornerX = width - cornerR;
            const cornerY = height - cornerR;
            // Path: M startX startY A rx ry x-axis-rotation large-arc-flag sweep-flag endX endY
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="M ${width - strokeWidth/2} ${cornerY} A ${cornerR - strokeWidth/2} ${cornerR - strokeWidth/2} 0 0 0 ${cornerX} ${height - strokeWidth/2}" fill="none" stroke="${tool.stroke}" stroke-width="${width * 0.15}" stroke-linecap="round"/></svg>`;
        default:
            // Default simple square icon
            return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect x="${strokeWidth}" y="${strokeWidth}" width="${width - strokeWidth*2}" height="${height - strokeWidth*2}" fill="lightgrey" stroke="black" stroke-width="${strokeWidth}"/></svg>`;
    }
}

/** Updates the content of the equipment trigger button */
export function updateEquipmentTriggerDisplay(toolId) {
    const tool = drawingToolMap.get(toolId);
    if (dom.customEquipmentSelectTrigger) {
        if (tool && tool.category === 'equipment') {
            const iconSvg = generateEquipmentIconSvg(tool);
            dom.customEquipmentSelectTrigger.innerHTML = `
                <span class="equipment-option-icon">${iconSvg}</span>
                <span>${tool.label}</span>
            `;
            dom.customEquipmentSelectTrigger.dataset.value = toolId;
        } else {
            // Reset if no tool or wrong category
            dom.customEquipmentSelectTrigger.innerHTML = `<span>Select Equipment...</span>`;
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
    if (!dom.equipmentOptionsList) {
        console.error("Custom equipment options list not found!");
        return;
    }
    dom.equipmentOptionsList.innerHTML = ''; // Clear existing options

    drawingTools.forEach(tool => {
        if (tool.category !== 'equipment') return; // Only show equipment

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = tool.toolId;

        const iconSvg = generateEquipmentIconSvg(tool);
        li.innerHTML = `
            <span class="equipment-option-icon">${iconSvg}</span>
            <span>${tool.label}</span>
        `;

        li.addEventListener('click', (e) => {
            const selectedToolId = e.currentTarget.dataset.value;
            if (selectedToolId) {
                updateEquipmentTriggerDisplay(selectedToolId); // Update the button appearance
                setActiveTool(selectedToolId);       // Set the tool in the app state
                toggleDropdown(false);               // Close the dropdown
            }
            e.stopPropagation(); // Prevent body click listener from firing
        });

        dom.equipmentOptionsList.appendChild(li);
    });

    // Set initial trigger display (empty)
    updateEquipmentTriggerDisplay(null);
}

/** Initializes event listeners for the custom equipment dropdown */
export function initCustomEquipmentSelector() {
    // Listener for the trigger button
    dom.customEquipmentSelectTrigger?.addEventListener('click', (e) => {
        toggleDropdown();
        e.stopPropagation(); // Prevent body click listener from firing
    });

    // Listener to close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dom.equipmentToolSelector?.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Optional: Add keyboard support (basic example)
    dom.customEquipmentSelectTrigger?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
        } else if (e.key === 'Escape' && isDropdownOpen) {
            toggleDropdown(false);
        }
    });
}