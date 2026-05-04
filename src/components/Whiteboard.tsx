import { useRef, useState } from "react";
import type { Point, Stroke } from "../types/whiteboard";

const Whiteboard = () => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);

  const boardRef = useRef<HTMLDivElement | null>(null);

  const getPoint = (e: React.MouseEvent<HTMLDivElement>): Point => {
    if (!boardRef.current) return { x: 0, y: 0 };

    const rect = boardRef.current.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setCurrentStroke([getPoint(e)]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;

    setCurrentStroke((prev) => [...prev, getPoint(e)]);
  };

  const handleMouseUp = () => {
    setStrokes((prev) => [...prev, currentStroke]);
    setCurrentStroke([]);
    console.log(strokes)
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div
        ref={boardRef}
        className="w-[50vw] h-[50vh] bg-gray-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg className="w-full h-full">
          {strokes.map((stroke, i) => (
            <polyline
              key={i}
              points={stroke.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {currentStroke.length > 0 && (
            <polyline
              points={currentStroke.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="red"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export default Whiteboard;