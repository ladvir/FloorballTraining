
let container;
let tool = "";
let layer;
let transformer;

let backgroundLayer;
let backgroundRect;
const toolColorPicker = document.getElementById('colorpicker');

var stage;

let images;
var x1, y1, x2, y2;


var sources = {
    player: '/assets/man.svg',

    BlankHorizontalIcon: '/assets/fields/blank_horizontal_ico.png',
    BlankHorizontalSvg: '/assets/fields/blank_horizontal.svg',

    BlankVerticalIcon: '/assets/fields/blank_vertical_ico.png',
    BlankVerticalSvg: '/assets/fields/blank_vertical.svg',

    CompletHorizontalIcon: '/assets/fields/complet_horizontal_ico.png',
    CompletHorizontalSvg: '/assets/fields/complet_horizontal.svg',

    CompletVerticalIcon: '/assets/fields/complet_vertical_ico.png',
    CompletVerticalSvg: '/assets/fields/complet_vertical.svg',
    
    HalfBottomIcon: '/assets/fields/half_bottom_ico.png',
    HalfBottomSvg: '/assets/fields/half_bottom.svg',

    HalfLeftIcon: '/assets/fields/half_left_ico.png',
    HalfLeftSvg: '/assets/fields/half_left.svg',

    HalfRightIcon: '/assets/fields/half_right_ico.png',
    HalfRightSvg: '/assets/fields/half_right.svg',

    HalfTopIcon: '/assets/fields/half_top_ico.png',
    HalfTopSvg: '/assets/fields/half_top.svg'
};



function drawPlayer() {
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

function clearBackgroundLayer() {
    backgroundLayer.removeChildren(); // Remove all the child nodes from the background layer
    backgroundLayer.draw(); // Redraw the layer to update the changes
}
function drawBackGround(src) {
    clearBackgroundLayer();
    var stageWidth = stage.width();
    var stageHeight = stage.height();

    // Resize the image proportionally to fit the stage size
    var imageAspectRatio = src.width / src.height;
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
        x: 0,
        y: 0,
        image: src,
        width:newImageWidth,
        height:newImageHeight,
        name: 'backgroundrect'
    });

    backgroundLayer.add(backgroundRect);
    backgroundLayer.draw();
}
function findImageByName(name) {
    // Use the 'find' method of the stage to search for the node by its name
    var imageNode = stage.find((node) => node.name() === name)[0];

    // Return the found image node, or null if not found
    return imageNode || null;
}

// Get the image data of a specific Konva.Image
function getImageData(imageNode) {
    if (imageNode) {
        // The image data is stored in the 'image' property of the Konva.Image node
        var imageData = imageNode.image();
        return imageData;
    } else {
        return null;
    }
}
function resizeBackgroundLayer() {
    stage.width(window.innerWidth - container.offsetLeft);
    stage.height(window.innerHeight - container.offsetLeft);
    
    var imageNameToFind = "backgroundrect"; // Replace this with the name of the image you want to find
    var foundImage = findImageByName(imageNameToFind);

    if (foundImage) {
        var imageData = getImageData(foundImage);
        drawBackGround(imageData);
    }

    stage.batchDraw();
}

function clearStage() {
    // Remove all shapes from the layer
    layer.removeChildren();
    // Draw the empty layer to clear the stage visually
    layer.draw();
}

function drawGate() {
    isDrawing = false;

    return new window.Konva.Path({
        x: stage.getPointerPosition().x,
        y: stage.getPointerPosition().y,
        data: '"<svg style=""width: 24px; height: 24px; "" viewBox=""0 0 24 24""><circle cx=""32"" cy=""13.48"" r=""5.91"" stroke-linecap=""round""/><path d=""M25.48,56.43V43.83a2.18,2.18,0,0,0-.73-1.64l-2.19-2a1.11,1.11,0,0,1-.36-.82v-13a2.21,2.21,0,0,1,2.2-2.21H38.5a3.31,3.31,0,0,1,3.3,3.31v12a1.14,1.14,0,0,1-.3.76l-2.11,2.25a2.18,2.18,0,0,0-.6,1.51V56.43"" /></svg>"',
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
        radius: 50,
        stroke: toolColorPicker.value,
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
function replaceString(oldS, newS, fullS) {
    return fullS.split(oldS).join(newS);
}

export function setTool(toolid) {
    tool = toolid;
}
export function setField(field) {

    field = replaceString("_ico.png", ".svg", field);
    for (var img in images) {
        if (images.hasOwnProperty(img))
            if (images[img].src.endsWith(field)) {
                drawBackGround(images[img]);
                break;
            }
    }
}
export function newDrawing() {
    clearStage();
}
export function saveDrawing() {
    var dataUrl = stage.toDataURL({ pixelRatio: 1 });
    downloadUri(dataUrl, 'stage.png');
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
export function init(containerId) {
    container = document.getElementById(containerId);

    stage = new window.Konva.Stage({
        container: containerId,
        width: window.innerWidth - container.offsetLeft,
        height: window.innerHeight - container.offsetTop
    });
    backgroundLayer = new window.Konva.Layer();
    backgroundLayer.name('backgroundlayer');
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

        if (e.target !== stage && e.target !== backgroundRect) {
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
            switch (tool) {
                case "player":
                    drawPlayer();
                    break;
                case "gate":
                    drawGate();
                    break;
                case "cone":
                    drawCone();
                    break;
                case "ball":
                    drawBall();
                    break;

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
            height: Math.abs(y2 - y1)
        });
    });

    stage.on('mouseup touchend', (e) => {


        // do nothing if we didn't start selection
        if (!selectionRectangle.visible()) {
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
        return null;
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
    
    stage.on('wheel', (e) => {
        e.evt.preventDefault();

        // Calculate the current zoom level of the stage
        var oldScale = stage.scaleX();

        // Determine the new zoom level based on the mousewheel direction
        var newScale = e.evt.deltaY > 0 ? oldScale * 1.1 : oldScale / 1.1;

        // Set minimum and maximum zoom levels if necessary
        // newScale = Math.max(0.2, Math.min(newScale, 2));

        // Apply the new zoom level to the stage
        stage.scaleX(newScale);
        stage.scaleY(newScale);

        // Make sure to redraw the layer after changing the zoom
        layer.batchDraw();
    });
    
    loadImages(sources, function (locimages) {
        images = locimages;
        drawBackGround(images.CompletHorizontalSvg);
    });

    window.addEventListener("resize", function () {
        resizeBackgroundLayer();

    });
}

