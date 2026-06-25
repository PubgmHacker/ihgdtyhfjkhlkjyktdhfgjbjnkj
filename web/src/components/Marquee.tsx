"use client";

import { useEffect, useRef } from "react";

const items = [
  "БОРЬБА",
  "·",
  "АУТЕНТИЧНОСТЬ",
  "·",
  "РАССВЕТ",
  "·",
  "COLLECTION 2026",
  "·",
  "STREETWEAR",
  "·",
  "OVERSIZED FIT",
  "·",
  "YKK HARDWARE",
  "·",
  "100% COTTON",
  "·",
  "FREE SHIPPING 5000₽+",
  "·",
  "SOULDAWN",
  "·",
];

export default function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.innerHTML += track.innerHTML;
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#C8C8D0] py-3 select-none">
      <div
        ref={trackRef}
        className="flex gap-6 whitespace-nowrap"
        style={{
          width: "max-content",
          animation: "marquee-scroll 30s linear infinite",
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className={`text-[11px] font-black tracking-[0.2em] uppercase ${
              item === "·" ? "text-[#08080A]/40" : "text-[#08080A]"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}