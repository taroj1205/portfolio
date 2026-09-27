"use client";

import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";

import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { shared } from "@/styles/shared";

import { color, ease, media, size } from "../styles/tokens.stylex";

export interface Photo {
  src: StaticImageData;
  caption: string;
}

const morph = {
  new: { height: "100%", objectFit: "cover" },
  old: { height: "100%", objectFit: "cover" },
} as const;
const opening = stylex.viewTransitionClass({
  ...morph,
  group: { animationDuration: "420ms", animationTimingFunction: ease.drawer },
});
const closing = stylex.viewTransitionClass({
  ...morph,
  group: { animationDuration: "260ms", animationTimingFunction: ease.out },
});

const inset = "clamp(1rem, 4vw, 3rem)";
const gap = "clamp(0.5rem, 1vw, 0.875rem)";

const deckMode =
  "@media (max-width: 800px) and (prefers-reduced-motion: no-preference)";
const scrollDriven = "@supports (animation-timeline: view())";
const tilts = [-3, 4, -5, 2, -2, 5];

const deal = stylex.keyframes({
  from: { transform: "translateY(115svh) rotate(14deg)" },
});

const styles = stylex.create({
  bandImage: {
    height: "clamp(11rem, 30vw, 22rem)",
    maxWidth: "none",
    width: "auto",
  },
  button: {
    backgroundColor: color.paperDeep,
    borderRadius: 16,
    borderWidth: 0,
    cursor: "zoom-in",
    display: "block",
    overflow: "hidden",
    padding: 0,
    width: "100%",
  },
  close: {
    backgroundColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    borderWidth: 0,
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.9375rem",
    outlineColor: { default: null, ":focus-visible": "#fff" },
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    position: "fixed",
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
  },
  full: {
    borderRadius: 12,
    maxHeight: "calc(100dvh - 8rem)",
    // In vw, not %: a percentage inside the shrink-to-fit dialog collapses it.
    maxWidth: `calc(100vw - 2 * ${inset})`,
    objectFit: "contain",
    viewTransitionClass: opening,
    viewTransitionName: "photo",
    width: "auto",
  },
  fullFigure: {
    display: "grid",
    gap: "0.85rem",
    justifyItems: "center",
  },
  fullCaption: {
    fontSize: "0.9375rem",
    opacity: 0.8,
  },
  echo: {
    display: { default: "flex", [media.reduce]: "none" },
  },
  group: {
    display: "flex",
    gap,
    paddingInlineEnd: gap,
  },
  image: {
    borderRadius: 16,
    scale: {
      default: null,
      [stylex.when.ancestor(":hover")]: { default: null, [media.hover]: 1.03 },
    },
    transitionDuration: "600ms",
    transitionProperty: "scale",
    transitionTimingFunction: ease.out,
    width: "100%",
  },
  rows: {
    alignItems: "start",
    display: "flex",
    flexWrap: "wrap",
    gap,
    justifyContent: "center",
  },
  strip: {
    cursor: {
      default: null,
      [media.motion]: { default: "grab", ":active": "grabbing" },
    },
    display: {
      default: "block",
      [deckMode]: { default: null, [scrollDriven]: "none" },
    },
    maskImage: `linear-gradient(90deg, transparent, #000 ${size.gutter}, #000 calc(100% - ${size.gutter}), transparent)`,
    overflowX: { default: "clip", [media.reduce]: "auto" },
    scrollbarWidth: "none",
    touchAction: "pan-y",
    userSelect: "none",
  },
  tile: (ratio: number) => ({
    flexBasis: `calc(${ratio} * clamp(11rem, 25vw, 20rem))`,
    // Scaled up: a row whose grow values sum below 1 leaves space unused.
    flexGrow: ratio * 100,
    maxWidth: `calc(${ratio} * clamp(15rem, 40vw, 30rem))`,
    minWidth: 0,
  }),
  track: {
    display: "flex",
    position: "relative",
    paddingInline: { default: null, [media.reduce]: size.gutter },
    width: "max-content",
  },
  deck: {
    display: {
      default: "none",
      [deckMode]: { default: null, [scrollDriven]: "block" },
    },
    viewTimelineName: "--deck",
  },
  deckHeight: (count: number) => ({
    height: `calc(100svh + ${count} * 38svh)`,
  }),
  stage: {
    display: "grid",
    height: "100svh",
    overflow: "clip",
    paddingTop: "clamp(1.5rem, 6svh, 3rem)",
    placeItems: "start center",
    position: "sticky",
    top: 0,
  },
  print: (tilt: number) => ({
    backgroundColor: color.surface,
    borderRadius: 10,
    boxShadow:
      "0 22px 50px rgb(18 16 14 / 0.18), 0 2px 6px rgb(18 16 14 / 0.08)",
    gridArea: "1 / 1",
    paddingBlock: "0.55rem 0",
    paddingInline: "0.55rem",
    rotate: `${tilt}deg`,
    width: "min(74vw, 19rem)",
  }),
  dealt: (from: string, to: string) => ({
    animationFillMode: "both",
    animationName: deal,
    animationRange: `contain ${from} contain ${to}`,
    animationTimeline: "--deck",
    animationTimingFunction: ease.out,
  }),
  printButton: {
    borderRadius: 5,
  },
  printImage: {
    maxHeight: "58svh",
    objectFit: "cover",
  },
  printCaption: {
    color: color.muted,
    fontSize: "0.8rem",
    paddingBlock: "0.55rem 0.7rem",
    textAlign: "center",
  },
});

// Pixels per second, leftwards.
const drift = -28;
// How fast a flick decays back into the drift, per second.
const settle = 2.2;

const startTicker = (track: HTMLElement, strip: HTMLElement) => {
  const controller = new AbortController();
  const { signal } = controller;
  let x = 0;
  let velocity = drift;
  let hovered = false;
  let focused = false;
  let dragged = false;
  let drag: { id: number; moved: number; t: number; x: number } | null = null;
  let last = 0;
  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!drag) {
      const target = hovered || focused ? 0 : drift;
      velocity += (target - velocity) * (1 - Math.exp(-settle * dt));
      x += velocity * dt;
    }
    const lap = track.offsetWidth / 2;
    x = (((x % lap) + lap) % lap) - lap;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
    frame = requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(frame);
    if (entry?.isIntersecting) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });
  observer.observe(strip);

  const release = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) {
      return;
    }
    velocity =
      event.timeStamp - drag.t > 80
        ? 0
        : Math.max(-4000, Math.min(4000, velocity));
    dragged = drag.moved > 6;
    drag = null;
  };
  const hover = (event: PointerEvent) => {
    hovered = event.type === "pointerenter" && event.pointerType === "mouse";
  };

  strip.addEventListener(
    "pointerdown",
    (event) => {
      if (drag || event.button !== 0) {
        return;
      }
      drag = {
        id: event.pointerId,
        moved: 0,
        t: event.timeStamp,
        x: event.clientX,
      };
      dragged = false;
      velocity = 0;
    },
    { signal }
  );
  strip.addEventListener(
    "pointermove",
    (event) => {
      if (drag?.id !== event.pointerId) {
        return;
      }
      const dx = event.clientX - drag.x;
      const dt = Math.max(event.timeStamp - drag.t, 1) / 1000;
      x += dx;
      velocity = velocity * 0.2 + (dx / dt) * 0.8;
      drag = {
        ...drag,
        moved: drag.moved + Math.abs(dx),
        t: event.timeStamp,
        x: event.clientX,
      };
      if (drag.moved > 6 && !strip.hasPointerCapture(event.pointerId)) {
        strip.setPointerCapture(event.pointerId);
      }
    },
    { signal }
  );
  strip.addEventListener("pointerup", release, { signal });
  strip.addEventListener("pointercancel", release, { signal });
  strip.addEventListener("pointerenter", hover, { signal });
  strip.addEventListener("pointerleave", hover, { signal });
  strip.addEventListener(
    "click",
    (event) => {
      if (dragged) {
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
      }
    },
    { capture: true, signal }
  );
  strip.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        x -= event.deltaX;
        velocity = 0;
      }
    },
    { passive: false, signal }
  );
  strip.addEventListener(
    "focusin",
    (event) => {
      focused = true;
      const figure =
        event.target instanceof HTMLElement &&
        event.target.matches(":focus-visible")
          ? event.target.closest("figure")
          : null;
      if (figure) {
        x = strip.clientWidth / 2 - figure.offsetLeft - figure.offsetWidth / 2;
        velocity = 0;
      }
    },
    { signal }
  );
  strip.addEventListener(
    "focusout",
    () => {
      focused = false;
    },
    { signal }
  );

  return () => {
    controller.abort();
    observer.disconnect();
    cancelAnimationFrame(frame);
    track.style.transform = "";
  };
};

const reduced = "(prefers-reduced-motion: reduce)";

const canMorph = () =>
  "startViewTransition" in document && !matchMedia(reduced).matches;

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
  const thumb = useRef<HTMLImageElement | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const t = getTranslator(locale);
  const [open, setOpen] = useState<Photo | null>(null);
  const band = variant === "band";
  useEffect(() => {
    const strip = track.current?.parentElement;
    return track.current && strip && !matchMedia(reduced).matches
      ? startTicker(track.current, strip)
      : undefined;
  }, []);

  const nameThumb = (name: string) => {
    if (thumb.current) {
      thumb.current.style.viewTransitionName = name;
      thumb.current.style.viewTransitionClass = name === "" ? "" : closing;
    }
  };

  const reveal = async (photo: Photo) => {
    flushSync(() => {
      setOpen(photo);
    });
    dialog.current?.showModal();
    await full.current?.decode().catch(() => null);
  };

  const show = (photo: Photo, event: MouseEvent<HTMLButtonElement>) => {
    thumb.current = event.currentTarget.querySelector("img");
    if (!canMorph()) {
      void reveal(photo);
      return;
    }
    nameThumb("photo");
    document.startViewTransition(async () => {
      nameThumb("");
      await reveal(photo);
    });
  };

  const hide = async () => {
    if (!canMorph()) {
      dialog.current?.close();
      return;
    }
    const transition = document.startViewTransition(() => {
      dialog.current?.close();
      nameThumb("photo");
    });
    await transition.finished;
    nameThumb("");
  };

  const tile = (photo: Photo, i: number) => {
    const ratio = photo.src.width / photo.src.height;
    return (
      <figure
        key={photo.caption}
        {...stylex.props(
          band
            ? shared.enter(`${250 + i * 70}ms`)
            : [styles.tile(ratio), shared.reveal]
        )}
      >
        <button
          aria-label={`${t("View larger")}: ${photo.caption}`}
          onClick={(event) => {
            show(photo, event);
          }}
          type="button"
          {...stylex.props(
            styles.button,
            shared.pressable,
            stylex.defaultMarker()
          )}
        >
          <Image
            alt={photo.caption}
            // Native image dragging would steal the ticker's drag.
            draggable={false}
            loading={i < eager ? "eager" : "lazy"}
            placeholder="blur"
            sizes={
              band
                ? `${Math.ceil(ratio * 352)}px`
                : `(max-width: 800px) ${ratio > 1 ? 100 : 50}vw, ${Math.ceil(ratio * 480)}px`
            }
            src={photo.src}
            {...stylex.props(styles.image, band && styles.bandImage)}
          />
        </button>
      </figure>
    );
  };

  const print = (photo: Photo, i: number) => (
    <figure
      key={photo.caption}
      {...stylex.props(
        styles.print(tilts[i % tilts.length] ?? 0),
        i === 0
          ? shared.enter("250ms")
          : styles.dealt(
              `${((i - 1) / photos.length) * 100}%`,
              `${(i / photos.length) * 100}%`
            )
      )}
    >
      <button
        aria-label={`${t("View larger")}: ${photo.caption}`}
        onClick={(event) => {
          show(photo, event);
        }}
        type="button"
        {...stylex.props(styles.button, styles.printButton, shared.pressable)}
      >
        <Image
          alt={photo.caption}
          loading={i === 0 ? "eager" : "lazy"}
          placeholder="blur"
          sizes="19rem"
          src={photo.src}
          {...stylex.props(styles.image, styles.printImage)}
        />
      </button>
      <figcaption {...stylex.props(styles.printCaption)}>
        {photo.caption}
      </figcaption>
    </figure>
  );

  return (
    <>
      {band ? (
        <>
          <div {...stylex.props(styles.strip)}>
            <div ref={track} {...stylex.props(styles.track)}>
              <div {...stylex.props(styles.group)}>{photos.map(tile)}</div>
              <div inert {...stylex.props(styles.group, styles.echo)}>
                {photos.map(tile)}
              </div>
            </div>
          </div>
          <div {...stylex.props(styles.deck, styles.deckHeight(photos.length))}>
            <div {...stylex.props(styles.stage)}>{photos.map(print)}</div>
          </div>
        </>
      ) : (
        <div {...stylex.props(styles.rows)}>{photos.map(tile)}</div>
      )}

      <dialog
        aria-label={t("Photo")}
        closedby="any"
        onCancel={(event) => {
          event.preventDefault();
          void hide();
        }}
        onClose={() => {
          setOpen(null);
        }}
        ref={dialog}
        {...stylex.props(styles.dialog)}
      >
        <button
          onClick={() => {
            void hide();
          }}
          type="button"
          {...stylex.props(styles.close, shared.pressable)}
        >
          {t("Close")}
        </button>
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
            <figcaption {...stylex.props(styles.fullCaption)}>
              {open.caption}
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
};
