//***** js\zoom.js ******




// js/zoom.js
import { dom } from './dom.js';
import { appState } from './state.js';
import { svgPoint } from './utils.js';

const ZOOM_FACTOR = 1.1; // How much to zoom in/out per step (e.g., 1.1 = 10%)
const MIN_ZOOM_LEVEL = 0.1; // Minimum zoom (e.g., 10% of original size)
const MAX_ZOOM_LEVEL = 10.0; // Maximum zoom (e.g., 1000% of original size)

let initialViewBox = { x: 0, y: 0, width: 800, height: 600 }; // Store initial dimensions

/**
 * Initializes the zoom state from the SVG's current viewBox.
 * This should be called whenever the viewBox might have changed (e.g., field change, import).
 */
export function initZoom() {
    const viewBoxAttr = dom.svgCanvas.getAttribute('viewBox');
    if (viewBoxAttr) {
        const parts = viewBoxAttr.split(/[ ,]+/); // Split by space or comma
        if (parts.length === 4) {
            // Update appState.viewBox to the current canvas viewBox
            appState.viewBox = {
                x: parseFloat(parts[0]),
                y: parseFloat(parts[1]),
                width: parseFloat(parts[2]),
                height: parseFloat(parts[3]),
            };
            // Store the *current* viewBox dimensions as the new "initial" for zoom limits
            initialViewBox = { ...appState.viewBox };
            console.log("Zoom initialized/reset with viewBox:", appState.viewBox);
            return;
        }
    }
    // Fallback if viewBox is missing or invalid on the element
    const width = parseFloat(dom.svgCanvas.getAttribute('width') || '800');
    const height = parseFloat(dom.svgCanvas.getAttribute('height') || '600');
    appState.viewBox = { x: 0, y: 0, width: width, height: height };
    initialViewBox = { ...appState.viewBox };
    // Ensure the attribute is set if it was missing
    applyViewBox();
    console.warn("Zoom initialized/reset with default/fallback viewBox:", appState.viewBox);
}

/**
 * Applies the current viewBox state to the SVG element.
 */
function applyViewBox() {
    if (!appState.viewBox) return;
    const { x, y, width, height } = appState.viewBox;
    // Format with spaces, ensure numbers are not excessively precise
    const viewBoxString = `${x.toFixed(3)} ${y.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
    dom.svgCanvas.setAttribute('viewBox', viewBoxString);
}

/**
 * Handles the mouse wheel event for zooming.
 * Zooms towards/away from the cursor position.
 */
export function handleWheelZoom(event) {
    event.preventDefault(); // Prevent page scroll

    if (!appState.viewBox) {
        console.error("ViewBox state not initialized.");
        return;
    }

    const currentVB = appState.viewBox;
    // Calculate current zoom level relative to the *initial* viewBox for limits
    const currentZoomLevelX = initialViewBox.width / currentVB.width;
    const currentZoomLevelY = initialViewBox.height / currentVB.height;
    // Use the smaller dimension's zoom level for limit checks, or a combined measure
    const currentZoomLevel = Math.min(currentZoomLevelX, currentZoomLevelY);


    // Determine zoom direction and calculate new scale factor
    const delta = event.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR; // Negative deltaY = zoom in

    let newWidth = currentVB.width * delta;
    let newHeight = currentVB.height * delta;

    // Calculate prospective new zoom level relative to the *initial* viewBox
    const prospectiveZoomLevel = initialViewBox.width / newWidth; // Using width for consistency

    // Apply zoom limits
    if (prospectiveZoomLevel < MIN_ZOOM_LEVEL) {
        newWidth = initialViewBox.width / MIN_ZOOM_LEVEL;
        newHeight = initialViewBox.height / MIN_ZOOM_LEVEL;
        // If we are already at or below the min zoom level, and the user is trying to zoom out, stop.
        if (currentZoomLevel <= MIN_ZOOM_LEVEL && delta < 1) return;
    } else if (prospectiveZoomLevel > MAX_ZOOM_LEVEL) {
        newWidth = initialViewBox.width / MAX_ZOOM_LEVEL;
        newHeight = initialViewBox.height / MAX_ZOOM_LEVEL;
        // If we are already at or above the max zoom level, and the user is trying to zoom in, stop.
        if (currentZoomLevel >= MAX_ZOOM_LEVEL && delta > 1) return;
    }


    // Get mouse position in SVG coordinates *before* applying the new zoom
    const mousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!mousePoint) return; // Couldn't get point

    // Calculate how much the viewBox origin needs to shift
    // The mouse point should stay in the same relative position within the new viewBox
    const newX = mousePoint.x - (mousePoint.x - currentVB.x) * (newWidth / currentVB.width);
    const newY = mousePoint.y - (mousePoint.y - currentVB.y) * (newHeight / currentVB.height);

    // Update the state
    appState.viewBox.x = newX;
    appState.viewBox.y = newY;
    appState.viewBox.width = newWidth;
    appState.viewBox.height = newHeight;

    // Apply the changes to the SVG
    applyViewBox();
}

/**
 * Resets the zoom and pan to the initial state (which is the current field's default viewBox).
 */
export function resetZoom() {
    // Reset to the initialViewBox captured when the field was set
    appState.viewBox = { ...initialViewBox };
    applyViewBox();
    console.log("Zoom reset to initial field view:", appState.viewBox);
}

/**
 * Gets the current viewBox state.
 */
export function getCurrentViewBox() {
    return { ...appState.viewBox };
}