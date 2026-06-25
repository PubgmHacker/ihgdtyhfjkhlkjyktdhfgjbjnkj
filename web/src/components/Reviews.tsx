"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, dawnReveal, viewportOnce, fadeUp } from "@/lib/motion";

interface Review {
  id: string;
  text: string;
  author: string;
  username?: string;
  date: number;
  rating?: number;
  mediaType: "none" | "photo" | "video";
  mediaUrl?: string;
  mediaThumb?: string;
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5 mb-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= rating ? "text-[#C8C8D0]" : "text-[#6B6B78]/30"}
          style={{ fontSize: 14 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [imgError, setImgError] = useState(false);
  const date = new Date(review.date * 1000).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <motion.div
      variants={dawnReveal}
      className="bg-[#08080A] border border-[rgba(200,200,210,0.08)] p-6 flex flex-col gap-4 hover:border-[rgba(200,200,210,0.15)] transition-colors duration-500"
    >
      {review.mediaType === "photo" && review.mediaUrl && !imgError && (
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#1D1D24]">
          <img
            src={review.mediaThumb || review.mediaUrl}
            alt="Фото отзыва"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      {review.mediaType === "video" && review.mediaUrl && (
        <div className="relative w-full aspect-video overflow-hidden bg-[#1D1D24]">
          {review.mediaThumb && !imgError ? (
            <div className="relative w-full h-full">
              <img
                src={review.mediaThumb}
                alt="Превью"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[rgba(200,200,210,0.15)] backdrop-blur-sm flex items-center justify-center border border-[rgba(200,200,210,0.2)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#C8C8D0">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <video
              src={review.mediaUrl}
              controls
              className="w-full h-full object-cover"
              preload="metadata"
            />
          )}
        </div>
      )}
      <StarRating rating={review.rating} />
      <p className="text-sm text-[#B0B0BC] leading-relaxed flex-1">
        «{review.text}»
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(200,200,210,0.08)]">
        <div>
          <p className="text-xs font-bold text-[#E8E8F0]">{review.author}</p>
          {review.username && (
            <p className="text-[10px] text-[#6B6B78]">@{review.username}</p>
          )}
        </div>
        <p className="text-[10px] text-[#6B6B78]">{date}</p>
      </div>
    </motion.div>
  );
}

const SAMPLE_REVIEWS: Review[] = [
    {
      id: "1", text: "Качество просто огонь. Ткань плотный, принт чёткий. Ношу уже вторую вещь от SOULDAWN — качество на уровне люкс.",
      author: "Дмитрий К.", username: "dmitry_k", date: 1709236800, rating: 5, mediaType: "none",
    },
    {
      id: "2", text: "Наконец-то бренд, который делает не только одежду. Аутентичность в каждой детали — от швов до фурнитуры. Рекомендую всем.",
      author: "Артём В.", username: "artem_v", date: 1709145600, rating: 5, mediaType: "none",
    },
    {
      id: "3", text: "Брал худи и лонгслив. Сел в нём размер и всё село как надо. Единственный бренд, в котором я чувствую себя.",
      author: "Максим Р.", username: "maxim_r", date: 1708900000, rating: 4, mediaType: "none",
    },
    {
      id: "4", text: "Доставка быстрая, упаковка стильная. Но самое главное — одежда реально крутая и не теряет форму после стирки.",
      author: "Кирилл С.", username: "kirill_s", date: 1708744000, rating: 5, mediaType: "none",
    },
    {
      id: "5", text: "Скидка на бомбер — лучшая покупка года. Качество на уровне премиум за вменьше вдвое.",
      author: "Олег Д.", username: "oleg_d", date: 1708600000, rating: 5, mediaType: "none",
    },
    {
      id: "6", text: "SOULDAWN — это не просто одежда, это состояние духа. Когда надеваешь его, меняется и твой подход к тренировкам.",
      author: "Алексей Н.", username: "alex_n", date: 1708456000, rating: 5, mediaType: "none",
    },
  ];

  export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch real reviews from API
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews?.length) {
          setReviews(d.reviews);
        }
        if (d.channel_url) {
          setChannelUrl(d.channel_url);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#101014] border border-[rgba(200,200,210,0.08)] p-6 h-48 animate-pulse"
            />
          ))}
        </div>
      </section>
    );

  if (!reviews.length) return null;

  return (
    <section className="px-5 md:px-10 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mb-12 flex items-end justify-between"
        >
          <motion.div variants={fadeUp}>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C8C8D0] mb-3">
              Отзывы покупателей
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase font-[family-name:var(--font-oswald)]">
              <span className="text-[#E8E8F0]">ЧТО </span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, #707080 0%, #C8C8D0 40%, #E8E8F0 55%, #C8C8D0 70%, #707080 100%)",
                }}
              >
                ГОВОРЯТ
              </span>
            </h2>
          </motion.div>
          {channelUrl && (
            <motion.a
              variants={fadeUp}
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold tracking-widest uppercase text-[#C8C8D0] hover:text-[#E8E8F0] transition-colors duration-300 hidden md:flex"
            >
              Все отзывы →
            </motion.a>
          )}
        </motion.div>

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {reviews.slice(0, 6).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </motion.div>

        {channelUrl && (
          <div className="mt-10 text-center md:hidden">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3.5 border border-[rgba(200,200,210,0.14)] text-[#C8C8D0] text-[10px] font-black tracking-[0.15em] uppercase hover:border-[rgba(200,200,210,0.3)] hover:text-[#E8E8F0] transition-colors duration-300"
            >
              Все отзывы
            </a>
          </div>
        )}
      </div>
    </section>
  );
}