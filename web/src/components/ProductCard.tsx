"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/types";
import { useBuyMode } from "@/lib/useBuyMode";

export type { Product };

/* ── Fit label helper ── */
function getFitLabel(icon?: string): string | null {
  const map: Record<string, string> = {
    tee: "Оверсайз",
    hoodie: "Оверсайз",
    longsleeve: "Оверсайз",
    bomber: "Оверсайз",
    pants: "Стандарт",
    cargo: "Стандарт",
    cap: "Универсальный",
    socks: "Универсальный",
    bag: "Универсальный",
    wraps: "Универсальный",
  };
  return map[icon || ""] || null;
}

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
  onProductClick?: (product: Product) => void;
}

/* ── Circle Badge Component ── */
function BadgeCircle({ type }: { type: "NEW" | "HIT" | "SALE" | string }) {
  const config: Record<string, { bg: string; label: string; ring: string }> = {
    NEW: {
      bg: "bg-[#C8C8D0]",
      label: "NEW",
      ring: "ring-[#C8C8D0]/20",
    },
    HIT: {
      bg: "bg-[#E8E8F0]",
      label: "HIT",
      ring: "ring-[#E8E8F0]/20",
    },
    SALE: {
      bg: "bg-red-500",
      label: "SALE",
      ring: "ring-red-500/20",
    },
  };

  const c = config[type] || {
    bg: "bg-[#C8C8D0]",
    label: type,
    ring: "ring-[#C8C8D0]/20",
  };

  return (
    <div
      className={`absolute top-3 right-3 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full ${c.bg} ring-4 ${c.ring} flex items-center justify-center shadow-lg`}
    >
      <span className="text-[8px] md:text-[9px] font-black tracking-[0.1em] text-[#08080A]">
        {c.label}
      </span>
    </div>
  );
}

/* ── Stock Indicator ── */
function StockIndicator({ stock, tag }: { stock?: number | null; tag?: string }) {
  const isSoldOut = stock !== null && stock !== undefined ? stock <= 0 : tag === "Нет в наличии";
  const isLow = stock !== null && stock !== undefined && stock > 0 && stock <= 3;

  if (isSoldOut) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
        <span className="text-[9px] font-bold tracking-wider uppercase text-red-400/60">
          Нет в наличии
        </span>
      </div>
    );
  }

  if (isLow) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-pulse" />
        <span className="text-[9px] font-bold tracking-wider uppercase text-amber-400/70">
          Осталось {stock}
        </span>
      </div>
    );
  }

  if (stock !== null && stock !== undefined) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
        <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400/50">
          В наличии
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
      <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400/50">
        В наличии
      </span>
    </div>
  );
}

/* ── Product Silhouettes ─────────────────────────── */
function ProductIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const cls = className || "w-full h-full";

  switch (icon) {
    case "tee":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M60 40 L40 55 L25 50 L30 80 L55 75 L55 165 L145 165 L145 75 L170 80 L175 50 L160 55 L140 40 L120 35 C115 50 85 50 80 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M80 35 C85 55 115 55 120 35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
      );
    case "hoodie":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M60 35 L35 50 L20 45 L25 85 L55 80 L55 170 L145 170 L145 80 L175 85 L180 45 L165 50 L140 35 L120 28 C115 15 85 15 80 28 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M80 28 C82 42 118 42 120 28" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <rect x="75" y="100" width="50" height="35" rx="5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
      );
    case "pants":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M55 35 L145 35 L145 30 L55 30 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
          <path d="M55 35 L50 170 L85 170 L100 100 L115 170 L150 170 L145 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    case "cap":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M50 110 C50 70 70 45 100 40 C130 45 150 70 150 110" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M40 110 C35 105 35 95 50 110 L150 110 C165 95 165 105 160 110 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    case "bomber":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M60 35 L35 50 L20 45 L25 85 L50 80 L50 155 L150 155 L150 80 L175 85 L180 45 L165 50 L140 35 L120 28 C115 18 85 18 80 28 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <line x1="100" y1="28" x2="100" y2="155" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
      );
    case "socks":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M75 30 L75 110 C75 130 60 145 55 155 L45 165 C40 170 50 180 65 175 L90 168 L100 145 L100 30 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M60 70 L60 155 L140 155 L140 70 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M75 70 L75 55 C75 35 85 25 100 25 C115 25 125 35 125 55 L125 70" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    case "wraps":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M60 60 C70 55 90 55 100 60 C110 65 130 65 140 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M60 60 L55 145 C55 155 65 160 75 155 L95 145 L105 145 L125 155 C135 160 145 155 145 145 L140 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    case "longsleeve":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M65 40 L40 50 L15 90 L35 95 L55 70 L55 165 L145 165 L145 70 L165 95 L185 90 L160 50 L135 40 L118 35 C115 48 85 48 82 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    case "cargo":
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <path d="M55 35 L145 35 L145 30 L55 30 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
          <path d="M55 35 L50 170 L85 170 L100 100 L115 170 L150 170 L145 35 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <rect x="56" y="55" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
          <rect x="126" y="55" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 200" fill="none" className={cls}>
          <rect x="50" y="40" width="100" height="120" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
  }
}

/* ── Skeleton Card ── */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-[rgba(200,200,210,0.04)] border border-[rgba(200,200,210,0.06)]" />
      <div className="mt-3.5 space-y-2 pb-2">
        <div className="h-2.5 w-12 bg-[rgba(200,200,210,0.06)] rounded-sm" />
        <div className="h-3.5 w-3/4 bg-[rgba(200,200,210,0.06)] rounded-sm" />
        <div className="h-3 w-16 bg-[rgba(200,200,210,0.06)] rounded-sm" />
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────── */

export default function ProductCard({
  product,
  layout = "grid",
  onProductClick,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const { addItem } = useCart();

  const stock = typeof product.stock === "number" ? product.stock : null;
  const isSoldOut =
    stock !== null ? stock <= 0 : product.tag === "Нет в наличии";

  const handleAddToCart = (size: string) => {
    const ok = addItem(product, size);
    if (!ok) {
      setLimitHit(true);
      setTimeout(() => setLimitHit(false), 1800);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleCardClick = () => {
    onProductClick?.(product);
  };

  const buyMode = useBuyMode();
  const buyLabel = buyMode === "preorder" ? "Предзаказ" : "В корзину";
  const buyLabelDone =
    buyMode === "preorder" ? "Предзаказ оформлен ✓" : "Добавлено ✓";
  const defaultSize = product.sizes?.[0] || "Универсальный";

  /* ── List layout ── */
  if (layout === "list") {
    return (
      <div
        className="group relative flex gap-5 md:gap-7 p-4 md:p-5 border border-[rgba(200,200,210,0.06)] hover:border-[rgba(200,200,210,0.18)] bg-gradient-to-br from-[rgba(200,200,210,0.01)] to-transparent hover:from-[rgba(200,200,210,0.03)] transition-all duration-500 cursor-pointer overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleCardClick}
      >
        {/* Left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#C8C8D0] to-transparent scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-center" />

        {/* Image */}
        <div
          className={`w-24 h-32 md:w-28 md:h-36 flex-shrink-0 bg-gradient-to-br ${product.gradient} relative overflow-hidden border border-[rgba(200,200,210,0.06)]`}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 96px, 112px"
              className="object-contain transition-transform duration-700 group-hover:scale-105 p-2"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[rgba(200,200,210,0.2)] group-hover:text-[rgba(200,200,210,0.4)] transition-colors duration-500">
              <ProductIcon icon={product.icon || "tee"} className="w-16 h-16 md:w-20 md:h-20" />
            </div>
          )}
          {product.badge && product.badge !== "Нет в наличии" && (
            <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-[#C8C8D0] flex items-center justify-center">
              <span className="text-[6px] font-black tracking-wider text-[#08080A]">
                {product.badge}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B78]/60 block mb-0.5">
              {product.category}{getFitLabel(product.icon) && <span className="text-[7px] font-bold tracking-[0.15em] text-[#C8C8D0]/40 ml-2 inline">{getFitLabel(product.icon)}</span>}
            </span>
            <h3 className="text-sm md:text-[15px] font-bold tracking-wide uppercase text-[#E8E8F0] group-hover:text-[#C8C8D0] transition-colors duration-300 mt-0.5">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-[11px] text-[#6B6B78]/70 mt-1.5 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
            {product.sizes && (
              <div className="flex gap-1 mt-2">
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="text-[8px] font-bold tracking-wider text-[#6B6B78]/50 border border-[rgba(200,200,210,0.08)] px-1.5 py-0.5"
                  >
                    {size}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#C8C8D0]">
                {product.price}
              </span>
              {product.oldPrice && (
                <span className="text-[11px] text-[#6B6B78]/50 line-through">
                  {product.oldPrice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StockIndicator stock={stock} tag={product.tag} />
              {!isSoldOut && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(defaultSize);
                  }}
                  className={`text-[9px] font-black tracking-[0.15em] uppercase px-4 py-1.5 border transition-all duration-300 ${
                    added
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/5"
                      : "border-[rgba(200,200,210,0.14)] text-[#6B6B78] hover:border-[rgba(200,200,210,0.3)] hover:text-[#C8C8D0]"
                  }`}
                >
                  {added ? buyLabelDone : buyLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Grid layout ── */
  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setSelectedSize(null);
      }}
      onClick={handleCardClick}
    >
      {/* Image area — Premium frame */}
      <div
        className={`aspect-[3/4] bg-gradient-to-br ${product.gradient} relative overflow-hidden transition-all duration-700 border rounded-[3px] ${
          hovered
            ? "border-[rgba(200,200,210,0.2)] shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(200,200,210,0.05)]"
            : "border-[rgba(200,200,210,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
        }`}
      >
        {product.image || product.images?.length ? (
          <>
            <div className="absolute inset-0 bg-[rgba(200,200,210,0.02)] animate-pulse" aria-hidden />
            <Image
              src={(product.images?.[0] || product.image) as string}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw"
              className={`object-contain transition-all duration-700 group-hover:scale-[1.03] p-3 ${
                product.images?.[1] && hovered ? "opacity-0" : "opacity-100"
              }`}
            />
            {product.images?.[1] && (
              <Image
                src={product.images[1]}
                alt={`${product.name} — вид спереди`}
                fill
                sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw"
                className={`object-contain transition-all duration-700 group-hover:scale-[1.03] p-3 ${
                  hovered ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[rgba(200,200,210,0.15)] group-hover:text-[rgba(200,200,210,0.3)] transition-all duration-700 group-hover:scale-110">
            <ProductIcon icon={product.icon || "tee"} className="w-28 h-28 md:w-36 md:h-36" />
          </div>
        )}

        {/* Circle Badge (NEW / HIT / SALE) */}
        {product.badge && product.badge !== "Нет в наличии" && (
          <BadgeCircle type={product.badge} />
        )}

        {/* Sold out overlay */}
        {product.tag === "Нет в наличии" && !product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[8px] font-black tracking-[0.15em] px-2.5 py-1 bg-white/10 text-white/50 backdrop-blur-sm">
              Нет в наличии
            </span>
          </div>
        )}

        {/* Tag fallback (if no badge but has tag) */}
        {!product.badge && product.tag && product.tag !== "Нет в наличии" && product.tag !== "Новинка" && product.tag !== "Хит" && product.tag !== "Скидка" && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[8px] font-black tracking-[0.15em] px-2.5 py-1 bg-[#C8C8D0] text-[#08080A]">
              {product.tag}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-[#08080A]/90 via-[#08080A]/50 to-transparent flex flex-col items-center justify-end pb-8 gap-3 transition-all duration-500 ${
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex gap-1.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`min-w-[32px] h-8 text-[9px] font-bold tracking-wider border transition-all duration-200 ${
                    selectedSize === size
                      ? "border-[#C8C8D0] text-[#C8C8D0] bg-[rgba(200,200,210,0.1)]"
                      : "border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {/* Add to cart */}
          {!isSoldOut && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(selectedSize || defaultSize);
              }}
              className={`px-10 py-2.5 text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-300 ${
                added
                  ? "bg-emerald-500 text-[#08080A]"
                  : "bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] hover:shadow-[0_0_30px_rgba(200,200,210,0.15)]"
              }`}
            >
              {added ? buyLabelDone : buyLabel}
            </button>
          )}

          {isSoldOut && (
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white/30">
              Нет в наличии
            </span>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8C8D0]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center" />

        {/* Corner brand mark */}

      </div>

      {/* Info */}
      <div className="mt-2.5 pb-1.5 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B78]/50 block mb-0.5">
              {product.category}{getFitLabel(product.icon) && <span className="text-[7px] font-bold tracking-[0.15em] text-[#C8C8D0]/40 ml-2 inline">{getFitLabel(product.icon)}</span>}
            </span>
            <h3 className="text-[12px] font-bold tracking-wide uppercase text-[#E8E8F0] group-hover:text-[#C8C8D0] transition-colors duration-300 leading-tight">
              {product.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black text-[#C8C8D0]">
              {product.price}
            </span>
            {product.oldPrice && (
              <span className="text-[11px] text-[#6B6B78]/40 line-through">
                {product.oldPrice}
              </span>
            )}
          </div>
          <StockIndicator stock={stock} tag={product.tag} />
        </div>

        {/* Underline */}
        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-[rgba(200,200,210,0.15)] via-[rgba(200,200,210,0.3)] to-transparent w-0 group-hover:w-full transition-all duration-500" />
      </div>
    </div>
  );
}