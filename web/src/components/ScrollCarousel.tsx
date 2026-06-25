"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useProducts } from "@/lib/useProducts";
import type { Product } from "@/lib/types";
import { useSwipeScroll } from "@/lib/useSwipeScroll";

export default function ScrollCarousel() {
  const { products } = useProducts();
  const [selected, setSelected] = useState<Product | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const isResettingRef = useRef(false);

  useSwipeScroll(scrollerRef);

  const items = products.slice(0, 8);

  const scrollBy = useCallback((dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  /* ── Auto-scroll ─────────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current || isResettingRef.current) return;

      const el = scrollerRef.current;
      if (!el) return;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

      if (atEnd) {
        // Smoothly loop back to the start
        isResettingRef.current = true;
        el.scrollTo({ left: 0, behavior: "smooth" });
        // Allow the reset animation to finish before resuming auto-scroll
        setTimeout(() => {
          isResettingRef.current = false;
        }, 600);
      } else {
        el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  /* ── Pause / resume on hover ─────────────────────────────────── */
  const handleMouseEnter = () => {
    isPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };

  return (
    <section className="px-5 md:px-0 py-20 md:py-28 bg-[#08080A] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-4"
        >
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase font-[family-name:var(--font-oswald)] text-[#E8E8F0]">
              Коллекция
            </h2>
            <p className="text-[#6B6B78] mt-2 text-sm">
              Эксклюзивные товары SOULDAWN
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => scrollBy(-1)}
              className="p-3.5 bg-[rgba(200,200,210,0.04)] border border-[rgba(200,200,210,0.14)] hover:bg-[rgba(200,200,210,0.1)] transition-colors text-[#B0B0BC] hover:text-[#E8E8F0]"
              aria-label="Прокрутить влево"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="p-3.5 bg-[rgba(200,200,210,0.04)] border border-[rgba(200,200,210,0.14)] hover:bg-[rgba(200,200,210,0.1)] transition-colors text-[#B0B0BC] hover:text-[#E8E8F0]"
              aria-label="Прокрутить вправо"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Scroll area with gradient fade edges */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Left gradient fade */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-8 w-10 z-10"
            style={{
              background: "linear-gradient(to right, #08080A, transparent)",
            }}
          />

          {/* Right gradient fade */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-8 w-10 z-10"
            style={{
              background: "linear-gradient(to left, #08080A, transparent)",
            }}
          />

          {/* Horizontal-only scroll — NO perspective, NO whileHover y movement */}
          <div
            ref={scrollerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              touchAction: "pan-y",
            }}
          >
            <style>{`
              div[class*="overflow-x-auto"]::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {items.map((product) => (
              <div
                key={product.id}
                className="snap-center shrink-0 w-[70vw] sm:w-[260px] md:w-[280px] lg:w-[300px]"
              >
                <ProductCard product={product} onProductClick={() => setSelected(product)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}