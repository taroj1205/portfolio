export const canTransition = () =>
  "startViewTransition" in document &&
  "ViewTransition" in globalThis &&
  "types" in ViewTransition.prototype &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

const [X1, X2] = [0.23, 0.32];

export const OUT = `cubic-bezier(${X1}, 1, ${X2}, 1)`;

const outTime = (progress: number) => {
  const s = 1 - Math.cbrt(1 - progress);

  return 3 * (1 - s) ** 2 * s * X1 + 3 * (1 - s) * s ** 2 * X2 + s ** 3;
};

export const turnTiming = (progress: number, back: boolean) =>
  back
    ? {
        at: 1 - outTime(1 - progress),
        easing: `cubic-bezier(${1 - X2}, 0, ${1 - X1}, 0)`,
      }
    : { at: outTime(progress), easing: OUT };
