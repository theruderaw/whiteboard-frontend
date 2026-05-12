import { useEffect, useRef, useMemo } from 'react';
import { WhiteboardManager } from '../../lib/whiteboard/WhiteboardManager';

export const useWhiteboardManager = (roomId?: string, userId?: string) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // 1. Stabilize the Manager Instance Forever per Room
  const manager = useMemo(() => {
    if (!roomId) return null;
    return new WhiteboardManager(roomId, userId);
  }, [roomId, userId]);

  // 2. Handle Physical Lifecycle Mounts
  useEffect(() => {
    if (!manager || !canvasRef.current) return;
    
    const currentCanvas = canvasRef.current;
    manager.bind(currentCanvas);
    
    return () => {
      manager.destroy();
    };
  }, [manager, roomId]);

  // 3. Clean, minimal return surface
  return {
    canvasRef,
    manager, 
    clear: () => manager?.clear(),
    download: () => manager?.download(),
    exportJSON: () => manager?.exportJSON(),
    importJSON: (file: File) => manager?.importJSON(file)
  };
};


