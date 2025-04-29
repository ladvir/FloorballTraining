//***** js\state.js ******
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
    saveStateAfterDrag: false, // This flag seems unused? Interactions save directly now. Can potentially remove.
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
    // --- Resize State (NEW) ---
    isResizingElement: false,
    resizeHandle: null, // The handle being dragged
    resizeElement: null, // The element being resized
    resizeStartPoint: null, // Mouse position at the start of resize
    initialSize: null, // {x, y, width, height} of the element's bgRect relative to group at start of resize
    initialTranslate: null, // {x, y} of the element's group translate at start of resize
    resizeElementCTM: null, // CTM of the element at the start of resize
    resizeElementInverseCTM: null, // Inverse CTM of the element at the start of resize
    minWidth: null, // Min width constraint for the current element
    minHeight: null, // Min height constraint for the current element
    maxWidth: null, // Max width constraint for the current element
    maxHeight: null, // Max height constraint for the current element
    // --- Drawing Style State ---
    selectedColor: '#000000',
    // --- History State ---
    undoStack: [],
    redoStack: [],
    isDrawingModified: false, // Added flag to track unsaved changes
    // --- View State ---
    // Default viewBox - will be overwritten by initial field setting
    viewBox: { x: 0, y: 0, width: 800, height: 600 },
    // Store the initial/current field's viewBox for resetZoom
    initialViewBox: { x: 0, y: 0, width: 800, height: 600 },
};