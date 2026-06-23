"use client";

/**
 * SOULDAWN — Карусель коллекции.
 *
 * Фиксы:
 * • overscroll-behavior-x: contain — колесо мыши не перехватывается каруселью
 * • На мобильных — сетка 2×2 вместо горизонтальной ленты
 * • На десктопе — drag-скролл мышью + стрелки
 * • Карточки компактнее на мобильных
 */
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useProducts } from "@/lib/useProducts";
import type { Product } from "@/lib/types";
import { EASE } from "@/lib/motion";

export default function ScrollCarousel() {
  const { products } = useProducts();
  const [selected, setSelected] = useState<Product | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // ── drag-скролл мышью на десктопе ──
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    el.scrollLeft = dragScrollLeft.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    el.style.userSelect = "";
  }, []);

  const scrollBy = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const items = products.slice(0, 8);

  return (
    <section className="section-padding bg-bg">
      <div className="max-w-7xl mx-auto">

        {/* Заголовок + стрелки */}
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="h-[1px] flex-1 bg-white/10" />
          <h2 className="text-xs font-bold tracking-superwide uppercase text-muted whitespace-nowrap">
            Коллекция
          </h2>
          {/* Стрелки — только на десктопе */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              aria-label="Назад"
              onClick={() => scrollBy(-1)}
              className="h-9 w-9 flex items-center justify-center border border-white/10 text-muted hover:text-accent hover:border-accent transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Вперёд"
              onClick={() => scrollBy(1)}
              className="h-9 w-9 flex items-center justify-center border border-white/10 text-muted hover:text-accent hover:border-accent transition-colors"
            >
              →
            </button>
          </div>
        </motion.div>

        {/* ── Мобильная сетка 2×2 ── */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {items.slice(0, 4).map((product) => (
            <div key={product.id}>
              <ProductCard product={product} onProductClick={setSelected} />
            </div>
          ))}
        </div>

        {/* ── Десктопная лента ── */}
        <div
          ref={scrollerRef}
          className="hidden md:flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 [overscroll-behavior-x:contain]"
          style={{
            scrollbarWidth: "none",
            // overscrollBehaviorX — camelCase не работает в Safari,
            // поэтому используем CSS-переменную через className
            cursor: "grab",
          } as React.CSSProperties}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {items.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[260px] lg:w-[280px]"
            >
              <ProductCard product={product} onProductClick={setSelected} />
            </div>
          ))}
        </div>

        {/* Подсказка для мобильных */}
        <p className="md:hidden text-center text-[10px] text-muted/40 mt-4 tracking-widest uppercase">
          Нажми на карточку чтобы узнать больше
        </p>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
