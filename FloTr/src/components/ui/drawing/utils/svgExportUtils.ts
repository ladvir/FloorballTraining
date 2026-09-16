const SVG_XMLNS = 'http://www.w3.org/2000/svg'
const XLINK_XMLNS = 'http://www.w3.org/1999/xlink'

/** Clones an SVG canvas element with explicit xmlns/width/height/viewBox, so the
 * result rasterizes correctly as a standalone image (SVG/PNG/GIF export). */
export function prepareSvgClone(svg: SVGSVGElement): {
  clone: SVGSVGElement
  width: number
  height: number
} {
  const clone = svg.cloneNode(true) as SVGSVGElement
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', SVG_XMLNS)
  if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', XLINK_XMLNS)

  const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : (null as SVGRect | null)
  const width =
    vb && vb.width ? vb.width : svg.width?.baseVal?.value ? svg.width.baseVal.value : 800
  const height =
    vb && vb.height ? vb.height : svg.height?.baseVal?.value ? svg.height.baseVal.value : 600

  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.getAttribute('viewBox') && vb) {
    clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`)
  }
  return { clone, width, height }
}

export function serializeSvgElement(svg: SVGSVGElement): string {
  const serializer = new XMLSerializer()
  let source = serializer.serializeToString(svg)
  if (!source.startsWith('<?xml')) {
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source
  }
  return source
}

export function rasterizeSvgToCanvas(
  svgString: string,
  width: number,
  height: number,
  scale = 1
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(Math.round(width * scale), 1)
      canvas.height = Math.max(Math.round(height * scale), 1)
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to rasterize SVG'))
    }
    img.src = url
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
