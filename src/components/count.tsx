"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { fmt } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

const styles = stylex.create({
  cell: {
    gridArea: "1 / 1",
  },
  ghost: {
    gridArea: "1 / 1",
    visibility: "hidden",
  },
  stack: {
    display: "inline-grid",
  },
});

export const Count = ({ value, locale }: { value: number; locale: Locale }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 1400);
          entry.target.textContent = fmt(
            Math.round(value * (1 - (1 - progress) ** 4)),
            locale
          );
          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          }
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    if (
      el &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      el.getBoundingClientRect().top >= innerHeight
    ) {
      el.textContent = fmt(0, locale);
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (el) {
        el.textContent = fmt(value, locale);
      }
    };
  }, [value, locale]);

  return (
    <span {...stylex.props(styles.stack)}>
      <span {...stylex.props(styles.ghost)}>{fmt(value, locale)}</span>
      <span ref={ref} {...stylex.props(styles.cell)}>
        {fmt(value, locale)}
      </span>
    </span>
  );
};
