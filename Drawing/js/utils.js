// js/utils.js
import { dom } from './dom.js';

// Although SVG_NS is global, importing explicitly is clearer

/** Creates an SVGPoint transformed from client coordinates to SVG coordinates. */
export function svgPoint(svgElement, clientX, clientY) {
    if (!svgElement) return null;
    const pt = svgElement.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    try {
        const ctm = svgElement.getScreenCTM();
        if (!ctm) throw new Error("Could not get CTM");
        return pt.matrixTransform(ctm.inverse());
    } catch (error) {
        console.warn("svgPoint using fallback:", error.message);
        const rect = svgElement.getBoundingClientRect();
        const svgWidth = parseFloat(svgElement.getAttribute('width') || rect.width) || 1;
        const svgHeight = parseFloat(svgElement.getAttribute('height') || rect.height) || 1;
        pt.x = (clientX - rect.left) * (svgWidth / rect.width);
        pt.y = (clientY - rect.top) * (svgHeight / rect.height);
        return pt;
    }
}

/** Transforms a point using a given SVGMatrix. */
export function transformPoint(x, y, matrix) {
    // Need an SVG point to perform matrix transformation; use the main canvas
    if (!dom.svgCanvas) return { x, y }; // Fallback if canvas not ready
    const pt = dom.svgCanvas.createSVGPoint();
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(matrix);
}

/** Gets or adds an SVGTransform of a specific type to an element's transform list. */
export function getOrAddTransform(transformList, type, initialValueX = 0, initialValueY = 0) {
    let transform = null;
    for (let i = 0; i < transformList.numberOfItems; i++) {
        if (transformList.getItem(i).type === type) {
            transform = transformList.getItem(i);
            break;
        }
    }
    if (!transform) {
        // Need the SVG element to create transforms
        if (!dom.svgCanvas) return null; // Cannot create if canvas not ready
        transform = dom.svgCanvas.createSVGTransform();

        if (type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            transform.setTranslate(initialValueX, initialValueY);
            transformList.insertItemBefore(transform, 0); // Insert translate first
        } else if (type === SVGTransform.SVG_TRANSFORM_ROTATE) {
            transform.setRotate(0, initialValueX, initialValueY); // Angle, cx, cy
            transformList.appendItem(transform); // Append rotate after translate
        } else {
            transformList.appendItem(transform); // Append other types
        }
    }
    return transform;
}


/** Calculates the screen-space bounding box of an SVG element, considering its transforms. */
export function getTransformedBBox(element) {
    if (!element || !element.getCTM) return null;
    // Base BBox calculation on the background rect for consistency if available
    const bgRect = element.querySelector('.element-bg');
    const targetElementForBBox = bgRect || element.firstElementChild || element; // Fallback if no bgRect

    if (!targetElementForBBox.getBBox) return null;

    try {
        const localBBox = targetElementForBBox.getBBox();
        const transformMatrix = element.getCTM();

        if (!transformMatrix) return null;

        const p1Local = { x: localBBox.x, y: localBBox.y };
        const p2Local = { x: localBBox.x + localBBox.width, y: localBBox.y };
        const p3Local = { x: localBBox.x + localBBox.width, y: localBBox.y + localBBox.height };
        const p4Local = { x: localBBox.x, y: localBBox.y + localBBox.height };

        const p1Global = transformPoint(p1Local.x, p1Local.y, transformMatrix);
        const p2Global = transformPoint(p2Local.x, p2Local.y, transformMatrix);
        const p3Global = transformPoint(p3Local.x, p3Local.y, transformMatrix);
        const p4Global = transformPoint(p4Local.x, p4Local.y, transformMatrix);

        const left = Math.min(p1Global.x, p2Global.x, p3Global.x, p4Global.x);
        const top = Math.min(p1Global.y, p2Global.y, p3Global.y, p4Global.y);
        const right = Math.max(p1Global.x, p2Global.x, p3Global.x, p4Global.x);
        const bottom = Math.max(p1Global.y, p2Global.y, p3Global.y, p4Global.y);

        return { left, top, right, bottom, width: right - left, height: bottom - top };

    } catch (e) {
        console.error("Error calculating transformed BBox:", e, element);
        return null;
    }
}