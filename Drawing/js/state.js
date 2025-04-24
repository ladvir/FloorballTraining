//***** js/state.js ******

// js/state.js

/** Shared Application State */
export const appState = {
    currentTool: 'select',
    activeDrawingTool: null,
    selectedElements: new Set(),
    isDraggingElement: false,
    isSelectingRect: false,
    selectionRectStart: null,
    justFinishedMarquee: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    elementStartPos: { x: 0, y: 0 },
    currentlyHighlightedCollisions: new Set(),
    currentDraggingItemInfo: null,
    svgLibrary: [],
    activities: [],
    // --- Interaction State ---
    isDrawingArrow: false,
    arrowStartPoint: null,
    isDrawingFreehand: false,
    freehandPoints: [],
    isDrawingLine: false,
    lineStartPoint: null,
    isDrawingShape: false,             // True when drawing rect/circle/square (NEW)
    shapeStartPoint: null,             // {x, y} start point for shape draw (NEW)
    currentShapePreview: null,         // Reference to the preview SVG element (rect/circle) (NEW)
    isEditingText: false,
    currentTextElement: null,
    nextNumberToPlace: null,
    continuousNumberingActive: false,
    saveStateAfterDrag: false,
    isDraggingTitle: false,
    draggedTitleElement: null,
    draggedTitleParentElement: null,
    titleDragStartOffset: { x: 0, y: 0 },
    titleDragStartPoint: { x: 0, y: 0 },
    // --- Placement Drag State (NEW) ---
    isPlacementDragging: false,
    placementDraggedElement: null, // The element being placed/dragged
    placementDragStartPoint: null, // Mouse position when drag started
    placementElementOffset: { x: 0, y: 0 }, // Offset from mouse to element's center
    // --- Drawing Style State ---
    selectedColor: '#000000',
    // --- History State ---
    undoStack: [],
    redoStack: [],
    // --- View State ---
    viewBox: { x: 0, y: 0, width: 800, height: 600 },
};