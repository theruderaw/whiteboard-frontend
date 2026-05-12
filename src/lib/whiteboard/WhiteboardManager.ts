import { screenToWorld, getAnchoredZoom } from './Viewport';
import type { Camera } from './Viewport';
import { renderFrame } from './Renderer';
import { normalizeStroke } from './DataNormalization';
import { apiClient } from '../apiClient';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("http", "ws");

export class WhiteboardManager {
  // Elements
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Core Datasets
  private strokes: any[] = [];
  private activeBuffer: number[] = [];
  private lastBroadcastIndex: number = 0;

  // Viewport state
  private camera: Camera = { x: 0, y: 0, zoom: 1 };

  // Interaction and Config Settings
  public currentTool: 'pen' | 'eraser' | 'hand' = 'pen';
  public currentSize: number = 1;
  public currentColor: string = '#ee2689';
  public zoomSpeed: number = 1.0;

  private isDrawing = false;
  private isPanning = false;
  private panOrigin = { x: 0, y: 0, camX: 0, camY: 0 };

  // Infrastructure
  private socket: WebSocket | null = null;
  private roomId: string;
  private whiteboardId: string | null = null;
  private userId: string | undefined;

  constructor(roomId: string, userId?: string) {
    this.roomId = roomId;
    this.userId = userId;
    this.connectSocket();
    this.preloadHistory();
  }

  // ────────────────────────────────────────────────────────────────
  // 🔗 DOM Binding Layer
  // ────────────────────────────────────────────────────────────────
  public bind(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    // Setup Hardware Dynamic Resizing
    this.resizeObserver = new ResizeObserver(() => this.syncSize());
    this.resizeObserver.observe(canvas);
    this.syncSize();

    // Attach NATIVE Event Vectors with absolute redundancy
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    
    // Fallback window listeners ensures capture release security
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    // Set essential hardware styling properties natively
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';

    this.redraw();
  }

  public unbind() {
    this.resizeObserver?.disconnect();
    this.canvas?.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas?.removeEventListener('wheel', this.handleWheel);
    this.canvas = null;
    this.ctx = null;
  }

  public destroy() {
    this.unbind();
    this.socket?.close();
  }


  private syncSize() {
    if (!this.canvas) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.redraw();
    }
  }

  // ────────────────────────────────────────────────────────────────
  // 🛰️ Network Synchronization
  // ────────────────────────────────────────────────────────────────
  private async preloadHistory() {
    try {
      const roomRes = await apiClient(`/whiteboard/room/${this.roomId}`);
      if (!roomRes.ok) return;
      const roomData = await roomRes.json();
      this.whiteboardId = roomData.id;

      const strokeRes = await apiClient(`/whiteboard/${this.whiteboardId}/strokes`);
      if (strokeRes.ok) {
        const list = await strokeRes.json();
        // Enforce VISIBILITY on initial ingestion
        this.strokes = list.map((s: any) => normalizeStroke(s));
        this.redraw();
      }
    } catch (e) { console.error("History load failure:", e); }
  }

  private connectSocket() {
    const ws = new WebSocket(`${WS_URL}/ws/${this.roomId}`);
    this.socket = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'stroke_chunk') {
          const { user_id, points: chunk } = msg.data;
          let remote = this.strokes.find(s => s._remoteLive === user_id);
          if (!remote) {
            remote = normalizeStroke({ ...msg, _remoteLive: user_id });
            remote._remoteLive = user_id;
            remote.data.points = [];
            this.strokes.push(remote);
          }
          remote.data.points.push(...chunk);
          this.redraw();
        } else if (msg.type === 'stroke_end') {
          const idx = this.strokes.findIndex(s => s._remoteLive === msg.data.user_id);
          if (idx !== -1) delete this.strokes[idx]._remoteLive;
        } else if (msg.type === 'clear') {
          this.strokes = [];
          this.redraw();
        }
      } catch { }
    };
  }

  private broadcastChunk(slice: number[], finish = false) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    if (slice.length > 0) {
      this.socket.send(JSON.stringify({
        type: 'stroke_chunk',
        data: {
          user_id: this.userId,
          points: slice,
          color: this.currentTool === 'eraser' ? '#000000' : this.currentColor,
          lineWidth: this.currentSize * 20,
          isEraser: this.currentTool === 'eraser'
        }
      }));
    }
    if (finish) {
      this.socket.send(JSON.stringify({ type: 'stroke_end', data: { user_id: this.userId } }));
    }
  }

  // ────────────────────────────────────────────────────────────────
  // 🖊️ Input Event Orchestration (AUTO-BOUND NATIVE VECTORS)
  // ────────────────────────────────────────────────────────────────
  private handlePointerDown = (e: PointerEvent) => {
    if (!this.canvas) return;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (e) { /* continue drawing regardless */ }


    const rect = this.canvas.getBoundingClientRect();

    if (this.currentTool === 'hand' || e.button === 1) {
      this.isPanning = true;
      this.panOrigin = { x: e.clientX, y: e.clientY, camX: this.camera.x, camY: this.camera.y };
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY, rect, this.canvas, this.camera);
    this.isDrawing = true;
    this.activeBuffer = [world.x, world.y];
    this.lastBroadcastIndex = 0;


    const newStroke = normalizeStroke({
      type: this.currentTool === 'eraser' ? 'erase' : 'stroke',
      data: {
        points: [world.x, world.y],
        color: this.currentColor,
        lineWidth: this.currentSize * 20
      }
    });

    (newStroke as any)._localLive = true;
    this.strokes.push(newStroke);
    this.redraw();
  }

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.canvas) return;


    if (this.isPanning) {
      const rect = this.canvas.getBoundingClientRect();
      const dx = ((e.clientX - this.panOrigin.x) / rect.width) * this.canvas.width;
      const dy = ((e.clientY - this.panOrigin.y) / rect.height) * this.canvas.height;
      this.camera.x = this.panOrigin.camX + dx;
      this.camera.y = this.panOrigin.camY + dy;
      this.redraw();
      return;
    }

    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const world = screenToWorld(e.clientX, e.clientY, rect, this.canvas, this.camera);

    const lastX = this.activeBuffer[this.activeBuffer.length - 2];
    const lastY = this.activeBuffer[this.activeBuffer.length - 1];
    const dSq = Math.pow(world.x - lastX, 2) + Math.pow(world.y - lastY, 2);

    if (dSq > 2.5) {
      this.activeBuffer.push(world.x, world.y);

      const active = this.strokes.find(s => s._localLive);
      if (active) active.data.points = [...this.activeBuffer];
      this.redraw();

      if (this.activeBuffer.length - this.lastBroadcastIndex > 6) {
        const slice = this.activeBuffer.slice(this.lastBroadcastIndex);
        this.broadcastChunk(slice);
        this.lastBroadcastIndex = this.activeBuffer.length;
      }
    }
  }

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.canvas) return;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* safe bypass of potential DOMException */ }



    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    const finalSlice = this.activeBuffer.slice(this.lastBroadcastIndex);
    this.broadcastChunk(finalSlice, true);

    const activeIdx = this.strokes.findIndex(s => s._localLive);
    if (activeIdx !== -1) delete this.strokes[activeIdx]._localLive;

    if (this.whiteboardId && this.activeBuffer.length > 0) {
      const payload = {
        whiteboard_id: this.whiteboardId,
        type: this.currentTool === 'eraser' ? 'erase' : 'stroke',
        data: {
          points: [...this.activeBuffer],
          color: this.currentTool === 'eraser' ? '#000000' : this.currentColor,
          lineWidth: this.currentSize * 20,
          isEraser: this.currentTool === 'eraser'
        }
      };

      console.log("[WhiteboardManager] Initiating DB persistence for stroke...", this.whiteboardId);
      
      apiClient(`/whiteboard/strokes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        console.log("[WhiteboardManager] API Response Recvd:", res.status);
      }).catch(err => {
        console.error("[WhiteboardManager] API Push Critical Fail:", err);
      });
    } else {
      console.warn("[WhiteboardManager] Skipped DB post: whiteboardId present?", !!this.whiteboardId, "Buffer has items?", this.activeBuffer.length);
    }
  }


  private handleWheel = (e: WheelEvent) => {
    if (!this.canvas) return;
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const prevZoom = this.camera.zoom;
    this.camera = getAnchoredZoom(e, rect, this.canvas, this.camera, this.zoomSpeed);
    
    // Diagnostics so we never fly blind
    if (prevZoom !== this.camera.zoom) {
      console.log("[WhiteboardManager] Camera Scaled To:", this.camera.zoom.toFixed(3));
    }
    
    this.redraw();
  }


  private redraw() {
    if (!this.ctx || !this.canvas) return;
    renderFrame(this.ctx, this.canvas, this.camera, this.strokes);
  }

  // ────────────────────────────────────────────────────────────────
  // 🛠️ Utilities
  // ────────────────────────────────────────────────────────────────
  public async clear() {
    if (!this.whiteboardId) return;
    try {
      const r = await apiClient(`/whiteboard/${this.whiteboardId}/clear`, { method: 'DELETE' });
      if (r.ok) {
        this.strokes = [];
        this.redraw();
        this.socket?.send(JSON.stringify({ type: 'clear' }));
      }
    } catch { }
  }

  public download() {
    if (!this.canvas) return;
    const a = document.createElement('a');
    a.download = `board-${Date.now()}.png`;
    a.href = this.canvas.toDataURL('image/png');
    a.click();
  }

  public async exportJSON() {
    if (!this.whiteboardId) return;
    try {
      const r = await apiClient(`/whiteboard/${this.whiteboardId}/strokes`);
      if (!r.ok) return;
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard-${this.roomId}.json`;
      a.click();
    } catch {}
  }

  public importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        this.strokes = Array.isArray(data) ? data.map((s: any) => normalizeStroke(s)) : [];
        this.redraw();
      } catch {}
    };
    reader.readAsText(file);
  }
}
