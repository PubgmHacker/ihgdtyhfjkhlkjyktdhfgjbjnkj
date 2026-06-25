"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

const timeline = [
  {
    phase: "Ночь",
    title: "Страх и тень",
    text: "Каждый путь начинается в темноте. Мы знаем, что значит быть одним наедине со своими демонами.",
  },
  {
    phase: "Борьба",
    title: "Закалка",
    text: "Сталь закаляется огнём. Мы создаём одежду для тех, кто превращает боль в движение.",
  },
  {
    phase: "Рассвет",
    title: "Восход",
    text: "После самой долгой ночи всегда восходит солнце. SOULDAWN — для тех, кто дошёл до утра.",
  },
];

const values = [
  { icon: "◆", label: "Аутентичность" },
  { icon: "◆", label: "Борьба" },
  { icon: "◆", label: "Рассвет" },
  { icon: "◆", label: "Сообщество" },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      {/* Hero */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={staggerContainer(0.15)}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-6"
          >
            О бренде
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-[family-name:var(--font-oswald)] text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none text-[#E8E8F0]"
          >
            Рождён
            <br />
            в борьбе
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-10 text-base md:text-lg text-[#6B6B78] max-w-2xl leading-relaxed"
          >
            SOULDAWN — это не просто одежда. Это манифест для тех, кто прошёл
            через тьму и вышел на свет. Мы создаём одежду, которая отражает
            внутреннюю борьбу каждого из нас — потому что рассвет приходит
            только тем, кто не спрятался от ночи.
          </motion.p>
        </motion.div>
      </section>

      {/* Values */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-12"
          >
            Наши ценности
          </motion.p>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {values.map((v) => (
              <motion.div key={v.label} variants={fadeUp} className="text-center">
                <span className="text-3xl text-[#C8C8D0] block mb-4">
                  {v.icon}
                </span>
                <h3 className="text-sm font-bold tracking-widest uppercase text-[#E8E8F0]">
                  {v.label}
                </h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-12"
          >
            Наш путь
          </motion.p>

          <motion.div
            className="space-y-16"
            variants={staggerContainer(0.18)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {timeline.map((item) => (
              <motion.div
                key={item.phase}
                variants={fadeUp}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start"
              >
                <div className="md:col-span-3">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#C8C8D0]">
                    {item.phase}
                  </p>
                </div>
                <div className="md:col-span-9 border-t border-[rgba(200,200,210,0.14)] pt-6">
                  <h3 className="font-[family-name:var(--font-oswald)] text-2xl md:text-3xl font-black tracking-tight uppercase mb-4 text-[#E8E8F0]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6B6B78] leading-relaxed max-w-lg">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <motion.div
          className="max-w-7xl mx-auto text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <blockquote className="font-[family-name:var(--font-oswald)] text-2xl md:text-4xl font-black tracking-tight uppercase leading-tight max-w-3xl mx-auto text-[#E8E8F0]">
            &ldquo;Рассвет принадлежит тем, кто
            <br />
            пережил ночь.&rdquo;
          </blockquote>
          <p className="mt-8 text-xs tracking-widest uppercase text-[#6B6B78]">
            — SOULDAWN
          </p>
        </motion.div>
      </section>
    </div>
  );
}