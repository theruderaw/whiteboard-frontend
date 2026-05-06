import React from 'react';

export const WhiteboardActions = ({ onExport, onImport, onPNG, isAdmin, onClear }: any) => (
  <div className="flex items-center gap-3 pointer-events-auto">
    <button onClick={onExport} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase rounded-xl border border-white/10 transition-all">JSON</button>
    <button onClick={() => document.getElementById('imp')?.click()} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase rounded-xl border border-white/10 transition-all">Upload</button>
    <input type="file" id="imp" className="hidden" accept=".json" onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} />
    <button onClick={onPNG} className="px-4 py-2 bg-brand-pink text-white text-[10px] font-black uppercase rounded-xl shadow-lg transition-all">PNG</button>
    {isAdmin && <button onClick={onClear} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase rounded-xl border border-red-500/20 transition-all">Clear</button>}
  </div>
);
