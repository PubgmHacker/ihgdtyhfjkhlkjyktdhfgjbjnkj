"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp, staggerContainer, EASE } from "@/lib/motion";
import { allProducts } from "@/lib/products";

export default function ManifestoSection() {
  const [activeGender, setActiveGender] = useState<string | null>(null);

  const maleCount = allProducts.filter((p) => p.gender === "Мужчинам").length;
  const femaleCount = allProducts.filter((p) => p.gender === "Женщинам").length;
  const unisexCount = allProducts.filter((p) => p.gender === "Унисекс").length;
  const totalCount = allProducts.length;

  return (
    <section className="relative bg-[#08080A] py-20 md:py-32 overflow-hidden">
      {/* Top divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,200,210,0.4), transparent)' }} />

      <motion.div
        className="max-w-3xl mx-auto px-6 md:px-10 text-center"
        variants={staggerContainer(0.08, 0.2)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2
          variants={fadeUp}
          className="font-[family-name:var(--font-oswald)] text-[1.65rem] sm:text-3xl md:text-[2.5rem] font-black tracking-tight uppercase leading-[0.95] text-[#E8E8F0] cursor-default select-none"
        >
          <span
            className="transition-all duration-300 hover:text-[#C8C8D0]"
            onClick={() => setActiveGender(activeGender === "battle" ? null : "battle")}
          >
            Каждый бой
          </span>
          <span className="block text-[#C8C8D0] mt-1">оставляет след</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mt-5 text-[12px] sm:text-[13px] md:text-[14px] text-[#6B6B78]/80 leading-relaxed max-w-lg mx-auto"
        >
          Не на коже — в голове. SOULDAWN для тех, кто выходит за пределы
          и не ищет оправданий. Бороться — значит жить.
        </motion.p>

        {/* Gender links — always underlined */}
        <motion.div
          variants={fadeUp}
          className="mt-7 flex items-center justify-center gap-4 text-[11px] font-bold tracking-[0.1em] uppercase"
        >
          <Link
            href="/collection?gender=Мужчинам"
            className="text-[#C8C8D0] hover:text-[#E8E8F0] transition-colors duration-300 border-b border-[#C8C8D0]/40 hover:border-[#C8C8D0]/70 pb-0.5"
          >
            Мужчинам
          </Link>
          <span className="text-[#6B6B78]/15">/</span>
          <Link
            href="/collection?gender=Женщинам"
            className="text-[#C8C8D0] hover:text-[#E8E8F0] transition-colors duration-300 border-b border-[#C8C8D0]/40 hover:border-[#C8C8D0]/70 pb-0.5"
          >
            Женщинам
          </Link>
        </motion.div>

        {/* Product count */}
        <motion.div
          variants={fadeUp}
          className="mt-5 flex items-center justify-center gap-3"
        >
          <span className="text-[#6B6B78]/40 text-[10px] font-bold tracking-[0.2em] uppercase">
            В каталоге
          </span>
          <span className={`text-sm font-black ${totalCount > 0 ? "text-red-400/70" : "text-[#6B6B78]/40"}`}>
            {totalCount}
          </span>
          <span className="text-[#6B6B78]/40 text-[10px] font-bold tracking-[0.2em] uppercase">
            вещей
          </span>
        </motion.div>

      </motion.div>
      {/* Bottom divider line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,200,210,0.4), transparent)' }} />
    </section>
  );
}