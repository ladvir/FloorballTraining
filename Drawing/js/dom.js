//***** js/dom.js ******
// Export an empty object initially
export const dom = {};

// Function to populate the dom object after DOM is loaded
export function initDom() {
    dom.body = document.body;
    dom.actionToolbar = document.getElementById("action-toolbar");
    dom.drawingToolbar = document.getElementById("drawing-toolbar");
    // Text Properties Toolbar Elements (NEW)
    dom.textPropertiesToolbar = document.getElementById("text-properties-toolbar");
    dom.fontFamilySelect = document.getElementById("font-family-select");
    dom.fontSizeInput = document.getElementById("font-size-input");
    dom.fontBoldButton = document.getElementById("font-bold-button");
    dom.fontItalicButton = document.getElementById("font-italic-button");
    // Field Selector Elements
    dom.fieldSelector = document.getElementById("field-selector");
    dom.customFieldSelectTrigger = document.getElementById("custom-field-select-trigger");
    dom.customFieldSelectOptions = document.getElementById("custom-field-select-options");
    dom.fieldOptionsList = document.getElementById("field-options-list");
    dom.fieldDescription = document.getElementById("field-description");

    // Team A Player Selector Elements
    dom.teamAPlayerSelector = document.getElementById("team-a-player-selector");
    dom.customTeamAPlayerSelectTrigger = document.getElementById("custom-team-a-player-select-trigger");
    dom.customTeamAPlayerSelectOptions = document.getElementById("custom-team-a-player-select-options");
    dom.teamAPlayerOptionsList = document.getElementById("team-a-player-options-list");
    dom.teamAPlayerDescription = document.getElementById("team-a-player-description");

    // Team B Player Selector Elements
    dom.teamBPlayerSelector = document.getElementById("team-b-player-selector");
    dom.customTeamBPlayerSelectTrigger = document.getElementById("custom-team-b-player-select-trigger");
    dom.customTeamBPlayerSelectOptions = document.getElementById("custom-team-b-player-select-options");
    dom.teamBPlayerOptionsList = document.getElementById("team-b-player-options-list");
    dom.teamBPlayerDescription = document.getElementById("team-b-player-description");

    // Other Player Selector Elements
    dom.otherPlayerSelector = document.getElementById("other-player-selector");
    dom.customOtherPlayerSelectTrigger = document.getElementById("custom-other-player-select-trigger");
    dom.customOtherPlayerSelectOptions = document.getElementById("custom-other-player-select-options");
    dom.otherPlayerOptionsList = document.getElementById("other-player-options-list");
    dom.otherPlayerDescription = document.getElementById("other-player-description");

    // Equipment Selector Elements
    dom.equipmentToolSelector = document.getElementById("equipment-tool-selector");
    dom.customEquipmentSelectTrigger = document.getElementById("custom-equipment-select-trigger");
    dom.customEquipmentSelectOptions = document.getElementById("custom-equipment-select-options");
    dom.equipmentOptionsList = document.getElementById("equipment-options-list");
    dom.equipmentDescription = document.getElementById("equipment-description");
    // Movement Selector Elements
    dom.movementToolSelector = document.getElementById("movement-tool-selector");
    dom.customMovementSelectTrigger = document.getElementById("custom-movement-select-trigger");
    dom.customMovementSelectOptions = document.getElementById("custom-movement-select-options");
    dom.movementOptionsList = document.getElementById("movement-options-list");
    dom.movementDescription = document.getElementById("movement-description");
    // Pass/Shot Selector Elements
    dom.passShotToolSelector = document.getElementById("passShot-tool-selector");
    dom.customPassShotSelectTrigger = document.getElementById("custom-passShot-select-trigger");
    dom.customPassShotSelectOptions = document.getElementById("custom-passShot-select-options");
    dom.passShotOptionsList = document.getElementById("passShot-options-list");
    dom.passShotDescription = document.getElementById("passShot-description");
    // Shape Selector Elements
    dom.shapeToolSelector = document.getElementById("shape-tool-selector");
    dom.customShapeSelectTrigger = document.getElementById("custom-shape-select-trigger");
    dom.customShapeSelectOptions = document.getElementById("custom-shape-select-options");
    dom.shapeOptionsList = document.getElementById("shape-options-list");
    dom.shapeDescription = document.getElementById("shape-description");
    // Number Button Elements
    dom.numberToolGroup = document.getElementById("number-tool-group");
    dom.numberToolButton = document.getElementById("number-tool-button");
    dom.numberDescription = document.getElementById("number-description");
    dom.resetNumberButton = document.getElementById("reset-number-button");
    // Text Tool Elements
    dom.textToolGroup = document.getElementById("text-tool-group");
    dom.textToolButton = document.getElementById("text-tool-button");
    dom.textDescription = document.getElementById("text-description");
    dom.textInputContainer = document.getElementById("text-input-container");
    dom.textInputField = document.getElementById("text-input-field"); // Now gets assigned here
    // Color Picker
    dom.colorPicker = document.getElementById("color-picker");
    dom.colorDescription = document.getElementById("color-description");
    // Action Toolbar Buttons
    dom.newButton = document.getElementById("new-button");
    dom.selectToolButton = document.getElementById("select-tool");
    dom.rotateToolButton = document.getElementById("rotate-tool");
    dom.deleteToolButton = document.getElementById("delete-tool");
    dom.undoButton = document.getElementById("undo-button");
    dom.redoButton = document.getElementById("redo-button");
    // File/Persistence Buttons
    dom.saveButton = document.getElementById("save-button"); // Note: This ID might not exist in your HTML
    dom.loadButton = document.getElementById("load-button");   // Note: This ID might not exist in your HTML
    dom.exportSvgButton = document.getElementById("export-svg");
    dom.importSvgButton = document.getElementById("import-svg");
    dom.fileInput = document.getElementById("file-input");
    dom.libraryInput = document.getElementById("library-input");
    dom.addSvgBtn = document.getElementById("add-svg-btn");
    // Sidebars
    dom.activityList = document.getElementById("activity-list");
    dom.svgLibraryList = document.getElementById("svg-library"); // Corrected from svg-library-list
    // Canvas Area
    dom.drawingArea = document.getElementById("drawing-area"); // <<< ADD THIS LINE
    dom.svgCanvas = document.getElementById("svg-canvas");
    dom.fieldLayer = document.getElementById("field-layer");
    dom.contentLayer = document.getElementById("content-layer");
    dom.selectionRect = document.getElementById("selection-rectangle");
    dom.tempArrowPreview = document.getElementById("temp-arrow-preview");
    dom.tempArrowPreview2 = document.getElementById("temp-arrow-preview-2");
    dom.tempFreehandPreview = document.getElementById("temp-freehand-preview");
    dom.tempLinePreview = document.getElementById("temp-line-preview");
    dom.tempRectPreview = document.getElementById("temp-rect-preview");
    dom.tempCirclePreview = document.getElementById("temp-circle-preview");
    dom.tempTrianglePreview = document.getElementById("temp-triangle-preview");
    // Misc
    dom.ghostPreview = document.getElementById("ghost-drag-preview");

    console.log("DOM references initialized.");
}