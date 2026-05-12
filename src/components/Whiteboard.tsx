import React from 'react';

interface WhiteboardProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  tool: string;
  startDrawing: (e: any) => void;
  draw: (e: any) => void;
  finishDrawing: (e: any) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ canvasRef, tool, startDrawing, draw, finishDrawing }) => {
  return (
    <div className="w-full h-full relative min-h-0 overflow-hidden">
      <canvas 
        ref={canvasRef} 
        onMouseDown={startDrawing} 
        onMouseUp={finishDrawing} 
        onMouseMove={draw} 
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing} 
        onTouchEnd={finishDrawing} 
        onTouchMove={draw}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-full bg-brand-black touch-none transition-all hover:brightness-110 relative z-20 pointer-events-auto ${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      />
    </div>
  );
};

export default Whiteboard;
