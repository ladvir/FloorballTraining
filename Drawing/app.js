(function() {
    // --- Constants ---
    const SVG_NS = "http://www.w3.org/2000/svg";
    const MIN_ELEMENT_WIDTH = 40;
    const MIN_ELEMENT_HEIGHT = 40;
    const MOVE_HANDLE_HEIGHT = 4;
    const MOVE_HANDLE_OFFSET = 2;
    const MOVE_HANDLE_WIDTH_PERCENT = 0.2;
    const PLACEMENT_GAP = 10;
    const PLAYER_RADIUS = 15;
    const PLAYER_DIAMETER = PLAYER_RADIUS * 2;
    const DEFAULT_GHOST_WIDTH = 120;
    const DEFAULT_GHOST_HEIGHT = 80;
    const ROTATION_STEP = 45;

    // --- Player Tool Definitions ---
    const playerTools = [
        { toolId: 'player', label: 'Player', type: 'player', radius: PLAYER_RADIUS, fill: 'black', stroke: 'black', text: null, textColor: 'white' },
        { toolId: 'team-a', label: 'Team A', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: null, textColor: 'white' },
        { toolId: 'team-a-LF', label: 'Team A LF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LF', textColor: 'white' }, { toolId: 'team-a-CF', label: 'Team A CF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'CF', textColor: 'white' }, { toolId: 'team-a-RF', label: 'Team A RF', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RF', textColor: 'white' }, { toolId: 'team-a-LD', label: 'Team A LD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'LD', textColor: 'white' }, { toolId: 'team-a-RD', label: 'Team A RD', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'RD', textColor: 'white' }, { toolId: 'team-a-G', label: 'Team A G', type: 'player', radius: PLAYER_RADIUS, fill: 'red', stroke: 'black', text: 'G', textColor: 'white' },
        { toolId: 'team-b', label: 'Team B', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: null, textColor: 'white' },
        { toolId: 'team-b-LF', label: 'Team B LF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'LF', textColor: 'white' }, { toolId: 'team-b-CF', label: 'Team B CF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'CF', textColor: 'white' }, { toolId: 'team-b-RF', label: 'Team B RF', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'RF', textColor: 'white' }, { toolId: 'team-b-LD', label: 'Team B LD', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'LD', textColor: 'white' }, { toolId: 'team-b-RD', label: 'Team B RD', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'RD', textColor: 'white' }, { toolId: 'team-b-G', label: 'Team B G', type: 'player', radius: PLAYER_RADIUS, fill: 'green', stroke: 'black', text: 'G', textColor: 'white' },
        { toolId: 'coach', label: 'Coach', type: 'player', radius: PLAYER_RADIUS, fill: 'none', stroke: 'black', text: 'C', textColor: 'black' },
    ];
    const playerToolMap = new Map(playerTools.map(tool => [tool.toolId, tool]));

    // --- Generate Cursors ---
    function generateCursorDataUrl(fillColor, strokeColor = 'black', text = null, textColor = 'white') { const radius = 8; const diameter = radius * 2; let textElement = ''; if (text) { textElement = `<text x="${radius}" y="${radius}" alignment-baseline="central" text-anchor="middle" fill="${textColor}" font-size="9" font-weight="bold" style="pointer-events:none;">${text}</text>`; } const cursorSvg = `<svg xmlns="${SVG_NS}" width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}"><circle cx="${radius}" cy="${radius}" r="${radius-1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>${textElement}</svg>`; return `url('data:image/svg+xml;base64,${btoa(cursorSvg)}') ${radius} ${radius}, auto`; }
    const toolCursors = {}; playerTools.forEach(tool => { toolCursors[tool.toolId] = generateCursorDataUrl(tool.fill === 'none' ? 'white' : tool.fill, tool.stroke, tool.text, tool.textColor); });

    // --- Application State ---
    const appState = {
        currentTool: 'select', activeDrawingTool: null, selectedElements: new Set(),
        isDraggingElement: false, isSelectingRect: false, selectionRectStart: null,
        dragOffsetX: 0, dragOffsetY: 0, elementStartPos: { x: 0, y: 0},
        currentlyHighlightedCollisions: new Set(), currentDraggingItemInfo: null,
        // Load library and activities from localStorage or use defaults
        svgLibrary: JSON.parse(localStorage.getItem("svgLibrary") || "[]"),
        // ** RESTORED ACTIVITIES **
        activities: JSON.parse(localStorage.getItem("activities") || JSON.stringify([
            { id: 1, name: "Activity A", svg: "<circle cx='20' cy='20' r='18' fill='blue' class='activity-svg' />" },
            { id: 2, name: "Activity B", svg: "<rect x='5' y='5' width='30' height='30' fill='red' class='activity-svg' />" },
            { id: 3, name: "Activity C", svg: "<svg class='activity-svg' viewBox='0 0 40 40' width='40' height='40'><path fill='#555' d='M20 1.6c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24S23.46 1.6 20 1.6zm-7.68 14.24c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm-23.04 14.4c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24z'/></svg>" }
        ]))
    };

    // --- DOM References ---
    const dom = {
        activityList: document.getElementById("activity-list"), svgCanvas: document.getElementById("svg-canvas"), svgLibraryList: document.getElementById("svg-library"), addSvgBtn: document.getElementById("add-svg-btn"), libraryInput: document.getElementById("library-input"),
        saveButton: document.getElementById("save-button"), loadButton: document.getElementById("load-button"), exportSvgButton: document.getElementById("export-svg"), importSvgButton: document.getElementById("import-svg"), fileInput: document.getElementById("file-input"),
        deleteToolButton: document.getElementById("delete-tool"), selectToolButton: document.getElementById("select-tool"), rotateToolButton: document.getElementById("rotate-tool"),
        ghostPreview: document.getElementById("ghost-drag-preview"), drawingToolbar: document.getElementById("drawing-toolbar"), drawingToolItems: document.querySelectorAll("#drawing-toolbar .tool-item"),
        selectionRect: document.getElementById("selection-rectangle"), actionToolbar: document.getElementById("action-toolbar")
    };

    // --- Core UI Functions ---
    function setActiveTool(toolId) { /* ... */ }
    function updateElementVisualSelection(element, isSelected) { /* ... */ }
    function clearSelection() { /* ... */ }
    function handleElementSelection(element, event) { /* ... */ }
    // Full implementations
    function setActiveTool(toolId) { console.log("setActiveTool:", toolId); document.body.classList.remove('tool-select', 'tool-delete', 'tool-draw', 'tool-rotate'); dom.deleteToolButton?.classList.remove('active-tool'); dom.selectToolButton?.classList.remove('active-tool'); dom.rotateToolButton?.classList.remove('active-tool'); dom.drawingToolItems.forEach(item => item.classList.remove('active-tool')); appState.activeDrawingTool = null; dom.svgCanvas.style.cursor = 'default'; if (toolId === 'delete') { document.body.classList.add('tool-delete'); appState.currentTool = 'delete'; dom.deleteToolButton?.classList.add('active-tool'); dom.svgCanvas.style.cursor = 'crosshair'; } else if (toolId === 'rotate') { document.body.classList.add('tool-rotate'); appState.currentTool = 'rotate'; dom.rotateToolButton?.classList.add('active-tool'); } else if (playerToolMap.has(toolId)) { document.body.classList.add('tool-draw'); appState.currentTool = 'draw'; appState.activeDrawingTool = toolId; const activeItem = dom.drawingToolbar.querySelector(`.tool-item[data-tool="${toolId}"]`); activeItem?.classList.add('active-tool'); dom.svgCanvas.style.cursor = toolCursors[toolId] || 'crosshair'; } else { toolId = 'select'; document.body.classList.add('tool-select'); appState.currentTool = 'select'; dom.selectToolButton?.classList.add('active-tool'); } console.log(" New state:", appState.currentTool, appState.activeDrawingTool); }
    function updateElementVisualSelection(element, isSelected) { if (!element) return; const existingOutline = element.querySelector('.selected-outline'); if (isSelected) { element.classList.add('selected'); if (!existingOutline) { const outline = document.createElementNS(SVG_NS, 'rect'); outline.setAttribute('class', 'selected-outline'); const firstHandle = element.querySelector('.move-handle'); if (firstHandle) { element.insertBefore(outline, firstHandle); } else { element.appendChild(outline); } const bgRect = element.querySelector('.element-bg'); if (bgRect) { const width = parseFloat(bgRect.getAttribute('width') || '0'); const height = parseFloat(bgRect.getAttribute('height') || '0'); const padding = 2; outline.setAttribute('x', String(-padding)); outline.setAttribute('y', String(-padding)); outline.setAttribute('width', String(width + 2 * padding)); outline.setAttribute('height', String(height + 2 * padding)); outline.setAttribute('rx', '5'); outline.setAttribute('ry', '5'); } } } else { element.classList.remove('selected'); existingOutline?.remove(); } }
    function clearSelection() { appState.selectedElements.forEach(el => updateElementVisualSelection(el, false)); appState.selectedElements.clear(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); }
    function handleElementSelection(element, event) { if (!element) return; const currentlySelected = appState.selectedElements.has(element); if (event.shiftKey) { if (currentlySelected) { appState.selectedElements.delete(element); updateElementVisualSelection(element, false); } else { appState.selectedElements.add(element); updateElementVisualSelection(element, true); } } else { if (!(appState.selectedElements.size === 1 && currentlySelected)) { clearSelection(); appState.selectedElements.add(element); updateElementVisualSelection(element, true); } } setActiveTool('select'); }

    // --- Collision Indicator Helper ---
    function ensureCollisionIndicatorRect(element) { /* ... */ }
    function clearCollisionHighlights(highlightSet) { /* ... */ }
    // Full implementations
    function ensureCollisionIndicatorRect(element) { if (!element) return; let indicator = element.querySelector('.collision-indicator-rect'); if (!indicator) { indicator = document.createElementNS(SVG_NS, 'rect'); indicator.setAttribute('class', 'collision-indicator-rect'); const outline = element.querySelector('.selected-outline'); const firstHandle = element.querySelector('.move-handle'); if (outline) { element.insertBefore(indicator, outline); } else if (firstHandle) { element.insertBefore(indicator, firstHandle); } else { element.appendChild(indicator); } } const bgRect = element.querySelector('.element-bg'); if (!bgRect) { indicator.remove(); return; } const width = parseFloat(bgRect.getAttribute('width') || '0'); const height = parseFloat(bgRect.getAttribute('height') || '0'); const padding = 4; indicator.setAttribute('x', String(-padding)); indicator.setAttribute('y', String(-padding)); indicator.setAttribute('width', String(width + 2 * padding)); indicator.setAttribute('height', String(height + 2 * padding)); indicator.setAttribute('rx', '7'); indicator.setAttribute('ry', '7'); }
    function clearCollisionHighlights(highlightSet) { highlightSet.forEach(el => { el.classList.remove('collision-indicator'); }); highlightSet.clear(); }

    // --- SVG Library & Activity List Management ---
    // ** MODIFIED loadActivities to check localStorage **
    function loadActivities() {
        dom.activityList.querySelectorAll('.activity-item').forEach(item => item.remove());
        // Ensure appState.activities is an array before iterating
        if (!Array.isArray(appState.activities)) {
            console.error("Activities data is invalid. Resetting to default.");
            // Reset to default if localStorage data was bad
            appState.activities = [
                { id: 1, name: "Activity A", svg: "<circle cx='20' cy='20' r='18' fill='blue' class='activity-svg' />" },
                { id: 2, name: "Activity B", svg: "<rect x='5' y='5' width='30' height='30' fill='red' class='activity-svg' />" },
                { id: 3, name: "Activity C", svg: "<svg class='activity-svg' viewBox='0 0 40 40' width='40' height='40'><path fill='#555' d='M20 1.6c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24S23.46 1.6 20 1.6zm-7.68 14.24c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm-23.04 14.4c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24zm15.36 0c-3.46 0-6.24 2.78-6.24 6.24s2.78 6.24 6.24 6.24 6.24-2.78 6.24-6.24-2.78-6.24-6.24-6.24z'/></svg>" }
            ];
            // Optionally save the default back to localStorage
            // localStorage.setItem("activities", JSON.stringify(appState.activities));
        }
        appState.activities.forEach(activity => {
            // Basic validation of activity item structure
            if (activity && activity.id != null && typeof activity.name === 'string' && typeof activity.svg === 'string') {
                const item = document.createElement("div");
                item.className = "sidebar-item-base activity-item";
                item.textContent = activity.name;
                item.draggable = true;
                item.dataset.activityId = String(activity.id);
                item.addEventListener("dragstart", handleActivityDragStart);
                dom.activityList.appendChild(item);
            } else {
                console.warn("Skipping invalid activity item:", activity);
            }
        });
    }
    // Other library/activity functions remain the same
    function loadSvgLibrary() { /* ... */ }
    function addSvgToLibraryUI(name, svgContent, index) { /* ... */ }
    function handleLibraryFileRead(file) { /* ... */ }
    // Full implementations
    function loadSvgLibrary() { dom.svgLibraryList.querySelectorAll('.library-item').forEach(item => item.remove()); if (!Array.isArray(appState.svgLibrary)) { appState.svgLibrary = []; localStorage.setItem("svgLibrary", "[]"); } appState.svgLibrary.forEach((svgItem, index) => { if (svgItem && typeof svgItem.name === 'string' && typeof svgItem.content === 'string') { addSvgToLibraryUI(svgItem.name, svgItem.content, index); } }); }
    function addSvgToLibraryUI(name, svgContent, index) { const item = document.createElement("div"); item.className = "sidebar-item-base library-item"; item.draggable = true; item.dataset.svgContent = svgContent; item.dataset.svgName = name || `SVG ${index + 1}`; const svgPreview = document.createElement("div"); try { svgPreview.innerHTML = svgContent; } catch (e) { svgPreview.textContent = "[Invalid SVG]"; } const svgElement = svgPreview.querySelector('svg'); if (svgElement) { svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svgElement.removeAttribute('width'); svgElement.removeAttribute('height'); svgElement.style.display = 'block'; } else { svgPreview.textContent = "[SVG Preview Error]"; } item.appendChild(svgPreview); const nameSpan = document.createElement("span"); nameSpan.className = "item-name"; nameSpan.textContent = item.dataset.svgName; item.appendChild(nameSpan); const deleteBtn = document.createElement("button"); deleteBtn.className = "delete-btn"; deleteBtn.textContent = "Remove"; deleteBtn.onclick = (e) => { e.stopPropagation(); appState.svgLibrary.splice(index, 1); localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary)); loadSvgLibrary(); }; item.appendChild(deleteBtn); item.addEventListener("dragstart", handleLibraryDragStart); dom.svgLibraryList.appendChild(item); }
    function handleLibraryFileRead(file) { const reader = new FileReader(); reader.onload = function(e) { try { const parser = new DOMParser(); const svgDoc = parser.parseFromString(e.target.result, "image/svg+xml"); const parseError = svgDoc.querySelector('parsererror'); if (!svgDoc.documentElement || svgDoc.documentElement.nodeName !== "svg" || parseError) { throw new Error(`File ${file.name} is not valid SVG`); } const svgElement = svgDoc.documentElement; svgElement.removeAttribute('id'); const svgContent = svgElement.outerHTML; appState.svgLibrary.push({ name: file.name.replace('.svg', ''), content: svgContent }); localStorage.setItem("svgLibrary", JSON.stringify(appState.svgLibrary)); loadSvgLibrary(); } catch (error) { alert(`Could not add ${file.name}: ${error.message}`); } }; reader.onerror = () => alert(`Error reading file: ${file.name}`); reader.readAsText(file); }


    // --- Canvas Element Creation --- (No changes needed)
    function createCanvasElement(config, x, y) { /* ... */ }
    function createPlayerElement(config, x, y) { /* ... */ }
    // Full implementations
    function createCanvasElement(config, x, y) { config = config || {}; config.width = Math.max(MIN_ELEMENT_WIDTH, config.width || MIN_ELEMENT_WIDTH); config.height = Math.max(MIN_ELEMENT_HEIGHT, config.height || MIN_ELEMENT_HEIGHT); config.name = config.name || "Element"; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element"); const initialTranslateX = x - config.width / 2; const initialTranslateY = y - config.height / 2; group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`); group.dataset.rotation = "0"; if (config.id) group.dataset.activityId = String(config.id); if (config.name) group.dataset.elementName = config.name; const rect = document.createElementNS(SVG_NS, "rect"); rect.setAttribute("class", "element-bg"); rect.setAttribute("x", "0"); rect.setAttribute("y", "0"); rect.setAttribute("width", String(config.width)); rect.setAttribute("height", String(config.height)); rect.setAttribute("rx", "10"); rect.setAttribute("ry", "10"); rect.setAttribute("fill", "lightyellow"); rect.setAttribute("stroke", "black"); group.appendChild(rect); const text = document.createElementNS(SVG_NS, "text"); text.setAttribute("x", "10"); text.setAttribute("y", "20"); text.setAttribute("font-size", "12"); text.setAttribute("fill", "black"); text.setAttribute("class", "element-label"); text.style.pointerEvents = "none"; text.textContent = config.name; group.appendChild(text); const contentPaddingX = 10; const contentPaddingY = 30; const contentWidth = Math.max(0, config.width - 2 * contentPaddingX); const contentHeight = Math.max(0, config.height - contentPaddingY - 10); if (config.type === 'activity' && config.svgContent) { const svgContainer = document.createElementNS(SVG_NS, "svg"); svgContainer.setAttribute("x", String(contentPaddingX)); svgContainer.setAttribute("y", String(contentPaddingY)); svgContainer.setAttribute("width", String(contentWidth)); svgContainer.setAttribute("height", String(contentHeight)); svgContainer.setAttribute("preserveAspectRatio", "xMidYMid meet"); svgContainer.setAttribute("viewBox", "0 0 40 40"); try { svgContainer.innerHTML = config.svgContent; } catch (e) {} svgContainer.style.pointerEvents = "none"; group.appendChild(svgContainer); } else if (config.type === 'library' && config.svgContent) { const foreignObject = document.createElementNS(SVG_NS, "foreignObject"); foreignObject.setAttribute("x", String(contentPaddingX)); foreignObject.setAttribute("y", String(contentPaddingY)); foreignObject.setAttribute("width", String(contentWidth)); foreignObject.setAttribute("height", String(contentHeight)); try { foreignObject.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; overflow:hidden;">${config.svgContent}</div>`; const innerSvg = foreignObject.querySelector('svg'); if (innerSvg) { innerSvg.style.width = '100%'; innerSvg.style.height = '100%'; innerSvg.style.display = 'block'; innerSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); } } catch (e) {} foreignObject.style.pointerEvents = "none"; group.appendChild(foreignObject); } ensureHandles(group, config.width, config.height); dom.svgCanvas.appendChild(group); makeElementInteractive(group); }
    function createPlayerElement(config, x, y) { const radius = config.radius || PLAYER_RADIUS; const diameter = radius * 2; const group = document.createElementNS(SVG_NS, "g"); group.classList.add("canvas-element", "player-element"); const initialTranslateX = x; const initialTranslateY = y; group.setAttribute("transform", `translate(${initialTranslateX}, ${initialTranslateY})`); group.dataset.rotation = "0"; group.dataset.playerType = config.toolId; group.dataset.elementName = config.label || "Player"; const bgRect = document.createElementNS(SVG_NS, "rect"); bgRect.setAttribute("class", "element-bg"); bgRect.setAttribute("x", String(-radius)); bgRect.setAttribute("y", String(-radius)); bgRect.setAttribute("width", String(diameter)); bgRect.setAttribute("height", String(diameter)); bgRect.setAttribute("fill", "transparent"); group.appendChild(bgRect); const circle = document.createElementNS(SVG_NS, "circle"); circle.setAttribute("cx", "0"); circle.setAttribute("cy", "0"); circle.setAttribute("r", String(radius)); circle.setAttribute("fill", config.fill || "black"); circle.setAttribute("stroke", config.stroke || "black"); circle.setAttribute("stroke-width", "1"); group.appendChild(circle); if (config.text) { const text = document.createElementNS(SVG_NS, "text"); text.setAttribute("x", "0"); text.setAttribute("y", "0"); text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central"); text.setAttribute("fill", config.textColor || "white"); text.setAttribute("font-size", "10"); text.setAttribute("font-weight", "bold"); text.style.pointerEvents = "none"; text.textContent = config.text; group.appendChild(text); } ensureHandles(group, diameter, diameter, true); dom.svgCanvas.appendChild(group); makeElementInteractive(group); }


    // --- Interactivity ---
    function makeElementInteractive(element) { if (!element) return; element.removeEventListener("mousedown", handleElementMouseDown); element.removeEventListener("click", handleElementClick); element.addEventListener("mousedown", handleElementMouseDown); element.addEventListener("click", handleElementClick); }
    function handleElementClick(event) {
        const element = event.currentTarget;
        if (appState.isDraggingElement || appState.isSelectingRect) { return; }
        const targetClasses = event.target.classList;
        const isHandleClick = targetClasses.contains('move-handle');

        if (!isHandleClick) { // Click on body
            if (appState.currentTool === 'delete') {
                if (appState.selectedElements.has(element)) { appState.selectedElements.delete(element); }
                element.remove();
            } else if (appState.currentTool === 'rotate') {
                const isPlayer = element.classList.contains('player-element');
                const rect = element.querySelector(".element-bg"); if (!rect) return;
                const width = parseFloat(rect.getAttribute("width") || "0"); const height = parseFloat(rect.getAttribute("height") || "0"); if (width <= 0 || height <= 0) return;
                const centerX = isPlayer ? 0 : width / 2; const centerY = isPlayer ? 0 : height / 2;
                const transformList = element.transform.baseVal; const currentRotation = parseFloat(element.dataset.rotation || "0"); const newRotation = (currentRotation + ROTATION_STEP); const rotateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_ROTATE, centerX, centerY);
                rotateTransform.setRotate(newRotation, centerX, centerY);
                const rotatedBBox = getTransformedBBox(element);
                if (rotatedBBox && getCollidingElementsByBBox(rotatedBBox, element).length > 0) {
                    console.log("Rotation resulted in BBox collision. Reverting."); rotateTransform.setRotate(currentRotation, centerX, centerY); element.dataset.rotation = String(currentRotation);
                } else { element.dataset.rotation = String(newRotation); }
            } else { // Select tool implicitly active
                handleElementSelection(element, event);
            }
        }
        event.stopPropagation();
    }

    // --- Transform & Collision Helpers ---
    function getOrAddTransform(transformList, type, initialValueX = 0, initialValueY = 0) { /* ... */ }
    function svgPoint(svgElement, clientX, clientY) { /* ... */ }
    function transformPoint(x, y, matrix) { /* ... */ }
    function getTransformedBBox(element) { /* ... */ }
    function getCollidingElementsByBBox(proposedBox, elementToExclude = null) { /* ... */ }
    // Full implementations
    function getOrAddTransform(transformList, type, initialValueX = 0, initialValueY = 0) { let transform = null; for (let i = 0; i < transformList.numberOfItems; i++) { if (transformList.getItem(i).type === type) { transform = transformList.getItem(i); break; } } if (!transform) { transform = dom.svgCanvas.createSVGTransform(); if (type === SVGTransform.SVG_TRANSFORM_TRANSLATE) { transform.setTranslate(initialValueX, initialValueY); transformList.appendItem(transform); } else if (type === SVGTransform.SVG_TRANSFORM_ROTATE) { transform.setRotate(0, initialValueX, initialValueY); transformList.appendItem(transform); } else { transformList.appendItem(transform); } } return transform; }
    function svgPoint(svgElement, clientX, clientY) { if (!svgElement) return null; const pt = svgElement.createSVGPoint(); pt.x = clientX; pt.y = clientY; try { const ctm = svgElement.getScreenCTM(); if (ctm?.inverse) { return pt.matrixTransform(ctm.inverse()); } else { const rect = svgElement.getBoundingClientRect(); const svgWidth = parseFloat(svgElement.getAttribute('width') || rect.width) || 1; const svgHeight = parseFloat(svgElement.getAttribute('height') || rect.height) || 1; pt.x = (clientX - rect.left) * (svgWidth / rect.width); pt.y = (clientY - rect.top) * (svgHeight / rect.height); return pt; } } catch (error) { return null; } }
    function transformPoint(x, y, matrix) { const pt = dom.svgCanvas.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(matrix); }
    function getTransformedBBox(element) { if (!element) return null; const bgRect = element.querySelector('.element-bg'); if (!bgRect) return null; try { const localBBox = bgRect.getBBox(); const transformMatrix = element.getCTM(); if (!transformMatrix) return null; const p1Local={x:localBBox.x, y:localBBox.y}; const p2Local={x:localBBox.x+localBBox.width, y:localBBox.y}; const p3Local={x:localBBox.x+localBBox.width, y:localBBox.y+localBBox.height}; const p4Local={x:localBBox.x, y:localBBox.y+localBBox.height}; const p1Global=transformPoint(p1Local.x,p1Local.y,transformMatrix); const p2Global=transformPoint(p2Local.x,p2Local.y,transformMatrix); const p3Global=transformPoint(p3Local.x,p3Local.y,transformMatrix); const p4Global=transformPoint(p4Local.x,p4Local.y,transformMatrix); const left=Math.min(p1Global.x,p2Global.x,p3Global.x,p4Global.x); const top=Math.min(p1Global.y,p2Global.y,p3Global.y,p4Global.y); const right=Math.max(p1Global.x,p2Global.x,p3Global.x,p4Global.x); const bottom=Math.max(p1Global.y,p2Global.y,p3Global.y,p4Global.y); return {left, top, right, bottom, width:right-left, height:bottom-top}; } catch(e) { return null; } }
    function getCollidingElementsByBBox(proposedBox, elementToExclude = null) { const colliding = []; if (!proposedBox) return colliding; const existingElements = dom.svgCanvas.querySelectorAll(".canvas-element"); for (const existingElement of existingElements) { if (existingElement === elementToExclude) continue; const existingBBox = getTransformedBBox(existingElement); if (!existingBBox) continue; const overlaps = !( proposedBox.right + PLACEMENT_GAP <= existingBBox.left || proposedBox.left - PLACEMENT_GAP >= existingBBox.right || proposedBox.bottom + PLACEMENT_GAP <= existingBBox.top || proposedBox.top - PLACEMENT_GAP >= existingBBox.bottom ); if (overlaps) { colliding.push(existingElement); } } return colliding; }

    // --- Event Handlers ---
    // MODIFIED: handleElementMouseDown - Correctly handle body drag for ALL element types
    function handleElementMouseDown(event) {
        const element = event.currentTarget;
        const targetClasses = event.target.classList;
        const isPlayer = element.classList.contains('player-element');
        const isMoveHandle = targetClasses.contains('move-handle');
        // Body click is true if it's not the move handle (since other handles removed)
        const isBodyClick = !isMoveHandle;

        // Ignore clicks completely if a specific tool prevents interaction on the body
        if (appState.currentTool === 'delete' && isBodyClick) {
            event.stopPropagation(); return; // Let click handler delete
        }
        if (appState.currentTool === 'rotate' && isBodyClick) {
            event.stopPropagation(); return; // Let click handler rotate
        }
        if (appState.currentTool === 'draw') {
            return; // Don't allow selecting/dragging elements when a drawing tool is active
        }

        // --- Select Tool Logic ---
        if (appState.currentTool === 'select') {
            // Allow drag from:
            // 1. Move handle (only exists on non-players)
            // 2. Body click (for players OR non-players)
            if (isMoveHandle || isBodyClick) {
                // Handle selection state *before* starting drag
                if (isBodyClick) {
                    if (!event.shiftKey) {
                        // If not shift clicking, and either the element is not selected
                        // OR multiple elements are selected, then select *only* this one.
                        if (!appState.selectedElements.has(element) || appState.selectedElements.size > 1) {
                            handleElementSelection(element, event); // Select only this one
                            // Don't start drag immediately after a click that changes selection
                            // unless it was the *only* one previously selected (allows immediate re-drag)
                            if (appState.selectedElements.size !== 1) return;
                        }
                        // If clicking the single already selected element, proceed to drag.
                    } else {
                        // Shift click toggles selection
                        handleElementSelection(element, event);
                        // Don't start drag immediately after toggling selection with shift
                        return;
                    }
                }
                // If we reach here, the element is selected (potentially as the only one)
                // and we intend to drag it.

                // Proceed with drag start for single element
                event.preventDefault(); event.stopPropagation();
                const startPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!startPoint) return;

                // Ensure element is selected (should be, but double check)
                if (!appState.selectedElements.has(element)) return;
                // **Restrict drag to single elements for now**
                if (appState.selectedElements.size > 1) {
                    console.log("Multi-element drag not implemented yet.");
                    return;
                }


                const transformList = element.transform.baseVal;
                clearCollisionHighlights(appState.currentlyHighlightedCollisions);
                appState.isDraggingElement = true;
                const initialTranslate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE);
                appState.elementStartPos = { x: initialTranslate.matrix.e, y: initialTranslate.matrix.f };
                appState.dragOffsetX = startPoint.x - appState.elementStartPos.x;
                appState.dragOffsetY = startPoint.y - appState.elementStartPos.y;
                element.classList.add('dragging');

                document.addEventListener('mousemove', handleElementDragMove, false);
                document.addEventListener('mouseup', handleElementDragEnd, false);
            }
        }
    }

    function handleElementDragMove(event) { /* ... Uses BBox check for highlights ... */ if (!appState.isDraggingElement || appState.selectedElements.size !== 1) { return; }; const element = appState.selectedElements.values().next().value; if (!element) { handleElementDragEnd(event); return; } const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!currentPoint) return; const transformList = element.transform.baseVal; const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE); const newTranslateX = currentPoint.x - appState.dragOffsetX; const newTranslateY = currentPoint.y - appState.dragOffsetY; translateTransform.setTranslate(newTranslateX, newTranslateY); const currentBBox = getTransformedBBox(element); if (!currentBBox) return; const newlyCollidingElements = getCollidingElementsByBBox(currentBBox, element); const newlyCollidingSet = new Set(newlyCollidingElements); const previouslyCollidingSet = appState.currentlyHighlightedCollisions; previouslyCollidingSet.forEach(collidedEl => { if (!newlyCollidingSet.has(collidedEl)) { collidedEl.classList.remove('collision-indicator'); previouslyCollidingSet.delete(collidedEl); } }); newlyCollidingSet.forEach(collidedEl => { if (!previouslyCollidingSet.has(collidedEl)) { ensureCollisionIndicatorRect(collidedEl); collidedEl.classList.add('collision-indicator'); previouslyCollidingSet.add(collidedEl); } }); }
    function handleElementDragEnd(event) { /* ... Uses BBox check for revert ... */ const wasDragging = appState.isDraggingElement; const elementProcessed = appState.selectedElements.values().next().value; document.removeEventListener('mousemove', handleElementDragMove, false); document.removeEventListener('mouseup', handleElementDragEnd, false); clearCollisionHighlights(appState.currentlyHighlightedCollisions); if (elementProcessed) { elementProcessed.classList.remove('dragging'); } if (wasDragging) { appState.isDraggingElement = false; if (elementProcessed) { const finalBBox = getTransformedBBox(elementProcessed); if (finalBBox && getCollidingElementsByBBox(finalBBox, elementProcessed).length > 0) { console.log("Move resulted in BBox collision. Reverting position."); const transformList = elementProcessed.transform.baseVal; const translateTransform = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE); translateTransform.setTranslate(appState.elementStartPos.x, appState.elementStartPos.y); } } } }

    // --- Listeners for Selection Rectangle (Bound to Canvas) ---
    function handleCanvasMouseDown(event) { /* ... as before ... */ if (event.target === dom.svgCanvas && appState.currentTool === 'select') { event.preventDefault(); if (!event.shiftKey) { clearSelection(); } appState.isSelectingRect = true; appState.selectionRectStart = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!appState.selectionRectStart) { appState.isSelectingRect = false; return; } dom.selectionRect.setAttribute('x', appState.selectionRectStart.x); dom.selectionRect.setAttribute('y', appState.selectionRectStart.y); dom.selectionRect.setAttribute('width', 0); dom.selectionRect.setAttribute('height', 0); dom.selectionRect.setAttribute('visibility', 'visible'); document.addEventListener('mousemove', handleCanvasMouseMoveSelect, false); document.addEventListener('mouseup', handleCanvasMouseUpSelect, false); } }
    function handleCanvasMouseMoveSelect(event) { /* ... as before ... */ if (!appState.isSelectingRect || !appState.selectionRectStart) return; event.preventDefault(); const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!currentPoint) return; const x = Math.min(appState.selectionRectStart.x, currentPoint.x); const y = Math.min(appState.selectionRectStart.y, currentPoint.y); const width = Math.abs(appState.selectionRectStart.x - currentPoint.x); const height = Math.abs(appState.selectionRectStart.y - currentPoint.y); dom.selectionRect.setAttribute('x', x); dom.selectionRect.setAttribute('y', y); dom.selectionRect.setAttribute('width', width); dom.selectionRect.setAttribute('height', height); }
    function handleCanvasMouseUpSelect(event) { /* ... as before ... */ if (!appState.isSelectingRect) return; appState.isSelectingRect = false; dom.selectionRect.setAttribute('visibility', 'hidden'); document.removeEventListener('mousemove', handleCanvasMouseMoveSelect, false); document.removeEventListener('mouseup', handleCanvasMouseUpSelect, false); const startPt = appState.selectionRectStart; const endPt = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!startPt || !endPt) return; const selectionX = Math.min(startPt.x, endPt.x); const selectionY = Math.min(startPt.y, endPt.y); const selectionWidth = Math.abs(startPt.x - endPt.x); const selectionHeight = Math.abs(startPt.y - endPt.y); if (selectionWidth > 5 || selectionHeight > 5) { const selectionRectBounds = { left: selectionX, top: selectionY, right: selectionX + selectionWidth, bottom: selectionY + selectionHeight }; const isRightToLeft = endPt.x < startPt.x; const elementsToSelectNow = new Set(); const allElements = dom.svgCanvas.querySelectorAll('.canvas-element'); allElements.forEach(element => { const elementBBox = getTransformedBBox(element); if (!elementBBox) return; if (isRightToLeft) { if (elementBBox.left >= selectionRectBounds.left && elementBBox.right <= selectionRectBounds.right && elementBBox.top >= selectionRectBounds.top && elementBBox.bottom <= selectionRectBounds.bottom) { elementsToSelectNow.add(element); } } else { const intersects = !(elementBBox.right < selectionRectBounds.left || elementBBox.left > selectionRectBounds.right || elementBBox.bottom < selectionRectBounds.top || elementBBox.top > selectionRectBounds.bottom); if (intersects) { elementsToSelectNow.add(element); } } }); if (!event.shiftKey) { clearSelection(); elementsToSelectNow.forEach(el => { appState.selectedElements.add(el); updateElementVisualSelection(el, true); }); } else { elementsToSelectNow.forEach(el => { if (!appState.selectedElements.has(el)) { appState.selectedElements.add(el); updateElementVisualSelection(el, true); } }); } } appState.selectionRectStart = null; }


    // --- Drag and Drop Handling --- (Ghost logic restored)
    function handleActivityDragStart(event) { /* ... create ghost ... */ }
    function handleLibraryDragStart(event) { /* ... create ghost ... */ }
    function createGhostPreview(event) { /* ... */ }
    function moveGhostPreview(event) { /* ... */ }
    function destroyGhostPreview() { /* ... */ }
    function handleCanvasDragOver(event) { /* ... Uses BBox check for highlights ... */ }
    function handleCanvasDragLeave(event) { /* ... */ }
    function handleCanvasDrop(event) { /* ... uses checkCollisionBBox for placement ... */ }
    // Full implementations
    function handleActivityDragStart(event) { const activityId = event.target.dataset.activityId || ""; event.dataTransfer.setData("text/plain", activityId); event.dataTransfer.setData("application/source", "activity"); event.dataTransfer.effectAllowed = "copy"; const activity = appState.activities.find(a => String(a.id) === activityId); if (activity) { appState.currentDraggingItemInfo = { type: 'activity', width: 120, height: 80, svgContent: activity.svg, name: activity.name }; createGhostPreview(event); } }
    function handleLibraryDragStart(event) { const itemElement = event.target.closest('.library-item'); if (!itemElement) return; const svgName = itemElement.dataset.svgName || ""; const svgContent = itemElement.dataset.svgContent || ""; event.dataTransfer.setData("text/plain", svgName); event.dataTransfer.setData("application/svg+xml", svgContent); event.dataTransfer.setData("application/source", "library"); event.dataTransfer.effectAllowed = "copy"; let ghostWidth = DEFAULT_GHOST_WIDTH; let ghostHeight = DEFAULT_GHOST_HEIGHT; if(svgContent) { try { const parser = new DOMParser(); const svgDoc = parser.parseFromString(svgContent, "image/svg+xml"); const svgRoot = svgDoc.documentElement; if (svgRoot && svgRoot.nodeName === 'svg') { const vb = svgRoot.viewBox?.baseVal; const wAttr = svgRoot.getAttribute('width'); const hAttr = svgRoot.getAttribute('height'); if (vb && vb.width > 0 && vb.height > 0) { ghostWidth = vb.width; ghostHeight = vb.height; } else if (wAttr && hAttr) { ghostWidth = parseFloat(wAttr) || ghostWidth; ghostHeight = parseFloat(hAttr) || ghostHeight; } ghostWidth = Math.min(Math.max(ghostWidth, MIN_ELEMENT_WIDTH), 400); ghostHeight = Math.min(Math.max(ghostHeight, MIN_ELEMENT_HEIGHT), 400); } } catch (e) {} } appState.currentDraggingItemInfo = { type: 'library', width: ghostWidth, height: ghostHeight, svgContent: svgContent, name: svgName }; createGhostPreview(event); }
    function createGhostPreview(event) { if (!appState.currentDraggingItemInfo || !dom.ghostPreview) return; const info = appState.currentDraggingItemInfo; dom.ghostPreview.style.width = `${info.width}px`; dom.ghostPreview.style.height = `${info.height}px`; dom.ghostPreview.innerHTML = ''; const label = document.createElement('div'); label.className = 'element-label'; label.textContent = info.name || "Item"; label.style.position = 'absolute'; label.style.left = '10px'; label.style.top = '5px'; dom.ghostPreview.appendChild(label); const contentWrapper = document.createElement('div'); contentWrapper.className = 'inner-content-wrapper'; if (info.svgContent) { try { contentWrapper.innerHTML = info.svgContent; const innerSvg = contentWrapper.querySelector('svg'); if (innerSvg) { innerSvg.setAttribute('width', '100%'); innerSvg.setAttribute('height', '100%'); innerSvg.style.display = 'block'; innerSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); if (!innerSvg.hasAttribute('viewBox') && info.width && info.height) { innerSvg.setAttribute('viewBox', `0 0 ${info.width} ${info.height}`); } } } catch(e) {} } dom.ghostPreview.appendChild(contentWrapper); try { event.dataTransfer.setDragImage(new Image(), 0, 0); } catch(e) {} dom.ghostPreview.style.display = 'block'; moveGhostPreview(event); }
    function moveGhostPreview(event) { if (!dom.ghostPreview || !appState.currentDraggingItemInfo) return; const x = event.pageX - (appState.currentDraggingItemInfo.width / 2); const y = event.pageY - (appState.currentDraggingItemInfo.height / 2); dom.ghostPreview.style.left = `${x}px`; dom.ghostPreview.style.top = `${y}px`; }
    function destroyGhostPreview() { if (dom.ghostPreview) { dom.ghostPreview.style.display = 'none'; dom.ghostPreview.innerHTML = ''; } appState.currentDraggingItemInfo = null; }
    function handleCanvasDragOver(event) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; if (appState.currentDraggingItemInfo) { moveGhostPreview(event); const currentPoint = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!currentPoint) return; const proposedWidth = appState.currentDraggingItemInfo.width; const proposedHeight = appState.currentDraggingItemInfo.height; const halfWidth = proposedWidth / 2; const halfHeight = proposedHeight / 2; const proposedBox = { left: currentPoint.x - halfWidth, top: currentPoint.y - halfHeight, right: currentPoint.x + halfWidth, bottom: currentPoint.y + halfHeight }; const newlyCollidingElements = getCollidingElementsByBBox(proposedBox); const newlyCollidingSet = new Set(newlyCollidingElements); const previouslyCollidingSet = appState.currentlyHighlightedCollisions; previouslyCollidingSet.forEach(collidedEl => { if (!newlyCollidingSet.has(collidedEl)) { collidedEl.classList.remove('collision-indicator'); previouslyCollidingSet.delete(collidedEl); } }); newlyCollidingSet.forEach(collidedEl => { if (!previouslyCollidingSet.has(collidedEl)) { ensureCollisionIndicatorRect(collidedEl); collidedEl.classList.add('collision-indicator'); previouslyCollidingSet.add(collidedEl); } }); } else { clearCollisionHighlights(appState.currentlyHighlightedCollisions); } }
    function handleCanvasDragLeave(event) { if (!event.relatedTarget || !dom.svgCanvas.contains(event.relatedTarget)) { clearCollisionHighlights(appState.currentlyHighlightedCollisions); destroyGhostPreview(); } }
    function handleCanvasDrop(event) { event.preventDefault(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); const isSidebarDrag = !!appState.currentDraggingItemInfo; destroyGhostPreview(); const initialDropPt = svgPoint(dom.svgCanvas, event.clientX, event.clientY); if (!initialDropPt) { console.error("Could not determine drop coordinates."); return; } const source = event.dataTransfer.getData("application/source"); let elementConfig = null; let proposedWidth = 0; let proposedHeight = 0; if (source === "activity") { /* ... */ const activityId = event.dataTransfer.getData("text/plain"); const activity = appState.activities.find(a => String(a.id) === activityId); if (activity) { proposedWidth = 120; proposedHeight = 80; elementConfig = { type: 'activity', id: activity.id, name: activity.name, svgContent: activity.svg, width: proposedWidth, height: proposedHeight }; } else { return; } } else if (source === "library") { /* ... */ const svgContent = event.dataTransfer.getData("application/svg+xml"); const svgName = event.dataTransfer.getData("text/plain"); if (svgContent) { let initialWidth = 120, initialHeight = 80; try { const parser = new DOMParser(); const svgDoc = parser.parseFromString(svgContent, "image/svg+xml"); const svgRoot = svgDoc.documentElement; if (svgRoot && svgRoot.nodeName === 'svg') { const vb = svgRoot.viewBox?.baseVal; const wAttr = svgRoot.getAttribute('width'); const hAttr = svgRoot.getAttribute('height'); if (vb && vb.width > 0 && vb.height > 0) { initialWidth = vb.width; initialHeight = vb.height; } else if (wAttr && hAttr) { initialWidth = parseFloat(wAttr) || initialWidth; initialHeight = parseFloat(hAttr) || initialHeight; } initialWidth = Math.min(Math.max(initialWidth, MIN_ELEMENT_WIDTH), 400); initialHeight = Math.min(Math.max(initialHeight, MIN_ELEMENT_HEIGHT), 400); } } catch (e) {} proposedWidth = initialWidth; proposedHeight = initialHeight; elementConfig = { type: 'library', name: svgName || "Library SVG", svgContent: svgContent, width: proposedWidth, height: proposedHeight }; } else { return; } } else { return; } let finalPlacementCenter = null; const halfWidth = proposedWidth / 2; const halfHeight = proposedHeight / 2; const tryPlacingAtBBox = (centerX, centerY) => { const proposedBox = { left: centerX - halfWidth, top: centerY - halfHeight, right: centerX + halfWidth, bottom: centerY + halfHeight }; return getCollidingElementsByBBox(proposedBox).length === 0; }; if (tryPlacingAtBBox(initialDropPt.x, initialDropPt.y)) { finalPlacementCenter = { x: initialDropPt.x, y: initialDropPt.y }; } else { const initialProposedBox = { left: initialDropPt.x - halfWidth, top: initialDropPt.y - halfHeight, right: initialDropPt.x + halfWidth, bottom: initialDropPt.y + halfHeight }; const initialColliders = getCollidingElementsByBBox(initialProposedBox); if (initialColliders.length > 0) { let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; initialColliders.forEach(el => { const bbox = getTransformedBBox(el); if (bbox) { minX = Math.min(minX, bbox.left); minY = Math.min(minY, bbox.top); maxX = Math.max(maxX, bbox.right); maxY = Math.max(maxY, bbox.bottom); } }); const combinedCollidingBox = { left: minX, top: minY, right: maxX, bottom: maxY }; const adjacentPositions = [ { x: combinedCollidingBox.right + PLACEMENT_GAP + halfWidth, y: initialDropPt.y }, { x: combinedCollidingBox.left - PLACEMENT_GAP - halfWidth, y: initialDropPt.y }, { x: initialDropPt.x, y: combinedCollidingBox.bottom + PLACEMENT_GAP + halfHeight }, { x: initialDropPt.x, y: combinedCollidingBox.top - PLACEMENT_GAP - halfHeight } ]; for (const pos of adjacentPositions) { if (tryPlacingAtBBox(pos.x, pos.y)) { finalPlacementCenter = pos; break; } } } } if (finalPlacementCenter) { clearSelection(); createCanvasElement(elementConfig, finalPlacementCenter.x, finalPlacementCenter.y); } else { console.log("Could not find a valid placement spot (BBox check). Element not created."); } }


    // --- Save, Load, Export, Import ---
    // MODIFIED: ensureHandles - simplified further
    function ensureHandles(element, currentWidth, currentHeight, isPlayer = false) {
        if (!element) return;
        const transformList = element.transform.baseVal;
        const translate = getOrAddTransform(transformList, SVGTransform.SVG_TRANSFORM_TRANSLATE, 0, 0);
        const rect = element.querySelector('.element-bg');
        // Use provided dimensions, fallback to rect, fallback to constants
        const width = currentWidth ?? parseFloat(rect?.getAttribute('width') || (isPlayer ? PLAYER_DIAMETER : MIN_ELEMENT_WIDTH));
        const height = currentHeight ?? parseFloat(rect?.getAttribute('height') || (isPlayer ? PLAYER_DIAMETER : MIN_ELEMENT_HEIGHT));

        // Sync rotation data (only for non-players)
        if (!isPlayer) {
            let currentRotation = 0; let rotateTransform = null;
            for (let i = 0; i < transformList.numberOfItems; i++) { if (transformList.getItem(i).type === SVGTransform.SVG_TRANSFORM_ROTATE) { rotateTransform = transformList.getItem(i); currentRotation = rotateTransform.angle; break; } }
            element.dataset.rotation = String(currentRotation);
        } else { element.dataset.rotation = "0"; }

        // Always remove unused handles/indicators
        element.querySelector('.resize-handle')?.remove();
        element.querySelector('.rotate-handle')?.remove();
        element.querySelector('.collision-indicator-rect')?.remove();
        element.classList.remove('collision-indicator');

        // Manage Move Handle (only for non-players)
        let moveHandle = element.querySelector('.move-handle');
        if (isPlayer) { moveHandle?.remove(); }
        else if (width > 0 && height > 0) {
            const moveHandleWidth = width * MOVE_HANDLE_WIDTH_PERCENT;
            const moveHandleX = (width - moveHandleWidth) / 2; // Centered for rect elements
            if (!moveHandle) { moveHandle = document.createElementNS(SVG_NS, "rect"); moveHandle.setAttribute("class", "move-handle"); moveHandle.setAttribute("height", String(MOVE_HANDLE_HEIGHT)); element.appendChild(moveHandle); }
            moveHandle.setAttribute("x", String(moveHandleX)); moveHandle.setAttribute("y", String(MOVE_HANDLE_OFFSET)); moveHandle.setAttribute("width", String(moveHandleWidth));
        } else if (moveHandle) { moveHandle.remove(); }
    }

    function saveDrawing() { /* ... */ }
    function loadDrawing() { /* ... */ }
    function exportDrawing() { /* ... remove only move handle */ }
    function handleImportFileRead(file) { /* ... */ }
    // Full implementations
    function saveDrawing() { clearSelection(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); localStorage.setItem("svgDrawing", dom.svgCanvas.innerHTML); alert("Drawing saved!"); }
    function loadDrawing() { const savedData = localStorage.getItem("svgDrawing"); if (savedData) { clearSelection(); dom.svgCanvas.innerHTML = savedData; dom.svgCanvas.querySelectorAll(".canvas-element").forEach(element => { const isPlayer = element.classList.contains('player-element'); ensureHandles(element, null, null, isPlayer); makeElementInteractive(element); }); alert("Drawing loaded!"); } else { alert("No saved drawing found!"); } }
    function exportDrawing() { clearSelection(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); const svgExport = dom.svgCanvas.cloneNode(true); svgExport.querySelectorAll('.selected-outline, .move-handle, .collision-indicator-rect').forEach(el => el.remove()); svgExport.setAttribute("xmlns", SVG_NS); svgExport.setAttribute("version", "1.1"); const svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(svgExport); const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "drawing.svg"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); }
    function handleImportFileRead(file) { const reader = new FileReader(); reader.onload = function(e) { try { const parser = new DOMParser(); const svgDoc = parser.parseFromString(e.target.result, "image/svg+xml"); const parseError = svgDoc.querySelector('parsererror'); if (!svgDoc.documentElement || svgDoc.documentElement.nodeName !== 'svg' || parseError) { throw new Error(`Invalid SVG file structure.${parseError ? ' ' + parseError.textContent : ''}`); } clearSelection(); dom.svgCanvas.innerHTML = ''; Array.from(svgDoc.documentElement.children).forEach(node => { const importedNode = document.importNode(node, true); if (importedNode.nodeType === Node.ELEMENT_NODE) { dom.svgCanvas.appendChild(importedNode); if (importedNode.classList?.contains('canvas-element')) { const isPlayer = importedNode.classList.contains('player-element'); ensureHandles(importedNode, null, null, isPlayer); makeElementInteractive(importedNode); } } }); alert("SVG drawing imported successfully!"); } catch (error) { console.error("Import error:", error); alert(`Failed to import SVG: ${error.message}`); } }; reader.onerror = () => alert("Error reading file."); reader.readAsText(file); }


    // --- Initialization ---
    function init() {
        loadActivities(); loadSvgLibrary();

        // Toolbar button listeners
        dom.selectToolButton?.addEventListener('click', () => setActiveTool('select'));
        dom.rotateToolButton?.addEventListener('click', () => setActiveTool('rotate'));
        dom.deleteToolButton?.addEventListener('click', () => setActiveTool('delete'));
        dom.drawingToolItems.forEach(item => {
            item.addEventListener('click', () => setActiveTool(item.dataset.tool));
        });

        // Canvas listeners
        dom.svgCanvas.addEventListener('dragover', handleCanvasDragOver); dom.svgCanvas.addEventListener('drop', handleCanvasDrop); dom.svgCanvas.addEventListener('dragleave', handleCanvasDragLeave);
        dom.svgCanvas.addEventListener('click', (e) => {
            if (e.target === dom.svgCanvas) {
                if (appState.currentTool === 'draw' && appState.activeDrawingTool) {
                    const toolConfig = playerToolMap.get(appState.activeDrawingTool);
                    const clickPt = svgPoint(dom.svgCanvas, e.clientX, e.clientY);
                    if (toolConfig && clickPt) {
                        const radius = toolConfig.radius || PLAYER_RADIUS;
                        const proposedBox = { left: clickPt.x - radius, top: clickPt.y - radius, right: clickPt.x + radius, bottom: clickPt.y + radius };
                        if (getCollidingElementsByBBox(proposedBox).length === 0) { createPlayerElement(toolConfig, clickPt.x, clickPt.y); }
                        else { console.log("Cannot place player here - collision."); }
                    }
                } else if (!appState.isSelectingRect && appState.currentTool !== 'delete' && appState.currentTool !== 'rotate') {
                    clearSelection(); setActiveTool('select');
                }
            }
        });
        dom.svgCanvas.addEventListener('mousedown', handleCanvasMouseDown, false);

        // Sidebar/File listeners
        dom.addSvgBtn.addEventListener('click', () => dom.libraryInput.click()); dom.libraryInput.addEventListener('change', (event) => { Array.from(event.target.files).forEach(handleLibraryFileRead); event.target.value = ''; });
        dom.importSvgButton.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (event) => { if (event.target.files.length > 0) { handleImportFileRead(event.target.files[0]); } event.target.value = ''; });
        // Action listeners
        dom.saveButton.addEventListener('click', saveDrawing); dom.loadButton.addEventListener('click', loadDrawing); dom.exportSvgButton.addEventListener('click', exportDrawing);
        // Global dragend listener
        document.addEventListener('dragend', (event) => { destroyGhostPreview(); clearCollisionHighlights(appState.currentlyHighlightedCollisions); }, false);
        setActiveTool('select');
    }

    document.addEventListener("DOMContentLoaded", init);

})();