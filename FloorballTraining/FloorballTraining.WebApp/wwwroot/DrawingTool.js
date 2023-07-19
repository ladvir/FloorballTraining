

let isDrawing = false;
let tool = "";
let color ="";
let layer ;
const toolPersonButton = document.getElementById("person");
const toolGateButton = document.getElementById("gate");
const toolConeButton = document.getElementById("cone");
const toolBallButton = document.getElementById("ball");
const toolSaveDrawingButton = document.getElementById('savedrawing');

const toolColorPicker = document.getElementById('colorpicker');

var stage;

export function init(containerId) {
    const canvas = document.getElementById(containerId);

    stage = new Konva.Stage({
    container: containerId,
    width: window.innerWidth - canvas.offsetLeft,
    height: window.innerHeight - canvas.offsetTop
});

layer = new Konva.Layer();

stage.add(layer);
stage.draw();

stage.on("mousedown", mouseDownHandler);
stage.on("mousemove", mouseMoveHandler);
stage.on("mouseup", mouseUpHandler);
}


export function setTool(toolid) {
  tool = toolid
  }

export function saveDrawing() {
    var dataURL = stage.toDataURL({ pixelRatio: 1 });
        downloadURI(dataURL, 'stage.png');
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
}

function drawPlayer() {
    isDrawing = false;
    
    return new Konva.Rect({
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
    return new Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 200,
        height: 200,
        stroke: toolColorPicker.value,
        draggable: true
    });
}

function drawCone() {
    return new Konva.Rect({
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
    return new Konva.Circle({

        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        radius : 50,
        stroke : toolColorPicker.value,
        draggable: true
    });
}


function downloadURI(uri, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    link = null;
    //delete link;
}

