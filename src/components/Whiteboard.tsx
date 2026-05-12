import React from 'react';

interface WhiteboardProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  tool: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ canvasRef, tool }) => {
  return (
    <div className="w-full h-full relative bg-brand-black overflow-hidden select-none">
      <canvas 
        ref={canvasRef} 
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-full relative z-20 block ${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      />
    </div>
  );
};

export default Whiteboard;
