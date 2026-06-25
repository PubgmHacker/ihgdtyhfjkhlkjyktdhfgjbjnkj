"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? "bg-[#08080A]/85 backdrop-blur-2xl border-b border-white/[0.04]"
            : "bg-transparent"
        }`}
      >
      {/* Subtle top bar shadow for readability on hero */}
      {!scrolled && (
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      )}

      {/* Center Nav — Desktop (full-width overlay, centered) */}
      <nav className="hidden md:flex absolute inset-x-0 top-0 h-full items-center justify-center gap-1 z-10 pointer-events-none">
        {[
          { href: "/collection", label: "Каталог" },
          { href: "/about", label: "О бренде" },
          { href: "/help", label: "Помощь" },
          { href: "/contact", label: "Контакты" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-300 rounded-sm pointer-events-auto ${
              isActive(link.href)
                ? "text-[#E8E8F0] bg-white/[0.06]"
                : scrolled
                  ? "text-[#6B6B78] hover:text-[#B0B0BC] hover:bg-white/[0.03]"
                  : "text-[#C8C8D0]/60 hover:text-[#C8C8D0] hover:bg-white/[0.03]"
            }`}
            style={!scrolled ? { textShadow: '0 1px 6px rgba(0,0,0,0.8)' } : undefined}
          >
            {link.label}
            {isActive(link.href) && (
              <span className="absolute bottom-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-[#C8C8D0] to-transparent" />
            )}
          </Link>
        ))}
      </nav>

        <div className="max-w-[1400px] mx-auto px-5 md:px-10 h-16 md:h-[72px] flex items-center justify-between">
          {/* Logo — island icon */}
          <Link href="/" className="group flex items-center">
            <img
              src="/sd-logo.png"
              alt="SOULDAWN"
              className="h-16 w-16 object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Link href="/cart" className={`relative group p-2 z-10 ${!scrolled ? 'text-[#C8C8D0]/70' : ''}`} aria-label="Корзина">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${!scrolled ? 'text-[#C8C8D0]/70 group-hover:text-[#C8C8D0]' : 'text-[#6B6B78] group-hover:text-[#C8C8D0]'}`} style={!scrolled ? { filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' } : undefined}>
                <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none" />
                <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none" />
                <path d="M1 1H5L7.5 16H19.5L22 6H6" />
              </svg>
              <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[8px] font-black tracking-wide transition-all duration-300 ${
                totalItems > 0
                  ? 'bg-[#C8C8D0] text-[#08080A]'
                  : 'bg-white/[0.06] text-[#6B6B78]/50 border border-white/[0.06]'
              }`}>
                {totalItems > 0 ? totalItems : '0'}
              </span>
            </Link>

            {user ? (
              <>
                <NotificationBell />
                <Link href="/dashboard" className="p-2">
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-[#C8C8D0]">
                    {(user.username || user.name || "S")[0].toUpperCase()}
                  </div>
                </Link>
              </>
            ) : (
              <Link
                href="/profile"
                className="hidden sm:block px-4 py-2 text-[10px] font-bold tracking-[0.12em] uppercase text-[#6B6B78] hover:text-[#C8C8D0] border border-white/[0.06] rounded-sm transition-all duration-300 hover:bg-white/[0.03]"
              >
                Войти
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 flex flex-col gap-[5px]"
              aria-label="Меню"
            >
              <span className={`block w-5 h-[1.5px] bg-[#E8E8F0] transition-all duration-300 origin-center ${mobileOpen ? "rotate-45" : ""}`} />
              <span className={`block w-5 h-[1.5px] bg-[#E8E8F0] transition-all duration-300 ${mobileOpen ? "opacity-0 scale-0" : ""}`} />
              <span className={`block w-5 h-[1.5px] bg-[#E8E8F0] transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={`absolute right-0 top-0 bottom-0 w-72 bg-[#0C0C0F] border-l border-white/[0.04] transition-transform duration-500 ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col p-6 pt-20 gap-1">
            <div className="mb-6 pb-4 border-b border-white/[0.06]">
              <img
                src="/sd-logo.png"
                alt="SOULDAWN"
                className="h-10 w-10 object-contain opacity-80"
              />
            </div>
            {[
              { href: "/collection", label: "Каталог", icon: "◉" },
              { href: "/lookbook", label: "Lookbook", icon: "◈" },
              { href: "/about", label: "О бренде", icon: "◆" },
              { href: "/contact", label: "Контакты", icon: "✉" },
              { href: "/help", label: "Помощь", icon: "?" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-[#E8E8F0] bg-white/[0.06]"
                    : "text-[#6B6B78] hover:text-[#B0B0BC] hover:bg-white/[0.03]"
                }`}
              >
                <span className="w-6 text-center text-[10px] opacity-40">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3.5 rounded-sm text-sm font-semibold tracking-wide uppercase text-[#C8C8D0] hover:bg-white/[0.03] transition-colors"
              >
                <span className="w-6 text-center text-[10px] opacity-40">●</span>
                Корзина
                <span className="ml-auto text-[10px] font-black bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 rounded-full">
                  {totalItems > 0 ? totalItems : '0'}
                </span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3.5 rounded-sm text-sm font-semibold tracking-wide uppercase text-[#6B6B78] hover:text-[#B0B0BC] hover:bg-white/[0.03] transition-colors"
              >
                <span className="w-6 text-center text-[10px] opacity-40">◎</span>
                {user ? "Профиль" : "Войти"}
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}