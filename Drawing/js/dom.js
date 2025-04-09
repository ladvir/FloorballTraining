// js/dom.js

/** DOM Element References */
export const dom = {
    body: document.body,
    actionToolbar: document.getElementById("action-toolbar"),
    drawingToolbar: document.getElementById("drawing-toolbar"),
    // Player Selector Elements
    playerToolSelector: document.getElementById("player-tool-selector"),
    selectedPlayerIcon: document.getElementById("selected-player-icon"),
    playerSelect: document.getElementById("player-select"),
    // Action Toolbar Buttons
    selectToolButton: document.getElementById("select-tool"),
    rotateToolButton: document.getElementById("rotate-tool"),
    deleteToolButton: document.getElementById("delete-tool"),
    // File/Persistence Buttons
    saveButton: document.getElementById("save-button"),
    loadButton: document.getElementById("load-button"),
    exportSvgButton: document.getElementById("export-svg"),
    importSvgButton: document.getElementById("import-svg"),
    fileInput: document.getElementById("file-input"), // For canvas import
    libraryInput: document.getElementById("library-input"), // For adding to library
    addSvgBtn: document.getElementById("add-svg-btn"),
    // Sidebars
    activityList: document.getElementById("activity-list"),
    svgLibraryList: document.getElementById("svg-library"),
    // Canvas Area
    svgCanvas: document.getElementById("svg-canvas"),
    selectionRect: document.getElementById("selection-rectangle"),
    // Misc
    ghostPreview: document.getElementById("ghost-drag-preview")
};