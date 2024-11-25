// script.js
"use strict";
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

let shapes = [];
let actionStack = [];
let redoStack = [];
let currentShape = null;
let selectedTool = null;
let selectedColor = "black"; // Default color
let selectedShape = null;
let isDrawing = false;
let startX, startY;

let isDragging = false;
let offsetX = 0, offsetY = 0;
let offsetX2 = 0, offsetY2 = 0;

const lineStyleSelector = document.getElementById("lineStyleSelector");
let selectedLineStyle = "normal"; // Default line style

// Shape Classes
class Shape {
    constructor(x, y, color = "black") {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    draw() {
    }

    contains(x, y) {
        return false;
    }
}

class Line extends Shape {
    constructor(x, y, x2, y2, color = "black", style = "normal") {
        super(x, y, color);
        this.x2 = x2;
        this.y2 = y2;
        this.style = style;
    }

    draw() {
        ctx.strokeStyle = this.color;

        switch (selectedLineStyle) {
            case "thick":
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                ctx.lineWidth = 1; // Reset line width
                break;

            case "wavy":
                ctx.lineWidth = 2;
                this.drawWavyLine();
                ctx.lineWidth = 1;
                break;

            
            case "arrow":
                ctx.lineWidth = 2;
                this.drawArrow();
                ctx.lineWidth = 1;
                break;

            case "doubleLineArrow":
                ctx.lineWidth = 2;
                this.drawDoubleLineWithArrow();
                ctx.lineWidth = 1;
                break;

            default: // normal line
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                break;
        }
    }

    drawArrow() {
        // Draw the main line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        // Calculate angle of the line
        const angle = Math.atan2(this.y2 - this.y, this.x2 - this.x);

        // Arrowhead parameters
        const arrowLength = 10; // Length of arrowhead lines
        const arrowWidth = Math.PI / 6; // 30 degrees angle for the arrowhead

        // Calculate points for the arrowhead
        const arrowX1 = this.x2 - arrowLength * Math.cos(angle - arrowWidth);
        const arrowY1 = this.y2 - arrowLength * Math.sin(angle - arrowWidth);

        const arrowX2 = this.x2 - arrowLength * Math.cos(angle + arrowWidth);
        const arrowY2 = this.y2 - arrowLength * Math.sin(angle + arrowWidth);

        // Draw the arrowhead
        ctx.beginPath();
        ctx.moveTo(this.x2, this.y2);
        ctx.lineTo(arrowX1, arrowY1);
        ctx.moveTo(this.x2, this.y2);
        ctx.lineTo(arrowX2, arrowY2);
        ctx.stroke();
    }
    
    drawWavyLine() {
        const waveLength = 10;
        const waveAmplitude = 5;
        const dx = this.x2 - this.x;
        const dy = this.y2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = distance / waveLength;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        for (let i = 0; i < steps; i++) {
            const x = this.x + (i * waveLength) * Math.cos(angle);
            const y = this.y + (i * waveLength) * Math.sin(angle);
            const offsetX = waveAmplitude * Math.sin(i * Math.PI);
            const offsetY = waveAmplitude * Math.cos(i * Math.PI);
            ctx.lineTo(x + offsetX, y + offsetY);
        }
        ctx.stroke();
    }


    drawArrowHead(x, y, angle) {
        const arrowLength = 17; // Length of arrowhead lines
        const arrowWidth = Math.PI / 5; // 30 degrees angle for the arrowhead

        // Calculate the two points for the arrowhead
        const arrowX1 = x - arrowLength * Math.cos(angle - arrowWidth);
        const arrowY1 = y - arrowLength * Math.sin(angle - arrowWidth);

        const arrowX2 = x - arrowLength * Math.cos(angle + arrowWidth);
        const arrowY2 = y - arrowLength * Math.sin(angle + arrowWidth);

        // Draw the arrowhead
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(arrowX1, arrowY1);
        ctx.moveTo(x, y);
        ctx.lineTo(arrowX2, arrowY2);
        ctx.stroke();
    }

    drawDoubleLineWithArrow() {
        const offset = 5; // Offset distance for the double line
        const arrowForwardOffset = 10; // Move arrowhead forward by 10 pixels

        // Calculate the angle of the line
        const angle = Math.atan2(this.y2 - this.y, this.x2 - this.x);

        // Calculate the offset for parallel lines
        const offsetX = offset * Math.sin(angle);
        const offsetY = offset * Math.cos(angle);

        // Draw the two parallel lines
        ctx.beginPath();
        ctx.moveTo(this.x - offsetX, this.y + offsetY);
        ctx.lineTo(this.x2 - offsetX, this.y2 + offsetY);
        ctx.moveTo(this.x + offsetX, this.y - offsetY);
        ctx.lineTo(this.x2 + offsetX, this.y2 - offsetY);
        ctx.stroke();

        // Calculate the new endpoint for the arrow by moving it forward by 10 pixels
        const arrowX = this.x2 + arrowForwardOffset * Math.cos(angle);
        const arrowY = this.y2 + arrowForwardOffset * Math.sin(angle);

        // Draw the arrowhead at this adjusted position
        this.drawArrowHead(arrowX, arrowY, angle);
    }


    contains(x, y) {
        const tolerance = 5;
        const distance = Math.abs((this.y2 - this.y) * x - (this.x2 - this.x) * y + this.x2 * this.y - this.y2 * this.x) / Math.sqrt((this.y2 - this.y) ** 2 + (this.x2 - this.x) ** 2);
        return distance <= tolerance;
    }
}

class Rectangle extends Shape {
    constructor(x, y, width, height, color = "black") {
        super(x, y, color);
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    }
}

class Circle extends Shape {
    constructor(x, y, radius, color = "black") {
        super(x, y, color);
        this.radius = radius;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    contains(x, y) {
        return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2) <= this.radius;
    }
}




function setLineStyle(style) {
    selectedLineStyle = style;
}
/*
// Update selectedLineStyle whenever the dropdown value changes
lineStyleSelector.addEventListener("change", (e) => {
    selectedLineStyle = e.target.value;
    selectedTool = "line";
});
lineStyleSelector.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent the event from closing the dropdown immediately
});*/

function newDrawing() {
    shapes=[];
    actionStack = [];
    redoStack = [];

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function saveDrawing() {
    
}

function initShot() {
    setLineStyle('doubleLineArrow');
    selectedTool = "line";
}

function initPass() {
    setLineStyle('arrow');
    selectedTool = "line";
}

function initRunStraight() {
    setLineStyle('arrow'); //todo
    selectedTool = "line";
}

function initRunFree() {
    setLineStyle('arrow'); //todo
    selectedTool = "line";
}


/*  TOOLBAR BUTTONS EVENTLISTENERS */
document.getElementById("newDrawing").addEventListener("click", () => init() );

document.getElementById("saveDrawing").addEventListener("click", () => saveDrawing() );

document.getElementById("initShot").addEventListener("click", () => initShot() );
document.getElementById("initPass").addEventListener("click", () => initPass() );

document.getElementById("runStraight").addEventListener("click", () => initRunStraight() );
document.getElementById("runFree").addEventListener("click", () => initRunFree() );


/*
document.getElementById("drawRectangle").addEventListener("click", () => selectedTool = "rectangle");
document.getElementById("drawCircle").addEventListener("click", () => selectedTool = "circle");
document.getElementById("selectTool").addEventListener("click", () => selectedTool = "select");

// Color selection
document.querySelectorAll(".colorOption").forEach(button => {
    button.addEventListener("click", (e) => {
        document.querySelectorAll(".colorOption").forEach(btn => btn.classList.remove("selected"));
        e.target.classList.add("selected");
        selectedColor = e.target.getAttribute("data-color");
    });
});
*/
// Mouse events
canvas.addEventListener("mousedown", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (selectedTool === "select") {
        // Check if any shape is clicked and set it as selectedShape
        selectedShape = shapes.find(shape => shape.contains(x, y));

        if (selectedShape) {
            isDragging = true; // Set dragging flag

            if (selectedShape instanceof Line) {
                // Calculate offsets for both points of the line
                offsetX = x - selectedShape.x;
                offsetY = y - selectedShape.y;
                offsetX2 = x - selectedShape.x2;
                offsetY2 = y - selectedShape.y2;
            } else {
                // Calculate offset between mouse and shape origin
                offsetX = x - selectedShape.x;
                offsetY = y - selectedShape.y;
            }

            render();
            drawOutline(selectedShape);
        } else {
            selectedShape = null;
            render();
        }

    } else {
        // Handle drawing logic as before
        startX = x;
        startY = y;
        isDrawing = true;

        if (selectedTool === "line") {
            currentShape = new Line(x, y, x, y, selectedColor, selectedLineStyle); // Apply selected style

        } else if (selectedTool === "rectangle") {
            currentShape = new Rectangle(startX, startY, 0, 0, selectedColor);
        } else if (selectedTool === "circle") {
            currentShape = new Circle(startX, startY, 0, selectedColor);
        }
    }
});


canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentShape) {
        const endX = e.offsetX;
        const endY = e.offsetY;

        if (isDrawing && currentShape && selectedTool === "line") {
            const endX = e.offsetX;
            const endY = e.offsetY;
            const minLineLength = 10;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Calculate the distance between the start and end points of the line
            const dx = x - startX;
            const dy = y - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is at least the minimum length
            if (distance >= minLineLength) {
                currentShape.x2 = endX;
                currentShape.y2 = endY;

                render();
                currentShape.draw();
            } else {
                console.log("Line too short, ignoring.");
            }

            
        } else if (selectedTool === "rectangle") {
            currentShape.width = endX - startX;
            currentShape.height = endY - startY;
        } else if (selectedTool === "circle") {
            currentShape.radius = Math.abs(endX - startX);
        }

        render();
        currentShape.draw();
    } else if (isDragging && selectedShape) {
        const x = e.offsetX;
        const y = e.offsetY;

        if (selectedShape instanceof Line) {
            // Move both points of the line
            selectedShape.x = x - offsetX;
            selectedShape.y = y - offsetY;
            selectedShape.x2 = x - offsetX2;
            selectedShape.y2 = y - offsetY2;
        } else {
            // Update position for other shapes
            selectedShape.x = x - offsetX;
            selectedShape.y = y - offsetY;
        }

        render();
        drawOutline(selectedShape);
    }
});

// Modify the mouseup event to stop dragging
canvas.addEventListener("mouseup", () => {
    if (isDrawing && currentShape) {
        shapes.push(currentShape);
        actionStack.push([...shapes]);
        redoStack = [];
        currentShape = null;
        isDrawing = false;
        render();
    } else if (isDragging) {
        isDragging = false; // Stop dragging
        actionStack.push([...shapes]); // Save the new position for undo/redo
        redoStack = [];
    }
});


function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => shape.draw());
}

function drawOutline(shape) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;

    if (shape instanceof Line) {
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
    } else if (shape instanceof Rectangle) {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape instanceof Circle) {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

// Shape manipulation
document.getElementById("deleteShape").addEventListener("click", () => {
    if (selectedShape) {
        shapes = shapes.filter(shape => shape !== selectedShape);
        selectedShape = null;
        actionStack.push([...shapes]);
        redoStack = [];
        render();
    }
});

document.getElementById("changeColorShape").addEventListener("click", () => {
    if (selectedShape) {
        selectedShape.color = selectedColor;
        actionStack.push([...shapes]);
        redoStack = [];
        render();
    }
});

// Undo/Redo functionality
document.getElementById("undo").addEventListener("click", () => {
    if (actionStack.length > 0) {
        redoStack.push(actionStack.pop());
        shapes = actionStack.length > 0 ? [...actionStack[actionStack.length - 1]] : [];
        render();
    }
});

document.getElementById("redo").addEventListener("click", () => {
    if (redoStack.length > 0) {
        actionStack.push(redoStack.pop());
        shapes = [...actionStack[actionStack.length - 1]];
        render();
    }
});





function init() {
    newDrawing();
    selectedTool = null;    
}


init();