
let container;
let isDrawing = false;
let tool = "";
let layer ;
let mouseDownPosition = null;

const toolColorPicker = document.getElementById('colorpicker');

var stage;

export function init(containerId) {
    container = document.getElementById(containerId);

    
    stage = new window.Konva.Stage({
    container: containerId,
    width: window.innerWidth - container.offsetLeft,
    height: window.innerHeight - container.offsetTop
});

layer = new window.Konva.Layer();

stage.add(layer);
stage.draw();

stage.on("mousedown", mouseDownHandler);
stage.on("mousemove", mouseMoveHandler);
stage.on("mouseup", mouseUpHandler);
}


export function setTool(toolid) {
    tool = toolid;
}

export function newDrawing() {
    clearStage();
}

export function saveDrawing() {
    var dataUrl = stage.toDataURL({ pixelRatio: 1 });
        downloadUri(dataUrl, 'stage.png');
}


function clearStage() {
    // Remove all shapes from the layer
    layer.removeChildren();
    // Draw the empty layer to clear the stage visually
    layer.draw();
}

function getMousePosition(event, element) {
    let position = {
        x: event.clientX - element.offsetLeft,
        y: event.clientY - element.offsetTop
    }
    return position;
}

function mouseDownHandler() {
    isDrawing = true;
    
    var shape = null;
    switch (tool) {
        case "player": shape = drawPlayer(); break;
        case "gate": shape = drawGate();  break;
        case "cone": shape = drawCone(); break;
        case "ball": shape = drawBall(); break;
    }

    if (shape !== null) {
        layer.add(shape).batchDraw();
    }
}

function mouseMoveHandler() {
    isDrawing = false;
}

function mouseUpHandler() {
    if (!isDrawing) return false;
    return true;
}

function drawPlayer() {
    isDrawing = false;
    
    return new window.Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 20,
        height: 20,
        stroke: toolColorPicker.value,
        draggable: true
    });
}
function drawGate() {
    isDrawing = false;
    return new window.Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 200,
        height: 200,
        stroke: toolColorPicker.value,
        draggable: true
    });
}

function drawCone() {
    return new window.Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 20,
        height: 50,
        stroke: toolColorPicker.value,
        draggable: true
    });
}

function drawBall() {
    
    isDrawing = false;
    return new window.Konva.Circle({

        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        radius : 50,
        stroke : toolColorPicker.value,
        draggable: true
    });
}



function downloadUri(uri, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    link = null;
    //delete link;
}

