"use client";

import * as stylex from "@stylexjs/stylex";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { split } from "@/components/liquid";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { socials } from "@/lib/socials";

import { color, ease, font, media } from "../styles/tokens.stylex";

const sections = ["about", "work", "projects", "photos", "contact"] as const;

const icons = {
  GitHub:
    "M12 .3a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58l-.02-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22l-.02 3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .3",
  Instagram:
    "M7 1h10a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6ZM7 3a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4ZM12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.75 4.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  LinkedIn:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  X: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3Z",
} as const;

const lensMap = (width: number, height: number) => {
  const radius = height / 2;
  const edge = Math.round(height * 0.2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="${width}" height="${height}" fill="black"/><rect width="${width}" height="${height}" rx="${radius}" fill="url(#r)"/><rect width="${width}" height="${height}" rx="${radius}" fill="url(#b)" style="mix-blend-mode:difference"/><rect x="${edge}" y="${edge}" width="${width - edge * 2}" height="${height - edge * 2}" rx="${radius - edge}" fill="hsl(0 0% 50%)" style="filter:blur(${edge * 0.6}px)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const drop = stylex.keyframes({
  from: { opacity: 0, scale: 0.9, translate: "0 calc(-100% - 1rem)" },
});
const lift = stylex.keyframes({
  from: { opacity: 0, scale: 0.9, translate: "0 calc(100% + 1rem)" },
});

const styles = stylex.create({
  bar: {
    bottom: {
      default: "auto",
      [media.tablet]: "calc(0.75rem + env(safe-area-inset-bottom))",
    },
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    left: 0,
    paddingInline: "0.75rem",
    pointerEvents: "none",
    position: "fixed",
    right: 0,
    top: { default: "1rem", [media.tablet]: "auto" },
    zIndex: 40,
  },
  pill: {
    alignItems: "center",
    animationDelay: "500ms",
    animationDuration: "800ms",
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: { default: drop, [media.tablet]: lift },
    },
    animationTimingFunction: ease.drawer,
    backdropFilter: "blur(14px) saturate(1.8)",
    backgroundColor: {
      default: "rgb(250 247 242 / 0.62)",
      "@media (prefers-reduced-transparency: reduce)": color.paper,
    },
    borderRadius: 999,
    boxShadow: [
      "inset 0 1px 0 rgb(255 255 255 / 0.85)",
      "inset 1px 0 0 rgb(255 255 255 / 0.4)",
      "inset 0 -1px 0 rgb(255 255 255 / 0.3)",
      "inset 0 0 18px rgb(255 255 255 / 0.35)",
      "0 0 0 1px rgb(18 16 14 / 0.06)",
      "0 12px 32px -12px rgb(18 16 14 / 0.3)",
      "0 2px 6px rgb(18 16 14 / 0.06)",
    ].join(", "),
    display: "flex",
    gap: 2,
    isolation: "isolate",
    maxWidth: "100%",
    padding: 5,
    pointerEvents: "auto",
    position: "relative",
  },
  sections: {
    width: { default: "auto", [media.tablet]: "min(100%, 26rem)" },
  },
  socials: {
    animationDelay: "620ms",
    animationName: { default: null, [media.motion]: drop },
    position: { default: "relative", [media.tablet]: "fixed" },
    right: { default: null, [media.tablet]: "0.75rem" },
    top: {
      default: null,
      [media.tablet]: "calc(0.75rem + env(safe-area-inset-top))",
    },
  },
  languages: {
    animationDelay: "620ms",
    animationName: { default: null, [media.motion]: drop },
    left: { default: null, [media.tablet]: "0.75rem" },
    position: { default: "relative", [media.tablet]: "fixed" },
    top: {
      default: null,
      [media.tablet]: "calc(0.75rem + env(safe-area-inset-top))",
    },
  },
  language: {
    flex: "0 0 auto",
    height: { default: 40, [media.tablet]: 36 },
    paddingInline: "0.875rem",
  },
  chip: {
    backgroundColor: "rgb(255 255 255 / 0.7)",
    boxShadow:
      "inset 0 1px 0 #fff, inset 0 -1px 2px rgb(18 16 14 / 0.06), 0 1px 2px rgb(18 16 14 / 0.08), 0 6px 16px -6px rgb(43 76 255 / 0.35)",
  },
  liquid: {
    backgroundColor: {
      default: "rgb(250 247 242 / 0.34)",
      "@media (prefers-reduced-transparency: reduce)": color.paper,
    },
  },
  lens: (id: string) => ({
    backdropFilter: `url(#${id}) saturate(1.7) brightness(1.06)`,
  }),
  link: {
    alignItems: "center",
    borderRadius: 999,
    color: {
      default: color.muted,
      [media.hover]: { default: null, ":hover": color.ink },
    },
    display: "flex",
    flex: { default: "0 0 auto", [media.tablet]: "1 1 0" },
    fontFamily: font.display,
    fontSize: { default: 15, [media.narrow]: 14 },
    fontWeight: 600,
    height: { default: 40, [media.tablet]: 46 },
    justifyContent: "center",
    letterSpacing: "-0.01em",
    minWidth: 0,
    outlineOffset: -2,
    paddingInline: { default: "1rem", [media.tablet]: "0.25rem" },
    position: "relative",
    textDecoration: "none",
    textShadow: "0 0 10px rgb(250 247 242 / 0.9)",
    transitionDuration: "200ms",
    transitionProperty: "color",
    whiteSpace: "nowrap",
    zIndex: 1,
  },
  icon: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      [media.hover]: { default: null, ":hover": "rgb(255 255 255 / 0.6)" },
    },
    borderRadius: 999,
    color: {
      default: color.muted,
      [media.hover]: { default: null, ":hover": color.ink },
    },
    display: "grid",
    height: { default: 40, [media.tablet]: 36 },
    justifyItems: "center",
    outlineOffset: -2,
    transitionDuration: "200ms",
    transitionProperty: "color, background-color",
    width: { default: 40, [media.tablet]: 36 },
  },
  current: {
    color: color.ink,
  },
  blob: {
    backgroundColor: "rgb(255 255 255 / 0.7)",
    borderRadius: 999,
    bottom: 5,
    boxShadow:
      "inset 0 1px 0 #fff, inset 0 -1px 2px rgb(18 16 14 / 0.06), 0 1px 2px rgb(18 16 14 / 0.08), 0 6px 16px -6px rgb(43 76 255 / 0.35)",
    left: 5,
    opacity: 0,
    pointerEvents: "none",
    position: "absolute",
    right: "100%",
    scale: 0.85,
    top: 5,
    transitionDuration: "520ms, 520ms, 240ms, 520ms",
    transitionProperty: "left, right, opacity, scale",
    transitionTimingFunction: ease.spring,
  },
  shown: {
    opacity: 1,
    scale: 1,
  },
  defs: {
    height: 0,
    position: "absolute",
    width: 0,
  },
});

export const SiteNav = ({ locale }: { locale: Locale }) => {
  const t = getTranslator(locale);
  const labels = {
    about: t("navigation.about", "About"),
    contact: t("navigation.contact", "Say hi"),
    photos: t("navigation.photos", "Photos"),
    projects: t("navigation.projects", "Made"),
    work: t("navigation.work", "Work"),
  };
  const pills = useRef<(HTMLElement | null)[]>([]);
  const blob = useRef<HTMLSpanElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const previous = useRef(-1);
  const [active, setActive] = useState(-1);
  const [glass, setGlass] = useState<{
    liquid: boolean;
    sizes: { height: number; width: number }[];
  } | null>(null);

  useEffect(() => {
    const targets = sections.map((id) => document.querySelector(`#${id}`));
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const atEnd = root.scrollTop + innerHeight >= root.scrollHeight - 2;
      setActive(
        atEnd
          ? sections.length - 1
          : targets.findLastIndex(
              (target) =>
                target !== null &&
                target.getBoundingClientRect().top <= innerHeight * 0.4
            )
      );
    };
    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };
    schedule();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);

    const observer = new ResizeObserver(() => {
      setGlass({
        liquid: "userAgentData" in navigator,
        sizes: pills.current.map((el) => ({
          height: el?.offsetHeight ?? 0,
          width: el?.offsetWidth ?? 0,
        })),
      });
    });
    for (const el of pills.current) {
      if (el) {
        observer.observe(el);
      }
    }
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const link = links.current[active];
    const el = blob.current;
    const size = glass?.sizes[0];
    if (!el || !link || !size) {
      return;
    }
    const forward = active > previous.current;
    el.style.transitionProperty =
      previous.current === -1 ? "opacity, scale" : "";
    el.style.transitionDelay = forward ? "90ms, 0ms" : "0ms, 90ms";
    el.style.left = `${link.offsetLeft}px`;
    el.style.right = `${size.width - link.offsetLeft - link.offsetWidth}px`;
    previous.current = active;
  }, [active, glass]);

  const liquid = glass?.liquid === true;

  return (
    <div {...stylex.props(styles.bar)}>
      <nav
        aria-label="Language / 言語"
        ref={(node) => {
          pills.current[2] = node;
        }}
        {...stylex.props(
          styles.pill,
          styles.languages,
          liquid && styles.liquid,
          liquid && styles.lens("nav-lens-2")
        )}
      >
        {(
          [
            ["en", "/", "English"],
            ["ja", "/ja", "日本語"],
          ] as const
        ).map(([code, href, label]) => (
          <Link
            aria-current={locale === code ? "page" : undefined}
            href={href}
            hrefLang={code}
            key={code}
            lang={code}
            scroll={false}
            {...stylex.props(
              styles.link,
              styles.language,
              locale === code && [styles.current, styles.chip]
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <nav
        aria-label={t("navigation.sections", "Sections")}
        ref={(node) => {
          pills.current[0] = node;
        }}
        {...stylex.props(
          styles.pill,
          styles.sections,
          liquid && styles.liquid,
          liquid && styles.lens("nav-lens-0")
        )}
      >
        <span
          aria-hidden="true"
          ref={blob}
          {...stylex.props(styles.blob, active !== -1 && styles.shown)}
        />
        {sections.map((id, i) => (
          <a
            aria-current={active === i ? "location" : undefined}
            href={`#${id}`}
            key={id}
            ref={(node) => {
              links.current[i] = node;
            }}
            {...stylex.props(styles.link, active === i && styles.current)}
          >
            {labels[id]}
          </a>
        ))}
      </nav>
      <nav
        aria-label={t("navigation.socials", "Social links")}
        ref={(node) => {
          pills.current[1] = node;
        }}
        {...stylex.props(
          styles.pill,
          styles.socials,
          liquid && styles.liquid,
          liquid && styles.lens("nav-lens-1")
        )}
      >
        {socials.map(([label, href]) => (
          <a
            aria-label={label}
            href={href}
            key={label}
            title={label}
            {...stylex.props(styles.icon)}
          >
            <svg
              aria-hidden="true"
              fill="currentColor"
              height="18"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d={icons[label]} fillRule="evenodd" />
            </svg>
          </a>
        ))}
      </nav>
      {glass && liquid && (
        <svg aria-hidden="true" {...stylex.props(styles.defs)}>
          {glass.sizes.map((size, n) => (
            <filter
              colorInterpolationFilters="sRGB"
              id={`nav-lens-${n}`}
              key={n}
            >
              <feImage
                height={size.height}
                href={lensMap(size.width, size.height)}
                preserveAspectRatio="none"
                result="map"
                width={size.width}
                x="0"
                y="0"
              />
              {split("map", "B", 1)}
            </filter>
          ))}
        </svg>
      )}
    </div>
  );
};
