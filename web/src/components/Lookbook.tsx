"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { LOOKS } from "@/lib/lookbook";
import { fadeUp, viewportOnce, staggerContainer, cardReveal } from "@/lib/motion";

export default function Lookbook() {
  return (
    <section className="px-5 md:px-10 py-8 md:py-14">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          className="flex items-center gap-6 mb-4 md:mb-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="h-[1px] flex-1 bg-[rgba(200,200,210,0.08)]" />
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#6B6B78]">
            Lookbook
          </h2>
          <div className="h-[1px] flex-1 bg-[rgba(200,200,210,0.08)]" />
        </motion.div>

        {/* Grid: 2-col on all sizes, compact */}
        <motion.div
          className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4"
          variants={staggerContainer(0.08, 0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {LOOKS.map((look, idx) => (
            <motion.div
              key={look.slug}
              variants={cardReveal}
              custom={idx}
              className="group"
            >
              <Link href="/lookbook" className="block">
                <div className="relative aspect-[3/4] overflow-hidden border border-[rgba(200,200,210,0.06)] hover:border-[rgba(200,200,210,0.15)] transition-all duration-500 rounded-[2px]">
                  <Image
                    src={look.image || "/lookbook/5314688838582086474.jpg"}
                    alt={look.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 640px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={idx === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080A]/80 via-transparent to-transparent pointer-events-none" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3 lg:p-4">
                    <span className="text-[6px] md:text-[7px] font-bold tracking-[0.2em] uppercase text-[#C8C8D0]/40 block mb-0.5">{look.subtitle}</span>
                    <h3 className="font-[family-name:var(--font-oswald)] font-black tracking-wide uppercase text-[#E8E8F0] text-[10px] md:text-xs lg:text-sm leading-tight">
                      {look.title}
                    </h3>
                    <p className="hidden md:block text-[10px] text-[#6B6B78]/50 mt-1 line-clamp-2 leading-relaxed max-w-sm">
                      {look.story}
                    </p>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8C8D0]/25 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-3 md:mt-5 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <Link
            href="/lookbook"
            className="inline-flex items-center gap-2.5 text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#6B6B78]/60 hover:text-[#C8C8D0] transition-colors duration-300 group/cta"
          >
            Все образы
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover/cta:translate-x-1 transition-transform duration-300">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}