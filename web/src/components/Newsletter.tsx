"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="px-5 md:px-0 py-20 md:py-28 bg-[#08080A]">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="relative border border-[rgba(200,200,210,0.08)] p-8 md:p-16 overflow-hidden">
            {/* Background accent glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8C8D0]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#707080]/5 rounded-full blur-[100px]" />

            <div className="relative z-10 max-w-xl mx-auto text-center">
              <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[#C8C8D0] block mb-4">
                Будь в курсе
              </span>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase text-[#E8E8F0] mb-4 font-[family-name:var(--font-oswald)]">
                Подпишись на{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, #707080 0%, #C8C8D0 40%, #E8E8F0 55%, #C8C8D0 70%, #707080 100%)",
                  }}
                >
                  drops
                </span>
              </h2>
              <p className="text-sm text-[#6B6B78]/70 mb-8 leading-relaxed">
                Новые коллекции, эксклюзивные товары и скидки первыми.
                Никакого спама — только то, что имеет значение.
              </p>

              {submitted ? (
                <div className="py-4">
                  <p className="text-[#C8C8D0] font-bold tracking-wider uppercase text-sm">
                    ✓ Ты подписан!
                  </p>
                  <p className="text-xs text-[#6B6B78]/50 mt-2">
                    Следи за обновлениями в соцсетях
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-2 sm:gap-0 max-w-md mx-auto w-full"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-5 py-3.5 bg-[#101014] border border-[rgba(200,200,210,0.08)] border-r-0 sm:border-r-0 text-sm text-[#E8E8F0] placeholder:text-[#6B6B78]/40 focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors duration-300"
                  />
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#C8C8D0] text-[#08080A] text-[10px] font-black tracking-[0.15em] uppercase hover:bg-[#E8E8F0] transition-colors duration-300"
                  >
                    Подписаться
                  </button>
                </form>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}