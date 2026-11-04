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
        { delay: i * 60, duration: 800, easing: settle, fill: "backwards" }
      )
    );
  }

  if (el.dataset.reveal === "stagger") {
    return [...el.children].map((child, i) =>
      child.animate(
        [
          { opacity: 0, translate: "0 0.5rem" },
          { opacity: 1, translate: "0 0" },
        ],
        { delay: i * 45, duration: 550, easing: settle, fill: "backwards" }
      )
    );
  }

  if (el.dataset.reveal !== "wipe") {
    return [
      el.animate(
        [
          { opacity: 0, translate: "0 1rem" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 650, easing: settle, fill: "backwards" }
      ),
    ];
  }

  const timing = { duration: 900, easing: drawer, fill: "backwards" } as const;

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
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const pending = new Map<Element, Animation[]>();
    const made: Animation[] = [];

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
              delay: order * 70 + (effect.getTiming().delay ?? 0),
            });
            animation.play();
          }

          order += 1;
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );

    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (query.matches || el.getBoundingClientRect().top < innerHeight) {
        continue;
      }

      const animations = prepare(el);

      for (const animation of animations) {
        animation.pause();
      }

      made.push(...animations);

      const target =
        el.dataset.reveal === "wipe" ? (el.parentElement ?? el) : el;

      pending.set(target, animations);
      observer.observe(target);
    }

    const release = () => {
      observer.disconnect();
      pending.clear();

      for (const animation of made) {
        animation.cancel();
      }
    };

    const calm = () => {
      if (query.matches) {
        release();
      }
    };

    query.addEventListener("change", calm);

    return () => {
      query.removeEventListener("change", calm);
      release();
    };
  }, []);

  return null;
};
