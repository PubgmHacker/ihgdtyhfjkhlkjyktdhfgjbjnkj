"use client";

import { useState, useMemo } from "react";
import { allProducts, categories } from "@/lib/products";
import { Product, formatPrice, parsePrice } from "@/lib/types";

function ProductIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const cls = className || "w-full h-full";
  const icons: Record<string, React.ReactNode> = {
    tee: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path
          d="M60 40 L40 55 L25 50 L30 80 L55 75 L55 165 L145 165 L145 75 L170 80 L175 50 L160 55 L140 40 L120 35 C115 50 85 50 80 35 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    ),
    hoodie: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path
          d="M60 35 L35 50 L20 45 L25 85 L55 80 L55 170 L145 170 L145 80 L175 85 L180 45 L165 50 L140 35 L120 28 C115 15 85 15 80 28 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    ),
    pants: (
      <svg viewBox="0 0 200 200" fill="none" className={cls}>
        <path
          d="M55 35 L50 170 L85 170 L100 100 L115 170 L150 170 L145 35 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    ),
  };
  return (icons[icon] || icons.tee) as React.ReactElement;
}

function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] bg-surface border border-white/[0.06] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-text transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="2" y1="2" x2="16" y2="16" />
            <line x1="16" y1="2" x2="2" y2="16" />
          </svg>
        </button>

        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted/50">
          {product.category}
        </span>
        <h2 className="text-xl font-black tracking-tight uppercase text-text mt-1 mb-4">
          {product.name}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                ID
              </span>
              <p className="text-sm text-text font-mono">{product.id}</p>
            </div>
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Цена
              </span>
              <p className="text-sm text-accent font-bold">{product.price}</p>
              {product.oldPrice && (
                <p className="text-xs text-muted line-through">
                  {product.oldPrice}
                </p>
              )}
            </div>
          </div>

          {product.description && (
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Описание
              </span>
              <p className="text-sm text-muted/70">{product.description}</p>
            </div>
          )}

          {product.fullDescription && (
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Полное описание
              </span>
              <p className="text-sm text-muted/70">
                {product.fullDescription}
              </p>
            </div>
          )}

          {product.sizes && (
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Размеры
              </span>
              <div className="flex gap-2">
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-bold text-muted border border-white/10 px-2 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.material && (
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Материал
              </span>
              <p className="text-sm text-muted/70">{product.material}</p>
            </div>
          )}

          {product.care && (
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Уход
              </span>
              <p className="text-sm text-muted/70">{product.care}</p>
            </div>
          )}

          {product.details && product.details.length > 0 && (
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Особенности
              </span>
              <ul className="space-y-1">
                {product.details.map((d, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted/70 flex items-start gap-2"
                  >
                    <span className="text-accent text-[8px] mt-1">&#9670;</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Тег
              </span>
              <p className="text-sm text-text">{product.tag || "—"}</p>
            </div>
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Паттерн
              </span>
              <p className="text-sm text-text">{product.pattern || "none"}</p>
            </div>
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted block mb-1">
                Иконка
              </span>
              <p className="text-sm text-text">{product.icon || "tee"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "category">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = allProducts;

    if (activeFilter !== "Все") {
      result = result.filter((p) => p.category === activeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "price") cmp = parsePrice(a.price) - parsePrice(b.price);
      else if (sortBy === "category") cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [activeFilter, search, sortBy, sortDir]);

  const handleSort = (col: "name" | "price" | "category") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-2">
          Управление
        </p>
        <h1 className="text-3xl font-black tracking-tight uppercase">
          Товары
        </h1>
        <p className="text-sm text-muted mt-2">
          {filtered.length} из {allProducts.length} товаров
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 border transition-all duration-300 ${
                activeFilter === cat
                  ? "border-accent text-accent bg-accent/10"
                  : "border-white/10 text-muted hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="bg-surface border border-white/10 px-4 py-2 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/40 transition-colors duration-300 w-48"
        />
      </div>

      {/* Table */}
      <div className="border border-white/5 bg-surface/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-[10px] font-bold tracking-widest uppercase text-muted w-12">
                  #
                </th>
                <th className="text-left p-4 text-[10px] font-bold tracking-widest uppercase text-muted">
                  <button
                    onClick={() => handleSort("name")}
                    className="hover:text-accent transition-colors"
                  >
                    Название{sortIcon("name")}
                  </button>
                </th>
                <th className="text-left p-4 text-[10px] font-bold tracking-widest uppercase text-muted">
                  <button
                    onClick={() => handleSort("category")}
                    className="hover:text-accent transition-colors"
                  >
                    Категория{sortIcon("category")}
                  </button>
                </th>
                <th className="text-right p-4 text-[10px] font-bold tracking-widest uppercase text-muted">
                  <button
                    onClick={() => handleSort("price")}
                    className="hover:text-accent transition-colors"
                  >
                    Цена{sortIcon("price")}
                  </button>
                </th>
                <th className="text-center p-4 text-[10px] font-bold tracking-widest uppercase text-muted">
                  Размеры
                </th>
                <th className="text-center p-4 text-[10px] font-bold tracking-widest uppercase text-muted">
                  Тег
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr
                  key={product.id}
                  onClick={() => setSelected(product)}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors duration-200"
                >
                  <td className="p-4 text-muted/50">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex-shrink-0 text-muted/40">
                        <ProductIcon
                          icon={product.icon || "tee"}
                          className="w-8 h-8"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-text text-sm">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-muted/50 font-mono">
                          {product.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted">{product.category}</td>
                  <td className="p-4 text-right">
                    <span className="text-accent font-bold">
                      {product.price}
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs text-muted/40 line-through ml-2">
                        {product.oldPrice}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {product.sizes?.map((s) => (
                        <span
                          key={s}
                          className="text-[9px] text-muted/60 border border-white/[0.06] px-1.5 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {product.tag && (
                      <span
                        className={`text-[9px] font-bold tracking-wider px-2 py-0.5 ${
                          product.tag === "Скидка"
                            ? "bg-accent-red/20 text-accent-red"
                            : product.tag === "Хит"
                              ? "bg-accent/20 text-accent"
                              : "bg-white/5 text-muted"
                        }`}
                      >
                        {product.tag}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted text-sm">
            Товары не найдены
          </div>
        )}
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
