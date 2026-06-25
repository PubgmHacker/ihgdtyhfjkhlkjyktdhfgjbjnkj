"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);
  const [touchDevice] = useState(() => typeof window !== "undefined" && "ontouchstart" in window);

  const onMove = useCallback((e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  }, []);

  useEffect(() => {
    if (touchDevice) return;

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", () => setClicking(true));
    window.addEventListener("mouseup", () => setClicking(false));
    document.addEventListener("mouseleave", () => setVisible(false));
    document.addEventListener("mouseenter", () => setVisible(true));

    // Hide on interactive elements
    const handleOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" || target.tagName === "BUTTON" || target.closest("a") || target.closest("button")) {
        document.documentElement.style.setProperty("--cursor-scale", "0.7");
      }
    };
    const handleOut = () => {
      document.documentElement.style.setProperty("--cursor-scale", "1");
    };

    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", () => setClicking(true));
      window.removeEventListener("mouseup", () => setClicking(false));
      document.removeEventListener("mouseleave", () => setVisible(false));
      document.removeEventListener("mouseenter", () => setVisible(true));
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, [onMove]);

  if (touchDevice) return null;

  const scale = clicking ? "scale(0.6)" : `scale(var(--cursor-scale, 1))`;

  return (
    <>
      {/* Main cursor — metallic silver */}
      <div
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{
          transform: `translate(${pos.x - 8}px, ${pos.y - 8}px) ${scale}`,
          transition: "transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s",
          opacity: visible ? 1 : 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {/* Sharp metallic tip */}
          <path
            d="M0.5 0.5L14.5 7.5L8 8.5L6 15.5L0.5 0.5Z"
            fill="url(#metalGrad)"
            stroke="rgba(200,200,210,0.6)"
            strokeWidth="0.5"
          />
          {/* Inner highlight */}
          <path
            d="M1.5 1.5L12 7.5L7.5 8L6 13L1.5 1.5Z"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.3"
          />
          <defs>
            <linearGradient id="metalGrad" x1="0" y1="0" x2="14" y2="15">
              <stop offset="0%" stopColor="#E8E8F0" />
              <stop offset="40%" stopColor="#C8C8D0" />
              <stop offset="70%" stopColor="#909098" />
              <stop offset="100%" stopColor="#0A0A0C" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* Demon blood dot at tip */}
      <div
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          transform: `translate(${pos.x - 2}px, ${pos.y - 2}px) ${scale}`,
          transition: "transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="w-1 h-1 rounded-full bg-[#0A0A0C]" />
      </div>
      <style>{`
        * {
          cursor: none !important;
        }
        @media (pointer: coarse) {
          * {
            cursor: auto !important;
          }
        }
      `}</style>
    </>
  );
}