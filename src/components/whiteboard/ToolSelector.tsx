import React from 'react';
import { Pencil, Eraser, Hand } from 'lucide-react';

export type WhiteboardTool = 'pen' | 'eraser' | 'hand';

interface ToolSelectorProps {
  activeTool: WhiteboardTool;
  onChange: (tool: WhiteboardTool) => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({ activeTool, onChange }) => {
  const tools = [
    {
      id: 'pen' as const,
      label: 'Pencil',
      icon: <Pencil className="w-5 h-5" />,
    },
    {
      id: 'eraser' as const,
      label: 'Eraser',
      icon: <Eraser className="w-5 h-5" />,
    },
    {
      id: 'hand' as const,
      label: 'Hand (Pan)',
      icon: <Hand className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onChange(tool.id)}
            title={tool.label}
            className={`
              relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
            `}
          >
            {tool.icon}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-brand-navy border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white opacity-0 pointer-events-none scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all whitespace-nowrap z-50 shadow-2xl">
              {tool.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
