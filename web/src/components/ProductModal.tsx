"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useBuyMode } from "@/lib/useBuyMode";
import { allProducts } from "@/lib/products";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

/* ── Product Silhouette ── */
function ProductIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || "w-full h-full";
  const icons: Record<string, JSX.Element> = {
    tee: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path d="M60 40 L40 55 L25 50 L30 80 L55 75 L55 165 L145 165 L145 75 L170 80 L175 50 L160 55 L140 40 L120 35 C115 50 85 50 80 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M80 35 C85 55 115 55 120 35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    hoodie: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path d="M60 35 L35 50 L20 45 L25 85 L55 80 L55 170 L145 170 L145 80 L175 85 L180 45 L165 50 L140 35 L120 28 C115 15 85 15 80 28 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M80 28 C82 42 118 42 120 28" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <rect x="75" y="100" width="50" height="35" rx="5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    pants: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path d="M55 35 L145 35 L145 30 L55 30 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <path d="M55 35 L50 170 L85 170 L100 100 L115 170 L150 170 L145 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    ),
    wraps: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path d="M60 60 C70 55 90 55 100 60 C110 65 130 65 140 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M60 60 L55 145 C55 155 65 160 75 155 L95 145 L105 145 L125 155 C135 160 145 155 145 145 L140 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    ),
    longsleeve: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path d="M65 40 L40 50 L15 90 L35 95 L55 70 L55 165 L145 165 L145 70 L165 95 L185 90 L160 50 L135 40 L118 35 C115 48 85 48 82 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    ),
    cargo: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path d="M55 35 L145 35 L145 30 L55 30 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <path d="M55 35 L50 170 L85 170 L100 100 L115 170 L150 170 L145 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        <rect x="56" y="55" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        <rect x="126" y="55" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
  };
  return icons[icon || "tee"] || icons.tee;
}

/* ── Animation Variants ── */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

const modalVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    y: 40,
    scale: 0.97,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const infoChildVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const sizeVariants = {
  idle: { scale: 1 },
  selected: { scale: 1.08, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.95 },
};

/* ── Modal ── */
export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [prevImg, setPrevImg] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem, items } = useCart();
  const swipeRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  /* Ref for CSS-based image slide direction */
  const activeImgRef = useRef(0);

  const stock = typeof product.stock === "number" ? product.stock : null;
  const isSoldOut = stock !== null ? stock <= 0 : product.tag === "Нет в наличии";
  const defaultSize = product.sizes?.[0] || "Универсальный";
  const inCart = items
    .filter((i) => i.product.id === product.id)
    .reduce((s, i) => s + i.quantity, 0);
  const canAddMore = stock === null ? true : inCart < stock;
  const buyMode = useBuyMode();
  const buyLabel = buyMode === "preorder" ? "Предзаказ" : "Добавить в корзину";

  const imgCount = product.images?.length || 0;
  const hasImages = imgCount > 0 && product.images?.[0];

  /* Fit label */
  const fitMap: Record<string, string> = {
    tee: "Оверсайз", hoodie: "Оверсайз", longsleeve: "Оверсайз",
    bomber: "Оверсайз", pants: "Стандарт", cargo: "Стандарт",
    cap: "Универсальный", socks: "Универсальный", bag: "Универсальный", wraps: "Универсальный",
  };
  const fitLabel = fitMap[product.icon || ""] || "Стандарт";

  /* Cross-sell */
  const crossSell = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  /* Keep activeImgRef in sync */
  useEffect(() => {
    activeImgRef.current = activeImg;
  }, [activeImg]);

  /* Navigate images with direction — pure CSS, no AnimatePresence */
  const goImg = useCallback(
    (dir: -1 | 1) => {
      if (imgCount <= 1) return;
      setPrevImg(activeImgRef.current);
      setDirection(dir);
      setActiveImg((prev) => {
        const next = prev + dir;
        if (next < 0) return imgCount - 1;
        if (next >= imgCount) return 0;
        return next;
      });
    },
    [imgCount]
  );

  const goToImg = useCallback(
    (index: number) => {
      if (index === activeImgRef.current) return;
      const dir = index > activeImgRef.current ? 1 : -1;
      setPrevImg(activeImgRef.current);
      setDirection(dir);
      setActiveImg(index);
    },
    []
  );

  /* Touch swipe */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        goImg(dx < 0 ? 1 : -1);
      }
    },
    [goImg]
  );

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = () => {
    const ok = addItem(product, selectedSize || defaultSize);
    if (!ok) {
      setLimitHit(true);
      setTimeout(() => setLimitHit(false), 2000);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 bg-[#08080A]/[0.92] backdrop-blur-2xl"
          onClick={onClose}
        />

        {/* Modal card */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-[calc(100%-2rem)] sm:max-w-[400px] md:max-w-4xl md:h-[85vh] max-h-[72vh] md:max-h-[85vh] bg-[#0D0D11] rounded-2xl md:rounded-[3px] border border-[rgba(200,200,210,0.1)] shadow-[0_0_0_1px_rgba(200,200,210,0.04),0_25px_80px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Content wrapper — mobile scrollable, desktop grid fills height */}
          <div className="overflow-y-auto max-h-[72vh] md:max-h-[85vh] md:overflow-hidden md:h-full">
            {/* Close button — positioned relative to modal card */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.3 } }}
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center text-[#6B6B78] hover:text-[#E8E8F0] transition-colors duration-200 bg-[#0D0D11]/70 backdrop-blur-md rounded-full border border-[rgba(200,200,210,0.06)] hover:border-[rgba(200,200,210,0.15)]"
              aria-label="Закрыть"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="16" y2="16" />
                <line x1="16" y1="2" x2="2" y2="16" />
              </svg>
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 md:h-full">
              {/* ── Left: Image ── */}
              <div className="relative h-[180px] sm:h-[220px] md:h-full bg-[#0A0A0E] overflow-hidden flex items-center justify-center">
                {hasImages ? (
                  <>
                    {/* Swipe area — captures touch events */}
                    <div
                      ref={swipeRef}
                      className="absolute inset-0 z-[2]"
                      onTouchStart={onTouchStart}
                      onTouchEnd={onTouchEnd}
                    />

                    {/* Image carousel — consistent frame for all images */}
                    <div className="absolute inset-0 flex items-center justify-center px-3 py-2 md:px-5 md:py-4">
                      <div className="relative w-full h-full">
                      {product.images!.map((img, i) => {
                        const isActive = i === activeImg;
                        const justLeft = i === prevImg && !isActive;
                        const tx = isActive
                          ? 0
                          : justLeft
                            ? -direction * 24
                            : direction * 24;
                        return (
                          <div
                            key={i}
                            className="absolute inset-0"
                            style={{
                              opacity: isActive ? 1 : 0,
                              transform: `translateX(${tx}px)`,
                              transition: "opacity 180ms ease-out, transform 180ms ease-out",
                              pointerEvents: isActive ? "auto" : "none",
                            }}
                          >
                            <Image
                              src={img}
                              alt={
                                i === 0
                                  ? `${product.name} — спина`
                                  : `${product.name} — перед`
                              }
                              fill
                              sizes="(max-width: 768px) 90vw, 640px"
                              className="object-contain select-none"
                              style={{ objectPosition: "center center" }}
                              priority={i === 0}
                            />
                          </div>
                        );
                      })}
                      </div>
                    </div>

                    {/* Arrow buttons (desktop) */}
                    {imgCount > 1 && (
                      <>
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            transition: { delay: 0.3 },
                          }}
                          onClick={() => goImg(-1)}
                          className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#08080A]/60 backdrop-blur-sm border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all duration-200 rounded-[2px]"
                          aria-label="Предыдущее фото"
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0, x: 10 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            transition: { delay: 0.3 },
                          }}
                          onClick={() => goImg(1)}
                          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#08080A]/60 backdrop-blur-sm border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all duration-200 rounded-[2px]"
                          aria-label="Следующее фото"
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </motion.button>
                      </>
                    )}

                    {/* СПИНА / ПЕРЕД label — dark pill, always readable on any bg */}
                    {imgCount > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                        className="absolute bottom-14 left-4 md:bottom-16 md:left-5 z-10"
                      >
                        <span className="inline-flex items-center text-[9px] font-bold tracking-[0.2em] uppercase bg-black/70 backdrop-blur-md text-[#E8E8F0]/90 px-3 py-1.5 rounded-full border border-white/[0.08] shadow-sm">
                          {activeImg === 0 ? "Спина" : "Перед"}
                        </span>
                      </motion.div>
                    )}

                    {/* Dots */}
                    {imgCount > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: 0.25 },
                        }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
                      >
                        {product.images!.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => goToImg(i)}
                            className="flex items-center justify-center"
                            aria-label={i === 0 ? "Спина" : "Перед"}
                          >
                            <span
                              className={`h-[5px] rounded-full transition-all duration-200 ${
                                i === activeImg
                                  ? "w-5 bg-[#C8C8D0]"
                                  : "w-[5px] bg-white/20 hover:bg-white/40"
                              }`}
                            />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="text-[rgba(200,200,210,0.15)]">
                    <ProductIcon
                      icon={product.icon || "tee"}
                      className="w-48 h-48 md:w-64 md:h-64"
                    />
                  </div>
                )}

                {/* Tag badge — top-left of image area */}
                {product.tag && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { delay: 0.25 },
                    }}
                    className={`absolute top-5 left-5 md:top-6 md:left-6 text-[9px] font-black tracking-[0.15em] px-3 py-1 z-10 rounded-[2px] ${
                      product.tag === "Скидка"
                        ? "bg-[#6B6B78] text-white"
                        : "bg-[#C8C8D0] text-[#08080A]"
                    }`}
                  >
                    {product.tag}
                  </motion.span>
                )}

                {/* Brand mark */}
                <div className="absolute bottom-5 left-5 md:bottom-6 md:left-6 opacity-15 z-[5]">
                  <span className="text-[8px] font-black tracking-[0.3em] uppercase text-white block">
                    SOUL
                  </span>
                  <span className="text-[8px] font-black tracking-[0.3em] uppercase text-[#C8C8D0] block">
                    DAWN
                  </span>
                </div>
              </div>

              {/* ── Right: Info ── */}
              <div className="p-6 md:p-8 flex flex-col md:overflow-y-auto border-t md:border-t-0 md:border-l border-[rgba(200,200,210,0.06)]">
                {/* Category + Fit */}
                <motion.div
                  custom={0}
                  variants={infoChildVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-2"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6B6B78]/60">
                    {product.category}
                  </span>
                  <span className="text-[8px] font-bold tracking-[0.15em] text-[#C8C8D0]/50 border border-[rgba(200,200,210,0.1)] px-2 py-0.5">
                    {fitLabel}
                  </span>
                </motion.div>

                {/* Name */}
                <motion.h2
                  custom={1}
                  variants={infoChildVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-xl md:text-3xl font-black tracking-tight uppercase text-[#E8E8F0] mt-2 font-[family-name:var(--font-oswald)] leading-none"
                >
                  {product.name}
                </motion.h2>

                {/* Price */}
                <motion.div
                  custom={2}
                  variants={infoChildVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-baseline gap-3 mt-3"
                >
                  <span className="text-2xl md:text-3xl font-black text-[#C8C8D0]">
                    {product.price}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-[#6B6B78]/40 line-through">
                      {product.oldPrice}
                    </span>
                  )}
                </motion.div>

                {/* Short description */}
                {product.description && (
                  <motion.p
                    custom={3}
                    variants={infoChildVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-[14px] text-[#C8C8D0]/70 mt-4 leading-relaxed"
                  >
                    {product.description}
                  </motion.p>
                )}

                {/* Full description */}
                {product.fullDescription && (
                  <motion.p
                    custom={4}
                    variants={infoChildVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-[13px] text-[#B0B0BC]/50 mt-2 leading-relaxed"
                  >
                    {product.fullDescription}
                  </motion.p>
                )}

                {/* Divider */}
                <motion.div
                  custom={5}
                  variants={infoChildVariants}
                  initial="hidden"
                  animate="visible"
                  className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(200,200,210,0.1)] to-transparent my-5"
                />

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <motion.div
                    custom={6}
                    variants={infoChildVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#B0B0BC]/60 block mb-3">
                      Размер
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <motion.button
                          key={size}
                          variants={sizeVariants}
                          animate={
                            selectedSize === size ? "selected" : "idle"
                          }
                          whileTap="tap"
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[44px] h-10 text-[11px] font-bold tracking-wider border transition-colors duration-200 ${
                            selectedSize === size
                              ? "border-[#C8C8D0] text-[#C8C8D0] bg-[rgba(200,200,210,0.1)]"
                              : "border-[rgba(200,200,210,0.08)] text-[#B0B0BC]/60 hover:border-[rgba(200,200,210,0.2)] hover:text-[#E8E8F0]"
                          }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>

                    {/* Size Guide Toggle */}
                    <motion.button
                      onClick={() => setSizeGuideOpen(!sizeGuideOpen)}
                      className="mt-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.15em] uppercase text-[#B0B0BC]/40 hover:text-[#B0B0BC]/70 transition-colors duration-200"
                    >
                      <motion.svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        animate={{ rotate: sizeGuideOpen ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <polyline points="2,4 6,8 10,4" />
                      </motion.svg>
                      Размерная сетка
                    </motion.button>

                    {/* Size Guide */}
                    <AnimatePresence>
                      {sizeGuideOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: { duration: 0.2 },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 border border-[rgba(200,200,210,0.06)]">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[rgba(200,200,210,0.06)]">
                                  <th className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#B0B0BC]/40 py-2 px-2 text-left">
                                    Размер
                                  </th>
                                  <th className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#B0B0BC]/40 py-2 px-2 text-left">
                                    Грудь
                                  </th>
                                  <th className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#B0B0BC]/40 py-2 px-2 text-left">
                                    Длина
                                  </th>
                                  <th className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#B0B0BC]/40 py-2 px-2 text-left">
                                    Плечо
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  ["S", "96", "68", "44"],
                                  ["M", "100", "70", "46"],
                                  ["L", "104", "72", "48"],
                                  ["XL", "108", "74", "50"],
                                ].map(
                                  ([s, chest, length, shoulder]) => (
                                    <tr
                                      key={s}
                                      className="border-b border-[rgba(200,200,210,0.04)] last:border-b-0"
                                    >
                                      <td className="text-[11px] text-[#B0B0BC]/60 py-1.5 px-2 font-bold">
                                        {s}
                                      </td>
                                      <td className="text-[11px] text-[#B0B0BC]/60 py-1.5 px-2">
                                        {chest}cm
                                      </td>
                                      <td className="text-[11px] text-[#B0B0BC]/60 py-1.5 px-2">
                                        {length}cm
                                      </td>
                                      <td className="text-[11px] text-[#B0B0BC]/60 py-1.5 px-2">
                                        {shoulder}cm
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Stock */}
                {stock !== null && !isSoldOut && (
                  <motion.div
                    custom={7}
                    variants={infoChildVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-4 text-[11px] tracking-wider"
                  >
                    {stock <= 5 ? (
                      <span className="text-[#C8C8D0] font-bold">
                        Осталось всего {stock} шт.
                      </span>
                    ) : (
                      <span className="text-green-400/70">
                        В наличии: {stock} шт.
                      </span>
                    )}
                  </motion.div>
                )}

                {/* Add to cart */}
                <motion.div
                  custom={8}
                  variants={infoChildVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-6"
                >
                  {!isSoldOut ? (
                    <motion.button
                      onClick={handleAdd}
                      disabled={!canAddMore}
                      whileTap={{
                        scale:
                          canAddMore && !added && !limitHit ? 0.97 : 1,
                      }}
                      whileHover={
                        canAddMore && !added && !limitHit
                          ? { scale: 1.01 }
                          : {}
                      }
                      className={`w-full py-3.5 text-[11px] font-black tracking-[0.15em] uppercase transition-colors duration-300 ${
                        limitHit
                          ? "bg-[#6B6B78] text-white"
                          : added
                            ? "bg-green-500 text-[#08080A]"
                            : !canAddMore
                              ? "bg-[rgba(200,200,210,0.05)] text-[#6B6B78]/40 cursor-not-allowed"
                              : "bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0]"
                      }`}
                    >
                      {limitHit
                        ? "Больше нет в наличии"
                        : added
                          ? "Добавлено в корзину ✓"
                          : !canAddMore
                            ? "Максимум в корзине"
                            : buyLabel}
                    </motion.button>
                  ) : (
                    <div className="w-full py-3.5 text-center text-[11px] font-black tracking-[0.15em] uppercase text-[#6B6B78]/30 border border-[rgba(200,200,210,0.06)]">
                      Нет в наличии
                    </div>
                  )}
                </motion.div>

                {/* Details */}
                {product.details && product.details.length > 0 && (
                  <motion.div
                    custom={9}
                    variants={infoChildVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-6"
                  >
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#C8C8D0]/40 block mb-3">
                      Особенности
                    </span>
                    <ul className="space-y-2">
                      {product.details.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-[13px] text-[#C8C8D0]/60 leading-relaxed"
                        >
                          <span className="text-[#C8C8D0]/50 mt-1 text-[5px] flex-shrink-0">
                            ◆
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Material & Care */}
                <motion.div
                  custom={10}
                  variants={infoChildVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-5 grid grid-cols-2 gap-4"
                >
                  {product.material && (
                    <div>
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#C8C8D0]/40 block mb-1.5">
                        Материал
                      </span>
                      <p className="text-[12px] text-[#C8C8D0]/60 leading-relaxed">
                        {product.material}
                      </p>
                    </div>
                  )}
                  {product.care && (
                    <div>
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#C8C8D0]/40 block mb-1.5">
                        Уход
                      </span>
                      <p className="text-[12px] text-[#C8C8D0]/60 leading-relaxed">
                        {product.care}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Cross-sell */}
                {crossSell.length > 0 && (
                  <motion.div
                    custom={11}
                    variants={infoChildVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-6 pb-4"
                  >
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C8C8D0]/50 block mb-4">
                      С этим выбирают
                    </span>
                    <div className="flex gap-3">
                      {crossSell.map((p, idx) => (
                        <motion.button
                          key={p.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              delay: 0.5 + idx * 0.08,
                              duration: 0.4,
                            },
                          }}
                          onClick={onClose}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 min-w-0 border border-[rgba(200,200,210,0.06)] hover:border-[rgba(200,200,210,0.18)] transition-colors duration-300 rounded-[2px] overflow-hidden"
                        >
                          <div
                            className={`w-full aspect-[3/4] bg-gradient-to-br ${p.gradient} flex items-center justify-center overflow-hidden relative`}
                          >
                            {p.images?.[0] ? (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                sizes="120px"
                                className="object-contain p-2"
                              />
                            ) : (
                              <div className="text-[rgba(200,200,210,0.15)]">
                                <ProductIcon
                                  icon={p.icon || "tee"}
                                  className="w-10 h-10"
                                />
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-[#0D0D11]">
                            <p className="text-[10px] font-bold tracking-wider uppercase text-[#B0B0BC]/60 line-clamp-2 text-left leading-tight">
                              {p.name}
                            </p>
                            <p className="text-[11px] font-black text-[#C8C8D0]/70 mt-0.5 text-left">
                              {p.price}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}