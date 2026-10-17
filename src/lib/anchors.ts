/**
 * Bridge between the anatomy section (DOM) and the 3D camera: the section
 * registers its hotspot elements here and the WebGL loop projects their 3D
 * anchors to screen space every frame.
 */
export const anchors = {
  points: [] as { el: HTMLElement | null; pos: [number, number, number] }[],
  layer: null as HTMLElement | null,
  line: null as SVGPathElement | null,
  target: null as HTMLElement | null,
  active: 0,
  screen: [] as { x: number; y: number; behind: boolean }[],
}
