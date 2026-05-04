import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWhiteboard } from '../hooks/whiteboard/useWhiteboard';

interface WhiteboardProps {
  roomId?: string;
  whiteboardId?: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId }) => {
  const { user, accessToken } = useAuth();
  const { 
    canvasRef, tool, setTool, size, setSize, 
    isAdmin, clearCanvas, downloadPNG, 
    startDrawing, draw, finishDrawing 
  } = useWhiteboard(roomId, accessToken, user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') setTool('eraser');
      if (e.key.toLowerCase() === 'p') setTool('pen');
      if (e.key === 'ArrowUp') setSize(prev => Math.min(prev + 0.5, 20));
      if (e.key === 'ArrowDown') setSize(prev => Math.max(prev - 0.5, 0.5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, setSize]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden relative group">
      {/* Top Controls */}
      <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Tool:</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${tool === 'eraser' ? 'text-brand-pink' : 'text-green-400'}`}>
              {tool}
            </span>
          </div>
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Size:</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink">
              {size} PTS
            </span>
          </div>
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">
            [H] Eraser | [P] Pen | [↑/↓] Size
          </span>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {isAdmin && (
            <button 
              onClick={clearCanvas}
              className="px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Screen
            </button>
          )}
          <button 
            onClick={downloadPNG}
            className="px-5 py-3 bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-brand-pink/20 hover:bg-brand-berry transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PNG
          </button>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-start p-8">
        <canvas
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
          ref={canvasRef}
          className="bg-brand-black shadow-[0_0_80px_rgba(0,0,0,0.6)] cursor-crosshair touch-none border-2 border-white/20 rounded-[2rem] transition-all duration-500 hover:border-brand-pink/40"
          style={{ aspectRatio: '1/1', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
        />
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" 
           style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
    </div>
  );
};

export default Whiteboard;
