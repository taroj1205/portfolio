"use client";

import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";

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
// Opening glides in on a drawer curve; closing is quicker.
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

const drift = stylex.keyframes({ to: { translate: "-50% 0" } });

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
  // The strip is doubled so it loops seamlessly; reduced motion shows one copy.
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
  // Justified rows: every photo in a row shares one height and none is
  // cropped. Rows stop growing at a height cap (smaller on phones) and centre.
  rows: {
    alignItems: "start",
    display: "flex",
    flexWrap: "wrap",
    gap,
    justifyContent: "center",
  },
  // The hero strip drifts by itself, so every photo passes without a swipe.
  // Reduced motion gets a still strip you can scroll instead.
  strip: {
    maskImage: `linear-gradient(90deg, transparent, #000 ${size.gutter}, #000 calc(100% - ${size.gutter}), transparent)`,
    overflowX: { default: "clip", [media.reduce]: "auto" },
    scrollbarWidth: "none",
  },
  tile: (ratio: number) => ({
    flexBasis: `calc(${ratio} * clamp(11rem, 25vw, 20rem))`,
    // Scaled up: a row whose grow values sum below 1 leaves space unused.
    flexGrow: ratio * 100,
    maxWidth: `calc(${ratio} * clamp(15rem, 40vw, 30rem))`,
    minWidth: 0,
  }),
  track: {
    animationDuration: "80s",
    animationIterationCount: "infinite",
    animationName: { default: null, [media.motion]: drift },
    animationPlayState: {
      default: "running",
      ":focus-within": "paused",
      ":hover": "paused",
    },
    animationTimingFunction: "linear",
    display: "flex",
    paddingInline: { default: null, [media.reduce]: size.gutter },
    width: "max-content",
  },
});

const canMorph = () =>
  "startViewTransition" in document &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

// The tapped thumbnail morphs into the full photo (View Transitions), and back
// again on close. Without View Transitions the dialog simply opens.
export const Photos = ({
  variant,
  photos,
  eager = 0,
}: {
  variant: "band" | "gallery";
  photos: Photo[];
  eager?: number;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const full = useRef<HTMLImageElement>(null);
  const thumb = useRef<HTMLImageElement | null>(null);
  const [open, setOpen] = useState<Photo | null>(null);
  const band = variant === "band";

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
    // Wait for the full photo so the morph doesn't land on an empty frame.
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
          aria-label={`View larger: ${photo.caption}`}
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
        <div {...stylex.props(styles.strip)}>
          <div {...stylex.props(styles.track)}>
            <div {...stylex.props(styles.group)}>{photos.map(tile)}</div>
            <div inert {...stylex.props(styles.group, styles.echo)}>
              {photos.map(tile)}
            </div>
          </div>
        </div>
      ) : (
        <div {...stylex.props(styles.rows)}>{photos.map(tile)}</div>
      )}

      {/* closedby="any": Escape and clicks on the backdrop both close it. */}
      <dialog
        aria-label="Photo"
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
          Close
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
