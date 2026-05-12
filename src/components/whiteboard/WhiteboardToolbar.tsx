export const WhiteboardToolbar = ({ tool, size, color }: any) => (
  <div className="flex items-center gap-8 bg-black/70 backdrop-blur-lg px-8 py-4 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
      <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Tool:</span>
      <span className={`text-[14px] font-black uppercase tracking-wide ${tool === 'eraser' ? 'text-brand-pink drop-shadow-[0_0_8px_rgba(255,38,137,0.4)]' : tool === 'hand' ? 'text-blue-400' : 'text-green-400'}`}>{tool}</span>
    </div>
    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
      <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Size:</span>
      <span className="text-[14px] font-black uppercase text-white/80">{size} PTS</span>
    </div>
    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
      <span className="text-[12px] font-black uppercase text-white/40 tracking-widest">Color:</span>
      <div className="w-4 h-4 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: color }} />
    </div>
  </div>
);
