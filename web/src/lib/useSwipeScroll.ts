"use client";

import { useEffect, useRef } from "react";

/**
 * Enables horizontal swipe on a scroll container WITHOUT capturing vertical page scroll.
 *
 * Strategy:
 * 1. CSS `touch-action: pan-y` — browser only handles vertical pan natively.
 * 2. JS non-passive touch listeners detect horizontal gestures and
 *    manually adjust `scrollLeft`.
 * 3. On touchend, move exactly ONE card in the swipe direction (same as arrows).
 */
export function useSwipeScroll(scrollerRef: React.RefObject<HTMLDivElement | null>) {
  const touchRef = useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    locked: boolean;
  } | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 25; // min px to count as a swipe

    const findCardAt = (scrollLeft: number) => {
      const scrollerLeft = el.offsetLeft;
      let current = 0;
      const children = el.children;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i] as HTMLElement;
        if (child.offsetLeft - scrollerLeft <= scrollLeft + 1) {
          current = i;
          break;
        }
      }
      return current;
    };

    const getCardLeft = (index: number) => {
      const child = el.children[index] as HTMLElement;
      return child.offsetLeft - el.offsetLeft;
    };

    const onTouchStart = (e: TouchEvent) => {
      touchRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startScrollLeft: el.scrollLeft,
        locked: false,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = touchRef.current;
      if (!t) return;
      const dx = e.touches[0].clientX - t.startX;
      const dy = e.touches[0].clientY - t.startY;

      // Decide direction on first significant move
      if (!t.locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          t.locked = true;
        } else {
          touchRef.current = null; // vertical — stop tracking
          return;
        }
      }

      // Horizontal: prevent default, follow finger
      e.preventDefault();
      el.scrollLeft = t.startScrollLeft - dx;
    };

    const onTouchEnd = () => {
      const t = touchRef.current;
      touchRef.current = null;
      if (!t || !t.locked || !el) return;

      const dx = /* final x not available, use scroll delta */
        el.scrollLeft - t.startScrollLeft;
      const dir = dx > SWIPE_THRESHOLD ? -1 : dx < -SWIPE_THRESHOLD ? 1 : 0;

      const current = findCardAt(t.startScrollLeft);
      const total = el.children.length;
      const next = Math.max(0, Math.min(total - 1, current + dir));

      // Temporarily disable snap for clean programmatic scroll
      el.style.setProperty("scroll-snap-type", "none");
      el.scrollTo({ left: getCardLeft(next), behavior: "smooth" });
      const restore = () => el.style.removeProperty("scroll-snap-type");
      el.addEventListener("scrollend", restore, { once: true });
      setTimeout(restore, 600);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scrollerRef]);
}