"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LOOKS } from "@/lib/lookbook";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

export default function Lookbook() {
  return (
    <section className="section-padding bg-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="flex items-center gap-6 mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="h-[1px] flex-1 bg-white/10" />
          <h2 className="text-xs font-bold tracking-superwide uppercase text-muted">
            Lookbook
          </h2>
          <div className="h-[1px] flex-1 bg-white/10" />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {LOOKS.map((look, i) => (
            <motion.div key={look.slug} variants={fadeUp}>
              <Link
                href={`/lookbook/${look.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden"
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${look.gradient} transition-transform duration-700 group-hover:scale-105`}
                />

                {/* Noise texture */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Grid pattern overlay */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `linear-gradient(${look.accent}22 1px, transparent 1px), linear-gradient(90deg, ${look.accent}22 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <span
                    className="text-[9px] font-black tracking-[0.2em] uppercase mb-2"
                    style={{ color: look.accent }}
                  >
                    {look.subtitle}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-text mb-2">
                    {look.title}
                  </h3>
                  <p className="text-sm text-muted/70 line-clamp-2">{look.story}</p>

                  {/* Bottom accent line */}
                  <div
                    className="mt-4 h-[2px] w-0 group-hover:w-full transition-all duration-700"
                    style={{ backgroundColor: look.accent }}
                  />
                </div>

                {/* Corner number */}
                <div className="absolute top-5 right-5 opacity-10 group-hover:opacity-25 transition-opacity duration-500">
                  <span className="text-5xl font-black" style={{ color: look.accent }}>
                    0{i + 1}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <Link
            href="/lookbook"
            className="text-xs font-bold tracking-widest uppercase text-muted hover:text-accent transition-colors duration-300"
          >
            Смотреть все образы →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
