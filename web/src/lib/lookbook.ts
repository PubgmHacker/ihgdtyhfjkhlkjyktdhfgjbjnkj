export interface LookItem {
  name: string;
  category: string;
  price: number;
}

export interface Look {
  slug: string;
  title: string;
  subtitle: string;
  story: string;
  accent: string;
  gradient: string;
  image?: string;
  items: LookItem[];
}

export const LOOKS: Look[] = [
  {
    slug: "king-of-the-ring",
    title: "KING OF THE RING",
    subtitle: "Король Ринга × Shadow Track Pants",
    story:
      "Выход на ринг начинается задолго до боя. Этот образ — для тех, кто готов к главному сражению дня. Плотная футболка с агрессивной типографикой на спине и сужающиеся трекшн-штаны для свободы движения.",
    accent: "#C8C8D0",
    gradient: "from-[#101014] via-[#1D1D24] to-[#08080A]",
    image: "/lookbook/5314688838582086474.jpg",
    items: [
      { name: "Король Ринга", category: "Верх", price: 2990 },
      { name: "Shadow Track Pants", category: "Низ", price: 5990 },
      { name: "Iron Grip Wraps", category: "Аксессуары", price: 2190 },
    ],
  },
  {
    slug: "night-shift",
    title: "NIGHT SHIFT",
    subtitle: "Void Long Sleeve × Night Shift Joggers",
    story:
      "Когда город засыпает — мы тренируемся. Тонкий лонгслив для межсезонья и утеплённые джоггеры с флисовой подкладкой. Тишина, фокус, движение.",
    accent: "#B0B0BC",
    gradient: "from-[#0e0e14] via-[#1D1D24] to-[#08080A]",
    image: "/lookbook/5314688838582086474.jpg",
    items: [
      { name: "Void Long Sleeve", category: "Верх", price: 5990 },
      { name: "Night Shift Joggers", category: "Низ", price: 6990 },
      { name: "Struggle Cap", category: "Аксессуары", price: 3490 },
    ],
  },
  {
    slug: "dawn-break",
    title: "DAWN BREAK",
    subtitle: "Dawnbreak Bomber × Grit Cargo Pants",
    story:
      "Рассвет принадлежит тем, кто не спал. Премиальный бомбер с атласной подкладкой и тактические карго для полного контроля. Финальный образ — о победе над собой и новом дне.",
    accent: "#E8E8F0",
    gradient: "from-[#141418] via-[#1D1D24] to-[#08080A]",
    image: "/lookbook/5314688838582086474.jpg",
    items: [
      { name: "Dawnbreak Bomber", category: "Верх", price: 14990 },
      { name: "Grit Cargo Pants", category: "Низ", price: 8490 },
      { name: "Battle Crossbody", category: "Аксессуары", price: 5490 },
    ],
  },
  {
    slug: "holy-burn",
    title: "HOLY BURN",
    subtitle: "Holy Burn × Urban Grip Socks",
    story:
      "Ангел бьёт грушу, демон держит. Боксёрская сцена огня и борьбы — для тех, кто превращает боль в движение. Компрессионные носки с anti-slip подошвой для максимального сцепления.",
    accent: "#C8C8D0",
    gradient: "from-[#1a1010] via-[#1D1D24] to-[#08080A]",
    image: "/lookbook/5314688838582086474.jpg",
    items: [
      { name: "Holy Burn", category: "Верх", price: 2990 },
      { name: "Urban Grip Socks", category: "Аксессуары", price: 1790 },
    ],
  },
];

export function getLook(slug: string): Look | undefined {
  return LOOKS.find((l) => l.slug === slug);
}