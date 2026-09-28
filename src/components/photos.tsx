"use client";

import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";

import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { shared } from "@/styles/shared";

import {
  color,
  ease,
  font,
  media,
  shadow,
  size,
} from "../styles/tokens.stylex";

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
    boxShadow:
      "0 1px 2px rgb(18 16 14 / 0.12), 0 22px 44px -22px rgb(18 16 14 / 0.5)",
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
    boxShadow: {
      default: null,
      ":hover": { default: null, [media.hover]: shadow.lift },
    },
    scale: {
      default: null,
      ":hover": { default: null, [media.hover]: 1.05 },
    },
    transitionDuration: "450ms",
    transitionProperty: "scale, translate, box-shadow, transform",
    transitionTimingFunction: ease.spring,
    translate: {
      default: null,
      ":hover": { default: null, [media.hover]: "0 -0.5rem" },
    },
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
    animationName: { default: null, [media.motion]: quick },
    color: color.line,
    fontFamily: font.display,
    fontSize: "clamp(5rem, 13vw, 11rem)",
    fontVariantNumeric: "tabular-nums",
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
    maxHeight: {
      default: "calc(100dvh - 8rem)",
      [media.tablet]: "calc(100dvh - 12rem)",
    },
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
    display: "flex",
    fontSize: "0.9375rem",
    gap: "0.75rem",
    opacity: 0.8,
  },
  count: {
    fontVariantNumeric: "tabular-nums",
    opacity: 0.6,
  },
  // The global reset makes every img a block, which beats `hidden`.
  preload: {
    display: "none",
  },
  turn: {
    alignItems: "center",
    backgroundColor: {
      default: "rgb(255 255 255 / 0.14)",
      ":hover": "rgb(255 255 255 / 0.26)",
    },
    borderRadius: 999,
    borderWidth: 0,
    bottom: { default: null, [media.tablet]: "1.25rem" },
    color: "#fff",
    cursor: "pointer",
    display: "grid",
    height: 48,
    justifyContent: "center",
    outlineColor: { default: null, ":focus-visible": "#fff" },
    position: "fixed",
    top: { default: "50%", [media.tablet]: "auto" },
    transitionDuration: "200ms",
    transitionProperty: "background-color, transform",
    transitionTimingFunction: ease.out,
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
  const list = useRef<HTMLDivElement>(null);
  const swipe = useRef(0);
  const t = getTranslator(locale);
  const [open, setOpen] = useState<Photo | null>(null);

  const nameThumb = (name: string) => {
    if (thumb.current) {
      thumb.current.style.viewTransitionName = name;
      thumb.current.style.viewTransitionClass = name === "" ? "" : closing;
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
    if (!open) {
      return;
    }
    const next = neighbour(open, direction);
    if (next === undefined) {
      return;
    }
    // Closing morphs back into this photo only if it is on screen.
    thumb.current =
      [...(list.current?.querySelectorAll("img") ?? [])].find((img) => {
        const box = img.getBoundingClientRect();
        return (
          img.alt === next.caption &&
          box.right > 0 &&
          box.left < innerWidth &&
          box.bottom > 0 &&
          box.top < innerHeight
        );
      }) ?? null;
    const swap = async () => {
      flushSync(() => {
        setOpen(next);
      });
      await ready();
    };
    if (canMorph()) {
      document.startViewTransition(swap);
    } else {
      void swap();
    }
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
      data-tilt
      type="button"
      {...stylex.props(styles.open, shared.tilt, frame)}
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
                {...stylex.props(
                  shared.scrub,
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
        closedby="any"
        onCancel={(event) => {
          event.preventDefault();
          void hide();
        }}
        onClose={() => {
          setOpen(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            step(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onPointerDown={(event) => {
          swipe.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const distance = event.clientX - swipe.current;
          if (event.pointerType !== "mouse" && Math.abs(distance) > 60) {
            step(distance < 0 ? 1 : -1);
          }
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
              styles.turn,
              direction < 0 ? styles.turnBack : styles.turnForward,
              shared.pressable
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
