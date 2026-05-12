export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export const screenToWorld = (
  clientX: number, 
  clientY: number, 
  rect: DOMRect, 
  canvas: HTMLCanvasElement, 
  camera: Camera
) => {
  // 1. Absolute Pixel Mapping
  const pxX = ((clientX - rect.left) / (rect.width || 1)) * canvas.width;
  const pxY = ((clientY - rect.top) / (rect.height || 1)) * canvas.height;

  // 2. Transform Inversion
  return {
    x: (pxX - camera.x) / camera.zoom,
    y: (pxY - camera.y) / camera.zoom
  };
};

export const getAnchoredZoom = (
  e: WheelEvent, 
  rect: DOMRect, 
  canvas: HTMLCanvasElement, 
  prevCam: Camera,
  speedScalar: number
): Camera => {
  // Find local anchor pixels under the mouse
  const pxX = ((e.clientX - rect.left) / (rect.width || 1)) * canvas.width;
  const pxY = ((e.clientY - rect.top) / (rect.height || 1)) * canvas.height;

  // 1. Normalize Hardware Scroll Modes (Crucial for Linux/Firefox/Lines-mode)
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 40; // Approx line height normalization
  if (e.deltaMode === 2) dy *= 800; // Approx page height normalization

  // 2. Apply relative exponential scaling using normalized delta
  const factor = 1 + (dy * -0.0012 * speedScalar);
  const nextZoom = Math.min(Math.max(prevCam.zoom * factor, 0.1), 15);

  
  // Compute post-clamping differential to ensure exact stabilization
  const scaleDiff = nextZoom / prevCam.zoom;

  return {
    zoom: nextZoom,
    // Reposition grid to preserve coordinate lock under pivot pixel
    x: pxX - (pxX - prevCam.x) * scaleDiff,
    y: pxY - (pxY - prevCam.y) * scaleDiff
  };
};
