"use client";

/**
 * SOULDAWN — Scroll-driven horizontal collection carousel (Apple-style).
 *
 * На десктопе: секция «прилипает» (sticky), а товары едут горизонтально
 * по мере вертикальной прокрутки. На мобильных / при prefers-reduced-motion —
 * обычный горизонтальный scroll-snap без pin.
 */
import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useProducts } from "@/lib/useProducts";
import type { Product } from "@/lib/types";
import { EASE } from "@/lib/motion";

export default function ScrollCarousel() {
  const { products } = useProducts();
  const [selected, setSelected] = useState<Product | null>(null);
  const reduce = useReducedMotion();

  // Ограничиваем количество карточек в карусели (первые 8).
  const items = products.slice(0, 8);

  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  // Плавный прогресс для инерции.
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.4 });

  // Горизонтальный сдвиг: от 5% до -расчётного конца.
  // Последнее значение зависит от количества карточек.
  const endPercent = `-${Math.max(0, items.length - 1) * 26}%`;
  const x = useTransform(smooth, [0, 1], ["4%", endPercent]);
  const progressScale = useTransform(smooth, [0, 1], [0, 1]);

  const openModal = (p: Product) => setSelected(p);

  // —— Reduced motion / простой вариант: горизонтальный scroll-snap ——
  if (reduce) {
    return (
      <section className="section-padding bg-bg">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="mt-12 flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6">
            {items.map((product) => (
              <div key={product.id} className="snap-start shrink-0 w-[70vw] sm:w-[40vw] lg:w-[24vw]">
                <ProductCard product={product} onProductClick={openModal} />
              </div>
            ))}
          </div>
        </div>
        {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      </section>
    );
  }

  // —— Основной scroll-driven вариант (sticky pin) ——
  // Высота секции определяет «длину» прокрутки карусели.
  return (
    <section ref={targetRef} className="relative bg-bg" style={{ height: `${items.length * 60 + 100}vh` }}>
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-6">
          <Header />
        </div>

        <motion.div className="mt-12 flex gap-6 md:gap-8 px-6 will-change-transform" style={{ x }}>
          {items.map((product, i) => (
            <CarouselCard
              key={product.id}
              product={product}
              index={i}
              progress={smooth}
              total={items.length}
              onClick={openModal}
            />
          ))}
        </motion.div>

        {/* Прогресс-бар */}
        <div className="max-w-7xl mx-auto w-full px-6 mt-12">
          <div className="h-[2px] w-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-accent origin-left"
              style={{ scaleX: progressScale }}
            />
          </div>
        </div>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function Header() {
  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="h-[1px] flex-1 bg-white/10" />
      <h2 className="text-xs font-bold tracking-superwide uppercase text-muted whitespace-nowrap">
        Коллекция — прокрутите
      </h2>
      <div className="h-[1px] flex-1 bg-white/10" />
    </motion.div>
  );
}

function CarouselCard({
  product,
  index,
  progress,
  total,
  onClick,
}: {
  product: Product;
  index: number;
  progress: import("framer-motion").MotionValue<number>;
  total: number;
  onClick: (p: Product) => void;
}) {
  // Лёгкий параллакс/scale: карточка чуть «дышит» по мере прохождения центра.
  const center = total > 1 ? index / (total - 1) : 0;
  const scale = useTransform(
    progress,
    [Math.max(0, center - 0.35), center, Math.min(1, center + 0.35)],
    [0.92, 1, 0.92]
  );
  const y = useTransform(
    progress,
    [Math.max(0, center - 0.35), center, Math.min(1, center + 0.35)],
    [24, 0, 24]
  );

  return (
    <motion.div
      className="shrink-0 w-[72vw] sm:w-[42vw] lg:w-[24vw] will-change-transform"
      style={{ scale, y }}
    >
      <ProductCard product={product} onProductClick={onClick} />
    </motion.div>
  );
}
