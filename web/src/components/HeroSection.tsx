"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, charReveal, fadeUp, EASE } from "@/lib/motion";

const WORD_SOUL = "SOUL".split("");
const WORD_DAWN = "DAWN".split("");

// Fallback images for when video can't autoplay
const BG_IMAGES = ["/train_1.jpg", "/train_2.jpg", "/train_3.jpg", "/train_4.jpg"];

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  // Autoplay video
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().then(() => setVideoReady(true)).catch(() => setVideoReady(false));
  }, []);

  // Fallback: crossfade between images if video fails
  useEffect(() => {
    if (videoReady) return;
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % BG_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [videoReady]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* ── Living Background ── */}

      {/* Video layer — primary */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Image fallback layer (Ken Burns) */}
      {!videoReady && (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImg}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={BG_IMAGES[currentImg]}
                alt=""
                fill
                priority
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Cinematic Vignette & Overlays ── */}
      {/* Smooth radial vignette — tight center, aggressive edge darkening */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65% 60% at 50% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.97) 100%)',
        }}
      />
      {/* Inset box-shadow — wide side darkening, eliminates corners */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 180px 100px rgba(0,0,0,0.75), inset 0 0 350px 180px rgba(0,0,0,0.45)',
        }}
      />
      {/* Side gradient overlays — force dark sides */}
      <div className="absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
      {/* Top fade for header blend */}
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-black/80 to-transparent" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
      {/* Animated film grain — subtle motion */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
        }}
      />
      {/* Scan lines — cinematic CRT feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.6) 1px, rgba(0,0,0,0.6) 2px)',
        }}
      />


      {/* ── Content ── */}
      <motion.div
        className="relative z-10 text-center px-5"
        variants={staggerContainer(0.05, 0.3)}
        initial="hidden"
        animate="visible"
      >
        {/* Tagline above brand */}
        <motion.p
          variants={fadeUp}
          className="text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase text-[#C8C8D0]/35 mb-4 md:mb-6"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
        >
          Уличная культура × Спорт
        </motion.p>

        <h1 className="font-[family-name:var(--font-oswald)] text-[3.2rem] sm:text-[4.5rem] md:text-[6.5rem] lg:text-[8rem] font-black tracking-tight uppercase leading-[0.85]">
          {/* SOUL — bright steel */}
          <span
            className="flex justify-center overflow-hidden"
            style={{ filter: "drop-shadow(0 4px 30px rgba(0,0,0,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
          >
            {WORD_SOUL.map((c, i) => (
              <motion.span
                key={`s${i}`}
                variants={charReveal}
                className="block text-[#C8C8D0]"
              >
                {c}
              </motion.span>
            ))}
          </span>

          {/* DAWN — darker steel */}
          <span
            className="flex justify-center overflow-hidden mt-0.5 md:mt-1"
            style={{ filter: "drop-shadow(0 4px 30px rgba(0,0,0,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
          >
            {WORD_DAWN.map((c, i) => (
              <motion.span
                key={`d${i}`}
                variants={charReveal}
                className="block text-[#8A8A96]"
              >
                {c}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Slogan */}
        <motion.p
          variants={fadeUp}
          className="mt-6 md:mt-8 text-[13px] sm:text-[15px] md:text-[17px] font-bold tracking-[0.12em] uppercase text-[#C8C8D0]/50"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.8))" }}
        >
          Рассвет после боя
        </motion.p>

        {/* Philosophy line */}
        <motion.p
          variants={fadeUp}
          className="mt-3 text-[10px] md:text-[12px] tracking-[0.06em] font-medium text-[#C8C8D0]/50"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.6)' }}
        >
          Твоя одежда — это отражение твоей внутренней борьбы
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link
            href="/collection"
            className="group relative w-full sm:w-auto inline-flex items-center justify-center min-w-[200px] sm:min-w-[220px] px-10 sm:px-14 py-4 bg-[#C8C8D0]/90 text-[#08080A] text-[11px] md:text-[12px] font-black tracking-[0.25em] uppercase backdrop-blur-sm border border-[#C8C8D0]/20 transition-all duration-500 hover:bg-[#E8E8F0] hover:border-[#C8C8D0]/40 hover:shadow-[0_0_60px_rgba(200,200,210,0.08)] active:scale-[0.98]"
          >
            Каталог
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center min-w-[200px] sm:min-w-[220px] px-10 sm:px-14 py-4 text-[11px] md:text-[12px] font-black tracking-[0.25em] uppercase text-[#C8C8D0]/70 hover:text-[#C8C8D0] border border-[#C8C8D0]/12 hover:border-[#C8C8D0]/25 bg-black/30 backdrop-blur-sm transition-all duration-500 hover:bg-black/40"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9), 0 0px 20px rgba(0,0,0,0.7)' }}
          >
            О бренде
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8, ease: EASE }}
      >
        <motion.div
          className="w-[1px] h-10 bg-gradient-to-b from-transparent to-[#C8C8D0]/25"
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}