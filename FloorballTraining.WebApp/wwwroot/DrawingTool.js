
const sizeRatio = 1;

const previewRatio = 0.3;

let container;
let tool = null;
let layer;
let transformer;

let backgroundLayer;
let backgroundRect;
let toolColorPicker;

let stage = new window.Konva.Stage({ container: "container" });

let images;
let x1, y1, x2, y2;

let isDrawing = false;

let points = [];

let toolShape;

const sources = {
    BlankHorizontalIcon: "/assets/fields/blank_horizontal_ico.png",
    BlankHorizontalSvg: "assets/fields/blank_horizontal.svg",

    BlankVerticalIcon: "/assets/fields/blank_vertical_ico.png",
    BlankVerticalSvg: "assets/fields/blank_vertical.svg",

    CompletHorizontalIcon: "/assets/fields/complet_horizontal_ico.png",
    CompletHorizontalSvg: "assets/fields/complet_horizontal.svg",

    CompletVerticalIcon: "/assets/fields/complet_vertical_ico.png",
    CompletVerticalSvg: "assets/fields/complet_vertical.svg",

    HalfBottomIcon: "/assets/fields/half_bottom_ico.png",
    HalfBottomSvg: "assets/fields/half_bottom.svg",

    HalfLeftIcon: "/assets/fields/half_left_ico.png",
    HalfLeftSvg: "assets/fields/half_left.svg",

    HalfRightIcon: "/assets/fields/half_right_ico.png",
    HalfRightSvg: "assets/fields/half_right.svg",

    HalfTopIcon: "/assets/fields/half_top_ico.png",
    HalfTopSvg: "assets/fields/half_top.svg",

    Player: "/assets/player.svg",
    Ball: "/assets/ball_ico.svg",
    Cone: "/assets/cone_ico.svg",
    Gate: "/assets/rectangle_ico.svg"
};

const backgrounds = new Map([
    ["BlankHorizontalSvg", "assets/fields/blank_horizontal.svg"],
    ["BlankVerticalSvg", "assets/fields/blank_vertical.svg"],
    ["CompletHorizontalSvg", "assets/fields/complet_horizontal.svg"],
    ["CompletVerticalSvg", "assets/fields/complet_vertical.svg"],
    ["HalfBottomSvg", "assets/fields/half_bottom.svg"],
    ["HalfLeftSvg", "assets/fields/half_left.svg"],
    ["HalfRightSvg", "assets/fields/half_right.svg"],
    ["HalfTopSvg", "assets/fields/half_top.svg"]
]);

const backgroundImages = new Map();

const shapeNames = ".player, .cone, .gate, .ball, .text, .circle, .rectangle, .line, .shot, .pass, .run, .run2";

function setWidth() {
    return container.offsetWidth;// - container.offsetLeft;
}

function setHeight() {
    return container.offsetHeight;// - container.offsetTop;
}

function addDrawing(drawing) {
    isDrawing = true;

    transformer.nodes([]);

    if (drawing === null || drawing === "" || drawing === undefined) return;

    switch (drawing.toLowerCase()) {
        case "player":
            drawImage(images.Player, "player");
            break;
        case "gate":
            drawImage(images.Gate, "gate");
            break;
        case "cone":
            drawImage(images.Cone, "cone", 40, 40);
            break;
        case "ball":
            drawImage(images.Ball, "ball", 30, 30);
            break;
        case "shot":
            startDrawingShot();
            break;

        case "line":
            startDrawingLine();
            break;
        case "pass":
            startDrawingPass();
            break;
        case "run":
            startDrawingRun();
            break;
        case "run2":
            startDrawingRun2();
            break;
        case "rectangle":
            startDrawingRectangle();
            break;
        case "circle":
            startDrawingCircle();
            break;

        case "text":
            drawTextBox();
            break;
    }
}

function finishDrawing(drawing) {
    if (drawing === null || drawing === "" || drawing === undefined) return;

    switch (drawing.toLowerCase()) {
        case "shot":
            stopDrawingShot();
            break;
        case "line":
            stopDrawingLine();
            break;

        case "pass":
            stopDrawingPass();
            break;
        case "run":
            stopDrawingRun();
            break;
        case "run2":
            stopDrawingRun2();
            break;
        case "rectangle":
            stopDrawingRectangle();
            break;
        case "circle":
            stopDrawingCircle();
            break;
    }
    layer.moveToTop();
}

function drawTextBox() {
    const pos = stage.getPointerPosition();
    toolShape = new window.Konva.Text({
        x: pos.x,
        y: pos.y,
        text: "Text",
        width: 200,
        draggable: true,
        name: "text"
    });

    const tr = new window.Konva.Transformer({
        node: toolShape,
        enabledAnchors: ["middle-left", "middle-right"],
        // set minimum width of text
        boundBoxFunc: function (oldBox, newBox) {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
        }
    });

    toolShape.on("transform", function () {
        // reset scale, so only with is changing by transformer
        toolShape.setAttrs({
            width: toolShape.width() * toolShape.scaleX(),
            scaleX: 1
        });
    });

    layer.add(toolShape);

    toolShape.on("dblclick",
        () => {
            // hide text node and transformer:

            setTool(null);
            toolShape.hide();
            tr.hide();
            layer.draw();

            // create textarea over canvas with absolute position
            // first we need to find position for textarea
            // how to find it?

            // at first lets find position of text node relative to the stage:
            const textPosition = toolShape.absolutePosition();

            // then lets find position of stage container on the page:
            const stageBox = stage.container().getBoundingClientRect();

            // so position of textarea will be the sum of positions above:
            const areaPosition = {
                x: stageBox.left + textPosition.x,
                y: stageBox.top + textPosition.y
            };

            // create textarea and style it
            const textarea = document.createElement("textarea");
            document.body.appendChild(textarea);

            // apply many styles to match text on canvas as close as possible
            // remember that text rendering on canvas and on the textarea can be different
            // and sometimes it is hard to make it 100% the same. But we will try...
            textarea.value = toolShape.text();
            textarea.style.position = "absolute";
            textarea.style.top = areaPosition.y + "px";
            textarea.style.left = areaPosition.x + "px";
            textarea.style.width = toolShape.width() - toolShape.padding() * 2 + "px";
            textarea.style.height =
                toolShape.height() - toolShape.padding() * 2 + 5 + "px";
            textarea.style.fontSize = toolShape.fontSize() + "px";
            textarea.style.border = "none";
            textarea.style.padding = "0";
            textarea.style.margin = "0";
            textarea.style.overflow = "hidden";
            textarea.style.background = "none";
            textarea.style.outline = "none";
            textarea.style.resize = "none";
            textarea.style.lineHeight = toolShape.lineHeight();
            textarea.style.fontFamily = toolShape.fontFamily();
            textarea.style.transformOrigin = "left top";
            textarea.style.textAlign = toolShape.align();
            textarea.style.color = toolShape.fill();
            const rotation = toolShape.rotation();
            let transform = "";
            if (rotation) {
                transform += "rotateZ(" + rotation + "deg)";
            }

            let px = 0;
            // also we need to slightly move textarea on firefox
            // because it jumps a bit
            const isFirefox =
                navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
            if (isFirefox) {
                px += 2 + Math.round(toolShape.fontSize() / 20);
            }
            transform += "translateY(-" + px + "px)";

            textarea.style.transform = transform;

            // reset height
            textarea.style.height = "auto";
            // after browsers resized it we can set actual value
            textarea.style.height = textarea.scrollHeight + 3 + "px";

            textarea.focus();

            function removeTextarea() {
                textarea.parentNode.removeChild(textarea);
                window.removeEventListener("click", handleOutsideClick);
                toolShape.show();
                tr.show();
                tr.forceUpdate();
                layer.draw();
            }

            function setTextareaWidth(newWidth) {
                if (!newWidth) {
                    // set width for placeholder
                    newWidth = toolShape.placeholder.length * toolShape.fontSize();
                }
                // some extra fixes on different browsers
                const isSafari = /^((?!chrome|android).)*safari/i.test(
                    navigator.userAgent
                );
                const isFirefox =
                    navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
                if (isSafari || isFirefox) {
                    newWidth = Math.ceil(newWidth);
                }

                const isEdge =
                    document.documentMode || /Edge/.test(navigator.userAgent);
                if (isEdge) {
                    newWidth += 1;
                }
                textarea.style.width = newWidth + "px";
            }

            textarea.addEventListener("keydown",
                function (e) {
                    // hide on enter
                    // but don't hide on shift + enter
                    if (e.Code === 13 && !e.shiftKey) {
                        toolShape.text(textarea.value);
                        removeTextarea();
                    }
                    // on esc do not set value back to node
                    if (e.Code === 27) {
                        removeTextarea();
                    }
                });

            textarea.addEventListener("keydown",
                function (e) {
                    const scale = toolShape.getAbsoluteScale().x;
                    setTextareaWidth(toolShape.width() * scale);
                    textarea.style.height = "auto";
                    textarea.style.height =
                        textarea.scrollHeight + toolShape.fontSize() + "px";
                });

            function handleOutsideClick(e) {
                if (e.target !== textarea) {
                    toolShape.text(textarea.value);
                    removeTextarea();
                }
            }

            setTimeout(() => {
                window.addEventListener("click", handleOutsideClick);
            });
        });
}

function startDrawingCircle() {
    const pos = stage.getPointerPosition();
    toolShape = new window.Konva.Circle({
        x: pos.x,
        y: pos.y,
        stroke: toolColorPicker.value,
        strokeWidth: 1,
        draggable: true,
        name: "circle"
    });
    layer.add(toolShape);
}

function stopDrawingCircle() {
    const pos = stage.getPointerPosition();

    toolShape.radius(Math.abs(pos.x - toolShape.x()));

    stage.batchDraw();
}

function startDrawingRectangle() {
    const pos = stage.getPointerPosition();
    toolShape = new window.Konva.Rect({
        x: pos.x,
        y: pos.y,
        stroke: toolColorPicker.value,
        strokeWidth: 1,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "rectangle"
    });
    layer.add(toolShape);
}

function stopDrawingRectangle() {
    const pos = stage.getPointerPosition();

    toolShape.width(pos.x - toolShape.x());
    toolShape.height(pos.y - toolShape.y());

    stage.batchDraw();
}

function startDrawingLine() {
    const pos = stage.getPointerPosition();
    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: toolColorPicker.value,
        strokeWidth: 2,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "line"
    });
    layer.add(toolShape);
    layer.draw();
}

function stopDrawingLine() {
    const pos = stage.getPointerPosition();
    const points = toolShape.points();

    points[2] = pos.x;
    points[3] = pos.y;
    toolShape.points(points);

    layer.batchDraw();
}

function startDrawingPass() {
    const pos = stage.getPointerPosition();

    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y],
        draggable: true,
        name: "pass",
        stroke: toolColorPicker.value,

        strokeWidth: 2
    });
    layer.add(toolShape);
}
function stopDrawingPass() {
    const pos = stage.getPointerPosition();
    const points = toolShape.points();

    points[2] = pos.x;
    points[3] = pos.y;

    toolShape.destroy();

    toolShape = new window.Konva.Arrow({
        points: points,
        draggable: true,
        name: "pass",
        stroke: toolColorPicker.value,
        fillEnabled :false,
        pointerLength: 18,     // Length of the arrowhead
        pointerWidth: 14,       // Narrow width to give an open appearance        
        lineCap: 'round',
        lineJoin: 'round',
    });

    layer.add(toolShape);
    layer.batchDraw();
}
function startDrawingShot() {
    const pos = stage.getPointerPosition();

    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y],
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "shot",
        pointerLength: 20,
        pointerWidth: 20,
        fill: toolColorPicker.value,
        stroke: toolColorPicker.value,
        strokeWidth: 4
    });
    layer.add(toolShape);
}
function stopDrawingShot() {
    const pos = stage.getPointerPosition();
    const points = toolShape.points();

    points[2] = pos.x;
    points[3] = pos.y;

    toolShape.destroy();

    toolShape = new window.Konva.Arrow({
        points: points,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "shot",
        pointerLength: 20,
        pointerWidth: 20,
        fill: toolColorPicker.value,
        stroke: toolColorPicker.value,
        strokeWidth: 4,
        dash: [15, 10]
    });

    layer.add(toolShape);
    layer.batchDraw();
}

function startDrawingRun() {
    const pos = stage.getPointerPosition();

    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        strokeWidth: 1,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "run"
    });
    layer.batchDraw();
}

function stopDrawingRun() {
    const pos = stage.getPointerPosition();
    const points = toolShape.points();

    points.push(pos.x);
    points.push(pos.y);

    toolShape.destroy();

    toolShape = new window.Konva.Arrow({
        points: points,
        draggable: true,
        name: "run",
        pointerLength: 20,
        pointerWidth: 20,
        stroke: toolColorPicker.value,
        strokeWidth: 1,
        tension: 0.8
    });

    layer.add(toolShape);
    layer.batchDraw();
}

function startDrawingRun2() {
    const pos = stage.getPointerPosition();
    points = [pos.x, pos.y];

    toolShape = new window.Konva.Line({
        points: points,
        strokeWidth: 1,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "run2"
    });
    layer.add(toolShape);
}

function stopDrawingRun2() {
    const pos = stage.getPointerPosition();
    const points = toolShape.points();

    points.push(pos.x);
    points.push(pos.y);

    toolShape.destroy();

    toolShape = new window.Konva.Arrow({
        points: points,
        draggable: true,
        name: "run2",
        pointerLength: 20,
        pointerWidth: 20,

        stroke: toolColorPicker.value,
        strokeWidth: 2,
        dash: [8, 10],
        fillAfterStrokeEnabled : true,
        tension: 0.9
    });

    layer.add(toolShape);
    layer.batchDraw();
}

function drawImage(drawingImage, imageName, width, height) {
    const image = new window.Konva.Image({
        image: drawingImage,
        draggable: true,
        name: imageName
    });

    if (width)
        image.width(width);

    if (height)
        image.height(height);

    const mousePos = stage.getPointerPosition();
    const imageCenterX = image.x() + image.width() / 2;
    const imageCenterY = image.y() + image.height() / 2;
    const dx = mousePos.x - imageCenterX;
    const dy = mousePos.y - imageCenterY;

    // Update the image's position to center it around the mouse cursor
    image.position({
        x: image.x() + dx,
        y: image.y() + dy
    });

    layer.add(image);
}

function drawBackGround(backgroundId) {
    const stageWidth = setWidth();
    const stageHeight = setHeight();

    const field = stage.findOne("#background");

    const backgroundName = backgroundId !== "" && backgroundId !== undefined
        ? backgroundId
        : (field !== undefined && field !== null ? field.attrs["name"] : "CompletHorizontalSvg");

    const img = backgroundImages.get(backgroundName);

    // Resize the image proportionally to fit the stage size
    const imageAspectRatio = img.width / img.height;
    const stageAspectRatio = stageWidth / stageHeight;

    let newImageWidth, newImageHeight;
    if (imageAspectRatio > stageAspectRatio) {
        newImageWidth = stageWidth;
        newImageHeight = stageWidth / imageAspectRatio;
    } else {
        newImageWidth = stageHeight * imageAspectRatio;
        newImageHeight = stageHeight;
    }

    backgroundLayer.removeChildren();

    backgroundRect = new window.Konva.Image({
        x: 0,
        y: 0,
        image: img,
        width: newImageWidth,
        height: newImageHeight,
        id: "background",
        name: backgroundName
    });

    //// center position
    //backgroundRect.position({
    //    x: ((stage.width() - backgroundRect.width() )  / 2) ,
    //    y: ((stage.height() - backgroundRect.height()) / 2)
    //});

    backgroundLayer.add(backgroundRect);
    backgroundLayer.moveToBottom();

    backgroundLayer.batchDraw();
    stage.batchDraw();
}

function resizeBackgroundLayer() {
    stage.width(setWidth());
    stage.height(setHeight());

    drawBackGround();
}
function clearStage() {
    layer.removeChildren();

    layer.draw();
}

function downloadUri(uri, name) {
    let link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    link = null;
}
function countProperties(obj) {
    let count = 0;

    for (let prop in obj) {
        if (obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}
function loadImages(sources, callback) {
    const images = {};
    let loadedImages = 0;
    const numImages = countProperties(sources);

    for (let src in sources) {
        if (sources.hasOwnProperty(src))
            images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
}

function loadBackgrounds(callback) {
    let loadedImages = 0;
    const numImages = backgrounds.size;

    backgrounds.forEach((value, key) => {
        const img = new Image();

        img.onload = function () {
            if (++loadedImages >= numImages) {
                callback(backgroundImages);
            }
        };
        img.src = value;
        backgroundImages.set(key, img);
    });
}

function replaceString(oldS, newS, fullS) {
    return fullS.split(oldS).join(newS);
}


function getByValue(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
    return null;
}

function isShape(target) {
    let names = shapeNames.split(", .");
    for (let i = 0; i < names.length - 1; i++) {
        if (target.indexOf(names[i]) >= 0) return true;
    }
    return false;
}

export function setTool(toolid) {
    if (toolid === "") toolid = null;
    tool = toolid;

    //console.log("set tool:"+toolid);
}
export function setField(field) {
    field = replaceString("_ico.png", ".svg", field);
    const backgroundId = getByValue(backgrounds, field);

    if (backgroundId !== undefined) {
        drawBackGround(backgroundId);
    }
}


export function setField0(field) {
    field = replaceString("_ico.png", ".svg", field);
    for (let img in images) {
        if (images.hasOwnProperty(img))
            if (images[img].src.endsWith(field)) {
                //drawBackGround(images[img]);
                break;
            }
    }
}

export function newDrawing() {
    clearStage();
}

export function saveDrawing() {
    const dataUrl = stage.toDataURL({pixelRatio: previewRatio});
    downloadUri(dataUrl, "stage.png");
}

//generate large string
export function exportImageAndGetBase64Length() {
    const dataUrl = stage.toDataURL({pixelRatio: previewRatio});
    return dataUrl.length;
}

//get part of the generated string
export function getChunk(startIndex, endIndex) {
    const dataUrl = stage.toDataURL({pixelRatio: previewRatio});
    return dataUrl.substring(startIndex, endIndex);
}

export function saveAsPng() {
    const png = stage.toDataURL({ pixelRatio: previewRatio });

    return new TextEncoder().encode(png);
}

export function saveAsJson() {
    const json = stage.toJSON();
    return json;
}

export function loadDrawing(containerId, drawingJson) {
    if (drawingJson === "") return;
    init(containerId, drawingJson);
}

export function deleteSelectedShapes() {
    transformer.nodes().forEach(node => {
        if (node instanceof window.Konva.Shape) {
            node.destroy(); // Remove the selected shape from the layer
            transformer.detach(); // Detach the transformer from the shape
            layer.draw(); // Redraw the layer without the deleted shape
        }
    });
}



export function init(containerId, contentForLoad) {
    container = document.getElementById(containerId);

    toolColorPicker = document.getElementById("colorpicker");
    toolColorPicker.value = "#000000";

    let selectionRectangle;

    if (stage === undefined || contentForLoad === "" || contentForLoad === null || contentForLoad === undefined) {
        //if (stage === undefined) {
        stage = new window.Konva.Stage({
            container: containerId,
            width: setWidth(),
            height: setHeight()
        });
        //}

        backgroundLayer = new window.Konva.Layer();
        backgroundLayer.name("backgroundLayer");
        stage.add(backgroundLayer);

        layer = new window.Konva.Layer();
        layer.name("drawingLayer");
        stage.add(layer);

        transformer = new window.Konva.Transformer();
        transformer.name("transformer");

        layer.add(transformer);

        // add a new feature, lets add ability to draw selection rectangle
        selectionRectangle = new window.Konva.Rect({
            fill: "rgba(0,0,255,0.5)",
            name: "selectionRectangle",
            visible: false
        });
        layer.add(selectionRectangle);
    } else {
        stage = window.Konva.Node.create(contentForLoad, containerId);

        selectionRectangle = stage.findOne('.selectionRectangle');

        backgroundLayer = stage.findOne(".backgroundLayer");

        layer = stage.findOne(".drawingLayer");

        transformer = stage.findOne(".transformer");

        contentForLoad = null;
    }

    loadImages(sources, function (locimages) {
        images = locimages;
    });

    loadBackgrounds(function () {
        drawBackGround();
    });

    //mousedown touchstart
    stage.on("mousedown touchstart", (e) => {
        //console.log("mousedown , tool: "+ tool + ", isdrawing:" + isDrawing );

        if (e.target !== stage && e.target !== backgroundRect) {
            return;
        }

        if (tool === null) {
            e.evt.preventDefault();
            x1 = stage.getPointerPosition().x;
            y1 = stage.getPointerPosition().y;
            x2 = stage.getPointerPosition().x;
            y2 = stage.getPointerPosition().y;

            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
        } else {
            addDrawing(tool);
        }
    });

    //mousemove touchmove
    stage.on("mousemove touchmove", (e) => {
        //console.log('mousemove, tool: '+ tool + ', isdrawing:' + isDrawing );
        // do nothing if we didn't start selection
        if (!selectionRectangle.visible() && tool === null) {
            return;
        }

        if (tool !== null) {
            if (!isDrawing) return;

            //drawShot();
            finishDrawing(tool);
        } else {
            e.evt.preventDefault();
            x2 = stage.getPointerPosition().x;
            y2 = stage.getPointerPosition().y;
            selectionRectangle.setAttrs({
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1)
            });
        }

        stage.batchDraw();
    });

    //mouseup touchend
    stage.on("mouseup touchend", (e) => {
        console.log("mouseup, tool: " + tool + ", isdrawing:" + isDrawing);

        // do nothing if we didn't start selection
        if (!selectionRectangle.visible() && tool === null) {
            return;
        }

        if (tool !== null) {
            isDrawing = false;
        } else {
            e.evt.preventDefault();
            // update visibility in timeout, so we can check it in click event
            setTimeout(() => {
                selectionRectangle.visible(false);
            });

            const shapes = stage.find(shapeNames);
            const box = selectionRectangle.getClientRect();
            const selected = shapes.filter((shape) =>
                window.Konva.Util.haveIntersection(box, shape.getClientRect())
            );
            transformer.nodes(selected);
        }

        //layer.batchDraw();
    });

    //click tap
    stage.on("click tap", function (e) {
        //console.log("click, tool: "+ tool + ", isdrawing:" + isDrawing + ", target: " + e.target.getName() );
        // if we are selecting with rect, do nothing

        if (selectionRectangle.visible()) {
            return;
        }

        // if click on empty area - remove all selections
        if (e.target === stage) {
            transformer.nodes([]);

            return;
        }

        // do nothing if clicked NOT on our rectangles
        if (!isShape(e.target.attrs["name"])) {
            return;
        }

        // do we pressed shift or ctrl?
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = transformer.nodes().indexOf(e.target) >= 0;

        if (!metaPressed && !isSelected) {
            // if no key pressed and the node is not selected
            // select just one
            transformer.nodes([e.target]);
        } else if (metaPressed && isSelected) {
            // if we pressed keys and node was selected
            // we need to remove it from selection:

            const nodes = transformer.nodes().slice(); // use slice to have new copy of array
            // remove node from array
            nodes.splice(nodes.indexOf(e.target), 1);

            transformer.nodes(nodes);
        } else if (metaPressed && !isSelected) {
            // add the node into selection
            const nodes = transformer.nodes().concat([e.target]);

            transformer.nodes(nodes);
        }
    });

    //wheel
    //stage.on("wheel", (e) => {
    //    console.log("wheel, tool: "+ tool + ", isdrawing:" + isDrawing);
    //    e.evt.preventDefault();

    //    // Calculate the current zoom level of the stage
    //    var oldScale = stage.scaleX();

    //    // Determine the new zoom level based on the mousewheel direction
    //    var newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;

    //    // Set minimum and maximum zoom levels if necessary
    //    // newScale = Math.max(0.2, Math.min(newScale, 2));

    //    // Apply the new zoom level to the stage
    //    stage.scaleX(newScale);
    //    stage.scaleY(newScale);

    //    // Make sure to redraw the layer after changing the zoom
    //    layer.batchDraw();
    //});

    //const delta = 10;

    //container.addEventListener("keydown",
    //    (e) => {
    //        e.preventDefault();

    //        if (e.key === "Delete") {
    //            deleteSelectedShapes();
    //        } else if (e.key === "ArrowLeft") {
    //            toolShape.x(toolShape.x() - delta);
    //        } else if (e.key === "ArrowUp") {
    //            toolShape.y(toolShape.y() - delta);
    //        } else if (e.key === "ArrowRight") {
    //            toolShape.x(toolShape.x() + delta);
    //        } else if (e.key === "ArrowDown") {
    //            toolShape.y(toolShape.y() + delta);
    //        } else {
    //            return;
    //        }

    //    });

    window.addEventListener("resize", function () {
        resizeBackgroundLayer();
    });

    stage.batchDraw();
}