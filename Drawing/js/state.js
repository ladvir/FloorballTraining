// js/state.js

/** Shared Application State */
export const appState = {
    currentTool: 'select',              // 'select', 'rotate', 'delete', 'draw'
    activeDrawingTool: null,            // e.g., 'team-a-LF' when currentTool is 'draw'
    selectedElements: new Set(),        // Holds references to selected SVG group elements
    isDraggingElement: false,           // True if dragging a canvas element
    isSelectingRect: false,             // True if drawing selection rectangle
    selectionRectStart: null,           // {x, y} start point for selection rect
    dragOffsetX: 0,                     // Offset from element origin to mouse down point
    dragOffsetY: 0,
    elementStartPos: { x: 0, y: 0 },    // Original {x, y} of element before drag starts
    currentlyHighlightedCollisions: new Set(), // Elements visually marked for collision
    currentDraggingItemInfo: null,      // Info about item being dragged from sidebar {type, width, height, svgContent, name}
    svgLibrary: [],                     // Loaded from localStorage in sidebarLibrary.js
    activities: []                      // Loaded from localStorage in sidebarActivities.js
};