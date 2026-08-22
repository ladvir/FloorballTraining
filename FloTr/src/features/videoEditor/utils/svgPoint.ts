import type { MouseEvent, TouchEvent } from 'react'

/** Converts a mouse/touch client position into the SVG element's own viewBox coordinate space. */
export function clientToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect()
  const viewBox = svg.viewBox.baseVal
  const scaleX = viewBox.width / rect.width
  const scaleY = viewBox.height / rect.height
  return {
    x: viewBox.x + (clientX - rect.left) * scaleX,
    y: viewBox.y + (clientY - rect.top) * scaleY,
  }
}

export function eventClientPoint(e: MouseEvent | TouchEvent): {
  clientX: number
  clientY: number
} {
  if ('touches' in e) {
    const t = e.touches[0] ?? e.changedTouches[0]
    return { clientX: t.clientX, clientY: t.clientY }
  }
  return { clientX: e.clientX, clientY: e.clientY }
}
