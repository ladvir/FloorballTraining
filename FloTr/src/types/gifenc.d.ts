declare module 'gifenc' {
  export interface GifEncoderOptions {
    auto?: boolean
    initialCapacity?: number
  }

  export interface WriteFrameOptions {
    palette?: number[][]
    first?: boolean
    transparent?: boolean
    transparentIndex?: number
    delay?: number
    repeat?: number
    dispose?: number
  }

  export interface GifEncoder {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    writeHeader(): void
    reset(): void
    readonly buffer: ArrayBuffer
  }

  export type QuantizeFormat = 'rgb565' | 'rgb444' | 'rgba4444'

  export function GIFEncoder(opts?: GifEncoderOptions): GifEncoder
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: QuantizeFormat
      oneBitAlpha?: boolean | number
      clearAlpha?: boolean
      clearAlphaThreshold?: number
      clearAlphaColor?: number
    }
  ): number[][]
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: QuantizeFormat
  ): Uint8Array
}
