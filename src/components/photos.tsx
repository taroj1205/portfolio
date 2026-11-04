"use client";

import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";

import { Smooth } from "@/components/smooth";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  OUT,
  canTransition,
  easedProgress,
  turnTiming,
} from "@/lib/view-transition";
import { shared } from "@/styles/shared";

import { color, ease, font, media, size } from "../styles/tokens.stylex";

export interface Photo {
  src: StaticImageData;
  caption: string;
}

const morph = {
  new: { height: "100%", objectFit: "cover", overflow: "clip" },
  old: { height: "100%", objectFit: "cover", overflow: "clip" },
} as const;

const FULL_RADIUS = "12px";
const THUMB_RADIUS = `var(--thumb-radius, ${FULL_RADIUS})`;

const grow = stylex.keyframes({ from: { borderRadius: THUMB_RADIUS } });
const shrink = stylex.keyframes({ from: { borderRadius: FULL_RADIUS } });

const land = stylex.keyframes({
  "0%": { opacity: 0 },
  "60%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const THUMB_FRAMING = {
  scale: "var(--thumb-zoom, 1)",
  translate: "var(--thumb-shift, 0 0)",
};

const fromThumb = stylex.keyframes({ from: THUMB_FRAMING });
const toThumb = stylex.keyframes({ to: THUMB_FRAMING });

const opening = stylex.viewTransitionClass({
  group: { animationDuration: "420ms", animationTimingFunction: ease.drawer },
  new: {
    ...morph.new,
    animationDuration: "420ms",
    animationFillMode: "both",
    animationName: fromThumb,
    animationTimingFunction: ease.drawer,
  },
  old: { ...morph.old, animationName: "none", opacity: 0 },
  imagePair: {
    animationDuration: "420ms",
    animationName: grow,
    animationTimingFunction: ease.drawer,
    borderRadius: FULL_RADIUS,
    overflow: "clip",
  },
});

const closing = stylex.viewTransitionClass({
  group: { animationDuration: "260ms", animationTimingFunction: ease.out },
  new: {
    ...morph.new,
    animationDuration: "260ms",
    animationFillMode: "both",
    animationName: land,
    animationTimingFunction: ease.out,
  },
  old: {
    ...morph.old,
    animationDuration: "260ms",
    animationFillMode: "both",
    animationName: toThumb,
    animationTimingFunction: ease.out,
  },
  imagePair: {
    animationDuration: "260ms",
    animationName: shrink,
    animationTimingFunction: ease.out,
    borderRadius: THUMB_RADIUS,
    overflow: "clip",
  },
});

// Prints drift upward at three speeds as they pass, like layered paper.
const slow = stylex.keyframes({
  from: { translate: "0 2rem" },
  to: { translate: "0 -2rem" },
});

const brisk = stylex.keyframes({
  from: { translate: "0 4.5rem" },
  to: { translate: "0 -4.5rem" },
});

const quick = stylex.keyframes({
  from: { translate: "0 7rem" },
  to: { translate: "0 -7rem" },
});

const deal = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "translateY(45vh) rotate(-14deg) scale(0.92)",
  },
});

// A photo slides inside its frame against the page, like a window.
const through = stylex.keyframes({
  from: { translate: "0 -7%" },
  to: { translate: "0 7%" },
});

const chevrons = [
  [-1, "m15 5-7 7 7 7"],
  [1, "m9 5 7 7-7 7"],
] as const;

const chevron = (path: string) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <path d={path} />
  </svg>
);

const inset = "clamp(1rem, 4vw, 3rem)";
const tilts = [-4, 3, -2, 5, -3, 2];
const drops = ["0rem", "2.5rem", "0.75rem", "1.25rem", "3.5rem", "2rem"];

const styles = stylex.create({
  open: {
    backgroundColor: color.paperDeep,
    borderWidth: 0,
    cursor: "zoom-in",
    display: "block",
    overflow: "clip",
    padding: 0,
  },
  prints: {
    display: "grid",
    gap: "clamp(0.75rem, 2vw, 1.75rem)",
    gridTemplateColumns: {
      default: "repeat(6, 1fr)",
      [media.tablet]: "repeat(3, 1fr)",
    },
    marginInline: "auto",
    maxWidth: 1440,
    paddingBlock: "clamp(1rem, 2vw, 1.5rem) clamp(3rem, 7vw, 6rem)",
    paddingInline: size.gutter,
    rowGap: { default: null, [media.tablet]: "0.5rem" },
  },
  dealt: (delay: string) => ({
    alignSelf: "start",
    animationDelay: delay,
    animationDuration: "1.1s",
    animationFillMode: "both",
    animationName: { default: null, [media.motion]: deal },
    animationTimingFunction: ease.spring,
  }),
  print: {
    backgroundColor: "#fff",
    borderRadius: 6,
    boxShadow: {
      default:
        "0 1px 2px rgb(18 16 14 / 0.12), 0 22px 44px -22px rgb(18 16 14 / 0.5)",
      ":hover": {
        default: null,
        [media.hover]:
          "0 1px 2px rgb(18 16 14 / 0.1), 0 36px 60px -24px rgb(18 16 14 / 0.45)",
      },
    },
    scale: {
      default: null,
      ":hover": {
        default: null,
        [media.hover]: { default: null, [media.motion]: 1.04 },
      },
    },
    transitionDuration: "350ms",
    transitionProperty: "scale, box-shadow, transform",
    transitionTimingFunction: ease.spring,
    zIndex: { default: null, ":hover": 1 },
    paddingBlock: "clamp(0.3rem, 0.6vw, 0.5rem) clamp(1rem, 2.2vw, 1.75rem)",
    paddingInline: "clamp(0.3rem, 0.6vw, 0.5rem)",
  },
  // Speeds follow the column (index mod 3) at both 6 and 3 columns, so
  // prints stacked in one column always move together and never collide.
  slow: {
    animationName: { default: null, [media.motion]: slow },
  },
  brisk: {
    animationName: { default: null, [media.motion]: brisk },
  },
  quick: {
    animationName: { default: null, [media.motion]: quick },
  },
  printAt: (angle: number, drop: string) => ({
    marginTop: drop,
    rotate: `${angle}deg`,
  }),
  printButton: {
    borderRadius: 2,
    width: "100%",
  },
  printImage: {
    aspectRatio: "4 / 5",
    objectFit: "cover",
    width: "100%",
  },
  spread: {
    columnGap: "1.5rem",
    display: "grid",
    gridTemplateColumns: { default: "repeat(12, 1fr)", [media.tablet]: "1fr" },
    paddingTop: { default: 0, [media.tablet]: "2rem" },
    rowGap: "clamp(4rem, 10vw, 8rem)",
  },
  piece: {
    position: "relative",
  },
  left: {
    gridColumn: { default: "1 / span 5", [media.tablet]: "1 / -1" },
  },
  right: {
    gridColumn: { default: "8 / span 5", [media.tablet]: "1 / -1" },
    marginTop: { default: "10rem", [media.tablet]: 0 },
  },
  leftIn: {
    gridColumn: { default: "2 / span 5", [media.tablet]: "1 / -1" },
  },
  rightIn: {
    gridColumn: { default: "7 / span 5", [media.tablet]: "1 / -1" },
    marginTop: { default: "6rem", [media.tablet]: 0 },
  },
  wide: {
    gridColumn: "1 / -1",
  },
  numeral: {
    animationName: {
      default: null,
      [media.motion]: { default: quick, [media.tablet]: "none" },
    },
    color: color.line,
    fontFamily: font.display,
    fontSize: "clamp(5rem, 13vw, 11rem)",
    fontWeight: 750,
    letterSpacing: "-0.06em",
    lineHeight: 0.8,
    pointerEvents: "none",
    position: "absolute",
    top: { default: "12%", [media.tablet]: "-0.45em" },
    userSelect: "none",
  },
  // Beside the photo in the empty columns; above it on one column.
  numeralAfter: {
    left: { default: "calc(100% + 1.5rem)", [media.tablet]: "0" },
  },
  numeralBefore: {
    bottom: { default: "12%", [media.tablet]: "auto" },
    left: { default: null, [media.tablet]: "0" },
    right: { default: "calc(100% + 1.5rem)", [media.tablet]: "auto" },
    top: { default: "auto", [media.tablet]: "-0.45em" },
  },
  numeralOver: {
    left: 0,
    top: "-0.45em",
  },
  window: {
    borderRadius: 20,
    outlineOffset: { default: null, ":focus-visible": -4 },
    transitionDuration: "500ms",
    transitionProperty: "transform",
    transitionTimingFunction: ease.out,
    width: "100%",
    zIndex: 1,
  },
  windowImage: {
    animationName: { default: null, [media.motion]: through },
    objectFit: "cover",
    // Room for the drift, so the frame never shows an edge.
    scale: 1.16,
    width: "100%",
  },
  tall: {
    aspectRatio: "4 / 5",
  },
  broad: {
    aspectRatio: "16 / 9",
  },
  caption: {
    color: color.muted,
    fontSize: "0.9375rem",
    marginTop: "0.9rem",
  },
  close: {
    fontSize: "0.9375rem",
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    right: "1rem",
    top: "1rem",
  },
  dialog: {
    "::backdrop": { backgroundColor: "rgb(18 16 14 / 0.94)" },
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "#fff",
    maxHeight: "100dvh",
    maxWidth: "100vw",
    overflow: "visible",
    padding: inset,
    touchAction: "pinch-zoom",
  },
  full: {
    borderRadius: FULL_RADIUS,
    maxHeight: {
      default: "calc(100dvh - 8rem)",
      [media.tablet]: "calc(100dvh - 12rem)",
    },
    // In vw, not %: a percentage inside the shrink-to-fit dialog collapses it.
    maxWidth: `calc(100vw - 2 * ${inset})`,
    objectFit: "contain",
    userSelect: "none",
    viewTransitionClass: opening,
    viewTransitionName: "photo",
    WebkitTouchCallout: "none",
    width: "auto",
  },
  fullFigure: {
    display: "grid",
    gap: "0.85rem",
    justifyItems: "center",
  },
  fullCaption: {
    display: "flex",
    fontSize: "0.9375rem",
    gap: "0.75rem",
    opacity: 0.8,
  },
  count: {
    opacity: 0.6,
  },
  // The global reset makes every img a block, which beats `hidden`.
  preload: {
    display: "none",
  },
  glass: {
    backgroundColor: {
      default: "rgb(255 255 255 / 0.14)",
      [media.hover]: { default: null, ":hover": "rgb(255 255 255 / 0.26)" },
    },
    borderRadius: 999,
    borderWidth: 0,
    color: "#fff",
    cursor: "pointer",
    outlineColor: { default: null, ":focus-visible": "#fff" },
    position: "fixed",
    transitionDuration: "200ms",
    transitionProperty: "background-color, transform",
    transitionTimingFunction: ease.out,
    userSelect: "none",
    zIndex: 1,
  },
  turn: {
    alignItems: "center",
    bottom: { default: null, [media.tablet]: "1.25rem" },
    display: "grid",
    height: 48,
    justifyContent: "center",
    top: { default: "50%", [media.tablet]: "auto" },
    translate: { default: "0 -50%", [media.tablet]: "none" },
    width: 48,
  },
  turnBack: {
    left: { default: "1rem", [media.tablet]: "calc(50% - 60px)" },
  },
  turnForward: {
    right: { default: "1rem", [media.tablet]: "calc(50% - 60px)" },
  },
});

const reduced = "(prefers-reduced-motion: reduce)";

const TURN_MS = 260;

const transitionParts = () =>
  document
    .getAnimations()
    .flatMap((part) =>
      part.effect instanceof KeyframeEffect &&
      part.effect.pseudoElement?.startsWith("::view-transition") === true
        ? [{ effect: part.effect, part }]
        : []
    );

const within = (box: DOMRect, point: { clientX: number; clientY: number }) =>
  point.clientX >= box.left &&
  point.clientX <= box.right &&
  point.clientY >= box.top &&
  point.clientY <= box.bottom;

const corners = (radius: string) => ({
  borderBottomLeftRadius: radius,
  borderBottomRightRadius: radius,
  borderTopLeftRadius: radius,
  borderTopRightRadius: radius,
});

const heading = (run: Run) => run.opens !== run.back;

const easeAt = (easing: string, time: number) => {
  const probe = new Animation(
    new KeyframeEffect(null, null, { duration: 1, easing, fill: "both" })
  );

  probe.currentTime = time;

  return probe.effect?.getComputedTiming().progress ?? time;
};

interface Run {
  back: boolean;
  opens: boolean;
  transition: ViewTransition;
  turns: number;
  undo: () => void;
  want: boolean;
}

const slideOut = (image: HTMLElement, direction: number) => {
  const ghost = image.cloneNode();
  const dialog = image.closest("dialog");
  const query = matchMedia(reduced);

  if (!(ghost instanceof HTMLElement) || !dialog || query.matches) {
    return;
  }

  const box = image.getBoundingClientRect();

  Object.assign(ghost.style, {
    height: `${box.height}px`,
    left: `${box.left}px`,
    margin: "0",
    maxHeight: "none",
    maxWidth: "none",
    pointerEvents: "none",
    position: "fixed",
    top: `${box.top}px`,
    viewTransitionName: "none",
    width: `${box.width}px`,
    zIndex: "-1",
  });

  ghost.removeAttribute("alt");
  ghost.setAttribute("aria-hidden", "true");
  dialog.append(ghost);

  const { filter, opacity } = getComputedStyle(image);

  const fade = ghost.animate(
    [
      { filter, opacity: Number(opacity) },
      {
        filter: "blur(8px)",
        opacity: 0,
        translate: `${direction * -0.75}rem 0`,
      },
    ],
    {
      duration: 200,
      easing: OUT,
      fill: "forwards",
    }
  );

  const stop = () => {
    fade.cancel();
  };

  const remove = () => {
    ghost.remove();
    query.removeEventListener("change", stop);
  };

  query.addEventListener("change", stop, { once: true });
  fade.addEventListener("finish", remove);
  fade.addEventListener("cancel", remove);
};

const slideIn = (image: HTMLElement, direction: number) => {
  const query = matchMedia(reduced);

  if (query.matches) {
    return;
  }

  const slide = image.animate(
    [
      {
        filter: "blur(8px)",
        opacity: 0,
        translate: `${direction * 0.75}rem 0`,
      },
      { filter: "blur(0px)", opacity: 1, translate: "0 0" },
    ],
    { duration: 360, easing: OUT }
  );

  const settle = () => {
    slide.cancel();
  };

  query.addEventListener("change", settle, { once: true });
  slide.addEventListener("finish", () => {
    query.removeEventListener("change", settle);
  });
};

export const Photos = ({
  variant,
  photos,
  eager = 0,
  locale,
}: {
  variant: "band" | "gallery";
  photos: Photo[];
  eager?: number;
  locale: Locale;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const full = useRef<HTMLImageElement>(null);
  const thumb = useRef<HTMLButtonElement | null>(null);
  const list = useRef<HTMLDivElement>(null);

  const press = useRef<{ target: EventTarget | null; x: number; y: number }>({
    target: null,
    x: 0,
    y: 0,
  });

  const moving = useRef<Run | null>(null);
  const t = getTranslator(locale);
  const [open, setOpen] = useState<Photo | null>(null);

  const nameThumb = (name: string) => {
    if (thumb.current) {
      thumb.current.style.viewTransitionName = name;
      thumb.current.style.viewTransitionClass = name === "" ? "" : closing;

      if (name !== "") {
        const root = document.documentElement.style;
        const image = thumb.current.querySelector("img");
        const framing = image ? getComputedStyle(image) : null;

        root.setProperty(
          "--thumb-radius",
          getComputedStyle(thumb.current).borderRadius
        );
        root.setProperty(
          "--thumb-zoom",
          !framing || framing.scale === "none" ? "1" : framing.scale
        );
        root.setProperty(
          "--thumb-shift",
          !framing || framing.translate === "none" ? "0 0" : framing.translate
        );
      }
    }
  };

  const lift = (lifted: boolean) => {
    const image = thumb.current?.querySelector("img");

    if (image) {
      image.style.visibility = lifted ? "hidden" : "";
    }
  };

  // Never hold the page frozen on a slow download: after a moment the
  // morph runs on the blurred placeholder and the sharp photo fades in.
  const ready = async () => {
    const timeout = Promise.withResolvers<undefined>();
    setTimeout(timeout.resolve, 150);
    await Promise.race([
      full.current?.decode().catch(() => null),
      timeout.promise,
    ]);
  };

  const turn = () => {
    const run = moving.current;
    const parts = transitionParts();

    if (!run || parts.length === 0) {
      return false;
    }

    run.back = !run.back;
    run.turns += 1;

    const { back, turns } = run;
    let left = parts.length;

    const settle = () => {
      left -= 1;

      if (left === 0 && run.turns === turns) {
        run.undo();
        run.transition.skipTransition();
      }
    };

    const thumbRadius =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--thumb-radius")
        .trim() || FULL_RADIUS;

    const [startRadius, endRadius] = run.opens
      ? [thumbRadius, FULL_RADIUS]
      : [FULL_RADIUS, thumbRadius];

    for (const { effect, part } of parts) {
      const frames = effect.getKeyframes();

      const pair =
        effect.pseudoElement === "::view-transition-image-pair(photo)";

      const progress = easedProgress(
        frames,
        effect.getComputedTiming().progress ?? 1,
        easeAt
      );

      const { at, easing } = turnTiming(progress, back);

      effect.setKeyframes(
        frames.map((frame) => {
          const flat: Keyframe = {
            ...frame,
            easing: "linear",
            offset: frame.computedOffset,
          };

          if (pair) {
            Object.assign(
              flat,
              corners(frame.computedOffset === 0 ? startRadius : endRadius)
            );
          }

          return flat;
        })
      );
      effect.updateTiming({ duration: TURN_MS, easing });
      part.currentTime = at * TURN_MS;
      part.playbackRate = back ? -1 : 1;

      if (back) {
        part.addEventListener("finish", settle, { once: true });
      }
    }

    return true;
  };

  const transit = async (
    options: StartViewTransitionOptions,
    undo: () => void
  ) => {
    const transition = document.startViewTransition(options);

    const opens = dialog.current?.open !== true;
    const run = { back: false, opens, transition, turns: 0, undo, want: opens };

    moving.current = run;
    transition.ready.catch(() => null);
    await transition.finished;

    if (moving.current === run) {
      moving.current = null;
    }

    const shown = dialog.current?.open === true;

    lift(shown);

    if (!shown) {
      setOpen(null);
    }
  };

  const reveal = async (photo: Photo) => {
    flushSync(() => {
      setOpen(photo);
    });
    dialog.current?.showModal();
    await ready();
  };

  const neighbour = (photo: Photo, direction: number) =>
    photos.at((photos.indexOf(photo) + direction) % photos.length);

  const step = (direction: number) => {
    if (!open || moving.current) {
      return;
    }

    const next = neighbour(open, direction);

    if (next === undefined) {
      return;
    }

    lift(false);
    // Closing morphs back into this photo only if it is on screen.
    thumb.current =
      [...(list.current?.querySelectorAll("button") ?? [])].find((button) => {
        const box = button.getBoundingClientRect();

        return (
          button.querySelector("img")?.alt === next.caption &&
          box.right > 0 &&
          box.left < innerWidth &&
          box.bottom > 0 &&
          box.top < innerHeight
        );
      }) ?? null;
    lift(true);

    if (full.current) {
      slideOut(full.current, direction);
    }

    flushSync(() => {
      setOpen(next);
    });

    if (full.current) {
      slideIn(full.current, direction);
    }
  };

  const show = (photo: Photo, event: MouseEvent<HTMLButtonElement>) => {
    thumb.current = event.currentTarget;

    if (!canTransition()) {
      lift(true);
      void reveal(photo);

      return;
    }

    nameThumb("photo");
    void transit(
      {
        update: async () => {
          nameThumb("");
          lift(true);
          await reveal(photo);
        },
      },
      () => {
        dialog.current?.close();
        lift(false);
      }
    );
  };

  const hide = async () => {
    if (dialog.current?.open !== true) {
      return;
    }

    if (!canTransition()) {
      dialog.current?.close();
      lift(false);

      return;
    }

    if (full.current) {
      full.current.style.viewTransitionName = thumb.current ? "" : "none";
    }

    await transit(
      {
        update: () => {
          dialog.current?.close();
          lift(false);
          nameThumb("photo");
        },
      },
      () => {
        dialog.current?.showModal();
        lift(true);
      }
    );
    nameThumb("");
  };

  const steer = async (toOpen: boolean) => {
    const run = moving.current;

    if (!run) {
      if (!toOpen) {
        await hide();
      }

      return;
    }

    run.want = toOpen;

    if (heading(run) === toOpen || turn()) {
      return;
    }

    const started = await run.transition.ready.then(
      () => true,
      () => false
    );

    if (heading(run) === run.want || (started && turn())) {
      return;
    }

    if (!run.want) {
      await hide();
    }
  };

  const pressDuring = useEffectEvent((event: PointerEvent) => {
    const run = moving.current;

    if (!run) {
      return;
    }

    press.current = { target: null, x: event.clientX, y: event.clientY };

    if (event.button === 0) {
      const box = thumb.current?.getBoundingClientRect();
      const onThumb = box !== undefined && within(box, event);

      void steer(onThumb && !run.want);
    }
  });

  const escapeDuring = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && moving.current) {
      event.preventDefault();
      void steer(false);
    }
  });

  useEffect(() => {
    const options = { capture: true };

    document.addEventListener("pointerdown", pressDuring, options);
    document.addEventListener("keydown", escapeDuring, options);

    return () => {
      document.removeEventListener("pointerdown", pressDuring, options);
      document.removeEventListener("keydown", escapeDuring, options);
    };
  }, []);

  const opener = (
    photo: Photo,
    i: number,
    frame: stylex.StyleXStyles,
    image: stylex.StyleXStyles,
    sizes: string
  ) => (
    <button
      aria-label={`${t("photos.viewLarger", "View larger")}: ${photo.caption}`}
      onClick={(event) => {
        show(photo, event);
      }}
      type="button"
      {...stylex.props(styles.open, frame)}
    >
      <Image
        alt={photo.caption}
        loading={i < eager ? "eager" : "lazy"}
        placeholder="blur"
        sizes={sizes}
        src={photo.src}
        {...stylex.props(image)}
      />
    </button>
  );

  const speeds = [styles.slow, styles.quick, styles.brisk];

  const sides = [
    [styles.left, styles.numeralAfter],
    [styles.right, styles.numeralBefore],
    [styles.leftIn, styles.numeralOver],
    [styles.rightIn, styles.numeralOver],
  ] as const;

  const isBroad = (photo: Photo) => photo.src.width > photo.src.height * 1.2;

  return (
    <>
      {variant === "band" ? (
        <div ref={list} {...stylex.props(styles.prints)}>
          {photos.map((photo, i) => (
            <div
              key={photo.caption}
              {...stylex.props(styles.dealt(`${650 + i * 90}ms`))}
            >
              <figure
                data-scroll="cover 0% cover 100%"
                data-tilt
                {...stylex.props(
                  shared.scrub,
                  shared.tilt,
                  styles.print,
                  speeds[i % speeds.length],
                  styles.printAt(
                    tilts[i % tilts.length] ?? 0,
                    drops[i % drops.length] ?? "0rem"
                  )
                )}
              >
                {opener(
                  photo,
                  i,
                  styles.printButton,
                  styles.printImage,
                  "(max-width: 800px) 30vw, 16vw"
                )}
              </figure>
            </div>
          ))}
        </div>
      ) : (
        <div ref={list} {...stylex.props(styles.spread)}>
          {photos.map((photo, i) => {
            const broad = isBroad(photo);

            const [side, numeral] = broad
              ? [styles.wide, styles.numeralOver]
              : (sides[
                  photos.slice(0, i).filter((other) => !isBroad(other)).length %
                    sides.length
                ] ?? [styles.left, styles.numeralAfter]);

            return (
              <figure key={photo.caption} {...stylex.props(styles.piece, side)}>
                <span
                  aria-hidden="true"
                  data-scroll="cover 0% cover 100%"
                  {...stylex.props(shared.scrub, styles.numeral, numeral)}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Smooth radius={20}>
                  <button
                    aria-label={`${t("photos.viewLarger", "View larger")}: ${photo.caption}`}
                    onClick={(event) => {
                      show(photo, event);
                    }}
                    data-tilt
                    type="button"
                    {...stylex.props(styles.open, shared.tilt, styles.window)}
                  >
                    <span data-reveal="wipe" {...stylex.props(shared.unveil)}>
                      <span>
                        <Image
                          alt={photo.caption}
                          data-scroll="cover 0% cover 100%"
                          placeholder="blur"
                          sizes={
                            broad
                              ? "(max-width: 800px) 100vw, 1180px"
                              : "(max-width: 800px) 100vw, 480px"
                          }
                          src={photo.src}
                          {...stylex.props(
                            shared.scrub,
                            styles.windowImage,
                            broad ? styles.broad : styles.tall
                          )}
                        />
                      </span>
                    </span>
                  </button>
                </Smooth>
                <figcaption {...stylex.props(styles.caption)}>
                  {photo.caption}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      <dialog
        aria-label={t("photos.dialogTitle", "Photo")}
        onCancel={(event) => {
          event.preventDefault();
          void steer(false);
        }}
        onClose={() => {
          if (!moving.current) {
            lift(false);
            setOpen(null);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            step(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary) {
            return;
          }

          press.current = {
            target: moving.current ? null : event.target,
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onPointerUp={(event) => {
          if (!event.isPrimary || press.current.target === null) {
            return;
          }

          const distance = event.clientX - press.current.x;

          if (event.pointerType !== "mouse" && Math.abs(distance) > 60) {
            step(distance < 0 ? 1 : -1);

            return;
          }

          const spot = event.target;

          const beside =
            spot instanceof Element &&
            spot.closest("img, figcaption, button") === null;

          if (
            beside &&
            spot === press.current.target &&
            event.button === 0 &&
            Math.hypot(distance, event.clientY - press.current.y) < 10
          ) {
            void steer(false);
          }
        }}
        ref={dialog}
        {...stylex.props(styles.dialog)}
      >
        <button
          onClick={() => {
            void steer(false);
          }}
          type="button"
          {...stylex.props(shared.pressable, styles.glass, styles.close)}
        >
          {t("photos.close", "Close")}
        </button>
        {chevrons.map(([direction, path]) => (
          <button
            aria-label={
              direction < 0
                ? t("photos.previous", "Previous photo")
                : t("photos.next", "Next photo")
            }
            key={direction}
            onClick={() => {
              step(direction);
            }}
            type="button"
            {...stylex.props(
              shared.pressable,
              styles.glass,
              styles.turn,
              direction < 0 ? styles.turnBack : styles.turnForward
            )}
          >
            {chevron(path)}
          </button>
        ))}
        {open && (
          <figure {...stylex.props(styles.fullFigure)}>
            <Image
              alt={open.caption}
              // Lazy images reject decode() before loading starts.
              loading="eager"
              placeholder="blur"
              ref={full}
              sizes="100vw"
              src={open.src}
              {...stylex.props(styles.full)}
            />
            <figcaption
              aria-live="polite"
              {...stylex.props(styles.fullCaption)}
            >
              {open.caption}
              <span {...stylex.props(styles.count)}>
                {photos.indexOf(open) + 1} / {photos.length}
              </span>
            </figcaption>
            {chevrons.map(([direction]) => {
              const near = neighbour(open, direction);

              return near === undefined ? null : (
                <Image
                  alt=""
                  key={direction}
                  loading="eager"
                  sizes="100vw"
                  src={near.src}
                  {...stylex.props(styles.preload)}
                />
              );
            })}
          </figure>
        )}
      </dialog>
    </>
  );
};
