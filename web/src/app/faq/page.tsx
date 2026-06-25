"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  icon: string;
  title: string;
  body: string;
}

const faqItems: FAQItem[] = [
  {
    icon: "📦",
    title: "Доставка",
    body: `СДЭК ПВЗ (пункт выдачи), СДЭК Курьер (до двери), Почта России.\n\nДоступно по всей России.\n\nСтоимость рассчитывается автоматически при оформлении заказа. Обычно от 250₽ (СДЭК ПВЗ) до 450₽ (Курьер).\n\nСДЭК: 2-5 рабочих дней. Почта России: 7-14 рабочих дней. После отправки мы пришлём трек-номер для отслеживания.`,
  },
  {
    icon: "🔄",
    title: "Возврат",
    body: `Возврат в течение 14 дней после получения заказа.\n\nТовар должен быть в оригинальной упаковке, без следов носки, стирки и повреждений.\n\nДля возврата свяжитесь с нами через бота @souldawn_support_bot или напишите на почту.\n\nВернём деньги на карту в течение 5 рабочих дней после получения возврата.`,
  },
  {
    icon: "📐",
    title: "Размеры",
    body: `Все худи и футболки — стандартные унисекс размеры (XS–XXL).\n\nПеред заказом рекомендуем свериться с таблицей размеров на сайте в разделе «Размерная сетка».\n\nЕсли сомневаешься — выбирай на размер больше, худи лучше сидят свободно.`,
  },
  {
    icon: "💳",
    title: "Оплата",
    body: `Оплата онлайн на сайте через YooKassa.\n\nПринимаем: Visa / MasterCard / МИР, СБП (Система Быстрых Платежей).\n\nВсе платежи защищены по стандарту PCI DSS. Деньги списываются только после подтверждения заказа.`,
  },
  {
    icon: "✅",
    title: "Качество",
    body: `Печатаем на премиум-фабрике. Плотность ткани 280-320 г/м².\n\nПринты — DTG (прямая цифровая печать), не трескаются и не выцветают после стирки.\n\nКаждый принт разрабатывается вручную. Коллекция «Ангел vs Демон» — 4 уникальных дизайна.`,
  },
  {
    icon: "📞",
    title: "Контакты",
    body: `Telegram бот: @souldawn_bot\nПоддержка: @souldawn_support_bot\nСайт: souldawn.ru\n\nПиши в любое время — ответим максимально быстро.`,
  },
  {
    icon: "🏠",
    title: "О бренде",
    body: `SOULDAWN — Рассвет после боя.\n\nМы не придумали эту борьбу. Мы просто решили показать её.\n\nSOULDAWN — это спорт. Как характер. Как действие. Как состояние.\n\nКоллекция «Ангел vs Демон» — 4 принта, каждый рассказывает историю.\nДихотомия тёмного/светлого = Демон/Ангел.`,
  },
  {
    icon: "🌐",
    title: "Наш сайт",
    body: `Полный каталог, оформление заказа и личный кабинет — на сайте.\n\nsouldawn.ru/collection — каталог\nsouldawn.ru/dashboard — личный кабинет\n\nТам же отслеживание заказов и история покупок.`,
  },
];

const C_COPPER = "#C97B3D";
const C_BG = "#08080A";
const C_CARD = "#101014";
const C_BORDER = "#1E1E24";

export default function FAQPage() {
  const [page, setPage] = useState(0);
  const total = faqItems.length;
  const item = faqItems[page];

  const goNext = useCallback(() => setPage((p) => Math.min(p + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: C_BG, color: "#E8E8F0", fontFamily: "var(--font-inter), sans-serif" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: C_BG, borderBottom: `1px solid ${C_BORDER}` }}>
        <div className="flex items-center justify-between">
          <h1
            className="text-lg tracking-widest uppercase"
            style={{ color: C_COPPER, fontFamily: "var(--font-oswald), sans-serif" }}
          >
            FAQ
          </h1>
          <span className="text-xs tracking-wide" style={{ color: "#6B6B78" }}>
            {page + 1} / {total}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-5 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon + Title */}
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">{item.icon}</span>
              <h2
                className="text-2xl tracking-wide uppercase"
                style={{ color: "#F5F0EB", fontFamily: "var(--font-oswald), sans-serif" }}
              >
                {item.title}
              </h2>
            </div>

            {/* Body */}
            <div
              className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-line"
              style={{ background: C_CARD, border: `1px solid ${C_BORDER}`, color: "#C8C8D0" }}
            >
              {item.body}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 px-5 pb-6 pt-3" style={{ background: C_BG, borderTop: `1px solid ${C_BORDER}` }}>
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {faqItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === page ? 20 : 6,
                height: 6,
                background: i === page ? C_COPPER : "#2A2A30",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={goPrev}
            disabled={page === 0}
            className="flex-1 py-3 rounded-lg text-sm font-medium tracking-wide transition-all disabled:opacity-30"
            style={{
              background: page === 0 ? "#1A1A1E" : C_CARD,
              border: `1px solid ${C_BORDER}`,
              color: "#E8E8F0",
            }}
          >
            ← Назад
          </button>
          <button
            onClick={goNext}
            disabled={page === total - 1}
            className="flex-1 py-3 rounded-lg text-sm font-medium tracking-wide transition-all disabled:opacity-30"
            style={{
              background: page === total - 1 ? "#1A1A1E" : C_COPPER,
              border: page === total - 1 ? `1px solid ${C_BORDER}` : "none",
              color: page === total - 1 ? "#E8E8F0" : "#08080A",
            }}
          >
            Далее →
          </button>
        </div>
      </div>
    </div>
  );
}
