//***** js/colorSelector.js ******

import { dom } from './dom.js';
import { appState } from './state.js';
import { DEFAULT_DRAW_COLOR } from './config.js';
import { updateShapeSelectorIcons } from './shapeSelector.js'; // To update icons
import { updateLineSelectorIcons } from './lineSelector.js';   // To update icons

/** Initializes the color picker */
export function initColorSelector() {
    const colorPicker = dom.colorPickerInput;
    const colorLabel = dom.colorPickerLabel;

    if (!colorPicker) {
        console.error("Color picker input not found!");
        return;
    }

    // Set initial value from state or default
    colorPicker.value = appState.currentDrawingColor || DEFAULT_DRAW_COLOR;

    // Update state and potentially other UI elements on color change
    colorPicker.addEventListener('input', (event) => {
        const newColor = event.target.value;
        appState.currentDrawingColor = newColor;
        // console.log("Color changed to:", newColor);

        // Update selector icons that depend on the color
        updateShapeSelectorIcons();
        updateLineSelectorIcons();
        // Optionally, update the color picker's background/border for feedback
        // colorPicker.style.borderColor = newColor;
    });

    // Set initial label/title if label element exists
    if (colorLabel) {
        colorLabel.textContent = 'Color';
        colorLabel.title = 'Select Draw Color';
    }
}