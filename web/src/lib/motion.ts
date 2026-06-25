/**
 * SOULDAWN — shared Framer Motion presets.
 */
import type { Variants } from "framer-motion";

export const viewportOnce = { once: true, amount: 0.2 } as const;
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

export const staggerContainer = (stagger = 0.12, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const charReveal: Variants = {
  hidden: { opacity: 0, y: "0.6em" },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const dawnReveal: Variants = {
  hidden: { opacity: 0, y: 48, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } },
};

// Page-level transition wrapper
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE } },
};

// Magnetic hover effect for buttons/links
export const magneticHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.3, ease: EASE } },
  whileTap: { scale: 0.98, transition: { duration: 0.15 } },
};

// Card reveal with slight rotation
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: 4 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: EASE } },
};

// Text line reveal (left to right clip)
export const lineReveal: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: { clipPath: "inset(0 0% 0 0)", transition: { duration: 0.8, ease: EASE } },
};

// Scale and fade for modal/overlay entries
export const overlayIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalIn: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.25 } },
};