import type { Config } from "tailwindcss";

/**
 * SOULDAWN — дизайн-система «Рассвет после боя».
 *
 * Дихотомия:
 *   • Демон  — графит / воронёная сталь (основа)
 *   • Ангел  — костяной / тёплый белый (свет, текст)
 *   • Рассвет — янтарь-му (единственный акцент = слоган «Рассвет после боя»)
 *   • Сталь  — холодный серый (вторичный микро-акцент, дихотомия)
 *
 * Имена токенов (bg/surface/text/muted/line/accent/...) сохранены ради
 * обратной совместимости со старыми страницами — меняется только наполнение.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // —— Демон (основа): графит / воронёная сталь ——
        bg: "#08080A",
        "bg-soft": "#0C0C0F",
        surface: "#101014",
        "surface-light": "#16161B",
        "surface-hi": "#1D1D24",
        "surface-top": "#24242C",
        // —— Ангел (свет): костяной / тёплый белый ——
        text: "#F2EEE9",
        "text-dim": "#B7B2AC",
        muted: "#7C7C85",
        // —— Рассвет: янтарь-му (единственный акцент) ——
        accent: "#E8B87A", // основной рассветный
        "accent-warm": "#D4915C", // глубокий закат
        "accent-deep": "#A86A3D", // тёмный янтарь (тени/градиент)
        "accent-bright": "#F5D0A3", // светло-золотой (highlight)
        // —— Сталь: холодный серый (микро-акцент дихотомии) ——
        steel: "#8A8F98",
        "steel-dark": "#54575E",
        // —— Совместимость со старым кодом ——
        "accent-red": "#E8B87A", // редирект старого red на янтарь
        "accent-violet": "#E8B87A",
        sand: "#D4C4A8",
        line: "rgba(242,238,233,0.08)",
        "line-strong": "rgba(242,238,233,0.14)",
        // Ангельский/демонический для split-hero
        angel: "#F2EEE9",
        demon: "#08080A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Янтарное свечение (рассветный glow)
        glow: "0 0 80px -28px rgba(232,184,122,0.45)",
        "glow-strong": "0 0 120px -20px rgba(232,184,122,0.6)",
        "glow-violet": "0 0 80px -28px rgba(232,184,122,0.45)",
        card: "0 32px 80px -40px rgba(0,0,0,0.9)",
        "card-hi": "0 40px 100px -36px rgba(0,0,0,0.95)",
        steel: "0 0 60px -24px rgba(138,143,152,0.35)",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.22, 1, 0.36, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        dawn: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      letterSpacing: {
        ultrawide: "0.25em",
        superwide: "0.4em",
        megawide: "0.55em",
      },
      backgroundImage: {
        "dawn-radial":
          "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(232,184,122,0.18) 0%, rgba(168,106,61,0.06) 35%, transparent 70%)",
        "dawn-linear":
          "linear-gradient(180deg, #08080A 0%, #0C0C0F 60%, #14100B 100%)",
        "steel-radial":
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(138,143,152,0.10) 0%, transparent 60%)",
        "angel-demon":
          "linear-gradient(90deg, #08080A 0%, #08080A 48%, #14100B 52%, #F2EEE9 52.01%, #F2EEE9 100%)",
      },
      animation: {
        spotlight: "spotlight 2s ease 0.75s 1 forwards",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
        marquee: "marquee 30s linear infinite",
        "marquee-slow": "marquee 50s linear infinite",
        float: "float 7s ease-in-out infinite",
        glow: "glow 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "gradient-shift": "gradientShift 14s ease infinite",
        "dawn-glow": "dawnGlow 8s ease-in-out infinite",
        "grain-shift": "grainShift 0.5s steps(2) infinite",
        "spin-slow": "spin 14s linear infinite",
      },
      keyframes: {
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        dawnGlow: {
          "0%, 100%": { opacity: "0.5", transform: "translateY(0) scale(1)" },
          "50%": { opacity: "0.85", transform: "translateY(-4%) scale(1.05)" },
        },
        grainShift: {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(-5%, -5%)" },
        },
      },
      backgroundSize: {
        "200": "200% 200%",
      },
    },
  },
  plugins: [],
};
export default config;
