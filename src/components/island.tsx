"use client";

import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import selfie from "@/assets/photos/sakura-selfie.webp";
import { Clock } from "@/components/clock";
import { Arrow } from "@/components/icons";
import { socials } from "@/lib/socials";
import { shared } from "@/styles/shared";

import { color, ease, font, media } from "../styles/tokens.stylex";

// Open when tapped, or reached by keyboard. Pointers get :hover on top.
// :focus-visible, not :focus-within, so a tap on Android can still close it.
const open = ":is([data-open], :has(:focus-visible))";

const grow = { duration: "560ms", easing: ease.spring } as const;

const bloom = stylex.keyframes({
  from: { scale: "0.92 1.1", width: "3.25rem" },
});
// A real spring (bounce ≈ 0.3), sampled into linear().
const liquid =
  "linear(0, 0.063, 0.226 5.2%, 0.446 8.2%, 0.831 13.8%, 0.974 16.8%, 1.075 19.8%, 1.13 22.6%, 1.149 25.2%, 1.136 28.2%, 1.1 31.5%, 0.998 40.1%, 0.98 44%, 0.973 48.4%, 0.985 58.2%, 1.001 70.2%, 1.004 78.7%, 1)";

const styles = stylex.create({
  island: {
    backdropFilter: "blur(7px) saturate(1.8) brightness(1.04)",
    backgroundColor: "rgb(255 255 255 / 0.3)",
    borderRadius: {
      default: 26,
      [open]: 30,
      [media.hover]: { default: null, ":hover": 30 },
    },
    boxShadow: {
      default:
        "inset 0 0 22px rgb(255 255 255 / 0.4), 0 10px 30px rgb(18 16 14 / 0.12), 0 1px 3px rgb(18 16 14 / 0.08)",
      [open]:
        "inset 0 0 22px rgb(255 255 255 / 0.4), 0 24px 60px rgb(18 16 14 / 0.2), 0 2px 6px rgb(18 16 14 / 0.08)",
      [media.hover]: {
        default: null,
        ":hover":
          "inset 0 0 22px rgb(255 255 255 / 0.4), 0 24px 60px rgb(18 16 14 / 0.2), 0 2px 6px rgb(18 16 14 / 0.08)",
      },
    },
    left: 0,
    marginInline: "auto",
    overflow: "clip",
    position: "fixed",
    right: 0,
    top: "0.75rem",
    transitionDuration: {
      default: "320ms",
      [open]: grow.duration,
      [media.hover]: { default: null, ":hover": grow.duration },
    },
    transitionProperty: "width, border-radius, box-shadow, opacity",
    transitionTimingFunction: {
      default: ease.out,
      [open]: grow.easing,
      [media.hover]: { default: null, ":hover": grow.easing },
    },
    width: {
      default: "min(16.5rem, 100vw - 1.5rem)",
      [open]: "min(24rem, 100vw - 1.5rem)",
      [media.hover]: { default: null, ":hover": "min(24rem, 100vw - 1.5rem)" },
    },
    zIndex: 50,
    "::before": {
      backgroundImage:
        "linear-gradient(165deg, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.2) 35%, rgb(255 255 255 / 0.05) 65%, rgb(255 255 255 / 0.7))",
      borderRadius: "inherit",
      content: '""',
      inset: 0,
      mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
      padding: 1,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  docked: {
    animationDuration: "800ms",
    animationFillMode: "backwards",
    animationName: { default: null, [media.motion]: bloom },
    animationTimingFunction: liquid,
  },
  undocked: {
    opacity: 0,
    pointerEvents: "none",
    width: "3.25rem",
  },
  face: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    color: color.ink,
    cursor: "pointer",
    display: "flex",
    gap: "0.6rem",
    height: "3.25rem",
    paddingBlock: 0,
    paddingInline: "0.4rem 1.1rem",
    textAlign: "start",
    width: "100%",
  },
  avatar: {
    borderRadius: "50%",
    flexShrink: 0,
    height: "2.45rem",
    objectFit: "cover",
    objectPosition: "50% 30%",
    width: "2.45rem",
  },
  name: {
    flexGrow: 1,
    fontFamily: font.display,
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap",
  },
  time: {
    color: color.muted,
    fontSize: "0.85rem",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  panel: {
    display: "grid",
    gridTemplateRows: {
      default: "0fr",
      [stylex.when.ancestor(open)]: "1fr",
      [stylex.when.ancestor(":hover")]: { default: null, [media.hover]: "1fr" },
    },
    transitionDuration: {
      default: "320ms",
      [stylex.when.ancestor(open)]: grow.duration,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: grow.duration,
      },
    },
    transitionProperty: "grid-template-rows",
    transitionTimingFunction: {
      default: ease.out,
      [stylex.when.ancestor(open)]: grow.easing,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: grow.easing,
      },
    },
  },
  clip: {
    minHeight: 0,
    overflow: "hidden",
  },
  content: {
    filter: {
      default: "blur(6px)",
      [stylex.when.ancestor(open)]: "blur(0)",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "blur(0)",
      },
    },
    opacity: {
      default: 0,
      [stylex.when.ancestor(open)]: 1,
      [stylex.when.ancestor(":hover")]: { default: null, [media.hover]: 1 },
    },
    paddingBlock: "0.15rem 0.45rem",
    paddingInline: "0.45rem",
    scale: {
      default: 0.96,
      [stylex.when.ancestor(open)]: 1,
      [stylex.when.ancestor(":hover")]: { default: null, [media.hover]: 1 },
    },
    transformOrigin: "50% 0",
    transitionDelay: {
      default: "0ms",
      [stylex.when.ancestor(open)]: "90ms",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "90ms",
      },
    },
    transitionDuration: "180ms, 180ms, 300ms, 180ms",
    transitionProperty: "opacity, filter, scale, visibility",
    transitionTimingFunction: ease.out,
    visibility: {
      default: "hidden",
      [stylex.when.ancestor(open)]: "visible",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "visible",
      },
    },
  },
  label: {
    paddingBlock: "0.2rem 0.5rem",
    paddingInline: "0.6rem",
  },
  links: {
    display: "grid",
    gap: "0.4rem",
    gridTemplateColumns: "1fr 1fr",
  },
  link: {
    backgroundColor: {
      default: "rgb(255 255 255 / 0.6)",
      [media.hover]: { default: null, ":hover": "#fff" },
    },
    borderRadius: 22,
    boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.9)",
    color: color.ink,
    display: "grid",
    paddingBlock: "0.7rem",
    paddingInline: "0.9rem",
    textDecoration: "none",
    transitionDuration: "160ms",
    transitionProperty: "transform, background-color",
  },
  linkName: {
    alignItems: "center",
    display: "flex",
    fontFamily: font.display,
    fontSize: "1.05rem",
    fontWeight: 700,
    justifyContent: "space-between",
    letterSpacing: "-0.02em",
  },
  handle: {
    color: color.muted,
    fontSize: "0.8rem",
  },
});

const mix = (from: number, to: number, t: number) => from + (to - from) * t;

const follow = (
  photo: HTMLElement | null,
  avatar: HTMLElement | null | undefined,
  dock: (docked: boolean) => void
) => {
  const controller = new AbortController();
  const { signal } = controller;
  if (
    !photo ||
    !avatar ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    dock(true);
    return () => {
      controller.abort();
    };
  }
  const reset = () => {
    for (const property of [
      "transform",
      "clip-path",
      "rotate",
      "transition",
      "visibility",
    ]) {
      photo.style.removeProperty(property);
    }
  };
  let frame = 0;

  const update = () => {
    frame = 0;
    // The figure never moves with the photo, so it's the resting position.
    const box = (photo.parentElement ?? photo).getBoundingClientRect();
    const section = photo.closest("section")?.getBoundingClientRect() ?? box;
    const target = avatar.getBoundingClientRect();
    const toX = document.documentElement.clientWidth / 2;
    const toY = target.top + target.height / 2;
    const t = Math.min(
      1,
      Math.max(0, (innerHeight * 0.55 - section.bottom) / (innerHeight * 0.35))
    );
    dock(t === 1);
    if (t === 0) {
      reset();
      return;
    }
    const border = 8;
    const square = box.width - 2 * border;
    const extra = box.height - box.width;
    const top = border + extra * 0.3;
    const bottom = border + extra * 0.7;
    const scale = (avatar.offsetWidth / square) ** t;
    const radius = mix(20, square / 2, t);
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const fromY = Math.max(y, (-box.height * scale) / 2);
    // The cropped part's centre sits off the photo's centre once scaled.
    const lift = ((top - bottom) * t * scale) / 2;
    photo.style.clipPath = `inset(${top * t}px ${border * t}px ${bottom * t}px round ${radius}px)`;
    photo.style.transform = `translate(${mix(x, toX, t) - x}px, ${mix(fromY, toY, t) - y - lift}px) scale(${scale})`;
    photo.style.rotate = `${mix(-2.5, 0, t)}deg`;
    photo.style.transition = "none";
    photo.style.visibility = t === 1 ? "hidden" : "";
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };

  addEventListener("scroll", schedule, { passive: true, signal });
  addEventListener("resize", schedule, { signal });
  update();
  return () => {
    controller.abort();
    cancelAnimationFrame(frame);
    reset();
  };
};

export const Island = () => {
  const [expanded, setExpanded] = useState(false);
  const [docked, setDocked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      follow(
        document.querySelector<HTMLElement>("#me img"),
        ref.current?.querySelector<HTMLElement>("img"),
        setDocked
      ),
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const close = () => {
      setExpanded(false);
    };
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.target instanceof Node &&
          ref.current?.contains(event.target) !== true
        ) {
          close();
        }
      },
      { signal }
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          close();
        }
      },
      { signal }
    );
    addEventListener("scroll", close, { passive: true, signal });
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div
      data-open={expanded || undefined}
      inert={!docked}
      ref={ref}
      {...stylex.props(
        styles.island,
        docked ? styles.docked : styles.undocked,
        stylex.defaultMarker()
      )}
    >
      <button
        aria-controls="island-links"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(!expanded);
        }}
        type="button"
        {...stylex.props(styles.face)}
      >
        <Image
          alt=""
          placeholder="blur"
          sizes="40px"
          src={selfie}
          {...stylex.props(styles.avatar)}
        />
        <span {...stylex.props(styles.name)}>Shintaro Jokagi</span>
        <span {...stylex.props(styles.time)}>
          <Clock />
        </span>
      </button>
      <div id="island-links" {...stylex.props(styles.panel)}>
        <div {...stylex.props(styles.clip)}>
          <div {...stylex.props(styles.content)}>
            <p {...stylex.props(shared.cardLabel, styles.label)}>Find me on</p>
            <ul {...stylex.props(styles.links)}>
              {socials.map(([label, href, handle]) => (
                <li key={label}>
                  <a
                    href={href}
                    {...stylex.props(
                      styles.link,
                      shared.pressable,
                      stylex.defaultMarker()
                    )}
                  >
                    <span {...stylex.props(styles.linkName)}>
                      {label} <Arrow />
                    </span>
                    <span {...stylex.props(styles.handle)}>@{handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
