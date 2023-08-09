let container;
let layer;
let backgroundLayer;
let backgroundRect;
let images;
let contentForLoad;
var stage;

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
function setWidth() {
    return container.innerWidth ;
}

function setHeight() {
    return container.innerHeight ;
}
function drawBackGround(backgroundId) {
    var stageWidth = setWidth();
    var stageHeight = setHeight();
    
    var field = stage.findOne("#background");

    var backgroundName = backgroundId !== "" && backgroundId !== undefined
        ? backgroundId
        : (field !== undefined && field !==null ? field.attrs["name"] : "CompletHorizontalSvg");

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
    
    backgroundLayer.removeChildren();

    backgroundRect = new window.Konva.Image({
        image: img,
        width:stageWidth,
        height:stageHeight,
        id: "background",
        name: backgroundName
    });

    // center position 
    backgroundRect.position({
        x: 0,// ((stage.width() - backgroundRect.width() )  / 2) ,
        y: 0//((stage.height() - backgroundRect.height()) / 2)
    });
    
    backgroundLayer.add(backgroundRect);
    backgroundLayer.moveToBottom();
    
    backgroundLayer.batchDraw();
    //stage.batchDraw();
}
function loadImages(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages = sources.size;

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

export function loadDrawing(containerId,drawingJson, maxWidth) {
    if (drawingJson === "") return;
    init(containerId, drawingJson, maxWidth);
};

function scaleStage(desiredWidth, desiredHeight) {
    var originalWidth = stage.width();
    var originalHeight = stage.height();

    var ratio = desiredWidth / originalWidth;

    stage.width(desiredWidth);
    stage.height(stage.height()*ratio);
    stage.scale({ x: ratio, y: ratio });
}

export function init(containerId, contentForLoad, maxWidth) {
    container = document.getElementById(containerId);
    
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

    } else {

        stage = window.Konva.Node.create(contentForLoad, containerId);

        backgroundLayer = stage.findOne(".backgroundLayer");

        layer = stage.findOne(".drawingLayer");
    }

    loadImages(sources, function (locimages) {
        images = locimages;
    });

    loadBackgrounds(function() {
        drawBackGround();
    });

    if (!maxWidth) maxWidth = stage.width();
    var maxHeight = maxWidth;
    scaleStage(maxWidth, maxHeight);

    stage.batchDraw();
}

