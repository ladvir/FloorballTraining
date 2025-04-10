// js/dom.js

/** DOM Element References */
export const dom = {
    body: document.body,
    actionToolbar: document.getElementById("action-toolbar"),
    drawingToolbar: document.getElementById("drawing-toolbar"),
    // Player Selector Elements
    playerToolSelector: document.getElementById("player-tool-selector"),
    customPlayerSelectTrigger: document.getElementById("custom-player-select-trigger"),
    customPlayerSelectOptions: document.getElementById("custom-player-select-options"),
    playerOptionsList: document.getElementById("player-options-list"),
    // Equipment Selector Elements
    equipmentToolSelector: document.getElementById("equipment-tool-selector"),
    customEquipmentSelectTrigger: document.getElementById("custom-equipment-select-trigger"),
    customEquipmentSelectOptions: document.getElementById("custom-equipment-select-options"),
    equipmentOptionsList: document.getElementById("equipment-options-list"),
    // Movement Selector Elements
    movementToolSelector: document.getElementById("movement-tool-selector"),
    customMovementSelectTrigger: document.getElementById("custom-movement-select-trigger"),
    customMovementSelectOptions: document.getElementById("custom-movement-select-options"),
    movementOptionsList: document.getElementById("movement-options-list"),
    // Pass/Shot Selector Elements
    passShotToolSelector: document.getElementById("passShot-tool-selector"),
    customPassShotSelectTrigger: document.getElementById("custom-passShot-select-trigger"),
    customPassShotSelectOptions: document.getElementById("custom-passShot-select-options"),
    passShotOptionsList: document.getElementById("passShot-options-list"),
    // Number Selector Elements
    numberToolSelector: document.getElementById("number-tool-selector"),
    customNumberSelectTrigger: document.getElementById("custom-number-select-trigger"),
    customNumberSelectOptions: document.getElementById("custom-number-select-options"),
    numberOptionsList: document.getElementById("number-options-list"),
    // Text Tool Elements
    textToolButton: document.getElementById("text-tool-button"),
    textInputContainer: document.getElementById("text-input-container"),
    textInputField: document.getElementById("text-input-field"),
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
    tempArrowPreview: document.getElementById("temp-arrow-preview"), // For arrow drawing
    // Misc
    ghostPreview: document.getElementById("ghost-drag-preview")
};