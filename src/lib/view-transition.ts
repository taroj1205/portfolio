export const canTransition = () =>
  "startViewTransition" in document &&
  "ViewTransition" in globalThis &&
  "types" in ViewTransition.prototype &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;
