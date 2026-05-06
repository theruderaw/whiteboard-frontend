

const COLORS = [
  { val: '#000000', k: 'b' }, { val: '#ffffff', k: 'w' }, { val: '#ff4444', k: 'r' },
  { val: '#00c851', k: 'g' }, { val: '#ffbb33', k: 'y' }, { val: '#0099cc', k: 'B' },
  { val: '#9e9e9e', k: 'G' }, { val: '#ee2689', k: 'p' }, { val: '#ff8800', k: 'o' },
  { val: '#9c27b0', k: 'v' }, { val: '#008080', k: 't' }, { val: '#32cd32', k: 'l' }
];

export const ColorPalette = ({ active, onSelect }: { active: string, onSelect: (c: string) => void }) => (
  <div className="flex flex-wrap gap-2 p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
    {COLORS.map(c => (
      <button key={c.val} onClick={() => onSelect(c.val)} 
        className={`w-8 h-8 rounded-lg border-2 transition-all ${active === c.val ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
        style={{ backgroundColor: c.val }} title={c.k} />
    ))}
  </div>
);
