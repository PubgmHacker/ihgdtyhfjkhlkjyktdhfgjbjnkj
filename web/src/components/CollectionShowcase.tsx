"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { allProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import {
  EASE,
  fadeUp,
  viewportOnce,
} from "@/lib/motion";
import { useSwipeScroll } from "@/lib/useSwipeScroll";

/* ── Filter only collection t-shirts with real photos ── */
const collectionProducts = allProducts.filter(
  (p): p is Product & { images: string[] } =>
    p.collection === "ANGELvsDEMON" && Array.isArray(p.images) && p.images.length >= 1
);

/* ── Single Showcase Card ── */
function ShowcaseCard({
  product,
  index,
  inView,
  onClick,
}: {
  product: Product & { images: string[] };
  index: number;
  inView: boolean;
  onClick: (p: Product) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backImg = product.images[0];
  const frontImg = product.images[1];

  /* ── Pointer hold for mobile (200ms delay) ── */
  const handlePointerDown = useCallback(() => {
    holdTimer.current = setTimeout(() => setFlipped(true), 200);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setFlipped(false);
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setFlipped(false);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  return (
    <div
      className="snap-start snap-always shrink-0"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-50px)",
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s`,
      }}
    >
      <button
        type="button"
        onClick={() => onClick(product)}
        className="block text-left bg-transparent border-0 p-0 cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        {/* Card Container */}
        <div className="relative w-[52vw] sm:w-[260px] md:w-[320px] lg:w-[360px] aspect-[3/4] bg-gradient-to-br from-[#0C0C0F] to-[#0A0A0D] overflow-hidden border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 rounded-[2px] group/card">

          {/* ── Back Image (default) ── */}
          <div className="absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ opacity: flipped ? 0 : 1 }}
          >
            {/* Skeleton shimmer */}
            <div className="absolute inset-0 bg-white/[0.02] animate-pulse" aria-hidden />
            <Image
              src={backImg}
              alt={`${product.name} — спина`}
              fill
              sizes="(max-width: 640px) 60vw, (max-width: 768px) 280px, (max-width: 1024px) 340px, 380px"
              className="object-contain p-4 transition-transform duration-700 ease-out group-hover/card:scale-[1.03]"
              draggable={false}
            />
          </div>

          {/* ── Front Image (crossfade on hover) ── */}
          {frontImg && (
            <div
              className="absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ opacity: flipped ? 1 : 0 }}
            >
              <Image
                src={frontImg}
                alt={`${product.name} — перед`}
                fill
                sizes="(max-width: 640px) 60vw, (max-width: 768px) 280px, (max-width: 1024px) 340px, 380px"
                className="object-contain p-4 transition-transform duration-700 ease-out group-hover/card:scale-[1.03]"
                draggable={false}
              />
            </div>
          )}

          {/* ── Gradient overlay ── */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/20 to-[#08080A]/40 pointer-events-none" />

          {/* ── Side indicator ── */}
          {frontImg && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 pointer-events-none">
              <motion.span
                animate={{ opacity: flipped ? 0.9 : 0.4 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#E8E8F0]/60"
              >
                {flipped ? "ПЕРЕД" : "СПИНА"}
              </motion.span>
            </div>
          )}

          {/* ── SOULDAWN brand mark (top-left) ── */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
            <div className="flex flex-col items-start gap-0">
              <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#E8E8F0]/30 leading-none">
                SOUL
              </span>
              <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#C8C8D0]/20 leading-none">
                DAWN
              </span>
            </div>
          </div>

          {/* ── Bottom info ── */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pt-12 pointer-events-none">
            {/* Collection badge */}
            <div className="mb-3">
              <span className="inline-block text-[8px] font-bold tracking-[0.25em] uppercase text-[#6B6B78] border border-white/[0.08] px-2.5 py-1">
                Ангел / Демон
              </span>
            </div>

            {/* Product name */}
            <h3 className="text-[13px] md:text-sm font-black tracking-wide uppercase text-[#E8E8F0] leading-tight">
              {product.name}
            </h3>

            {/* Price + subtle detail */}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[12px] font-bold text-[#C8C8D0]">
                {product.price}
              </span>
              {product.tag && (
                <span className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#C8C8D0]/50">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          {/* ── Bottom accent line ── */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8C8D0]/30 to-transparent scale-x-0 group-hover/card:scale-x-100 transition-transform duration-700 origin-center" />

          {/* ── Hover hint on desktop ── */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none md:flex hidden">
            <motion.div
              initial={false}
              animate={{ opacity: flipped ? 0 : 0.5, y: flipped ? 8 : 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col items-center gap-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-[#C8C8D0]/40"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              <span className="text-[7px] font-bold tracking-[0.2em] uppercase text-[#C8C8D0]/40">
                Удерживайте
              </span>
            </motion.div>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ── Main CollectionShowcase ── */
export default function CollectionShowcase({ onProductClick }: { onProductClick: (p: Product) => void }) {
  const sectionRef = useRef(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  useSwipeScroll(scrollerRef);

  /* Find the card at the left edge and move ±1 */
  const scrollStep = useCallback((dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const children = el.children;
    if (children.length === 0) return;
    const scrollerLeft = el.offsetLeft;

    let current = 0;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i] as HTMLElement;
      if (child.offsetLeft - scrollerLeft <= el.scrollLeft + 1) {
        current = i;
        break;
      }
    }
    const next = Math.max(0, Math.min(children.length - 1, current + dir));
    const target = children[next] as HTMLElement;
    const targetLeft = target.offsetLeft - scrollerLeft;

    // Temporarily disable snap to prevent conflict with smooth scroll
    el.style.setProperty("scroll-snap-type", "none");
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
    const restore = () => el.style.removeProperty("scroll-snap-type");
    el.addEventListener("scrollend", restore, { once: true });
    setTimeout(restore, 600);
  }, []);

  /* Reset scroll to 0 on mount */
  useLayoutEffect(() => {
    if (scrollerRef.current) {
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ left: 0, behavior: 'instant' });
      });
    }
  }, []);

  /* Also reset scroll when section enters viewport */
  useEffect(() => {
    if (inView && scrollerRef.current) {
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ left: 0, behavior: 'instant' });
      });
    }
  }, [inView]);

  if (collectionProducts.length === 0) return null;

  const totalCards = collectionProducts.length + 1; // +1 for CTA card

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        {/* ── Section Header ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4"
        >
          <div>
            <span className="block text-[10px] md:text-[11px] font-bold tracking-[0.35em] uppercase text-[#6B6B78] mb-3">
              ПЕРВАЯ КОЛЛЕКЦИЯ
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase font-[family-name:var(--font-oswald)] text-[#E8E8F0] leading-[0.95]">
              Angel
              <br />
              vs Demon
            </h2>
            <p className="mt-3 text-[10px] md:text-xs text-[#6B6B78]/70 max-w-md leading-relaxed">
              Четыре принта, вдохновлённых разными видами спорта: бокс, тяжёлая атлетика, борьба, армрестлинг. Оверсайз-футболки, плотный хлопок 220 г/м². Принт на спине.
            </p>
          </div>

          {/* Scroll arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollStep(-1)}
              className="p-3 border border-[rgba(200,200,210,0.1)] hover:border-[rgba(200,200,210,0.25)] hover:bg-white/[0.03] transition-all duration-300 text-[#6B6B78] hover:text-[#E8E8F0]"
              aria-label="Прокрутить влево"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => scrollStep(1)}
              className="p-3 border border-[rgba(200,200,210,0.1)] hover:border-[rgba(200,200,210,0.25)] hover:bg-white/[0.03] transition-all duration-300 text-[#6B6B78] hover:text-[#E8E8F0]"
              aria-label="Прокрутить вправо"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* ── Horizontal Scroll ── */}
        <div
          ref={scrollerRef}
          className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-6"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-y",
          }}
        >
          {collectionProducts.map((product, i) => (
            <ShowcaseCard key={product.id} product={product} index={i} inView={inView} onClick={onProductClick} />
          ))}

          {/* ── CTA card at end ── */}
          <div
            className="snap-start snap-always shrink-0"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-50px)",
              transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${collectionProducts.length * 0.1}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${collectionProducts.length * 0.1}s`,
            }}
          >
            <Link
              href="/collection"
              className="block w-[52vw] sm:w-[260px] md:w-[320px] lg:w-[360px] aspect-[3/4] bg-gradient-to-br from-[#0C0C0F] to-[#0A0A0D] border border-white/[0.04] hover:border-[rgba(200,200,210,0.15)] transition-all duration-500 group/cta flex flex-col items-center justify-center gap-6 rounded-[2px]"
            >
              <div className="flex flex-col items-center gap-0 opacity-20 group-hover/cta:opacity-40 transition-opacity duration-500">
                <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#E8E8F0] leading-none">
                  SOUL
                </span>
                <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#C8C8D0] leading-none">
                  DAWN
                </span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6B6B78] group-hover/cta:text-[#C8C8D0] transition-colors duration-500">
                  Весь каталог
                </span>
                <div className="w-px h-8 bg-gradient-to-b from-[#C8C8D0]/20 to-transparent" />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[#6B6B78] group-hover/cta:text-[#C8C8D0] transition-all duration-500 group-hover/cta:translate-x-1"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}