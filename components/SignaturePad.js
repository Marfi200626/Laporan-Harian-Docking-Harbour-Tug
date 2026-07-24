"use client";

import { useRef, useState, useEffect } from "react";

export default function SignaturePad({ onChange, disabled }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ukuran internal canvas lebih besar dari tampilan agar tidak buram (retina)
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b2545";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e) {
    if (disabled) return;
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function move(e) {
    if (disabled || !drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const point = getPoint(e);
    const last = lastPointRef.current;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    setHasDrawing(true);
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (hasDrawing) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawing(false);
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full h-32 border border-slate-300 rounded-md bg-white touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-400">Coret di sini pakai jari atau mouse</span>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="text-[10px] text-navy-700 hover:underline"
        >
          Bersihkan
        </button>
      </div>
    </div>
  );
}
