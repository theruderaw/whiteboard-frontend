import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWhiteboard } from '../hooks/whiteboard/useWhiteboard';
import { ColorPalette } from './whiteboard/ColorPalette';
import { WhiteboardToolbar } from './whiteboard/WhiteboardToolbar';
import { WhiteboardActions } from './whiteboard/WhiteboardActions';

const Whiteboard = ({ roomId }: { roomId?: string }) => {
  const { user, accessToken } = useAuth();
  const { 
    canvasRef, tool, setTool, size, setSize, color, setColor, isAdmin, 
    clearCanvas, downloadPNG, startDrawing, draw, finishDrawing,
    castResetVote, votes, members, exportJSON, importJSON 
  } = useWhiteboard(roomId, accessToken, user);
  const escAt = useRef(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'h') setTool('eraser');
      if (e.key === 'p') setTool('pen');
      const colors: any = { b:'#000', w:'#fff', r:'#f44', g:'#0c5', y:'#fb3', B:'#09c', G:'#999', p:'#e26', o:'#f80', v:'#92b', t:'#088', l:'#3c3' };
      if (colors[e.key]) { setColor(colors[e.key]); setTool('pen'); }
      if (e.key === 'Escape') { if (Date.now() - escAt.current < 500) castResetVote(); escAt.current = Date.now(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setTool, setColor, castResetVote]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 relative overflow-hidden">
      <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between pointer-events-none">
        <WhiteboardToolbar {...{ tool, size, color, votes, members }} />
        <WhiteboardActions onExport={exportJSON} onImport={importJSON} onPNG={downloadPNG} isAdmin={isAdmin} onClear={clearCanvas} />
      </div>
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
        <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseUp={finishDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchEnd={finishDrawing} onTouchMove={draw}
          className="bg-brand-black shadow-2xl cursor-crosshair touch-none border-2 border-white/20 rounded-[2rem] transition-all hover:border-brand-pink/40"
          style={{ aspectRatio: '1/1', maxWidth: '100%', maxHeight: 'calc(100% - 100px)' }} />
        <ColorPalette active={color} onSelect={setColor} />
      </div>
    </div>
  );
};

export default Whiteboard;
