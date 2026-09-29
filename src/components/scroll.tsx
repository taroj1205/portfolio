"use client";

import { useEffect } from "react";

const stiffness = 150;
const damping = 20;

const ranges = new Map([
  ["cover", (height: number, view: number) => [view, -height]],
  [
    "entry",
    (height: number, view: number) => [view, view - Math.min(height, view)],
  ],
  [
    "exit",
    (height: number, view: number) => [Math.min(0, view - height), -height],
  ],
]);

const edge = (name: string, offset: number, source: HTMLElement) => {
  const [start = 0, end = 0] =
    ranges.get(name)?.(source.offsetHeight, innerHeight) ?? [];
  return start + ((end - start) * offset) / 100;
};

const viewTop = (el: HTMLElement) => {
  let top = -scrollY;
  for (
    let node: Element | null = el;
    node instanceof HTMLElement;
    node = node.offsetParent
  ) {
    top += node.offsetTop;
  }
  return top;
};

const parse = (range: string, source: HTMLElement) => {
  const [a = "", from = "", b = "", to = ""] = range.trim().split(/\s+/u);
  const track = {
    progress: () => {
      const start = edge(a, Number(from.slice(0, -1)), source);
      const end = edge(b, Number(to.slice(0, -1)), source);
      return Math.min(
        1,
        Math.max(0, (start - viewTop(source)) / (start - end))
      );
    },
    speed: 0,
    value: 0,
  };
  track.value = track.progress();
  return track;
};

export const Scroll = () => {
  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = [
      ...document.querySelectorAll<HTMLElement>("[data-scroll]"),
    ].flatMap((el) => {
      const source =
        el.dataset.scrollFrom === undefined
          ? el
          : document.querySelector<HTMLElement>(`#${el.dataset.scrollFrom}`);
      return source
        ? [
            {
              el,
              tracks: (el.dataset.scroll ?? "")
                .split(",")
                .map((range) => parse(range, source)),
            },
          ]
        : [];
    });
    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.min(Math.max(now - last, 0) / 1000, 1 / 30);
      last = now;
      let moving = false;
      for (const { el, tracks } of items) {
        for (const [i, track] of tracks.entries()) {
          const target = track.progress();
          if (!still) {
            track.speed +=
              (stiffness * (target - track.value) - damping * track.speed) * dt;
            track.value += track.speed * dt;
          }
          if (
            still ||
            Math.abs(target - track.value) + Math.abs(track.speed) < 1e-4
          ) {
            track.value = target;
            track.speed = 0;
          } else {
            moving = true;
          }
          el.style.setProperty(`--scroll-${i}`, track.value.toFixed(4));
        }
      }
      frame = moving ? requestAnimationFrame(tick) : 0;
    };

    const wake = () => {
      if (frame === 0) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    wake();
    addEventListener("scroll", wake, { passive: true });
    addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", wake);
      removeEventListener("resize", wake);
    };
  }, []);
  return null;
};
