
let container;
let isDrawing = false;
let tool = "";
let layer ;
let selectedShape = null;
let selectedShapeOriginal = null;
let mouseDownPosition = null;

let backgroundLayer ;
let backgroundRect;
const toolColorPicker = document.getElementById('colorpicker');

var stage;

let images;

export function init(containerId) {
    container = document.getElementById(containerId);


    stage = new window.Konva.Stage({
        container: containerId,
        width: window.innerWidth - container.offsetLeft,
        height: window.innerHeight - container.offsetTop
    });

    layer = new window.Konva.Layer();
    backgroundLayer = new window.Konva.Layer();

    stage.add(backgroundLayer);

    stage.add(layer);
    stage.draw();

    stage.on("mousedown", mouseDownHandler);
    stage.on("mousemove", mouseMoveHandler);
    stage.on("mouseup", mouseUpHandler);

    window.addEventListener('resize', function() {
        updateStageSize();
    });

loadImages(sources, function(locimages) {
    images = locimages;
            drawBackGround(images);
        });


}


function drawPlayer() {
    isDrawing = false;
    createImageElement(images.player);
    
}

function createImageElement(src) {

    

    const image = new window.Konva.Image({
        image: src,
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        draggable: true
    });

    layer.add(image);
    layer.draw();

    return image;
}


function drawBackGround(images) {
   backgroundRect = new window.Konva.Image({
       x: 0,
       y: 0,
       //width: window.innerWidth - container.offsetLeft,
     //  height: window.innerHeight - container.offsetTop,
       
       image : images.florballsvg
   });

   



// Add the background rectangle to the background layer
    backgroundLayer.add(backgroundRect);

// Draw the stage
    backgroundLayer.draw();
}

//function updateStageSize() {
//    stage.width(window.innerWidth - container.offsetLeft);
//    stage.height(window.innerHeight - container.offsetTop);
//    backgroundRect.width(window.innerWidth - container.offsetLeft);
//    backgroundRect.height(window.innerHeight - container.offsetTop);
//    backgroundLayer.batchDraw();
//}

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
        
        case "delete":
                deleteSelectedShape();
                break;

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


function drawGate() {
    isDrawing = false;

    return new window.Konva.Path({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        data:
            'M213.1,6.7c-32.4-14.4-73.7,0-88.1,30.6C110.6,4.9,67.5-9.5,36.9,6.7C2.8,22.9-13.4,62.4,13.5,110.9C33.3,145.1,67.5,170.3,125,217c59.3-46.7,93.5-71.9,111.5-106.1C263.4,64.2,247.2,22.9,213.1,6.7z',
        fill: 'green',
        scaleX: 0.5,
        scaleY: 0.5,
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


function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}
function loadImages(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages  = countProperties(sources);

    for (var src in sources) {
        if(sources.hasOwnProperty(src))
        images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
}

var sources = {
    florball: '/assets/florball.png',
    florballsvg: '/assets/florball.svg',
    hriste: '/assets/hriste.png',
    player: '/assets/man.svg'

};



