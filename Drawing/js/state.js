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
    isDrawingShape: false,
    shapeStartPoint: null,
    currentShapePreview: null,
    isEditingText: false, // Will be true when editing *any* text (text tool or number)
    currentEditingElement: null, // Reference to the element being edited (text or number)
    nextNumberToPlace: 1, // Start sequence at 1 by default
    saveStateAfterDrag: false,
    isDraggingTitle: false,
    draggedTitleElement: null,
    draggedTitleParentElement: null,
    titleDragStartOffset: { x: 0, y: 0 },
    titleDragStartPoint: { x: 0, y: 0 },
    // --- Placement Drag State (NEW) ---
    isPlacementDragging: false,
    placementDraggedElement: null,
    placementDragStartPoint: null,
    placementElementOffset: { x: 0, y: 0 },
    // --- Resize State (NEW) ---
    isResizingElement: false,
    resizeHandle: null,
    resizeElement: null,
    resizeStartPoint: null,
    initialSize: null,
    initialTranslate: null,
    resizeElementCTM: null,
    resizeElementInverseCTM: null,
    minWidth: null,
    minHeight: null,
    maxWidth: null,
    maxHeight: null,
    // --- Drawing Style State ---
    selectedColor: '#000000',
    // --- History State ---
    undoStack: [],
    redoStack: [],
    isDrawingModified: false,
    // --- View State ---
    viewBox: { x: 0, y: 0, width: 800, height: 600 },
    initialViewBox: { x: 0, y: 0, width: 800, height: 600 },
};