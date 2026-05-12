import { useEffect, useRef, useState, useCallback } from 'react';

export interface Point {
  x: number;
  y: number;
}

export type Tool = 'pen' | 'eraser' | 'hand';

// Convert flat list [x,y,x,y] to Point[{x,y}]
const parsePoints = (raw: any): Point[] => {
  if (!raw || !Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'object') return raw as Point[]; // Legacy support
  const pts: Point[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    pts.push({ x: raw[i], y: raw[i + 1] });
  }
  return pts;
};

// Convert Point[{x,y}] to flat list [x,y,x,y]
const flattenPoints = (pts: Point[]): number[] => {
  const res: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    res.push(pts[i].x, pts[i].y);
  }
  return res;
};

export const useWhiteboard = (roomId: string | undefined, accessToken: string | null, user: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Camera and strokes history state
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);
  useEffect(() => { cameraRef.current = camera; }, [camera]);
  
  const allStrokesRef = useRef<any[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [size, setSize] = useState<number>(1);
  const [color, setColor] = useState<string>('#ee2689');
  
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  const currentStrokePoints = useRef<Point[]>([]);
  const lastBroadcastIndex = useRef<number>(0);
  
  const panStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace("http", "ws");

  // Redraw all handler - made stable by relying on cameraRef.current
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    
    const currentCam = cameraRef.current;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply Camera
    ctx.translate(currentCam.x, currentCam.y);
    ctx.scale(currentCam.zoom, currentCam.zoom);
    
    // Draw cached strokes
    allStrokesRef.current.forEach(stroke => {
      const points = parsePoints(stroke.data.points);
      if (points.length < 1) return;
      
      ctx.save();
      if (stroke.type === 'erase' || stroke.data.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.strokeStyle = stroke.data.color;
      }
      ctx.lineWidth = stroke.data.lineWidth;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
    
    ctx.restore();
  }, []); // Stable callback, never changes, safe to inject anywhere.

  // Explicitly redraw whenever the reactive camera state changes.
  useEffect(() => {
    redraw();
  }, [camera, redraw]);

  // Canvas Init & Resize Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    contextRef.current = context;

    const handleResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        // Setting dimensions resets context properties!
        canvas.width = width;
        canvas.height = height;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        redraw(); // Trigger visual refresh to mapping
      }
    };

    const ro = new ResizeObserver(() => {
      // Request animation frame to prevent infinite looping on fast resizes
      window.requestAnimationFrame(handleResize);
    });
    
    ro.observe(canvas);
    handleResize(); // Fire initial fill

    // Zoom logic via native wheel listener
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCamera(prev => {
        const zoomSensitivity = 0.0025;
        const delta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.min(Math.max(prev.zoom + delta, 0.1), 10);
        return { ...prev, zoom: newZoom };
      });
    };
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      ro.disconnect();
    };
  }, [roomId, redraw]);

  // Helper to convert screen pixel to World unit (0-2000 range accounting for camera)
  const getCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Use React Event or Touch props directly
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;
    
    const pixelX = (cssX / rect.width) * canvas.width;
    const pixelY = (cssY / rect.height) * canvas.height;

    const currentCam = cameraRef.current;
    const worldX = (pixelX - currentCam.x) / currentCam.zoom;
    const worldY = (pixelY - currentCam.y) / currentCam.zoom;

    return { x: worldX, y: worldY };
  };

  // Sync Logic
  useEffect(() => {
    if (!roomId) return;
    setCurrentWhiteboardId(null);
    
    // 🚀 Fix: Immediately flush existing render-buffer to prevent "ghost trails"
    allStrokesRef.current = [];
    redraw();

    const init = async () => {
      try {
        const res = await fetch(`${API_URL}/whiteboard/room/${roomId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentWhiteboardId(data.id);

          const sRes = await fetch(`${API_URL}/whiteboard/${data.id}/strokes`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (sRes.ok) {
            const fetchedStrokes = await sRes.json();
            allStrokesRef.current = fetchedStrokes;
            redraw();
          }
        }
      } catch (err) { console.error(err); }
    };
    init();

    const socket = new WebSocket(`${WS_URL}/ws/${roomId}`);
    socketRef.current = socket;
    
    const handleRemoteUpdate = (msg: any) => {
      if (msg.type === 'stroke_chunk') {
        const { user_id, points: rawPoints, color: c, lineWidth: lw, isEraser } = msg.data;
        const incPoints = parsePoints(rawPoints);
        if (incPoints.length === 0) return;

        let activeRemote = allStrokesRef.current.find(s => s._liveUser === user_id);
        if (!activeRemote) {
          activeRemote = {
            _liveUser: user_id,
            type: isEraser ? 'erase' : 'stroke',
            data: { points: [], color: c, lineWidth: lw, isEraser }
          };
          allStrokesRef.current.push(activeRemote);
        }
        
        const existing = parsePoints(activeRemote.data.points);
        activeRemote.data.points = flattenPoints([...existing, ...incPoints]);
        
        redraw();
      } else if (msg.type === 'stroke_end') {
        const idx = allStrokesRef.current.findIndex(s => s._liveUser === msg.data.user_id);
        if (idx !== -1) {
          delete allStrokesRef.current[idx]._liveUser;
        }
      } else if (msg.type === 'clear') {
        allStrokesRef.current = [];
        redraw();
      }
    };

    socket.onmessage = (e) => handleRemoteUpdate(JSON.parse(e.data));

    return () => socket.close();
  }, [roomId, accessToken, redraw]);

  const broadcast = (points: Point[], isEnd = false) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (points.length > 0) {
        socketRef.current.send(JSON.stringify({
          type: 'stroke_chunk',
          data: {
            user_id: user?.id,
            points: flattenPoints(points),
            color: tool === 'eraser' ? 'transparent' : color,
            lineWidth: size * 20,
            isEraser: tool === 'eraser'
          }
        }));
      }
      if (isEnd) {
        socketRef.current.send(JSON.stringify({ type: 'stroke_end', data: { user_id: user?.id } }));
      }
    }
  };

  const startDrawing = (e: any) => {
    if (tool === 'hand' || e.button === 1 || e.button === 2) {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      panStart.current = { x: clientX, y: clientY, camX: camera.x, camY: camera.y };
      setIsPanning(true);
      return;
    }

    const { x, y } = getCoords(e);
    const newPoint = { x, y };
    currentStrokePoints.current = [newPoint];
    
    allStrokesRef.current.push({
      _liveLocal: true,
      type: tool === 'eraser' ? 'erase' : 'stroke',
      data: {
        points: flattenPoints([newPoint]),
        color: tool === 'eraser' ? 'transparent' : color,
        lineWidth: size * 20,
        isEraser: tool === 'eraser'
      }
    });
    
    lastBroadcastIndex.current = 0;
    setIsDrawing(true);
    redraw();
  };

  const draw = (e: any) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (isPanning) {
      const dx = clientX - panStart.current.x;
      const dy = clientY - panStart.current.y;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      
      const localDx = (dx / rect.width) * canvas.width;
      const localDy = (dy / rect.height) * canvas.height;

      setCamera({
        ...camera,
        x: panStart.current.camX + localDx,
        y: panStart.current.camY + localDy,
      });
      return;
    }

    if (!isDrawing) return;
    
    const { x, y } = getCoords(e);
    const newPoint = { x, y };
    
    const pts = currentStrokePoints.current;
    const lastPoint = pts[pts.length - 1];
    const dx = newPoint.x - lastPoint.x;
    const dy = newPoint.y - lastPoint.y;

    if (dx * dx + dy * dy > 4) {
      pts.push(newPoint);
      
      const liveStroke = allStrokesRef.current.find(s => s._liveLocal);
      if (liveStroke) {
        liveStroke.data.points = flattenPoints(pts);
      }
      
      redraw();
      
      if (pts.length - lastBroadcastIndex.current > 5) {
        broadcast(pts.slice(lastBroadcastIndex.current));
        lastBroadcastIndex.current = pts.length;
      }
    }
  };

  const finishDrawing = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (!isDrawing) return;
    setIsDrawing(false);
    broadcast(currentStrokePoints.current.slice(lastBroadcastIndex.current), true);

    const liveIdx = allStrokesRef.current.findIndex(s => s._liveLocal);
    if (liveIdx !== -1) {
      delete allStrokesRef.current[liveIdx]._liveLocal;
    }

    if (currentWhiteboardId) {
      fetch(`${API_URL}/whiteboard/strokes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          whiteboard_id: currentWhiteboardId,
          type: tool === 'eraser' ? 'erase' : 'stroke',
          data: { 
            points: flattenPoints(currentStrokePoints.current),
            color: tool === 'eraser' ? 'transparent' : color, 
            lineWidth: size * 20,
            isEraser: tool === 'eraser' 
          }
        })
      });
    }
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!roomId || !accessToken) return;
    fetch(`${API_URL}/rooms/${roomId}/members`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(mList => {
        const me = mList.find((m: any) => m.user_id === user?.id);
        setIsAdmin(me?.role === 'admin');
      })
      .catch(console.error);
  }, [roomId, accessToken, user?.id]);

  const clearCanvas = async () => {
    if (!currentWhiteboardId || !accessToken) return;
    try {
      const res = await fetch(`${API_URL}/whiteboard/${currentWhiteboardId}/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        allStrokesRef.current = [];
        redraw();
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'clear' }));
        }
      }
    } catch (err) { console.error(err); }
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportJSON = async () => {
    try {
      const res = await fetch(`${API_URL}/whiteboard/${currentWhiteboardId}/strokes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const strokes = await res.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(strokes));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `whiteboard-${roomId}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    } catch (err) { console.error(err); }
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        allStrokesRef.current = content;
        redraw();
      } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
  };

  return { 
    canvasRef, tool, setTool, size, setSize, color, setColor,
    isAdmin, clearCanvas, downloadPNG, startDrawing, draw, finishDrawing,
    exportJSON, importJSON
  };
};

