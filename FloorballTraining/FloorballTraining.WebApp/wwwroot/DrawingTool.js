const sizeRatio = 1;
let container;
let tool = null;
let layer;
let transformer;

let backgroundLayer;
let backgroundRect;
const toolColorPicker = document.getElementById("colorpicker");

let stage;

let images;
var x1, y1, x2, y2;

var isDrawing = false;
let mousePositionDown = null;
var points = [];

var lastX, lastY;

let toolShape ;

var sources = {
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
    Ball:"/assets/ball_ico.svg",
    Cone:"/assets/cone_ico.svg",
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


const shapeNames= ".player, .cone, .gate, .ball, .text, .circle, .rectangle, .line, .shot, .pass, .run, .run2";

function setWidth() {
    return container.offsetWidth - container.offsetLeft;
}

function setHeight() {

    return container.offsetHeight - container.offsetTop;

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
            drawImage(images.Cone, "cone");
            break;
        case "ball":
            drawImage(images.Ball, "ball");
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
    var pos = stage.getPointerPosition();
    toolShape = new window.Konva.Text({
        x: pos.x,
        y: pos.y,
        text: "Text",
        width: 200,
        draggable: true,
        name: "text"
    });


    var tr = new window.Konva.Transformer({
        node: toolShape,
        enabledAnchors: ["middle-left", "middle-right"],
        // set minimum width of text
        boundBoxFunc: function(oldBox, newBox) {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
        }
    });

    toolShape.on("transform", function() {
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
            var textPosition = toolShape.absolutePosition();

            // then lets find position of stage container on the page:
            var stageBox = stage.container().getBoundingClientRect();

            // so position of textarea will be the sum of positions above:
            var areaPosition = {
                x: stageBox.left + textPosition.x,
                y: stageBox.top + textPosition.y
            };

            // create textarea and style it
            var textarea = document.createElement("textarea");
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
            textarea.style.padding = "0px";
            textarea.style.margin = "0px";
            textarea.style.overflow = "hidden";
            textarea.style.background = "none";
            textarea.style.outline = "none";
            textarea.style.resize = "none";
            textarea.style.lineHeight = toolShape.lineHeight();
            textarea.style.fontFamily = toolShape.fontFamily();
            textarea.style.transformOrigin = "left top";
            textarea.style.textAlign = toolShape.align();
            textarea.style.color = toolShape.fill();
            var rotation = toolShape.rotation();
            var transform = "";
            if (rotation) {
                transform += "rotateZ(" + rotation + "deg)";
            }

            var px = 0;
            // also we need to slightly move textarea on firefox
            // because it jumps a bit
            var isFirefox =
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
                var isSafari = /^((?!chrome|android).)*safari/i.test(
                    navigator.userAgent
                );
                var isFirefox =
                    navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
                if (isSafari || isFirefox) {
                    newWidth = Math.ceil(newWidth);
                }

                var isEdge =
                    document.documentMode || /Edge/.test(navigator.userAgent);
                if (isEdge) {
                    newWidth += 1;
                }
                textarea.style.width = newWidth + "px";
            }

            textarea.addEventListener("keydown",
                function(e) {
                    // hide on enter
                    // but don't hide on shift + enter
                    if (e.keyCode === 13 && !e.shiftKey) {
                        toolShape.text(textarea.value);
                        removeTextarea();
                    }
                    // on esc do not set value back to node
                    if (e.keyCode === 27) {
                        removeTextarea();
                    }
                });

            textarea.addEventListener("keydown",
                function(e) {
                    var scale = toolShape.getAbsoluteScale().x;
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


function startDrawingCircle()
{
   var pos = stage.getPointerPosition();
    toolShape = new window.Konva.Circle({
        x: pos.x,
        y: pos.y,
        stroke: "black",
        strokeWidth: 2,
        draggable: true,
        name: "circle"
    });
    layer.add(toolShape);
}

function stopDrawingCircle()
{
    var pos = stage.getPointerPosition();

    toolShape.radius(Math.abs(pos.x - toolShape.x()));
    
    
    stage.batchDraw();
}

function startDrawingRectangle()
{
    var pos = stage.getPointerPosition();
    toolShape = new window.Konva.Rect({
        x: pos.x,
        y: pos.y,
        stroke: "black",
        strokeWidth: 2,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "rectangle"
    });
    layer.add(toolShape);
}

function stopDrawingRectangle()
{
    var pos = stage.getPointerPosition();

    toolShape.width(pos.x - toolShape.x());
    toolShape.height(pos.y - toolShape.y());
    
    stage.batchDraw();
}

function startDrawingLine() {
    var pos = stage.getPointerPosition();
    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: "black",
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
    var pos = stage.getPointerPosition();
    var points = toolShape.points();

    points[2] = pos.x;
    points[3] = pos.y;
    toolShape.points(points);

    layer.batchDraw();
}

function startDrawingPass() {
    var pos = stage.getPointerPosition();

    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y],
        draggable: true,
        name: "pass",
        stroke: "black",
        
        strokeWidth: 2
    });
    layer.add(toolShape);
}
function stopDrawingPass() {
    var pos = stage.getPointerPosition();
    var points = toolShape.points();
    
    points[2] = pos.x;
    points[3] = pos.y;

    toolShape.destroy();
    
    toolShape = new window.Konva.Arrow({
        points: points,
        draggable: true,
        name: "pass",
        pointerLength: 20,
        pointerWidth: 20,
        stroke: "black",
        fill: "white",
        strokeWidth: 2
    });

    layer.add(toolShape);
    layer.batchDraw();
}
function startDrawingShot() {
    var pos = stage.getPointerPosition();


    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y],
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "shot",
        pointerLength: 20,
        pointerWidth: 20,
        fill: "black",
        stroke: "black",
        strokeWidth: 4,
    });
    layer.add(toolShape);
}
function stopDrawingShot() {
    var pos = stage.getPointerPosition();
    var points = toolShape.points();
    
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
        fill: "black",
        stroke: "black",
        strokeWidth: 4,
        dash: [15,10]

    });

    layer.add(toolShape);
    layer.batchDraw();
}



function startDrawingRun() {

    var pos = stage.getPointerPosition();
    
    toolShape = new window.Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        strokeWidth: 2,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "run", 
});
    layer.batchDraw();
}

function stopDrawingRun() {
    var pos = stage.getPointerPosition();
    var points = toolShape.points();

    points.push(pos.x);
    points.push(pos.y);

    toolShape.destroy();

    toolShape = new window.Konva.Arrow({
        points: points,
        draggable: true,
        name: "run",
        pointerLength: 20,
        pointerWidth: 20,
        stroke: "black",
        strokeWidth: 2,
        tension: 0.8
    });

    layer.add(toolShape);
    layer.batchDraw();
}


function startDrawingRun2() {

    var pos = stage.getPointerPosition();
    points = [pos.x, pos.y];

    toolShape = new window.Konva.Line({
        points: points,
        strokeWidth: 2,
        lineCap: "round",
        lineJoin: "round",
        draggable: true,
        name: "run2"
});
    layer.add(toolShape);
}

function stopDrawingRun2() {
    var pos = stage.getPointerPosition();
    var points = toolShape.points();

    points.push(pos.x);
    points.push(pos.y);

    
    var len = points.length;

    toolShape.destroy();

    var rot = Math.atan2(points[len - 1] - points[len - 3], points[len - 2] - points[len - 4]) * 180 / Math.PI;

    //console.log(rot);


    toolShape = new window.Konva.Arrow({
        points: points,
        draggable: true,
        name: "run2",
        pointerLength: 20,
        pointerWidth: 20,
        
        stroke: "black",
        strokeWidth: 2,
        dash: [15, 10],
        tension: 0.8
    });

    layer.add(toolShape);
    layer.batchDraw();
}


function drawImage(drawingImage, imageName ) {
    const image = new window.Konva.Image({
        image: drawingImage,
        draggable: true,
        name: imageName
    });

    var mousePos = stage.getPointerPosition();
    var imageCenterX = image.x() + image.width() / 2;
    var imageCenterY = image.y() + image.height() / 2;
    var dx = mousePos.x - imageCenterX;
    var dy = mousePos.y - imageCenterY;

    // Update the image's position to center it around the mouse cursor
    image.position({
        x: image.x() + dx,
        y: image.y() + dy
    });

    layer.add(image);
    
}

function clearBackgroundLayer() {


    backgroundLayer.removeChildren();

}


function drawBackGround(backgroundId) {
    clearBackgroundLayer();
    var stageWidth = setWidth();
    var stageHeight = setHeight();
    
    var field = stage.find((node) => node.name().indexOf("field")>-1)[0];

    var x = stage.findOne("field");

    var backgroundName = backgroundId !== "" && backgroundId !== undefined
        ? backgroundId
        : (field !== undefined && field !==null ? field.attrs["name"] : "CompletHorizontalSvg");


    backgroundName = backgroundName!==undefined && backgroundName!==null ? backgroundName.replace("field_", "") : "CompletHorizontalSvg";
    var img = backgroundImages.get(backgroundName);
    

    // Resize the image proportionally to fit the stage size
    var imageAspectRatio = img.width / img.height;
    var stageAspectRatio = stageWidth / stageHeight;

    var newImageWidth, newImageHeight;
    if (imageAspectRatio > stageAspectRatio) {
        newImageWidth = stageWidth;
        newImageHeight = stageWidth / imageAspectRatio;
    } else {
        newImageWidth = stageHeight * imageAspectRatio;
        newImageHeight = stageHeight;
    }

    backgroundRect = new window.Konva.Image({
        image: img,
        width:newImageWidth,
        height:newImageHeight,
        name: "field_" + backgroundName
    });

    // center position 
    backgroundRect.position({
        x: ((stage.width() - backgroundRect.width() )  / 2) ,
        y: ((stage.height() - backgroundRect.height()) / 2)
    });
    
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
    // Remove all shapes from the layer
    layer.removeChildren();
    // Draw the empty layer to clear the stage visually
    layer.draw();
}

function downloadUri(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    link = null;
    //delete link;
}
function countProperties(obj) {
    var count = 0;

    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}
function loadImages(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages = countProperties(sources);

    for (var src in sources) {
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
    
    var loadedImages = 0;
    var numImages = backgrounds.size;


    backgrounds.forEach((value, key) => {
        var img = new Image();

        img.onload = function() {
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

export function setTool(toolid) {
    if (toolid === "") toolid = null;
    tool = toolid;
    console.log("set tool:"+toolid);
}
export function setField(field) {

    field = replaceString("_ico.png", ".svg", field);
    var backgroundId = getByValue(backgrounds, field);

    if (backgroundId !== undefined) {
        drawBackGround(backgroundId);
    }

}

function getByValue(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}

export function setField0(field) {

    field = replaceString("_ico.png", ".svg", field);
    for (var img in images) {
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
    var dataUrl = stage.toDataURL({ pixelRatio: 1 });
    downloadUri(dataUrl, "stage.png");
}

export function saveAsJson() {
    var json = stage.toJSON();
    return json;
}

export function loadDrawing(drawingJson) {
    if (drawingJson === "") return;
    init("container", drawingJson);
};
   

export function deleteSelectedShapes() {
    
    transformer.nodes().forEach(node => {
        if (node instanceof window.Konva.Shape) {
            
                node.destroy(); // Remove the selected shape from the layer
                transformer.detach(); // Detach the transformer from the shape
                layer.draw(); // Redraw the layer without the deleted shape
            
        }
    });
}

function isShape (target) {
    let names = shapeNames.split(", .");
    for (var i=0; i<names.length-1; i++) {
        
            if (target.indexOf(names[i])>=0) return true;
        
    }
    return false;
};


export function init(containerId, contentForLoad) {
    container = document.getElementById(containerId);


    var selectionRectangle = null;

    if (stage===undefined || contentForLoad === "" || contentForLoad === null || contentForLoad === undefined) {
        stage = new window.Konva.Stage({
            container: containerId,
            width: setWidth(),
            height: setHeight()
        });

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
    }

    loadImages(sources, function (locimages) {
        images = locimages;
    });

    loadBackgrounds(function() {
        drawBackGround();
    });

    //mousedown touchstart
    stage.on("mousedown touchstart", (e) => {
        
        console.log("mousedown , tool: "+ tool + ", isdrawing:" + isDrawing );

        if (e.target !== stage && e.target !== backgroundRect) {
            return;
        }


        mousePositionDown = {
            x: stage.getPointerPosition().x,
            y: stage.getPointerPosition().y
        };

        if (tool===null) {
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
        if (!selectionRectangle.visible() && tool===null  ) {
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

        console.log("mouseup, tool: "+ tool + ", isdrawing:" + isDrawing );

        // do nothing if we didn't start selection
        if (!selectionRectangle.visible() && tool=== null) {
            return false;
        }

        if (tool !== null) {
            isDrawing = false;
        } else {
            e.evt.preventDefault();
            // update visibility in timeout, so we can check it in click event
            setTimeout(() => {
                selectionRectangle.visible(false);
            });

            var shapes = stage.find(shapeNames);
            var box = selectionRectangle.getClientRect();
            var selected = shapes.filter((shape) =>
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
        
        if (selectionRectangle.visible() ) {
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
    stage.on("wheel", (e) => {
        console.log("wheel, tool: "+ tool + ", isdrawing:" + isDrawing);
        e.evt.preventDefault();

        // Calculate the current zoom level of the stage
        var oldScale = stage.scaleX();

        // Determine the new zoom level based on the mousewheel direction
        var newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;

        // Set minimum and maximum zoom levels if necessary
        // newScale = Math.max(0.2, Math.min(newScale, 2));

        // Apply the new zoom level to the stage
        stage.scaleX(newScale);
        stage.scaleY(newScale);

        // Make sure to redraw the layer after changing the zoom
        layer.batchDraw();
    });

    window.addEventListener("resize", function () {
        resizeBackgroundLayer();
    });

    stage.batchDraw();
}

