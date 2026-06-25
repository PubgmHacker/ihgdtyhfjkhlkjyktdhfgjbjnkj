"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import { categories, genders, collections } from "@/lib/products";
import { useProducts } from "@/lib/useProducts";
import { Product, parsePrice } from "@/lib/types";

type LayoutMode = "grid" | "list";
type SortMode = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const SKELETON_COUNT = 9;

/* ── Collapsible Filter Panel ── */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== "Все";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 border transition-all duration-200 ${
          isActive
            ? "border-[#C8C8D0]/60 text-[#C8C8D0] bg-[rgba(200,200,210,0.08)]"
            : "border-[rgba(200,200,210,0.1)] text-[#6B6B78]/70 hover:border-[rgba(200,200,210,0.2)] hover:text-[#E8E8F0]"
        }`}
      >
        {label}
        {isActive && (
          <span className="w-1 h-1 rounded-full bg-[#C8C8D0]" />
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-30 min-w-[140px] bg-[#141418] border border-[rgba(200,200,210,0.1)] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left text-[10px] font-bold tracking-widest uppercase px-4 py-2 transition-colors duration-150 ${
                value === opt
                  ? "text-[#C8C8D0] bg-[rgba(200,200,210,0.08)]"
                  : "text-[#6B6B78]/70 hover:text-[#E8E8F0] hover:bg-[rgba(200,200,210,0.04)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Content (wrapped in Suspense for useSearchParams) ── */
function CollectionContent() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeGender, setActiveGender] = useState("Все");
  const [activeCollection, setActiveCollection] = useState("Все");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [search, setSearch] = useState("");
  const [layoutKey, setLayoutKey] = useState(0);
  const { products: allProducts, loading } = useProducts();
  const searchParams = useSearchParams();

  // Read initial gender from URL
  useEffect(() => {
    const g = searchParams.get("gender");
    if (g === "Мужчинам" || g === "Женщинам" || g === "Унисекс") {
      setActiveGender(g);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = allProducts;

    if (activeGender !== "Все") {
      result = result.filter((p) => p.gender === activeGender);
    }
    if (activeCollection !== "Все") {
      result = result.filter((p) => p.collection === activeCollection);
    }
    if (activeCategory !== "Все") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.material || "").toLowerCase().includes(q),
      );
    }
    if (sortMode !== "default") {
      result = [...result].sort((a, b) => {
        switch (sortMode) {
          case "price-asc": return parsePrice(a.price) - parsePrice(b.price);
          case "price-desc": return parsePrice(b.price) - parsePrice(a.price);
          case "name-asc": return a.name.localeCompare(b.name);
          case "name-desc": return b.name.localeCompare(a.name);
          default: return 0;
        }
      });
    }
    return result;
  }, [allProducts, activeCategory, activeGender, activeCollection, search, sortMode]);

  const hasActiveFilters = activeCategory !== "Все" || activeGender !== "Все" || activeCollection !== "Все";

  const clearFilters = () => {
    setActiveCategory("Все");
    setActiveGender("Все");
    setActiveCollection("Все");
    setSearch("");
    setSortMode("default");
  };

  const handleLayoutChange = (newLayout: LayoutMode) => {
    if (newLayout === layout) return;
    setLayoutKey((k) => k + 1);
    setLayout(newLayout);
  };

  return (
    <div className="pt-20 pb-8 px-4 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-3">Каталог</p>
            <h1 className="font-[family-name:var(--font-oswald)] text-4xl md:text-6xl font-black tracking-tight uppercase text-[#E8E8F0]">
              Все вещи
            </h1>
            <p className="mt-2 text-sm">
              {loading ? (
                <span className="text-[#6B6B78]">Загрузка...</span>
              ) : (
                <span className={filtered.length > 0 ? "text-red-400/80 font-bold" : "text-[#6B6B78]"}>
                  {filtered.length} {filtered.length === 1 ? "товар" : filtered.length < 5 ? "товара" : "товаров"}
                </span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B78]/40">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-36 md:w-48 pl-9 pr-3 py-2 bg-transparent border border-[rgba(200,200,210,0.1)] text-xs text-[#E8E8F0] placeholder:text-[#6B6B78]/30 focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors"
              />
            </div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent border border-[rgba(200,200,210,0.1)] px-3 py-2 text-xs text-[#6B6B78] focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors appearance-none cursor-pointer"
            >
              <option value="default">По умолчанию</option>
              <option value="price-asc">Дешевле</option>
              <option value="price-desc">Дороже</option>
              <option value="name-asc">А–Я</option>
              <option value="name-desc">Я–А</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => handleLayoutChange("grid")}
                className={`w-9 h-9 flex items-center justify-center border transition-all duration-200 ${layout === "grid" ? "border-[#C8C8D0] text-[#C8C8D0]" : "border-[rgba(200,200,210,0.1)] text-[#6B6B78]/50 hover:text-[#E8E8F0]"}`}
                aria-label="Сетка"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                  <rect x="5" y="0" width="4" height="4" fill="currentColor" />
                  <rect x="10" y="0" width="4" height="4" fill="currentColor" />
                  <rect x="0" y="5" width="4" height="4" fill="currentColor" />
                  <rect x="5" y="5" width="4" height="4" fill="currentColor" />
                  <rect x="10" y="5" width="4" height="4" fill="currentColor" />
                  <rect x="0" y="10" width="4" height="4" fill="currentColor" />
                  <rect x="5" y="10" width="4" height="4" fill="currentColor" />
                  <rect x="10" y="10" width="4" height="4" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={() => handleLayoutChange("list")}
                className={`w-9 h-9 flex items-center justify-center border transition-all duration-200 ${layout === "list" ? "border-[#C8C8D0] text-[#C8C8D0]" : "border-[rgba(200,200,210,0.1)] text-[#6B6B78]/50 hover:text-[#E8E8F0]"}`}
                aria-label="Список"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="0" y="0" width="14" height="3" fill="currentColor" />
                  <rect x="0" y="5.5" width="14" height="3" fill="currentColor" />
                  <rect x="0" y="11" width="14" height="3" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Collapsible Filters ── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Пол"
            options={genders}
            value={activeGender}
            onChange={setActiveGender}
          />
          <FilterDropdown
            label="Коллекция"
            options={collections}
            value={activeCollection}
            onChange={setActiveCollection}
          />
          <FilterDropdown
            label="Категория"
            options={categories}
            value={activeCategory}
            onChange={setActiveCategory}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold tracking-widest uppercase text-[#6B6B78]/50 hover:text-red-400/80 border border-[rgba(200,200,210,0.06)] px-2.5 py-1.5 transition-all duration-200 hover:border-red-400/20 ml-1"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* ── Products grid with fade-in on layout switch ── */}
        <div
          key={layoutKey}
          className="mt-4 animate-[fadeIn_0.25s_ease-out]"
        >
          <div
            className={
              layout === "grid"
                ? "grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
                : "flex flex-col gap-3"
            }
          >
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ProductCardSkeleton key={`skel-${i}`} />
                ))
              : filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout={layout}
                    onProductClick={setSelectedProduct}
                  />
                ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !loading && (
          <div className="text-center mt-16 py-10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#6B6B78]/20 mx-auto mb-3">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-[#6B6B78] text-sm tracking-wider">Ничего не найдено</p>
            {(hasActiveFilters || search) && (
              <button onClick={clearFilters} className="text-[#C8C8D0] text-xs mt-2 hover:underline">Сбросить фильтры</button>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Global keyframe for fade-in */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Page wrapper with Suspense ── */
export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-20 pb-8 px-4 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-4 w-16 bg-[rgba(200,200,210,0.06)] mb-3" />
              <div className="h-12 w-64 bg-[rgba(200,200,210,0.04)] mb-2" />
              <div className="h-4 w-24 bg-[rgba(200,200,210,0.04)]" />
            </div>
          </div>
        </div>
      }
    >
      <CollectionContent />
    </Suspense>
  );
}