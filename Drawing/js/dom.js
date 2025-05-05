// js/dom.js

/** DOM Element References */
export const dom = {
    body: document.body,
    actionToolbar: document.getElementById("action-toolbar"),
    drawingToolbar: document.getElementById("drawing-toolbar"),
    // Field Selector Elements
    fieldSelector: document.getElementById("field-selector"),
    customFieldSelectTrigger: document.getElementById("custom-field-select-trigger"),
    customFieldSelectOptions: document.getElementById("custom-field-select-options"),
    fieldOptionsList: document.getElementById("field-options-list"),
    fieldDescription: document.getElementById("field-description"),
    // Player Selector Elements
    playerToolSelector: document.getElementById("player-tool-selector"),
    customPlayerSelectTrigger: document.getElementById("custom-player-select-trigger"),
    customPlayerSelectOptions: document.getElementById("custom-player-select-options"),
    playerOptionsList: document.getElementById("player-options-list"),
    playerDescription: document.getElementById("player-description"),
    // Equipment Selector Elements
    equipmentToolSelector: document.getElementById("equipment-tool-selector"),
    customEquipmentSelectTrigger: document.getElementById("custom-equipment-select-trigger"),
    customEquipmentSelectOptions: document.getElementById("custom-equipment-select-options"),
    equipmentOptionsList: document.getElementById("equipment-options-list"),
    equipmentDescription: document.getElementById("equipment-description"),
    // Movement Selector Elements
    movementToolSelector: document.getElementById("movement-tool-selector"),
    customMovementSelectTrigger: document.getElementById("custom-movement-select-trigger"),
    customMovementSelectOptions: document.getElementById("custom-movement-select-options"),
    movementOptionsList: document.getElementById("movement-options-list"),
    movementDescription: document.getElementById("movement-description"),
    // Pass/Shot Selector Elements
    passShotToolSelector: document.getElementById("passShot-tool-selector"),
    customPassShotSelectTrigger: document.getElementById("custom-passShot-select-trigger"),
    customPassShotSelectOptions: document.getElementById("custom-passShot-select-options"),
    passShotOptionsList: document.getElementById("passShot-options-list"),
    passShotDescription: document.getElementById("passShot-description"),
    // Shape Selector Elements
    shapeToolSelector: document.getElementById("shape-tool-selector"),
    customShapeSelectTrigger: document.getElementById("custom-shape-select-trigger"),
    customShapeSelectOptions: document.getElementById("custom-shape-select-options"),
    shapeOptionsList: document.getElementById("shape-options-list"),
    shapeDescription: document.getElementById("shape-description"),
    // --- REMOVED Number Selector Elements ---
    // Number Button Elements (NEW)
    numberToolGroup: document.getElementById("number-tool-group"),
    numberToolButton: document.getElementById("number-tool-button"),
    numberDescription: document.getElementById("number-description"),
    resetNumberButton: document.getElementById("reset-number-button"), // New Reset Button
    // Text Tool Elements
    textToolGroup: document.getElementById("text-tool-group"),
    textToolButton: document.getElementById("text-tool-button"),
    textDescription: document.getElementById("text-description"),
    textInputContainer: document.getElementById("text-input-container"),
    textInputField: document.getElementById("text-input-field"),
    // Color Picker
    colorPicker: document.getElementById("color-picker"),
    colorDescription: document.getElementById("color-description"),
    // Action Toolbar Buttons
    newButton: document.getElementById("new-button"), // Added New button reference
    selectToolButton: document.getElementById("select-tool"),
    rotateToolButton: document.getElementById("rotate-tool"),
    deleteToolButton: document.getElementById("delete-tool"),
    undoButton: document.getElementById("undo-button"),
    redoButton: document.getElementById("redo-button"),
    // File/Persistence Buttons
    saveButton: document.getElementById("save-button"),
    loadButton: document.getElementById("load-button"),
    exportSvgButton: document.getElementById("export-svg"),
    importSvgButton: document.getElementById("import-svg"),
    fileInput: document.getElementById("file-input"),
    libraryInput: document.getElementById("library-input"),
    addSvgBtn: document.getElementById("add-svg-btn"),
    // Sidebars
    activityList: document.getElementById("activity-list"),
    svgLibraryList: document.getElementById("svg-library"),
    // Canvas Area
    svgCanvas: document.getElementById("svg-canvas"),
    fieldLayer: document.getElementById("field-layer"),
    contentLayer: document.getElementById("content-layer"),
    selectionRect: document.getElementById("selection-rectangle"),
    tempArrowPreview: document.getElementById("temp-arrow-preview"),
    tempArrowPreview2: document.getElementById("temp-arrow-preview-2"),
    tempFreehandPreview: document.getElementById("temp-freehand-preview"),
    tempLinePreview: document.getElementById("temp-line-preview"),
    tempRectPreview: document.getElementById("temp-rect-preview"),
    tempCirclePreview: document.getElementById("temp-circle-preview"),
    tempTrianglePreview: document.getElementById("temp-triangle-preview"), // Added ref
    // Misc
    ghostPreview: document.getElementById("ghost-drag-preview")
};
