import ScrollReveal from "./ScrollReveal";

const values = [
  {
    title: "Аутентичность",
    text: "Наследие улиц. Мы не притворяемся — мы живём тем, что носим.",
  },
  {
    title: "Борьба",
    text: "Борьба — это топливо. Каждый шов, каждый силуэт создан для тех, кто не сдаётся.",
  },
  {
    title: "Рассвет",
    text: "Рассвет приходит после самой долгой ночи. Мы — для тех, кто ждёт своего часа.",
  },
];

export default function BrandPhilosophy() {
  return (
    <section className="section-padding bg-surface">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-6">
            Наша философия
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight max-w-3xl">
            Одежда, рождённая
            <br />
            <span className="text-accent">внутренней борьбой</span>
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {values.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 150}>
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-lg font-bold tracking-wider uppercase text-text mb-4">
                  {v.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{v.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
