//***** js/zoom.js ******
// js/zoom.js
import { dom } from './dom.js';
import { appState } from './state.js';
import { svgPoint } from './utils.js';

const ZOOM_FACTOR = 1.1;
const MIN_ZOOM_LEVEL_FACTOR = 0.1; // Factor relative to initialViewBox
const MAX_ZOOM_LEVEL_FACTOR = 10.0; // Factor relative to initialViewBox

// No module-scoped initialViewBox here anymore. We rely on appState.initialViewBox.

export function initZoom() {
    // Ensure appState.initialViewBox is set (should be by setFieldBackground or restoreState)
    if (!appState.initialViewBox || appState.initialViewBox.width <= 0 || appState.initialViewBox.height <= 0) {
        // Fallback: read from SVG attribute if appState is not properly initialized
        const viewBoxAttr = dom.svgCanvas.getAttribute('viewBox');
        if (viewBoxAttr) {
            const parts = viewBoxAttr.split(/[ ,]+/);
            if (parts.length === 4) {
                appState.initialViewBox = {
                    x: parseFloat(parts[0]), y: parseFloat(parts[1]),
                    width: parseFloat(parts[2]), height: parseFloat(parts[3]),
                };
            }
        }
        // If still not set, use defaults
        if (!appState.initialViewBox || appState.initialViewBox.width <= 0 || appState.initialViewBox.height <= 0) {
            appState.initialViewBox = { x: 0, y: 0, width: parseFloat(dom.svgCanvas.getAttribute('width') || '800'), height: parseFloat(dom.svgCanvas.getAttribute('height') || '600') };
        }
        // Ensure appState.viewBox matches this initial state if it's also uninit
        if (!appState.viewBox || appState.viewBox.width <= 0) {
            appState.viewBox = { ...appState.initialViewBox };
        }
        console.warn("Zoom initialized with fallback initialViewBox:", appState.initialViewBox);
    } else {
        // If appState.initialViewBox IS set, ensure appState.viewBox is also aligned if it's the first init for this view
        if (!appState.viewBox || appState.viewBox.width <= 0 ||
            (appState.viewBox.x !== appState.initialViewBox.x || appState.viewBox.y !== appState.initialViewBox.y ||
                appState.viewBox.width !== appState.initialViewBox.width || appState.viewBox.height !== appState.initialViewBox.height )) {
            // This condition might be too aggressive if we allow panned/zoomed state to be the initial.
            // The goal is that appState.initialViewBox is the source of truth for "100%".
            // And appState.viewBox is the current panned/zoomed view.
        }
    }
    // Ensure the SVG element reflects the current appState.viewBox
    applyViewBox();
    // console.log("Zoom initialized. InitialViewBox:", appState.initialViewBox, "CurrentViewBox:", appState.viewBox);
}

function applyViewBox() {
    if (!appState.viewBox || appState.viewBox.width <= 0 || appState.viewBox.height <= 0) {
        console.error("Cannot apply invalid viewBox from appState:", appState.viewBox);
        return;
    }
    const { x, y, width, height } = appState.viewBox;
    const viewBoxString = `${x.toFixed(3)} ${y.toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`;
    dom.svgCanvas.setAttribute('viewBox', viewBoxString);
}

export function handleWheelZoom(event) {
    event.preventDefault();

    if (!appState.viewBox || !appState.initialViewBox || appState.initialViewBox.width <=0 || appState.initialViewBox.height <=0) {
        console.error("ViewBox or initialViewBox state not properly initialized for zoom.");
        initZoom(); // Attempt to re-initialize
        if(!appState.initialViewBox || appState.initialViewBox.width <=0) return; // Still bad, exit
    }

    const currentVB = appState.viewBox;
    const baseVB = appState.initialViewBox; // Use appState.initialViewBox as the "100%" reference

    // Calculate current zoom level relative to the baseVB for limit checks
    const currentZoomFactorX = baseVB.width / currentVB.width;

    const deltaZoomFactor = event.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
    let newProposedWidth = currentVB.width / deltaZoomFactor; // If deltaZoomFactor > 1 (zoom in), newWidth is smaller

    // Prospective zoom level relative to baseVB
    let prospectiveOverallZoomFactor = baseVB.width / newProposedWidth;

    // Apply zoom limits based on factors
    if (prospectiveOverallZoomFactor < MIN_ZOOM_LEVEL_FACTOR) {
        newProposedWidth = baseVB.width / MIN_ZOOM_LEVEL_FACTOR;
        if (currentZoomFactorX <= MIN_ZOOM_LEVEL_FACTOR && deltaZoomFactor < 1) return; // Already at min, trying to zoom out
    } else if (prospectiveOverallZoomFactor > MAX_ZOOM_LEVEL_FACTOR) {
        newProposedWidth = baseVB.width / MAX_ZOOM_LEVEL_FACTOR;
        if (currentZoomFactorX >= MAX_ZOOM_LEVEL_FACTOR && deltaZoomFactor > 1) return; // Already at max, trying to zoom in
    }

    const newProposedHeight = newProposedWidth * (currentVB.height / currentVB.width); // Maintain aspect ratio of currentVB

    const mousePoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY);
    if (!mousePoint) return;

    const newX = mousePoint.x - (mousePoint.x - currentVB.x) * (newProposedWidth / currentVB.width);
    const newY = mousePoint.y - (mousePoint.y - currentVB.y) * (newProposedHeight / currentVB.height);

    appState.viewBox.x = newX;
    appState.viewBox.y = newY;
    appState.viewBox.width = newProposedWidth;
    appState.viewBox.height = newProposedHeight;

    applyViewBox();
}

export function resetZoom() {
    if (!appState.initialViewBox || appState.initialViewBox.width <= 0 || appState.initialViewBox.height <= 0) {
        console.warn("Cannot reset zoom, initialViewBox is not valid. Re-initializing zoom.");
        initZoom(); // Attempt to set a valid initialViewBox
        if (!appState.initialViewBox || appState.initialViewBox.width <= 0) { // Still not valid
            console.error("Reset zoom failed: initialViewBox remains invalid after re-init.");
            return;
        }
    }
    appState.viewBox = { ...appState.initialViewBox };
    applyViewBox();
    // console.log("Zoom reset to initialViewBox:", appState.viewBox);
}

export function getCurrentViewBox() {
    return { ...appState.viewBox };
}