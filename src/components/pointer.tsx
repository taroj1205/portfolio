"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { media } from "../styles/tokens.stylex";

const styles = stylex.create({
  glow: {
    backgroundImage:
      "radial-gradient(closest-side, rgb(255 122 69 / 0.24), rgb(43 76 255 / 0.1) 55%, transparent)",
    display: {
      default: "none",
      [media.hover]: { default: null, [media.motion]: "block" },
    },
    height: "44rem",
    left: "-22rem",
    opacity: 0,
    pointerEvents: "none",
    position: "fixed",
    top: "-22rem",
    transitionDuration: "500ms",
    transitionProperty: "opacity",
    width: "44rem",
    zIndex: 30,
  },
});

const tiltProps = ["--tilt-x", "--tilt-y", "--glare"];

const falloff = (distance: number, reach: number) => {
  const t = Math.max(0, 1 - distance / reach);
  return t * t * (3 - 2 * t);
};

export const Pointer = () => {
  const glow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    let tilted: HTMLElement | null = null;
    let last: { target: Element | null; x: number; y: number } | null = null;

    const tilt = (target: Element | null, x: number, y: number) => {
      const el = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (el !== tilted) {
        for (const prop of tiltProps) {
          tilted?.style.removeProperty(prop);
        }
        tilted = el;
      }
      if (!el) {
        return;
      }
      const box = el.getBoundingClientRect();
      el.style.setProperty("--tilt-x", ((x - box.left) / box.width).toFixed(3));
      el.style.setProperty("--tilt-y", ((y - box.top) / box.height).toFixed(3));
      el.style.setProperty("--glare", "1");
    };

    const swell = (x: number, y: number) => {
      const nears: [HTMLElement, number][] = [];
      for (const title of document.querySelectorAll<HTMLElement>(
        "[data-near]"
      )) {
        const letters = title.querySelectorAll<HTMLElement>(
          ":scope > span > span > span"
        );
        const reach = letters[0]?.offsetHeight ?? 0;
        const box = title.getBoundingClientRect();
        const close = y > box.top - reach && y < box.bottom + reach;
        for (const letter of letters) {
          const r = letter.getBoundingClientRect();
          const near = close
            ? falloff(
                Math.hypot(
                  x - (r.left + r.width / 2),
                  y - (r.top + r.height / 2)
                ),
                reach
              )
            : 0;
          nears.push([letter, near]);
        }
      }
      for (const [letter, near] of nears) {
        letter.style.setProperty("--near", near.toFixed(2));
      }
    };

    const pull = (x: number, y: number) => {
      const pulls: [HTMLElement, number, number][] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        "[data-magnet]"
      )) {
        const box = el.getBoundingClientRect();
        const dx = x - (box.left + box.width / 2);
        const dy = y - (box.top + box.height / 2);
        const near = falloff(
          Math.hypot(dx, dy),
          Math.max(box.width, box.height) * 1.5
        );
        pulls.push([el, dx * near * 0.5, dy * near * 0.5]);
      }
      for (const [el, dx, dy] of pulls) {
        el.style.setProperty("--pull-x", `${dx.toFixed(1)}px`);
        el.style.setProperty("--pull-y", `${dy.toFixed(1)}px`);
      }
    };

    const update = () => {
      frame = 0;
      if (last) {
        tilt(last.target, last.x, last.y);
        swell(last.x, last.y);
        pull(last.x, last.y);
        glow.current?.style.setProperty("translate", `${last.x}px ${last.y}px`);
        glow.current?.style.setProperty("opacity", last.target ? "1" : "0");
      }
    };
    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };
    const move = (event: PointerEvent) => {
      last = {
        target: event.target instanceof Element ? event.target : null,
        x: event.clientX,
        y: event.clientY,
      };
      schedule();
    };
    const leave = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        last = { target: null, x: -1e4, y: -1e4 };
        schedule();
      }
    };

    const query = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    const sync = () => {
      if (query.matches) {
        addEventListener("pointermove", move, { passive: true });
        document.addEventListener("pointerout", leave);
        return;
      }
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      cancelAnimationFrame(frame);
      frame = 0;
      tilt(null, 0, 0);
      for (const el of document.querySelectorAll<HTMLElement>(
        "[data-magnet]"
      )) {
        el.style.removeProperty("--pull-x");
        el.style.removeProperty("--pull-y");
      }
      for (const letter of document.querySelectorAll<HTMLElement>(
        "[data-near] > span > span > span"
      )) {
        letter.style.removeProperty("--near");
      }
    };

    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
    };
  }, []);
  return <div aria-hidden="true" ref={glow} {...stylex.props(styles.glow)} />;
};
