import type { Camera } from './Viewport';
import { normalizePoints } from './DataNormalization';

export const clearCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const applyCamera = (ctx: CanvasRenderingContext2D, camera: Camera) => {
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
};

export const drawStroke = (ctx: CanvasRenderingContext2D, stroke: any) => {
  if (!stroke.data) return;

  const pts = normalizePoints(stroke.data.points);
  if (pts.length < 2) return;

  ctx.save();

  const isEraser = stroke.type === 'erase' || stroke.data?.isEraser === true;
  ctx.lineWidth = Math.max(stroke.data.lineWidth || 5, 0.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.data.color || '#ee2689';
  }

  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  // Safeguard: Dot support
  ctx.lineTo(pts[0], pts[1]);

  // Efficient iteration block
  for (let i = 2; i < pts.length; i += 2) {
    ctx.lineTo(pts[i], pts[i + 1]);
  }

  ctx.stroke();
  ctx.restore();
};

export const renderFrame = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  camera: Camera,
  strokes: any[]
) => {
  clearCanvas(ctx, canvas);
  ctx.save();
  applyCamera(ctx, camera);

  // Paint all buffered vector collections sequentially
  for (let i = 0; i < strokes.length; i++) {
    drawStroke(ctx, strokes[i]);
  }

  ctx.restore();
};
