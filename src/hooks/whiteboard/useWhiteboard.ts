import { useEffect, useRef, useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  points: Point[];
  color: string;
  lineWidth: number;
  isEraser?: boolean;
}

export const useWhiteboard = (roomId: string | undefined, accessToken: string | null, user: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [size, setSize] = useState<number>(1);
  const [color, setColor] = useState<string>('#ee2689');
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [votes, setVotes] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const remoteStrokesRef = useRef<Record<string, Point>>({});
  const currentStrokePoints = useRef<Point[]>([]);
  const lastBroadcastIndex = useRef<number>(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace("http", "ws");

  // Canvas Init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 2000;
    canvas.height = 2000;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;
  }, []);

  // Drawing primitives
  const drawStroke = (points: Point[], color: string, width: number) => {
    const ctx = contextRef.current;
    if (!ctx || points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();
  };

  const drawErase = (points: Point[], width: number) => {
    const ctx = contextRef.current;
    if (!ctx || points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Sync Logic
  useEffect(() => {
    if (!roomId) return;
    setCurrentWhiteboardId(null);

    const init = async () => {
      try {
        const res = await fetch(`${API_URL}/whiteboard/room/${roomId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentWhiteboardId(data.id);

          // Load strokes
          const sRes = await fetch(`${API_URL}/whiteboard/${data.id}/strokes`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (sRes.ok) {
            clearCanvasLocal();
            const strokes = await sRes.json();
            strokes.forEach((s: any) => {
              if (s.type === 'erase') drawErase(s.data.points, s.data.lineWidth);
              else drawStroke(s.data.points, s.data.color, s.data.lineWidth);
            });
          }
        }
      } catch (err) { console.error(err); }
    };
    init();

    const socket = new WebSocket(`${WS_URL}/ws/${roomId}`);
    socketRef.current = socket;
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'stroke_chunk') {
        const { user_id, points, color, lineWidth, isEraser } = msg.data;
        const ctx = contextRef.current;
        if (!ctx) return;
        ctx.save();
        if (isEraser) ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        const last = remoteStrokesRef.current[user_id];
        ctx.beginPath();
        if (last) ctx.moveTo(last.x, last.y);
        else ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p: Point) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
        remoteStrokesRef.current[user_id] = points[points.length - 1];
      } else if (msg.type === 'stroke_end') {
        delete remoteStrokesRef.current[msg.data.user_id];
      } else if (msg.type === 'clear') {
        clearCanvasLocal();
        setVotes([]);
      } else if (msg.type === 'reset_vote') {
        setVotes(prev => prev.includes(msg.data.user_id) ? prev : [...prev, msg.data.user_id]);
      }
    };
    return () => socket.close();
  }, [roomId, accessToken]);

  const broadcast = (points: Point[], isEnd = false) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (points.length > 0) {
        socketRef.current.send(JSON.stringify({
          type: 'stroke_chunk',
          data: {
            user_id: user?.id,
            points,
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

  const castResetVote = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'reset_vote', data: { user_id: user?.id } }));
    }
  };

  useEffect(() => {
    const threshold = Math.ceil(members.length / 2);
    if (votes.length >= threshold && threshold > 0) {
      clearCanvas();
      setVotes([]);
    }
  }, [votes, members]);

  const getCoords = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: ((clientX - rect.left) / rect.width) * 2000,
      y: ((clientY - rect.top) / rect.height) * 2000
    };
  };

  const startDrawing = (e: any) => {
    const { x, y } = getCoords(e.nativeEvent);
    contextRef.current?.beginPath();
    if (tool === 'eraser') contextRef.current!.globalCompositeOperation = 'destination-out';
    else {
      contextRef.current!.globalCompositeOperation = 'source-over';
      contextRef.current!.strokeStyle = color;
    }
    contextRef.current!.lineWidth = size * 20;
    contextRef.current?.moveTo(x, y);
    currentStrokePoints.current = [{ x, y }];
    lastBroadcastIndex.current = 0;
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e.nativeEvent);
    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
    currentStrokePoints.current.push({ x, y });
    if (currentStrokePoints.current.length - lastBroadcastIndex.current > 5) {
      broadcast(currentStrokePoints.current.slice(lastBroadcastIndex.current));
      lastBroadcastIndex.current = currentStrokePoints.current.length;
    }
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    contextRef.current!.globalCompositeOperation = 'source-over';
    setIsDrawing(false);
    broadcast(currentStrokePoints.current.slice(lastBroadcastIndex.current), true);

    if (currentWhiteboardId) {
      fetch(`${API_URL}/whiteboard/strokes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          whiteboard_id: currentWhiteboardId,
          type: tool === 'eraser' ? 'erase' : 'stroke',
          data: { points: currentStrokePoints.current, color: tool === 'eraser' ? 'transparent' : color, lineWidth: size * 20 }
        })
      });
    }
  };

  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch Role
  useEffect(() => {
    if (!roomId || !accessToken) return;
    fetch(`${API_URL}/rooms/${roomId}/members`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(mList => {
        setMembers(mList);
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
        clearCanvasLocal();
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
        const strokes = JSON.parse(e.target?.result as string);
        clearCanvasLocal();
        strokes.forEach((s: any) => {
          if (s.type === 'erase') drawErase(s.data.points, s.data.lineWidth);
          else drawStroke(s.data.points, s.data.color, s.data.lineWidth);
        });
      } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
  };

  return { 
    canvasRef, tool, setTool, size, setSize, color, setColor,
    isAdmin, clearCanvas, downloadPNG, startDrawing, draw, finishDrawing,
    castResetVote, votes, members, exportJSON, importJSON
  };
};
