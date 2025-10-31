import { FieldOption } from '../FieldSelector';

/**
 * Vrací svgMarkup pro danou FieldOption, včetně dynamické rotace pro half-* varianty.
 * half-bottom je základ, ostatní rotují podle zadání.
 */
export function getFieldOptionSvgMarkup(option: FieldOption, allOptions: FieldOption[]): string {
    if (!option.id.startsWith('half-')) return option.svgMarkup;
    const base = allOptions.find(o => o.id === 'half-bottom');
    if (!base) return option.svgMarkup;
    let angle = 0;
    switch (option.id) {
        case 'half-bottom':
            angle = 360;
            break;
        case 'half-right':
            angle = 270;
            break;
        case 'half-left':
            angle = 90;
            break;
        case 'half-top':
            angle = 180;
            break;
        default:
            return option.svgMarkup;
    }
    return `<g style="transform-box: fill-box;transform-origin: center" transform="rotate(${angle})">${base.svgMarkup}</g>`;
}

