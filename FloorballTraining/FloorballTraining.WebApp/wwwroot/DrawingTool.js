


const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight

});

const layer = new Konva.Layer();
stage.add(layer);

stage.draw();

stage.on("mousedown", mouseDownHandler);
stage.on("mousemove", mouseMoveHandler);
stage.on("mouseup", mouseUpHandler);



let isDrawing = false;
let drawingShape = "";






const toolPersonButton = document.getElementById("person");
const toolGateButton = document.getElementById("gate");
const toolConeButton = document.getElementById("cone");
const toolBallButton = document.getElementById("ball");

const toolSaveDrawingButton = document.getElementById('savedrawing');


toolSaveDrawingButton.addEventListener('click',()=> {
        var dataURL = stage.toDataURL({ pixelRatio: 1 });
        downloadURI(dataURL, 'stage.png');
    }
);

// Event listeners for each tool button
toolPersonButton.addEventListener("click", () => {
    drawingShape = "person";
});

toolGateButton.addEventListener("click", () => {
    drawingShape = "gate";
});

toolConeButton.addEventListener("click", () => {
    drawingShape = "cone";
});
toolBallButton.addEventListener("click", () => {
    drawingShape = "ball";
});



function mouseDownHandler() {
    isDrawing = true;
    let shape = null;
    switch (drawingShape) {
        case "person": shape = drawPerson(); break;
        case "gate": shape = drawGate(); break;
        case "cone": shape = drawCone(); break;
        case "ball": shape = drawBall(); break;
    }

    layer.add(shape).batchDraw();

}

function mouseMoveHandler() {
    isDrawing = false;
}

function mouseUpHandler() {
    if (!isDrawing) return false;


}



function drawPerson() {
    isDrawing = false;
        toolPersonButton.click();

    drawingShape = null;


    

    return new Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 20,
        height: 20,
        stroke: "red",
        draggable: true
    });
}

function drawGate() {
    isDrawing = false;
    drawingShape = null;
    return new Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 20,
        height: 20,
        stroke: "green",
        draggable: true
    });
}

function drawCone() {
    isDrawing = false;
    drawingShape = null;
    return new Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 20,
        height: 50,
        stroke: "yellow",
        draggable: true
    });
}

function drawBall() {
    isDrawing = false;

    drawingShape = null;

    return new Konva.Rect({

        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 80,
        height: 80,
        stroke: "blue",
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

