"use client";

/**
 * SOULDAWN — Блок отзывов.
 * Поддерживает фото, видео и текст.
 * Адаптивный: десктоп (4 колонки) / планшет (2 колонки) / мобильный (1 колонка).
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

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

const PLACEHOLDER: Review[] = [
  { id: "p1", text: "Качество ткани просто огонь. Худи ношу уже полгода, не теряет форму. ★★★★★", author: "Artem K.", date: Date.now()/1000-86400, rating: 5, mediaType: "none" },
  { id: "p2", text: "Футболка «Король ринга» — лучшее что я покупал в этом году. ★★★★★", author: "Dima S.", date: Date.now()/1000-172800, rating: 5, mediaType: "none" },
  { id: "p3", text: "Брал бомбер Dawnbreak — получил за 3 дня. Атласная подкладка очень приятная. ★★★★★", author: "Max R.", date: Date.now()/1000-259200, rating: 5, mediaType: "none" },
  { id: "p4", text: "Стиль уникальный, ни на что не похож. Буду брать ещё. ★★★★☆", author: "Ivan P.", date: Date.now()/1000-345600, rating: 4, mediaType: "none" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={`text-sm leading-none ${s <= rating ? "text-accent" : "text-muted/20"}`}>★</span>
      ))}
    </div>
  );
}

function MediaBlock({ review, expanded, onExpand }: { review: Review; expanded: boolean; onExpand: () => void }) {
  if (review.mediaType === "none" || !review.mediaUrl) return null;

  if (review.mediaType === "photo") {
    return (
      <div
        className="relative overflow-hidden rounded-lg cursor-pointer group"
        style={{ aspectRatio: "4/3" }}
        onClick={onExpand}
      >
        <img
          src={review.mediaThumb || review.mediaUrl}
          alt="Фото отзыва"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-bg/0 group-hover:bg-bg/20 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold tracking-widest uppercase">
            Увеличить
          </span>
        </div>
      </div>
    );
  }

  if (review.mediaType === "video") {
    return (
      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "4/3" }}>
        <video
          src={review.mediaUrl}
          poster={review.mediaThumb}
          controls
          preload="none"
          className="w-full h-full object-cover"
          playsInline
        />
      </div>
    );
  }

  return null;
}

function ReviewCard({ review }: { review: Review }) {
  const [lightbox, setLightbox] = useState(false);
  const date = new Date(review.date * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const initials = (review.author || "?")[0].toUpperCase();
  const hasMedia = review.mediaType !== "none" && review.mediaUrl;

  return (
    <>
      <div className="ingot flex flex-col h-full overflow-hidden">
        {/* Медиа */}
        {hasMedia && (
          <div className="flex-shrink-0">
            <MediaBlock review={review} expanded={false} onExpand={() => setLightbox(true)} />
          </div>
        )}

        <div className="p-4 flex flex-col gap-2.5 flex-1">
          {review.rating && <Stars rating={review.rating} />}

          {review.text && (
            <p className="text-sm text-text-dim leading-relaxed line-clamp-4 flex-1">
              &ldquo;{review.text}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-2.5 pt-2 border-t border-line mt-auto">
            <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-text truncate">{review.author}</p>
              <p className="text-[10px] text-muted/50">{date}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && review.mediaType === "photo" && review.mediaUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-bg/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={review.mediaUrl}
              alt="Отзыв"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-muted hover:text-text"
              onClick={() => setLightbox(false)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Reviews() {
  const [reviews, setReviews]       = useState<Review[]>(PLACEHOLDER);
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews?.length) setReviews(d.reviews);
        if (d.channel_url)     setChannelUrl(d.channel_url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-padding bg-surface">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {/* Заголовок */}
        <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-3">Отзывы</p>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight uppercase">
              Говорят покупатели
            </h2>
          </div>
          {channelUrl && (
            <a href={channelUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-xs font-bold tracking-widest uppercase text-accent border border-accent/20 px-4 py-2 hover:bg-accent/5 transition-colors">
              Все отзывы ↗
            </a>
          )}
        </motion.div>

        {/* Сетка: 1 кол / 2 кол на планшете / 4 на десктопе */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.slice(0, 8).map((review) => (
            <motion.div key={review.id} variants={fadeUp} className="flex">
              <div className="w-full">
                <ReviewCard review={review} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {channelUrl && (
          <motion.div variants={fadeUp} className="mt-10 text-center">
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
              Оставить отзыв в Telegram
            </a>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
