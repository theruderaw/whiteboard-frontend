import { useState, useEffect } from 'react';

export const WhiteboardToolbar = ({ tool, size, color, setSize, zoomSpeed, setZoomSpeed }: any) => {
  const [inputValue, setInputValue] = useState(String(size));
  const [localZoom, setLocalZoom] = useState(String(zoomSpeed));

  useEffect(() => {
    setInputValue(String(size));
  }, [size]);

  useEffect(() => {
    setLocalZoom(String(zoomSpeed));
  }, [zoomSpeed]);

  const commitSize = () => {
    let parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed === null) parsed = 1;
    const clamped = Math.min(25, Math.max(0.5, parsed));
    setSize(clamped);
    setInputValue(String(clamped));
  };

  const commitZoom = () => {
    let parsed = parseFloat(localZoom);
    if (isNaN(parsed) || parsed === null) parsed = 1;
    const clamped = Math.min(10, Math.max(0.1, parsed));
    setZoomSpeed(clamped);
    setLocalZoom(String(clamped));
  };

  return (
    <div className="flex items-center gap-8 bg-black/70 backdrop-blur-lg px-8 py-4 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
      <div className="flex items-center gap-3 border-r border-white/10 pr-6">
        <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Tool:</span>
        <span className={`text-[14px] font-black uppercase tracking-wide ${tool === 'eraser' ? 'text-brand-pink drop-shadow-[0_0_8px_rgba(255,38,137,0.4)]' : tool === 'hand' ? 'text-blue-400' : 'text-green-400'}`}>{tool}</span>
      </div>
      <div className="flex items-center gap-3 border-r border-white/10 pr-6">
        <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Size:</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitSize}
          onKeyDown={(e) => e.key === 'Enter' && commitSize()}
          className="w-16 bg-white/5 border border-white/20 rounded-md px-2 py-1 text-[14px] font-black text-white/80 focus:outline-none focus:border-brand-pink text-center"
        />
        <span className="text-[10px] font-bold text-white/30">PTS</span>
      </div>
      <div className="flex items-center gap-3 border-r border-white/10 pr-6">
        <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Zoom:</span>
        <input 
          type="text" 
          value={localZoom}
          onChange={(e) => setLocalZoom(e.target.value)}
          onBlur={commitZoom}
          onKeyDown={(e) => e.key === 'Enter' && commitZoom()}
          className="w-16 bg-white/5 border border-white/20 rounded-md px-2 py-1 text-[14px] font-black text-white/80 focus:outline-none focus:border-brand-pink text-center"
        />
        <span className="text-[10px] font-bold text-white/30">SPD</span>
      </div>
      <div className="flex items-center gap-3 border-r border-white/10 pr-6">
        <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Color:</span>
        <div className="w-4 h-4 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
};



