"use client";

import { usePathname } from "next/navigation";

export default function PageFog() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-32 md:h-40 pointer-events-none z-10">
      <style>{`
        @keyframes fogFloat1 {
          0%, 100% { transform: translateX(-3%); opacity: 0.5; }
          50% { transform: translateX(3%); opacity: 0.8; }
        }
        @keyframes fogFloat2 {
          0%, 100% { transform: translateX(4%); opacity: 0.4; }
          50% { transform: translateX(-4%); opacity: 0.7; }
        }
        @keyframes fogFloat3 {
          0%, 100% { transform: translateX(-2%); opacity: 0.3; }
          50% { transform: translateX(2%); opacity: 0.6; }
        }
      `}</style>

      {/* Wide even fog — spans full width, low opacity, no blur */}
      <div
        className="absolute bottom-0 left-0 right-0 h-full"
        style={{
          background: "linear-gradient(to top, rgba(200,200,210,0.06) 0%, transparent 100%)",
          animation: "fogFloat1 16s ease-in-out infinite",
        }}
      />

      {/* Second fog layer — slightly offset, different timing */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3/4"
        style={{
          background: "linear-gradient(to top, rgba(200,200,210,0.04) 0%, rgba(200,200,210,0.01) 60%, transparent 100%)",
          animation: "fogFloat2 22s ease-in-out infinite",
        }}
      />

      {/* Subtle edge accents */}
      <div
        className="absolute bottom-0 left-0 w-1/3 h-1/2"
        style={{
          background: "linear-gradient(to top right, rgba(200,200,210,0.03) 0%, transparent 100%)",
          animation: "fogFloat3 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-1/3 h-1/2"
        style={{
          background: "linear-gradient(to top left, rgba(200,200,210,0.03) 0%, transparent 100%)",
          animation: "fogFloat1 20s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}