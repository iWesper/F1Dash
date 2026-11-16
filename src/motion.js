// Motion tokens shared by every animated component. Mirrors the --ease-* and
// --dur-* custom properties in src/css/tokens.css.
export const EASE_OUT = [0.19, 1, 0.22, 1]; // entering / leaving
export const EASE_IN_OUT = [0.645, 0.045, 0.355, 1]; // moving while on screen

export const DUR = { fast: 0.15, base: 0.22, slow: 0.3 };

// Position changes (tab pill, reordered rows): a spring with no bounce is
// interruptible, so quick repeated clicks never restart from zero.
export const SPRING = { type: "spring", duration: 0.35, bounce: 0 };

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DUR.base, ease: EASE_OUT },
};

// Loaded on demand by <LazyMotion> so the animation runtime stays out of
// the initial bundle.
export const loadMotionFeatures = () => import("./motion-features").then((m) => m.default);
