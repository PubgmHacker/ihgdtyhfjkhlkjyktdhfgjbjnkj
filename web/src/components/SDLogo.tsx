"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "text-lg md:text-xl",
  md: "text-2xl md:text-3xl",
  lg: "text-4xl md:text-5xl",
  hero: "text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]",
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <span
      className={`${sizeClasses[size]} font-[family-name:var(--font-oswald)] font-bold uppercase tracking-tight leading-none select-none ${className}`}
      style={{
        background: "linear-gradient(135deg, #707080 0%, #C8C8D0 35%, #F0F0F4 50%, #C8C8D0 65%, #707080 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      SOULDAWN
    </span>
  );
}