"use client";

import Image from "next/image";
import { LOOKS } from "@/lib/lookbook";
import ScrollReveal from "@/components/ScrollReveal";

export default function LookbookPage() {
  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-14 md:mb-20">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-4">
              Коллекция 2026
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-[#E8E8F0]">
              Lookbook
            </h1>
            <p className="mt-6 max-w-xl text-sm md:text-base text-[#6B6B78] leading-relaxed">
              Ангел и демон. Движение и покой. Каждый образ — это
              застывший момент внутренней борьбы. Твоя сила на спине.
            </p>
          </div>
        </ScrollReveal>

        {/* Horizontal scrolling gallery */}
        <div
          className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {LOOKS.map((look, idx) => (
            <ScrollReveal key={look.slug} delay={idx * 100}>
              <div className="shrink-0 w-[80vw] sm:w-[360px] md:w-[420px] lg:w-[480px] group cursor-pointer">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#101014] border border-[rgba(200,200,210,0.08)] hover:border-[rgba(200,200,210,0.2)] transition-all duration-500">
                  <Image
                    src={look.image || "/lookbook/5314688838582086474.jpg"}
                    alt={look.title}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 768px) 360px, (max-width: 1024px) 420px, 480px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={idx === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080A]/80 via-[#08080A]/20 to-transparent" />

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                    <div className="flex items-center gap-2 mb-2">
                      {look.items.map((item) => (
                        <span
                          key={item.name}
                          className="text-[8px] font-bold tracking-widest uppercase text-[#6B6B78]/60 border border-[rgba(200,200,210,0.1)] px-2 py-0.5"
                        >
                          {item.category}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-[family-name:var(--font-oswald)] text-xl md:text-2xl font-black tracking-wide uppercase text-[#E8E8F0]">
                      {look.title}
                    </h3>
                    <p className="text-xs text-[#6B6B78] mt-1.5">
                      {look.subtitle}
                    </p>
                    <p className="text-[11px] text-[#6B6B78]/60 mt-3 leading-relaxed line-clamp-3">
                      {look.story}
                    </p>

                    {/* Items list */}
                    <div className="mt-4 pt-4 border-t border-[rgba(200,200,210,0.1)] space-y-1.5">
                      {look.items.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[11px] text-[#E8E8F0]/70 font-bold tracking-wider uppercase">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-[#C8C8D0] font-bold">
                            {item.price.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C8C8D0] scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom section */}
        <ScrollReveal delay={200}>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4">
              <div className="h-px w-12 bg-[rgba(200,200,210,0.1)]" />
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#6B6B78]/60">
                Каждый образ — рассвет после боя
              </p>
              <div className="h-px w-12 bg-[rgba(200,200,210,0.1)]" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}