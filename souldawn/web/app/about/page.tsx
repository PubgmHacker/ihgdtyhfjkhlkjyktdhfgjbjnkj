import ScrollReveal from "@/components/ScrollReveal";

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
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-6">
              О бренде
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none">
              Рождён<br />
              <span className="text-accent">в борьбе</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="mt-10 text-base md:text-lg text-muted max-w-2xl leading-relaxed">
              SOULDAWN — это не просто одежда. Это манифест для тех, кто прошёл
              через тьму и вышел на свет. Мы создаём одежду, которая отражает
              внутреннюю борьбу каждого из нас — потому что рассвет приходит
              только тем, кто не спрятался от ночи.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-surface">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-12">
              Наши ценности
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <ScrollReveal key={v.label} delay={i * 100}>
                <div className="text-center">
                  <span className="text-3xl text-accent block mb-4">{v.icon}</span>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-text">
                    {v.label}
                  </h3>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-12">
              Наш путь
            </p>
          </ScrollReveal>

          <div className="space-y-16">
            {timeline.map((item, i) => (
              <ScrollReveal key={item.phase} delay={i * 150}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
                  <div className="md:col-span-3">
                    <p className="text-xs font-bold tracking-widest uppercase text-accent">
                      {item.phase}
                    </p>
                  </div>
                  <div className="md:col-span-9 border-t border-white/10 pt-6">
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase mb-4">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed max-w-lg">
                      {item.text}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section-padding bg-surface">
        <div className="max-w-7xl mx-auto text-center">
          <ScrollReveal>
            <blockquote className="text-2xl md:text-4xl font-black tracking-tight uppercase leading-tight max-w-3xl mx-auto">
              &ldquo;Рассвет принадлежит тем, кто<br />
              <span className="text-accent">пережил ночь.&rdquo;</span>
            </blockquote>
            <p className="mt-8 text-xs tracking-widest uppercase text-muted">
              — SOULDAWN
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
