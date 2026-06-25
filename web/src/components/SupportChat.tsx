"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SupportChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating chat bubble button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[100] group"
        aria-label="Поддержка"
      >
        {/* Outer glow */}
        <div className="absolute -inset-1.5 rounded-full bg-[#C8C8D0]/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* 3D circle */}
        <div
          className="relative w-14 h-14 rounded-full bg-[#101014] border border-[#C8C8D0]/15 flex items-center justify-center transition-all duration-300 group-hover:border-[#C8C8D0]/30 group-hover:scale-105 active:scale-95"
          style={{
            boxShadow: '0 4px 16px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,200,210,0.06)',
          }}
        >
          {/* Chat bubble icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[#6B6B78] group-hover:text-[#C8C8D0] transition-colors duration-300"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          {/* 3D highlight */}
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(200,200,210,0.08) 0%, transparent 50%)',
          }} />
        </div>
        {/* Bottom shadow */}
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/30 blur-sm pointer-events-none" />
      </button>

      {/* Modal popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm bg-[#101014] border border-white/[0.06] p-6 rounded-sm"
              style={{
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,200,210,0.04)',
              }}
            >
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-[#6B6B78] hover:text-[#E8E8F0] text-lg leading-none transition-colors"
              >
                ×
              </button>
              {/* Title */}
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#E8E8F0] mb-2">
                Поддержка
              </h3>
              <p className="text-[13px] text-[#6B6B78] leading-relaxed mb-5">
                Напишите нам в Telegram — ответим в течение часа.
              </p>
              {/* CTA */}
              <a
                href="https://t.me/souldawnsupport_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 text-center text-[11px] font-bold tracking-widest uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] transition-colors rounded-sm"
              >
                Написать в Telegram →
              </a>
              <p className="text-[10px] text-[#6B6B78]/50 text-center mt-3">
                Ежедневно 10:00 – 19:00
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}