"use client";

import { useEffect } from "react";

const settle = "cubic-bezier(0.23, 1, 0.32, 1)";
const drawer = "cubic-bezier(0.32, 0.72, 0, 1)";

const prepare = (el: HTMLElement) => {
  if (el.dataset.reveal === "words") {
    return [...el.querySelectorAll(":scope > span > span")].map((word, i) =>
      word.animate(
        [
          { rotate: "7deg", translate: "0 118%" },
          { rotate: "0deg", translate: "0 0" },
        ],
        { delay: i * 70, duration: 1000, easing: settle, fill: "backwards" }
      )
    );
  }
  if (el.dataset.reveal !== "wipe") {
    return [
      el.animate(
        [
          { opacity: 0, translate: "0 2rem" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 800, easing: settle, fill: "backwards" }
      ),
    ];
  }
  const timing = { duration: 1100, easing: drawer, fill: "backwards" } as const;
  const frame = el.animate(
    [{ translate: "0 -100%" }, { translate: "0 0" }],
    timing
  );
  const image = el.firstElementChild?.animate(
    [{ translate: "0 100%" }, { translate: "0 0" }],
    timing
  );
  return image ? [frame, image] : [frame];
};

export const Reveal = () => {
  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = new Map<Element, Animation[]>();
    const observer = new IntersectionObserver(
      (entries) => {
        let order = 0;
        for (const entry of entries) {
          const animations = pending.get(entry.target);
          if (!entry.isIntersecting || !animations) {
            continue;
          }
          observer.unobserve(entry.target);
          pending.delete(entry.target);
          for (const animation of animations) {
            const { effect } = animation;
            effect?.updateTiming({
              delay: order * 90 + (effect.getTiming().delay ?? 0),
            });
            animation.play();
          }
          order += 1;
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (still || el.getBoundingClientRect().top < innerHeight) {
        continue;
      }
      const animations = prepare(el);
      for (const animation of animations) {
        animation.pause();
      }
      const target =
        el.dataset.reveal === "wipe" ? (el.parentElement ?? el) : el;
      pending.set(target, animations);
      observer.observe(target);
    }
    return () => {
      observer.disconnect();
      for (const animations of pending.values()) {
        for (const animation of animations) {
          animation.cancel();
        }
      }
    };
  }, []);
  return null;
};
