"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import ScrollReveal from "@/components/ScrollReveal";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
    promoCode,
    discount,
    applyPromo,
    removePromo,
    discountedTotal,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState(false);

  const handleApplyPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const ok = applyPromo(promoInput);
    if (!ok) {
      setPromoError(true);
      setTimeout(() => setPromoError(false), 2000);
    } else {
      setPromoInput("");
      setPromoError(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-20 px-6 md:px-12 lg:px-24 min-h-screen flex flex-col items-center justify-center">
        <ScrollReveal>
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full bg-[rgba(200,200,210,0.03)] border border-[rgba(200,200,210,0.06)]" />
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#6B6B78]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>

            <h1 className="font-[family-name:var(--font-oswald)] text-3xl md:text-5xl font-black tracking-tight uppercase text-[#E8E8F0] mb-4">
              Пусто
            </h1>
            <p className="text-sm text-[#6B6B78] mb-2">
              Арсенал пока пуст.
            </p>
            <p className="text-xs text-[#6B6B78]/50 mb-10 max-w-xs text-center leading-relaxed">
              Самое время найти то, что откликается на твою внутреннюю борьбу.
            </p>
            <Link
              href="/collection"
              className="px-10 py-3.5 text-[11px] font-black tracking-[0.15em] uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] hover:shadow-[0_0_40px_rgba(200,200,210,0.08)] transition-all duration-300"
            >
              Собрать арсенал
            </Link>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 lg:pb-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0]/60 mb-4">
                {totalItems}{" "}
                {totalItems === 1
                  ? "позиция"
                  : totalItems < 5
                  ? "позиции"
                  : "позиций"}
              </p>
              <h1 className="font-[family-name:var(--font-oswald)] text-4xl md:text-6xl font-black tracking-tight uppercase text-[#E8E8F0]">
                Твой арсенал
              </h1>
              <p className="mt-3 text-sm text-[#6B6B78]/60">
                Твоё снаряжение для победы
              </p>
            </div>
            <button
              onClick={clearCart}
              className="text-xs font-bold tracking-widest uppercase text-[#6B6B78]/50 hover:text-red-400 transition-colors duration-300 mb-2"
            >
              Очистить
            </button>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, i) => (
              <ScrollReveal
                key={`${item.product.id}-${item.size}`}
                delay={i * 60}
              >
                <div className="flex gap-4 md:gap-6 p-4 md:p-5 border border-[rgba(200,200,210,0.06)] bg-gradient-to-br from-[rgba(200,200,210,0.01)] to-transparent hover:border-[rgba(200,200,210,0.14)] hover:from-[rgba(200,200,210,0.02)] transition-all duration-500 group">
                  {/* Image */}
                  <div
                    className={`w-20 h-28 md:w-28 md:h-36 flex-shrink-0 bg-gradient-to-br ${item.product.gradient} relative border border-[rgba(200,200,210,0.06)] overflow-hidden`}
                  >
                    {item.product.image && (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 768px) 80px, 112px"
                        className="object-contain p-1.5"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B78]/50 block mb-0.5">
                        {item.product.category}
                      </span>
                      <h3 className="text-sm md:text-base font-bold tracking-wide uppercase text-[#E8E8F0] group-hover:text-[#C8C8D0] transition-colors duration-300 truncate">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-bold tracking-wider text-[#6B6B78]/60 border border-[rgba(200,200,210,0.1)] px-2 py-0.5">
                          {item.size}
                        </span>
                        {typeof item.product.stock === "number" &&
                          item.quantity >= item.product.stock && (
                            <span className="text-[10px] font-bold tracking-wider text-amber-400/70">
                              Макс: {item.product.stock} шт.
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center border border-[rgba(200,200,210,0.1)]">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.size,
                              item.quantity - 1,
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#6B6B78]/60 hover:text-[#E8E8F0] hover:bg-[rgba(200,200,210,0.05)] transition-all duration-200"
                        >
                          −
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-xs font-bold text-[#E8E8F0] border-x border-[rgba(200,200,210,0.1)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.size,
                              item.quantity + 1,
                            )
                          }
                          disabled={
                            typeof item.product.stock === "number" &&
                            item.quantity >= item.product.stock
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#6B6B78]/60 hover:text-[#E8E8F0] hover:bg-[rgba(200,200,210,0.05)] transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-[#C8C8D0]">
                          {(
                            parseInt(
                              item.product.price.replace(/[^\d]/g, ""),
                              10,
                            ) * item.quantity
                          ).toLocaleString("ru-RU")}{" "}
                          ₽
                        </span>
                        <button
                          onClick={() =>
                            removeItem(item.product.id, item.size)
                          }
                          className="text-[10px] font-bold tracking-widest uppercase text-[#6B6B78]/40 hover:text-red-400 transition-colors duration-300"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Summary Panel — NO ScrollReveal, always visible immediately */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-[rgba(200,200,210,0.08)] bg-gradient-to-b from-[rgba(200,200,210,0.02)] to-transparent p-6 md:p-8">
              {/* Brand mark */}
              <div className="mb-6">
                <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#E8E8F0]/20 block leading-none">SOUL</span>
                <span className="text-[7px] font-black tracking-[0.35em] uppercase text-[#C8C8D0]/15 block leading-none">DAWN</span>
              </div>

              <h2 className="text-xs font-bold tracking-widest uppercase text-[#6B6B78] mb-6">
                Итого
              </h2>

              {/* Promo code input */}
              {!promoCode ? (
                <form onSubmit={handleApplyPromo} className="mb-6">
                  <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#6B6B78]/60 block mb-2">
                    Промокод
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="ВВЕДИ КОД"
                      className={`flex-1 bg-transparent border px-4 py-3 text-sm text-[#E8E8F0] placeholder:text-[#6B6B78]/30 outline-none transition-colors duration-300 ${
                        promoError
                          ? "border-red-400/60"
                          : "border-[rgba(200,200,210,0.1)] focus:border-[rgba(200,200,210,0.3)]"
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 text-[11px] font-black tracking-[0.15em] uppercase border border-[rgba(200,200,210,0.1)] text-[#C8C8D0] hover:border-[rgba(200,200,210,0.3)] hover:text-[#E8E8F0] transition-all duration-300 whitespace-nowrap"
                    >
                      OK
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] text-red-400/70 mt-1.5 tracking-wide">
                      Неверный промокод
                    </p>
                  )}
                </form>
              ) : (
                <div className="mb-6 flex items-center justify-between border border-emerald-400/20 bg-emerald-400/[0.03] px-4 py-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-400/60 block mb-0.5">
                      Промокод применён
                    </span>
                    <span className="text-sm font-bold text-emerald-400 tracking-wide">
                      {promoCode}{' '}
                      <span className="text-emerald-400/60 font-normal text-xs">−{discount}%</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      removePromo();
                      setPromoError(false);
                    }}
                    className="w-6 h-6 flex items-center justify-center text-[#6B6B78]/50 hover:text-red-400 transition-colors duration-300"
                    aria-label="Удалить промокод"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B78]/60">
                    Снаряжение ({totalItems})
                  </span>
                  <span className={`font-bold ${discount > 0 ? "text-[#6B6B78]/50 line-through" : "text-[#E8E8F0]"}`}>
                    {totalPrice.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400/70">
                      Скидка ({discount}%)
                    </span>
                    <span className="text-emerald-400 font-bold">
                      −{(totalPrice - discountedTotal).toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B78]/60">Доставка</span>
                  <span className="text-[#6B6B78]/40 text-xs">
                    расчёт при оформлении
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[rgba(200,200,210,0.1)] to-transparent my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#E8E8F0]">
                    К оплате
                  </span>
                  <span className="text-xl font-black text-[#C8C8D0] font-[family-name:var(--font-oswald)] tracking-tight">
                    {discountedTotal.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              {/* Desktop-only checkout button (mobile uses sticky bar below) */}
              <Link
                href="/checkout"
                className="hidden lg:block w-full mt-8 text-center px-6 py-4 text-[11px] font-black tracking-[0.15em] uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] hover:shadow-[0_0_60px_rgba(200,200,210,0.1)] transition-all duration-300"
              >
                Оформить заказ
              </Link>

              <Link
                href="/collection"
                className="block w-full mt-3 text-center px-6 py-3 text-xs font-bold tracking-widest uppercase border border-[rgba(200,200,210,0.08)] text-[#6B6B78]/60 hover:border-[rgba(200,200,210,0.2)] hover:text-[#C8C8D0] transition-all duration-300"
              >
                Продолжить сборку
              </Link>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-[rgba(200,200,210,0.06)] space-y-3">
                <div className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C8C8D0]/60">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-[11px] text-[#6B6B78]/50">
                    Безопасная оплата
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C8C8D0]/60">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span className="text-[11px] text-[#6B6B78]/50">
                    Доставка СДЭК по всей стране
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C8C8D0]/60">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                  </svg>
                  <span className="text-[11px] text-[#6B6B78]/50">
                    Возврат в течение 30 дней
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA — mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0D]/95 backdrop-blur-xl border-t border-[rgba(200,200,210,0.08)] px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#6B6B78]/60 block">
              К оплате
            </span>
            <span className="text-lg font-black text-[#C8C8D0] font-[family-name:var(--font-oswald)] tracking-tight">
              {discountedTotal.toLocaleString("ru-RU")} ₽
            </span>
          </div>
          <Link
            href="/checkout"
            className="px-8 py-3.5 text-[11px] font-black tracking-[0.15em] uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] transition-all duration-300"
          >
            Оформить заказ
          </Link>
        </div>
      </div>
    </div>
  );
}