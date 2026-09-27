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

// Photos ease up to full size as they cross into the row and settle back
// as they leave, so the row reads as having depth without moving by itself.
const depth = stylex.keyframes({
  "entry 0%": { scale: 0.88 },
  "entry 100%": { scale: 1 },
  "exit 0%": { scale: 1 },
  "exit 100%": { scale: 0.88 },
});

const inset = "clamp(1rem, 4vw, 3rem)";
const gap = "clamp(0.5rem, 1vw, 0.875rem)";

const styles = stylex.create({
  bandImage: {
    height: "clamp(15rem, 30vw, 22rem)",
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
  band: {
    position: "relative",
  },
  bandTile: {
    flex: "none",
    scrollSnapAlign: "start",
  },
  depth: {
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": depth,
      },
    },
    animationTimeline: "view(inline)",
    animationTimingFunction: "linear",
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
  nudge: {
    alignItems: "center",
    backdropFilter: "blur(12px) saturate(1.6)",
    backgroundColor: {
      default: "rgb(250 247 242 / 0.72)",
      ":hover": "rgb(255 255 255 / 0.92)",
    },
    borderRadius: 999,
    borderWidth: 0,
    boxShadow:
      "inset 0 1px 0 rgb(255 255 255 / 0.9), 0 0 0 1px rgb(18 16 14 / 0.06), 0 10px 28px -10px rgb(18 16 14 / 0.35)",
    color: color.ink,
    cursor: "pointer",
    display: { default: "none", [media.hover]: "grid" },
    height: 48,
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    transitionDuration: "200ms",
    transitionProperty: "background-color, transform",
    transitionTimingFunction: ease.out,
    translate: "0 -50%",
    width: 48,
  },
  back: {
    left: size.gutter,
  },
  forward: {
    right: size.gutter,
  },
  strip: {
    display: "flex",
    gap,
    overflowX: "auto",
    overscrollBehaviorX: "contain",
    paddingBlock: "0.75rem",
    paddingInline: size.gutter,
    scrollPaddingInline: size.gutter,
    scrollSnapType: "x proximity",
    scrollbarWidth: "none",
  },
  tile: (ratio: number) => ({
    flexBasis: `calc(${ratio} * clamp(11rem, 25vw, 20rem))`,
    // Scaled up: a row whose grow values sum below 1 leaves space unused.
    flexGrow: ratio * 100,
    maxWidth: `calc(${ratio} * clamp(15rem, 40vw, 30rem))`,
    minWidth: 0,
  }),
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
  const strip = useRef<HTMLDivElement>(null);
  const t = getTranslator(locale);
  const [open, setOpen] = useState<Photo | null>(null);
  const band = variant === "band";

  const nudge = (direction: number) => {
    strip.current?.scrollBy({
      behavior: matchMedia(reduced).matches ? "auto" : "smooth",
      left: direction * strip.current.clientWidth * 0.8,
    });
  };

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
    // Never hold the page frozen on a slow download: after a moment the
    // morph runs on the blurred placeholder and the sharp photo fades in.
    const timeout = Promise.withResolvers<undefined>();
    setTimeout(timeout.resolve, 150);
    await Promise.race([
      full.current?.decode().catch(() => null),
      timeout.promise,
    ]);
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
            ? [shared.enter(`${250 + i * 70}ms`), styles.bandTile]
            : [styles.tile(ratio), shared.reveal]
        )}
      >
        <button
          aria-label={`${t("photos.viewLarger", "View larger")}: ${photo.caption}`}
          onClick={(event) => {
            show(photo, event);
          }}
          type="button"
          {...stylex.props(
            styles.button,
            shared.pressable,
            band && styles.depth,
            stylex.defaultMarker()
          )}
        >
          <Image
            alt={photo.caption}
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

  return (
    <>
      {band ? (
        <div {...stylex.props(styles.band)}>
          <div ref={strip} {...stylex.props(styles.strip)}>
            {photos.map(tile)}
          </div>
          {(
            [
              [
                -1,
                styles.back,
                t("photos.previous", "Previous photos"),
                "m15 5-7 7 7 7",
              ],
              [
                1,
                styles.forward,
                t("photos.next", "Next photos"),
                "m9 5 7 7-7 7",
              ],
            ] as const
          ).map(([direction, side, label, path]) => (
            <button
              aria-label={label}
              key={direction}
              onClick={() => {
                nudge(direction);
              }}
              type="button"
              {...stylex.props(styles.nudge, side, shared.pressable)}
            >
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
            </button>
          ))}
        </div>
      ) : (
        <div {...stylex.props(styles.rows)}>{photos.map(tile)}</div>
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
