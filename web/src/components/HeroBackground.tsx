"use client";

import { useEffect, useRef } from "react";

/**
 * Living animated mesh-gradient background for the hero section.
 * Pure canvas-based for maximum performance.
 * Inspired by D2C sportswear hero animations — dark, cinematic, fluid.
 */
export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Blobs — large gradient circles that move slowly
    interface Blob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      phase: number;
      speed: number;
    }

    const blobs: Blob[] = [
      { x: 0.3, y: 0.4, vx: 0.00015, vy: 0.0001, radius: 0.45, color: "rgba(100,100,120,0.07)", phase: 0, speed: 0.0003 },
      { x: 0.7, y: 0.6, vx: -0.00012, vy: 0.00008, radius: 0.4, color: "rgba(140,140,160,0.05)", phase: 2, speed: 0.00025 },
      { x: 0.5, y: 0.3, vx: 0.0001, vy: -0.00013, radius: 0.5, color: "rgba(80,80,100,0.06)", phase: 4, speed: 0.00035 },
      { x: 0.2, y: 0.7, vx: 0.00008, vy: 0.00014, radius: 0.35, color: "rgba(160,160,180,0.04)", phase: 1, speed: 0.0002 },
      { x: 0.8, y: 0.2, vx: -0.00014, vy: -0.00009, radius: 0.3, color: "rgba(120,120,140,0.05)", phase: 3, speed: 0.00028 },
    ];

    // Grid lines — subtle horizontal scanlines
    const drawGrid = (time: number) => {
      ctx.strokeStyle = "rgba(200,200,210,0.012)";
      ctx.lineWidth = 0.5;
      const spacing = 80;
      const offset = (time * 0.008) % spacing;

      for (let y = -spacing + offset; y < h + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    // Floating particles — tiny dots that drift
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];
    const MAX_PARTICLES = 60;

    const spawnParticle = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.05,
      life: 0,
      maxLife: Math.random() * 600 + 300,
    });

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    // Noise/grain overlay (drawn once per few frames for perf)
    let grainCanvas: HTMLCanvasElement | null = null;
    let grainFrame = 0;

    const createGrain = () => {
      grainCanvas = document.createElement("canvas");
      grainCanvas.width = Math.floor(w / 2);
      grainCanvas.height = Math.floor(h / 2);
      const gCtx = grainCanvas.getContext("2d");
      if (!gCtx) return;
      const imageData = gCtx.createImageData(grainCanvas.width, grainCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 8; // very subtle
      }
      gCtx.putImageData(imageData, 0, 0);
    };

    createGrain();

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);

      // Base dark fill
      ctx.fillStyle = "#08080A";
      ctx.fillRect(0, 0, w, h);

      // Draw blobs
      for (const blob of blobs) {
        blob.x += blob.vx + Math.sin(time * blob.speed + blob.phase) * 0.0002;
        blob.y += blob.vy + Math.cos(time * blob.speed * 0.7 + blob.phase) * 0.00015;

        // Soft boundary bounce
        if (blob.x < -0.2) blob.vx = Math.abs(blob.vx);
        if (blob.x > 1.2) blob.vx = -Math.abs(blob.vx);
        if (blob.y < -0.2) blob.vy = Math.abs(blob.vy);
        if (blob.y > 1.2) blob.vy = -Math.abs(blob.vy);

        const bx = blob.x * w;
        const by = blob.y * h;
        const br = blob.radius * Math.max(w, h);

        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw grid
      drawGrid(time);

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        const alpha = p.opacity * (lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1);

        if (p.life >= p.maxLife || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
          particles[i] = spawnParticle();
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
        ctx.fill();
      }

      // Grain overlay (update every 4 frames for perf)
      grainFrame++;
      if (grainFrame % 4 === 0) createGrain();
      if (grainCanvas) {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(grainCanvas, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // Top and bottom vignette
      const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      topGrad.addColorStop(0, "#08080A");
      topGrad.addColorStop(1, "transparent");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, w, h * 0.3);

      const botGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      botGrad.addColorStop(0, "transparent");
      botGrad.addColorStop(1, "#08080A");
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}