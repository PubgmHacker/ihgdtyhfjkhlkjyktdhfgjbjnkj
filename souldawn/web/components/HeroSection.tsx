"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { staggerContainer, charReveal, fadeUp, EASE } from "@/lib/motion";

const WORD_SOUL = "SOUL".split("");
const WORD_DAWN = "DAWN".split("");

export default function HeroSection() {
  // Pointer parallax: move background slightly opposite to the cursor.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const bgX = useTransform(sx, [-1, 1], ["-3%", "3%"]);
  const bgY = useTransform(sy, [-1, 1], ["-3%", "3%"]);
  const glowX = useTransform(sx, [-1, 1], ["-12%", "12%"]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mx.set(x);
      my.set(y);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated dawn gradient background */}
      <motion.div
        className="absolute inset-[-10%] dawn-gradient bg-200 animate-gradient-shift"
        style={{ x: bgX, y: bgY }}
      />

      {/* Soft glow orb (dawn) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60vmin] w-[60vmin] rounded-full blur-3xl animate-glow"
        style={{
          x: glowX,
          background:
            "radial-gradient(circle, rgba(201,123,61,0.35) 0%, rgba(139,37,0,0.12) 45%, transparent 70%)",
        }}
      />

      {/* Noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6"
        variants={staggerContainer(0.06, 0.1)}
        initial="hidden"
        animate="visible"
      >
        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-xs md:text-sm font-bold tracking-superwide uppercase text-accent mb-6"
        >
          Уличная культура × Спорт
        </motion.p>

        {/* Main title — staggered letters */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none">
          <span className="flex justify-center overflow-hidden">
            {WORD_SOUL.map((c, i) => (
              <motion.span key={`s${i}`} variants={charReveal} className="block text-text">
                {c}
              </motion.span>
            ))}
          </span>
          <span className="flex justify-center overflow-hidden">
            {WORD_DAWN.map((c, i) => (
              <motion.span key={`d${i}`} variants={charReveal} className="block text-gradient">
                {c}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          className="mt-8 text-sm md:text-base text-muted max-w-md mx-auto leading-relaxed tracking-wide"
        >
          Твоя одежда — это отражение твоей внутренней борьбы
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} className="mt-12">
          <Link href="/collection" className="btn-primary">
            Смотреть коллекцию
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8, ease: EASE }}
      >
        <motion.div
          className="w-[1px] h-12 bg-gradient-to-b from-transparent to-accent"
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}
