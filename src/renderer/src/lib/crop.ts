export interface CropState {
  /** Zoom ≥ 1: 1 = the image's shorter side fills the square. */
  zoom: number
  /** Offset of the image centre from the square centre, in square-size units. */
  x: number
  y: number
}

export interface SourceRect {
  sx: number
  sy: number
  size: number
}

/** Keeps the image covering the square: offsets are limited so no empty edges show. */
export function clampCrop(state: CropState, width: number, height: number): CropState {
  const zoom = Math.max(1, Math.min(8, state.zoom))
  const scale = zoom / Math.min(width, height)
  const maxX = Math.max(0, (width * scale - 1) / 2)
  const maxY = Math.max(0, (height * scale - 1) / 2)
  return {
    zoom,
    x: Math.max(-maxX, Math.min(maxX, state.x)),
    y: Math.max(-maxY, Math.min(maxY, state.y))
  }
}

/** The square region of the source image (in image pixels) shown by a crop state. */
export function sourceRect(state: CropState, width: number, height: number): SourceRect {
  const { zoom, x, y } = clampCrop(state, width, height)
  const size = Math.min(width, height) / zoom
  return {
    size,
    sx: width / 2 - size / 2 - x * size,
    sy: height / 2 - size / 2 - y * size
  }
}
