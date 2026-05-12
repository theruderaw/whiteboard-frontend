import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import { ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';

let globalZIndexCounter = 100;

interface FloatingPanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  className?: string;
  headerExtra?: React.ReactNode;
  resizable?: boolean;
  initialWidth?: string;
  initialHeight?: string;
  dragAxis?: 'both' | 'x' | 'y' | 'none';
  resizeMode?: 'both' | 'horizontal' | 'vertical' | 'none';
  fixedZIndex?: number;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  id,
  title,
  children,
  defaultPosition = { x: 0, y: 0 },
  className = "",
  headerExtra,
  resizable = false,
  initialWidth,
  initialHeight,
  dragAxis = 'both',
  resizeMode = 'both',
  fixedZIndex
}) => {
  const nodeRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [zIndex, setZIndex] = useState(fixedZIndex !== undefined ? fixedZIndex : 50);

  // Loading initial state from localStorage
  useEffect(() => {
    const storedPos = localStorage.getItem(`panel_pos_${id}`);
    const storedCollapsed = localStorage.getItem(`panel_collapsed_${id}`);

    if (storedPos) {
      try {
        setPosition(JSON.parse(storedPos));
      } catch (e) {
        console.error("Failed to load panel position", e);
      }
    }
    if (storedCollapsed !== null) {
      setIsCollapsed(storedCollapsed === 'true');
    }
    setIsMounted(true);
  }, [id]);

  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    // Optimistic update local state without writing to localStorage on every single pixel
    setPosition({ x: data.x, y: data.y });
  };

  const handleStop = (_e: DraggableEvent, data: DraggableData) => {
    const newPos = { x: data.x, y: data.y };
    setPosition(newPos);
    localStorage.setItem(`panel_pos_${id}`, JSON.stringify(newPos));
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`panel_collapsed_${id}`, String(newState));
  };

  const handleStart = (e?: React.MouseEvent | DraggableEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    if (fixedZIndex === undefined) {
      globalZIndexCounter += 1;
      setZIndex(globalZIndexCounter);
    }
  };

  if (!isMounted) return null;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".panel-drag-handle"
      cancel=".panel-body-content"
      axis={dragAxis === 'none' ? 'none' as any : dragAxis}
      position={position}
      onStart={(e) => { if (dragAxis === 'none') return false; handleStart(e); }}
      onDrag={handleDrag}
      onStop={handleStop}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        onMouseDown={(e) => handleStart(e)}
        onTouchStart={(e) => { e.stopPropagation(); handleStart(e); }}
        className={`absolute top-0 left-0 flex flex-col bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-[max-height] duration-300 ease-in-out pointer-events-auto ${className}`}
        style={{ 
          zIndex,
          resize: resizable ? (resizeMode === 'none' ? 'none' : resizeMode) : 'none',
          overflow: 'hidden',
          width: initialWidth,
          height: initialHeight,
          minWidth: '200px',
          minHeight: '100px'
        }}
      >
        {/* Header Area: DRAG HANDLE */}
        <div className={`panel-drag-handle group flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 select-none ${dragAxis !== 'none' ? 'cursor-grab active:cursor-grabbing' : ''}`}>
          <div className="flex items-center gap-2 text-white/50 group-hover:text-brand-pink transition-colors">
            {dragAxis !== 'none' && <GripHorizontal className="w-4 h-4" />}
            <span className="text-xs font-black uppercase tracking-wider text-white/80">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {headerExtra && <div onClick={e => e.stopPropagation()}>{headerExtra}</div>}
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Body Content with transition */}
        <div className={`panel-body-content flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'h-0 overflow-hidden opacity-0 pointer-events-none' : 'flex-1 opacity-100'}`}>
          <div className="flex-1 flex flex-col relative min-h-0">
            {children}
          </div>
        </div>
      </div>
    </Draggable>
  );
};
