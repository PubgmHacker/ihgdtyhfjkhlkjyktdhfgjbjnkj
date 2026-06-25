import { NextResponse } from "next/server";

const SAMPLE_REVIEWS = [
  {
    id: "1",
    text: "Качество просто огонь. Ткань плотный, принт чёткий. Ношу уже вторую вещь от SOULDAWN — качество на уровне люкс.",
    author: "Дмитрий К.",
    username: "dmitry_k",
    date: 1709236800,
    rating: 5,
    mediaType: "none",
  },
  {
    id: "2",
    text: "Наконец-то бренд, который делает не только одежду. Аутентичность в каждой детали — от швов до фурнитуры. Рекомендую всем.",
    author: "Артём В.",
    username: "artem_v",
    date: 1709145600,
    rating: 5,
    mediaType: "none",
  },
  {
    id: "3",
    text: "Брал худи и лонгслив. Сел в нём размер и всё село как надо. Единственный бренд, в котором я чувствую себя.",
    author: "Максим Р.",
    username: "maxim_r",
    date: 1708900000,
    rating: 4,
    mediaType: "none",
  },
  {
    id: "4",
    text: "Доставка быстрая, упаковка стильная. Но самое главное — одежда реально крутая и не теряет форму после стирки.",
    author: "Кирилл С.",
    username: "kirill_s",
    date: 1708744000,
    rating: 5,
    mediaType: "none",
  },
  {
    id: "5",
    text: "Скидка на бомбер — лучшая покупка года. Качество на уровне премиум за вменьше вдвое.",
    author: "Олег Д.",
    username: "oleg_d",
    date: 1708600000,
    rating: 5,
    mediaType: "none",
  },
  {
    id: "6",
    text: "SOULDAWN — это не просто одежда, это состояние духа. Когда надеваешь его, меняется и твой подход к тренировкам.",
    author: "Алексей Н.",
    username: "alex_n",
    date: 1708456000,
    rating: 5,
    mediaType: "none",
  },
];

export async function GET() {
  return NextResponse.json({ reviews: SAMPLE_REVIEWS });
}