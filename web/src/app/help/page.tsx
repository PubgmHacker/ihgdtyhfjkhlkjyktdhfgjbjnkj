"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const sections: FAQSection[] = [
  {
    title: "Доставка",
    items: [
      {
        q: "Какие способы доставки доступны?",
        a: "СДЭК ПВЗ (пункт выдачи), СДЭК Курьер (до двери), Почта России. Доступно по всей России.",
      },
      {
        q: "Сколько стоит доставка?",
        a: "Стоимость рассчитывается автоматически при оформлении заказа на основе вашего адреса. Обычно от 250₽ (СДЭК ПВЗ) до 450₽ (Курьер).",
      },
      {
        q: "Сколько идёт доставка?",
        a: "СДЭК: 2-5 рабочих дней. Почта России: 7-14 рабочих дней. После отправки мы пришлём трек-номер.",
      },
    ],
  },
  {
    title: "Оплата",
    items: [
      {
        q: "Как оплатить заказ?",
        a: "Оплата онлайн на сайте (банковская карта). Visa / MasterCard / МИР, СБП. Все платежи защищены через YooKassa.",
      },
      {
        q: "Есть ли промокоды?",
        a: 'Да! Подпишитесь на Telegram или следите за Instagram — мы регулярно выпускаем промокоды на скидки.',
      },
    ],
  },
  {
    title: "Обмен и возврат",
    items: [
      {
        q: "Можно ли обменять товар?",
        a: "Да, в течение 14 дней с момента получения. Товар должен быть с бирками, без следов носки.",
      },
      {
        q: "Как оформить возврат?",
        a: "Напишите нам в Telegram-бот или на почту — мы организуем возврат через СДЭК за наш счёт.",
      },
    ],
  },
  {
    title: "Размеры",
    items: [
      {
        q: "Как подобрать размер?",
        a: "На странице каждого товара есть размерная сетка. Большинство футболок и худи — оверсайз-крой. Если сомневаешься, бери свой обычный размер.",
      },
    ],
  },
];

export default function HelpPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) =>
    setOpenKey((prev) => (prev === key ? null : key));

  return (
    <main className="min-h-screen bg-[#08080A] pt-24 pb-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <h1 className="font-[family-name:var(--font-oswald)] text-4xl md:text-6xl font-black tracking-tight uppercase text-[#E8E8F0] mb-16">
            Помощь
          </h1>
        </ScrollReveal>

        {sections.map((section, si) => (
          <div key={section.title} className={si > 0 ? "mt-12" : ""}>
            <ScrollReveal delay={si * 0.08}>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0]/60 mb-6">
                {section.title}
              </p>

              <div className="flex flex-col gap-0">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  const isOpen = openKey === key;

                  return (
                    <div key={key} className="border-b border-[rgba(200,200,210,0.06)] last:border-b-0">
                      <button
                        onClick={() => toggle(key)}
                        className={`w-full text-left p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
                          isOpen
                            ? "border border-[rgba(200,200,210,0.14)] bg-[rgba(200,200,210,0.02)] text-sm font-bold text-[#E8E8F0]"
                            : "border border-transparent text-sm font-bold text-[#E8E8F0] hover:border-[rgba(200,200,210,0.14)]"
                        }`}
                      >
                        <span>{item.q}</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`shrink-0 text-[#6B6B78] transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="p-4 text-[13px] text-[#6B6B78]/70 leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        ))}
      </div>
    </main>
  );
}