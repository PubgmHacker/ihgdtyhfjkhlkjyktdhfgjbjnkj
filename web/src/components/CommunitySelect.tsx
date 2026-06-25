"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { fadeUp, EASE } from "@/lib/motion";
import { allProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import { useSwipeScroll } from "@/lib/useSwipeScroll";

async function fetchPopularIds(): Promise<string[]> {
  try {
    const res = await fetch("/api/products/popular");
    if (!res.ok) return [];
    const data: Array<{ id: string; count: number }> = await res.json();
    return data.map((d) => d.id);
  } catch {
    return [];
  }
}

function BestsellerCard({
  product,
  rank,
  inView,
  delay,
  onClick,
}: {
  product: Product;
  rank: number;
  inView: boolean;
  delay: number;
  onClick: (p: Product) => void;
}) {
  const mainImg = product.images?.[0] || product.image;
  return (
    <div
      className="snap-start snap-always shrink-0"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-40px)",
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      <button
        type="button"
        onClick={() => onClick(product)}
        className="block group/bc w-full text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        <div
          className={`relative w-[38vw] sm:w-[200px] md:w-[240px] lg:w-[270px] aspect-[3/4] bg-gradient-to-br ${product.gradient} overflow-hidden border border-white/[0.04] hover:border-[rgba(200,200,210,0.18)] transition-all duration-500 rounded-[2px]`}
        >
          {mainImg ? (
            <>
              <div className="absolute inset-0 bg-white/[0.02] animate-pulse" aria-hidden />
              <Image
                src={mainImg}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 40vw, (max-width: 768px) 220px, 280px"
                className="object-contain p-3 transition-transform duration-700 group-hover/bc:scale-[1.04]"
                draggable={false}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[rgba(200,200,210,0.12)]">
              <span className="text-2xl font-black">SD</span>
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-full bg-[#C8C8D0] flex items-center justify-center shadow-lg">
            <span className="text-[8px] font-black text-[#08080A]">{rank}</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080A]/95 via-[#08080A]/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-10 pointer-events-none">
            <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#6B6B78] block mb-1">
              {product.category}
            </span>
            <h3 className="text-[12px] font-black tracking-wide uppercase text-[#E8E8F0] leading-tight truncate">
              {product.name}
            </h3>
            <span className="text-[11px] font-bold text-[#C8C8D0] mt-0.5 block">
              {product.price}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8C8D0]/40 to-transparent scale-x-0 group-hover/bc:scale-x-100 transition-transform duration-700 origin-center" />
        </div>
      </button>
    </div>
  );
}

export default function CommunitySelect({ onProductClick }: { onProductClick: (p: Product) => void }) {
  const sectionRef = useRef(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);

  useSwipeScroll(scrollerRef);

  useEffect(() => {
    fetchPopularIds().then((ids) => {
      if (ids.length === 0) {
        const fallback = allProducts.filter((p) => p.images && p.images.length > 0).slice(0, 6);
        setPopularProducts(fallback);
        return;
      }
      const matched: Product[] = [];
      for (const id of ids) {
        const p = allProducts.find((pr) => pr.id === id);
        if (p) matched.push(p);
        if (matched.length >= 6) break;
      }
      if (matched.length < 6) {
        const remaining = allProducts
          .filter((p) => p.images && p.images.length > 0 && !matched.some((m) => m.id === p.id))
          .slice(0, 6 - matched.length);
        matched.push(...remaining);
      }
      setPopularProducts(matched);
    });
  }, []);

  useLayoutEffect(() => {
    if (popularProducts.length > 0 && scrollerRef.current) {
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ left: 0, behavior: "instant" });
      });
    }
  }, [popularProducts.length]);

  useEffect(() => {
    if (inView && scrollerRef.current) {
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ left: 0, behavior: "instant" });
      });
    }
  }, [inView]);

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
    el.style.setProperty("scroll-snap-type", "none");
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
    const restore = () => el.style.removeProperty("scroll-snap-type");
    el.addEventListener("scrollend", restore, { once: true });
    setTimeout(restore, 600);
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-[#08080A] pt-20 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-4"
        >
          <div>
            <span className="block text-[10px] md:text-[11px] font-bold tracking-[0.35em] uppercase text-[#6B6B78] mb-3">
              Выбор коммьюнити
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase font-[family-name:var(--font-oswald)] text-[#E8E8F0] leading-[0.95]">
              Популярное
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scrollStep(-1)} className="p-3 border border-[rgba(200,200,210,0.1)] hover:border-[rgba(200,200,210,0.25)] hover:bg-white/[0.03] transition-all duration-300 text-[#6B6B78] hover:text-[#E8E8F0]" aria-label="Назад">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={() => scrollStep(1)} className="p-3 border border-[rgba(200,200,210,0.1)] hover:border-[rgba(200,200,210,0.25)] hover:bg-white/[0.03] transition-all duration-300 text-[#6B6B78] hover:text-[#E8E8F0]" aria-label="Вперёд">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollerRef}
          className="flex gap-3 md:gap-5 lg:gap-6 overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", touchAction: "pan-y" }}
        >
          {popularProducts.map((product, i) => (
            <BestsellerCard key={product.id} product={product} rank={i + 1} inView={inView} delay={i * 0.08} onClick={onProductClick} />
          ))}
          <div
            className="snap-start snap-always shrink-0"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-40px)",
              transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${popularProducts.length * 0.08}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${popularProducts.length * 0.08}s`,
            }}
          >
            <Link
              href="/collection"
              className="block w-[38vw] sm:w-[200px] md:w-[240px] lg:w-[270px] aspect-[3/4] bg-gradient-to-br from-[#0C0C0F] to-[#0A0A0D] border border-white/[0.04] hover:border-[rgba(200,200,210,0.15)] transition-all duration-500 group/cta flex flex-col items-center justify-center gap-5 rounded-[2px]"
            >
              <div className="flex flex-col items-center opacity-15 group-hover/cta:opacity-30 transition-opacity duration-500">
                <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#E8E8F0] leading-none">SOUL</span>
                <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#C8C8D0] leading-none">DAWN</span>
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B78] group-hover/cta:text-[#C8C8D0] transition-colors duration-500">Весь каталог</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6B6B78] group-hover/cta:text-[#C8C8D0] transition-all duration-500 group-hover/cta:translate-x-1">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"} className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}