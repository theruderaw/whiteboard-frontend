import React from 'react';

interface ColorPaletteProps {
  active: string;
  onSelect: (c: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ active, onSelect }) => {
  // Format active color to always ensure it has '#' for input value
  const normalizedColor = active.startsWith('#') ? active : '#000000';

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9A-Fa-f]/g, ''); // Only hex chars
    if (val.length > 6) val = val.slice(0, 6);
    
    // Update state directly while typing so it remains editable, 
    // prepend '#' to submit as valid prop. 
    // We will use input control safely.
    if (val.length === 3 || val.length === 6) {
      onSelect('#' + val);
    } else {
      // Don't strictly limit length typing, just fire onSelect to current.
      // Wait, parent manages state, so to allow dynamic typing intermediate chars we just emit always.
      onSelect('#' + val); 
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-black/60 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl w-fit">
      {/* The Visual Color Box - Styled Input wrapper */}
      <div 
        className="relative w-10 h-10 rounded-xl border-2 border-white/20 cursor-pointer overflow-hidden transition-all active:scale-90 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"
        title="Open Color Spectrum"
      >
        <input 
          type="color" 
          value={normalizedColor.length === 7 ? normalizedColor : '#000000'} 
          onChange={(e) => onSelect(e.target.value)}
          className="absolute -top-2 -left-2 w-[200%] h-[200%] cursor-pointer border-0"
        />
      </div>

      {/* The Manual HEX Field */}
      <div className="flex items-center h-10 gap-2 bg-white/5 border border-white/10 rounded-xl px-3 group focus-within:border-brand-pink/50 transition-all">
        <span className="text-[10px] font-black text-white/30 select-none">HEX</span>
        <div className="text-xs font-bold text-white/60">#</div>
        <input 
          type="text"
          value={active.replace('#', '').toUpperCase()}
          onChange={handleHexChange}
          placeholder="FFFFFF"
          className="w-16 bg-transparent text-xs font-bold tracking-widest text-white outline-none uppercase placeholder:text-white/10"
          maxLength={6}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
