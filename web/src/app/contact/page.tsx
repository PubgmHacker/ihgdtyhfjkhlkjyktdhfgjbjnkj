"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

const SOCIALS = [
  {
    name: "Instagram",
    handle: "@souldawnclothes",
    href: "https://instagram.com/souldawnclothes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C8C8D0]">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    handle: "@souldawnclothes",
    href: "https://tiktok.com/@souldawnclothes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#C8C8D0]">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.15V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    handle: "@souldawnclothes",
    href: "https://t.me/souldawnclothes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#C8C8D0]">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.07-.2c-.08-.06-.2-.04-.28-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.98-1.73 6.63-2.87 7.97-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    handle: "SOULDAWN",
    href: "https://youtube.com/@souldawnclothes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#C8C8D0]">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-4"
          >
            Контакты
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-[family-name:var(--font-oswald)] text-4xl md:text-6xl font-black tracking-tight uppercase text-[#E8E8F0]"
          >
            Будь на связи
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-sm text-[#6B6B78] max-w-md leading-relaxed"
          >
            Основной канал, поддержка через бота, сотрудничество — по почте.
            Следи за промокодами, дропами и новостями.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-14 space-y-12"
          variants={staggerContainer(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {/* Social links */}
          <motion.div variants={fadeUp}>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-6">
              Соцсети
            </h3>
            <div className="space-y-1">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border border-transparent hover:border-[rgba(200,200,210,0.1)] hover:bg-[#101014]/50 transition-all duration-300 group rounded-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-[rgba(200,200,210,0.06)] border border-[rgba(200,200,210,0.1)] flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#E8E8F0] group-hover:text-[#C8C8D0] transition-colors">
                      {s.name}
                    </p>
                    <p className="text-xs text-[#6B6B78]">
                      {s.handle}
                    </p>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-[#6B6B78]/50 group-hover:text-[#C8C8D0] group-hover:translate-x-1 transition-all duration-300"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Support */}
          <motion.div variants={fadeUp}>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-6">
              Поддержка
            </h3>
            <a
              href="https://t.me/souldawnsupport_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 border border-[rgba(200,200,210,0.08)] hover:border-[rgba(200,200,210,0.2)] bg-[#101014]/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(200,200,210,0.08)] border border-[rgba(200,200,210,0.14)] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#C8C8D0]">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.07-.2c-.08-.06-.2-.04-.28-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.98-1.73 6.63-2.87 7.97-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#E8E8F0] group-hover:text-[#C8C8D0] transition-colors">
                  Telegram бот
                </p>
                <p className="text-xs text-[#6B6B78]">@souldawnsupport_bot</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B6B78] ml-auto group-hover:text-[#C8C8D0] group-hover:translate-x-1 transition-all duration-300">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </motion.div>

          {/* Business email */}
          <motion.div variants={fadeUp}>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-4">
              Сотрудничество
            </h3>
            <p className="text-sm text-[#6B6B78] leading-relaxed mb-3">
              По вопросам сотрудничества, оптовым заказам и партнёрским программам:
            </p>
            <a
              href="mailto:hello@souldawn.com"
              className="text-sm font-bold text-[#C8C8D0] hover:text-[#E8E8F0] transition-colors duration-300 underline underline-offset-4 decoration-[rgba(200,200,210,0.2)] hover:decoration-[rgba(200,200,210,0.4)]"
            >
              hello@souldawn.com
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}