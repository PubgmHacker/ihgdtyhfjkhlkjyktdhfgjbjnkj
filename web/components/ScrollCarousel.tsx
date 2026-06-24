"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useProducts } from "@/lib/useProducts";
import type { Product } from "@/lib/types";

export default function ScrollCarousel() {
  const { products } = useProducts();
  const [selected, setSelected] = useState<Product | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const items = products.slice(0, 8);

  const scrollBy = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="section-padding bg-bg overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight uppercase">
              Коллекция
            </h2>
            <p className="text-muted-foreground mt-2">
              Эксклюзивные товары SOULDAWN
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => scrollBy(-1)}
              className="p-3 rounded-full border border-border hover:bg-white/5 transition"
            >
              ←
            </button>
            <button 
              onClick={() => scrollBy(1)}
              className="p-3 rounded-full border border-border hover:bg-white/5 transition"
            >
              →
            </button>
          </div>
        </motion.div>

        <div 
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-8"
          style={{ perspective: "1000px" }}
        >
          {items.map((product, idx) => (
            <motion.div
              key={product.id}
              className="snap-center shrink-0 w-[280px] md:w-[350px]"
              initial={{ opacity: 0, rotateY: 15 }}
              whileInView={{ opacity: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              whileHover={{ y: -10 }}
            >
              <ProductCard product={product} onClick={() => setSelected(product)} />
            </motion.div>
          ))}
        </div>
      </div>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
