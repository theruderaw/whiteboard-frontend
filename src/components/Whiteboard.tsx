import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface WhiteboardProps {
  roomId?: string;
  whiteboardId?: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, whiteboardId }) => {
  const { accessToken } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ee2689'); // brand-pink
  const [lineWidth, setLineWidth] = useState(3);
  const socketRef = useRef<WebSocket | null>(null);
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState<string | null>(whiteboardId || null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace("http", "ws");

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;
  }, []);

  // Fetch/Set Whiteboard ID
  useEffect(() => {
    const initWhiteboard = async () => {
      if (!roomId || currentWhiteboardId) return;
      try {
        const res = await fetch(`${API_URL}/whiteboard/room/${roomId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentWhiteboardId(data.id);
        }
      } catch (err) {
        console.error("Failed to init whiteboard", err);
      }
    };
    initWhiteboard();
  }, [roomId, accessToken]);

  // Load Initial Strokes
  useEffect(() => {
    const loadStrokes = async () => {
      if (!currentWhiteboardId) return;
      try {
        const res = await fetch(`${API_URL}/whiteboard/${currentWhiteboardId}/strokes`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const strokes = await res.json();
          strokes.forEach((s: any) => drawStroke(s.data.points, s.data.color, s.data.lineWidth));
        }
      } catch (err) {
        console.error("Failed to load strokes", err);
      }
    };
    loadStrokes();
  }, [currentWhiteboardId, accessToken]);

  // WebSocket Connection
  useEffect(() => {
    if (!roomId) return;

    const socket = new WebSocket(`${WS_URL}/ws/${roomId}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = jsonSafeParse(event.data);
      if (message && message.type === 'stroke') {
        const { points, color, lineWidth } = message.data;
        drawStroke(points, color, lineWidth);
      } else if (message && message.type === 'clear') {
        clearCanvasLocal();
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  const jsonSafeParse = (data: string) => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const drawStroke = (points: {x: number, y: number}[], strokeColor: string, width: number) => {
    const ctx = contextRef.current;
    if (!ctx || points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.closePath();
    
    // Reset to current tools
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  };

  const currentStrokePoints = useRef<{x: number, y: number}[]>([]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    currentStrokePoints.current = [{ x: offsetX, y: offsetY }];
    setIsDrawing(true);
  };

  const finishDrawing = async () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    setIsDrawing(false);

    const strokeData = {
      points: currentStrokePoints.current,
      color: color,
      lineWidth: lineWidth
    };

    // Save to backend
    if (currentWhiteboardId) {
      fetch(`${API_URL}/whiteboard/strokes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          whiteboard_id: currentWhiteboardId,
          type: 'stroke',
          data: strokeData
        })
      });
    }

    // Broadcast via WS
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'stroke',
        data: strokeData
      }));
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
    currentStrokePoints.current.push({ x: offsetX, y: offsetY });
  };

  const getCoordinates = (nativeEvent: any) => {
    if (nativeEvent instanceof MouseEvent) {
      return { offsetX: nativeEvent.offsetX, offsetY: nativeEvent.offsetY };
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { offsetX: 0, offsetY: 0 };
      return {
        offsetX: nativeEvent.touches[0].clientX - rect.left,
        offsetY: nativeEvent.touches[0].clientY - rect.top
      };
    }
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearCanvas = async () => {
    clearCanvasLocal();
    if (currentWhiteboardId) {
      fetch(`${API_URL}/whiteboard/${currentWhiteboardId}/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'clear' }));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden relative group">
      {/* Controls Overlay */}
      <div className="absolute top-6 left-6 z-10 flex gap-4 items-center px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5">
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
        />
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={lineWidth} 
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="w-24 accent-brand-pink"
        />
        <button 
          onClick={clearCanvas}
          className="px-3 py-1 bg-white/5 hover:bg-brand-pink/20 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-brand-pink rounded-lg transition-all border border-white/10"
        >
          Clear
        </button>
      </div>

      <canvas
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
        ref={canvasRef}
        className="flex-1 cursor-crosshair touch-none"
      />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" 
           style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
    </div>
  );
};

export default Whiteboard;
