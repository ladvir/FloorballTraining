// js/state.js

/** Shared Application State */
export const appState = {
    currentTool: 'select',              // 'select', 'rotate', 'delete', 'draw', 'text'
    activeDrawingTool: null,            // e.g., 'team-a-LF', 'ball', 'run-straight', 'number-1' when currentTool is 'draw'
    selectedElements: new Set(),        // Holds references to selected SVG group elements
    isDraggingElement: false,           // True if dragging a canvas element
    isSelectingRect: false,             // True if drawing selection rectangle
    selectionRectStart: null,           // {x, y} start point for selection rect
    dragOffsetX: 0,                     // Offset for element drag
    dragOffsetY: 0,
    elementStartPos: { x: 0, y: 0 },    // Original pos before drag
    currentlyHighlightedCollisions: new Set(), // Elements visually marked for collision
    currentDraggingItemInfo: null,      // Info about item being dragged from sidebar
    svgLibrary: [],                     // Loaded from localStorage
    activities: [],                     // Loaded from localStorage
    // --- New State Variables ---
    isDrawingArrow: false,              // True when drawing a straight arrow
    arrowStartPoint: null,              // {x, y} start point for straight arrow
    isDrawingFreehand: false,           // True when drawing freehand arrow
    freehandPoints: [],                 // Array of {x, y} points for freehand line
    isEditingText: false,               // True when text input is active
    currentTextElement: null,           // Reference to the temporary text element/input
    nextNumberToPlace: null,            // Next number for continuous placement (e.g., 1, 2, 3...)
};