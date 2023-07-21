
let container;
let isDrawing = false;
let tool = "";
let layer ;
let transformer;
let selectedShape = null;
let selectedShapeOriginal = null;
let mouseDownPosition = null;

let backgroundLayer ;
let backgroundRect;
const toolColorPicker = document.getElementById('colorpicker');

var stage;

let images;
var x1, y1, x2, y2;

export function init(containerId) {
    container = document.getElementById(containerId);


    stage = new window.Konva.Stage({
        container: containerId,
        width: window.innerWidth - container.offsetLeft,
        height: window.innerHeight - container.offsetTop
    });
    backgroundLayer = new window.Konva.Layer();

    stage.add(backgroundLayer);


    layer = new window.Konva.Layer();
    stage.add(layer);

    transformer = new window.Konva.Transformer();
    layer.add(transformer);

    // add a new feature, lets add ability to draw selection rectangle
    var selectionRectangle = new window.Konva.Rect({
        fill: 'rgba(0,0,255,0.5)',
        visible: false
    });
    layer.add(selectionRectangle);



    

    stage.on('mousedown touchstart', (e) => {
        // do nothing if we mousedown on any shape
        if (e.target !== stage) {
          return;
        }

        if (tool === "") {
            e.evt.preventDefault();
            x1 = stage.getPointerPosition().x;
            y1 = stage.getPointerPosition().y;
            x2 = stage.getPointerPosition().x;
            y2 = stage.getPointerPosition().y;

            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
        } else {

            isDrawing = true;

            var shape = null;
            switch (tool) {
            case "player":
                shape = drawPlayer();
                break;
            case "gate":
                shape = drawGate();
                break;
            case "cone":
                shape = drawCone();
                break;
            case "ball":
                shape = drawBall();
                break;

            case "delete":
                deleteSelectedShape();
                break;

            }

            if (shape !== null) {
                layer.add(shape).batchDraw();
            }
        }

    });

      stage.on('mousemove touchmove', (e) => {
          

        // do nothing if we didn't start selection
        if (!selectionRectangle.visible()) {
          return;
        }
        e.evt.preventDefault();
        x2 = stage.getPointerPosition().x;
        y2 = stage.getPointerPosition().y;

        selectionRectangle.setAttrs({
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(x2 - x1),
          height: Math.abs(y2 - y1),
        });
      });

      stage.on('mouseup touchend', (e) => {

         
        // do nothing if we didn't start selection
        if (!selectionRectangle.visible() ) {
          return false;
        }
        e.evt.preventDefault();
        // update visibility in timeout, so we can check it in click event
        setTimeout(() => {
          selectionRectangle.visible(false);
        });

        var shapes = stage.find('.mydrawing');
        var box = selectionRectangle.getClientRect();
        var selected = shapes.filter((shape) =>
          window.Konva.Util.haveIntersection(box, shape.getClientRect())
        );
        transformer.nodes(selected);
      });

      // clicks should select/deselect shapes
      stage.on('click tap', function (e) {
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
        if (!e.target.hasName('mydrawing')) {
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

    stage.draw();

    

    loadImages(sources, function(locimages) {
        images = locimages;
        //drawBackGround(images);
    });


}

function deleteSelectedShape() {
    //transformer.
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
        draggable: true,
        name: 'mydrawing'
    });

    layer.add(image);
    layer.draw();

    return image;
}


function drawBackGround(images) {
   backgroundRect = new window.Konva.Image({
       x: 0,
       y: 0,
       image : images.florballsvg
   });

   backgroundLayer.add(backgroundRect);
   backgroundLayer.draw();
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
    };
    return position;
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
        name: 'mydrawing'
    });
}

function drawCone() {
    return new window.Konva.Rect({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        width: 20,
        height: 50,
        stroke: toolColorPicker.value,
        draggable: true,
        name: 'mydrawing'
    });
}

function drawBall() {
    
    isDrawing = false;
    return new window.Konva.Circle({

        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        radius : 50,
        stroke : toolColorPicker.value,
        draggable: true,
        name: 'mydrawing'
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



