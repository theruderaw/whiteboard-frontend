

export const WhiteboardToolbar = ({ tool, size, color, votes, members }: any) => (
  <div className="flex items-center gap-6 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
      <span className="text-[10px] font-black uppercase text-white/30">Tool:</span>
      <span className={`text-[10px] font-black uppercase ${tool === 'eraser' ? 'text-brand-pink' : 'text-green-400'}`}>{tool}</span>
    </div>
    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
      <span className="text-[10px] font-black uppercase text-white/30">Size:</span>
      <span className="text-[10px] font-black uppercase text-white/60">{size} PTS</span>
    </div>
    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
      <span className="text-[10px] font-black uppercase text-white/30">Color:</span>
      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: color }} />
    </div>
    {votes.length > 0 && (
      <div className="flex items-center gap-2 text-red-400 animate-pulse">
        <span className="text-[9px] font-black uppercase">Reset: {votes.length}/{Math.ceil(members.length / 2)}</span>
      </div>
    )}
    <span className="text-[9px] text-white/20 uppercase font-bold">[H] Eraser | [P] Pen | [ESC]x2 Reset</span>
  </div>
);
