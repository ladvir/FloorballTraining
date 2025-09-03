//***** js/utils.js ******
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
        // console.warn("svgPoint using fallback:", error.message); // Fallback can be noisy
        const rect = svgElement.getBoundingClientRect();
        // Ensure rect.width and rect.height are not zero to prevent division by zero
        const clientWidth = rect.width || 1;
        const clientHeight = rect.height || 1;

        // Get SVG's own width/height attributes or viewBox for aspect ratio
        let svgIntrinsicWidth = parseFloat(svgElement.getAttribute('width'));
        let svgIntrinsicHeight = parseFloat(svgElement.getAttribute('height'));

        if (isNaN(svgIntrinsicWidth) || isNaN(svgIntrinsicHeight)) {
            const viewBox = svgElement.viewBox?.baseVal;
            if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
                svgIntrinsicWidth = viewBox.width;
                svgIntrinsicHeight = viewBox.height;
            } else {
                svgIntrinsicWidth = clientWidth; // Fallback to client dimensions if no other info
                svgIntrinsicHeight = clientHeight;
            }
        }

        pt.x = (clientX - rect.left) * (svgIntrinsicWidth / clientWidth);
        pt.y = (clientY - rect.top) * (svgIntrinsicHeight / clientHeight);
        return pt;
    }
}

/** Transforms a point using a given SVGMatrix. */
export function transformPoint(x, y, matrix) {
    if (!dom.svgCanvas) return { x, y };
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
        if (!dom.svgCanvas) return null;
        transform = dom.svgCanvas.createSVGTransform();

        if (type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            transform.setTranslate(initialValueX, initialValueY);
            transformList.insertItemBefore(transform, 0);
        } else if (type === SVGTransform.SVG_TRANSFORM_ROTATE) {
            transform.setRotate(0, initialValueX, initialValueY);
            transformList.appendItem(transform);
        } else {
            transformList.appendItem(transform);
        }
    }
    return transform;
}


/** Calculates the screen-space bounding box of an SVG element, considering its transforms. */
export function getTransformedBBox(element) {
    if (!element || !element.getCTM || !element.getBBox) return null; // Added getBBox check

    let targetElementForBBox = element;
    // Check if querySelector exists before using it (for synthetic elements)
    if (typeof element.querySelector === 'function') {
        const bgRect = element.querySelector('.element-bg');
        targetElementForBBox = bgRect || element.firstElementChild || element;
    }

    // Ensure the target for BBox calculation also has getBBox
    if (!targetElementForBBox || !targetElementForBBox.getBBox) {
        // If after attempting to find a child, targetElementForBBox is invalid, 
        // but the original 'element' was valid for getBBox, use the original 'element'.
        if (element.getBBox) {
            targetElementForBBox = element;
        } else {
            // console.warn("getTransformedBBox: Target for BBox calculation is invalid.", element);
            return null;
        }
    }


    try {
        const localBBox = targetElementForBBox.getBBox();
        const transformMatrix = element.getCTM(); // Use CTM of the original group element

        if (!transformMatrix) return null;

        // If the element IS the targetElementForBBox (e.g. synthetic or simple element),
        // its localBBox is directly what we need to transform.
        // If targetElementForBBox is a child (like .element-bg), its localBBox is relative
        // to 'element'. The CTM of 'element' will transform these child-local points correctly.

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
        // console.error("Error calculating transformed BBox:", e, element, targetElementForBBox);
        return null;
    }
}