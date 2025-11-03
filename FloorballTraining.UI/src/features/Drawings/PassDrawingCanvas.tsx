import React, { useRef, useState } from 'react';

interface PassLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const PASS_COLOR = 'dimgray';
const PASS_WIDTH = 1.2;
const PASS_DASH = '4 4';

const PassDrawingCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [lines, setLines] = useState<PassLine[]>([]);
  const [preview, setPreview] = useState<PassLine | null>(null);

  const getSvgCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const rect = svg.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getSvgCoords(e);
    setDrawing(true);
    setStart({ x, y });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !start) return;
    const { x, y } = getSvgCoords(e);
    setPreview({ x1: start.x, y1: start.y, x2: x, y2: y });
  };

  const handleUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !start) return;
    const { x, y } = getSvgCoords(e);
    setLines([...lines, { x1: start.x, y1: start.y, x2: x, y2: y }]);
    setDrawing(false);
    setStart(null);
    setPreview(null);
  };

  return (
    <svg
      ref={svgRef}
      width={800}
      height={600}
      style={{ border: '1px solid #ccc', touchAction: 'none' }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onTouchStart={handleDown}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
    >
      <defs>
        <marker id="pass-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={PASS_COLOR} />
        </marker>
      </defs>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={PASS_COLOR}
          strokeWidth={PASS_WIDTH}
          strokeDasharray={PASS_DASH}
          markerEnd="url(#pass-arrow)"
        />
      ))}
      {preview && (
        <line
          x1={preview.x1}
          y1={preview.y1}
          x2={preview.x2}
          y2={preview.y2}
          stroke={PASS_COLOR}
          strokeWidth={PASS_WIDTH}
          strokeDasharray={PASS_DASH}
          markerEnd="url(#pass-arrow)"
        />
      )}
    </svg>
  );
};

export default PassDrawingCanvas;

