"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";

import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { socials } from "@/lib/socials";

import { color, font, media, shadow, size } from "../styles/tokens.stylex";

const styles = stylex.create({
  nav: {
    alignItems: "center",
    backgroundImage: {
      default: `linear-gradient(${color.paper} 70%, transparent)`,
      [media.tablet]: "none",
    },
    bottom: { default: "auto", [media.tablet]: 0 },
    display: "flex",
    height: { default: 86, [media.tablet]: "auto" },
    justifyContent: "flex-end",
    left: 0,
    paddingInline: { default: size.gutter, [media.tablet]: 12 },
    pointerEvents: "none",
    position: "fixed",
    right: 0,
    top: { default: 0, [media.tablet]: "auto" },
    transitionDuration: "180ms",
    transitionProperty: "opacity, visibility",
    zIndex: 40,
  },
  hidden: {
    opacity: 0,
    visibility: "hidden",
  },
  links: {
    alignItems: { default: "center", [media.tablet]: "flex-end" },
    display: "flex",
    gap: { default: 30, [media.tablet]: 3 },
    paddingBottom: { default: 10, [media.tablet]: 0 },
    pointerEvents: "auto",
    position: "relative",
    width: { default: "auto", [media.tablet]: "100%" },
    "::after": {
      borderBottomColor: color.cobalt,
      borderBottomStyle: "solid",
      borderBottomWidth: 1.5,
      borderRadius: "0 0 50% 24%",
      bottom: 0,
      content: '""',
      display: { default: "block", [media.tablet]: "none" },
      height: 8,
      left: 1,
      pointerEvents: "none",
      position: "absolute",
      right: 0,
      rotate: "-0.8deg",
    },
  },
  link: {
    alignItems: "center",
    backgroundColor: { default: "transparent", [media.tablet]: color.surface },
    boxShadow: { default: "none", [media.tablet]: shadow.soft },
    clipPath: {
      default: "none",
      [media.tablet]:
        "polygon(0 4px, 8% 2px, 17% 4px, 25% 1px, 33% 3px, 42% 0, 50% 3px, 58% 1px, 67% 4px, 75% 1px, 83% 3px, 92% 1px, 100% 3px, 100% 100%, 0 100%)",
    },
    color: {
      default: color.ink,
      ":focus-visible": color.cobalt,
      [media.hover]: { default: null, ":hover": color.cobalt },
    },
    display: "flex",
    flex: { default: "0 1 auto", [media.tablet]: "1 1 0" },
    fontFamily: font.display,
    fontSize: { default: 16, [media.tablet]: "clamp(14px, 4vw, 16px)" },
    fontWeight: 600,
    height: {
      default: 44,
      [media.tablet]: "calc(60px + env(safe-area-inset-bottom))",
    },
    justifyContent: "center",
    letterSpacing: "-0.3px",
    minWidth: 0,
    outlineOffset: { default: 3, [media.tablet]: -5 },
    paddingBottom: {
      default: 0,
      [media.tablet]: "env(safe-area-inset-bottom)",
    },
    paddingInline: { default: 0, [media.tablet]: 2 },
    paddingTop: { default: 0, [media.tablet]: 8 },
    position: "relative",
    textDecoration: "none",
    transitionDuration: "150ms",
    transitionProperty: "color",
    "::after": {
      borderTopColor: color.line,
      borderTopStyle: "dashed",
      borderTopWidth: 1,
      content: '""',
      display: { default: "none", [media.tablet]: "block" },
      left: 8,
      pointerEvents: "none",
      position: "absolute",
      right: 8,
      top: 11,
    },
    ":nth-child(2)": {
      height: {
        default: null,
        [media.tablet]: "calc(68px + env(safe-area-inset-bottom))",
      },
    },
    ":nth-child(3)": {
      height: {
        default: null,
        [media.tablet]: "calc(56px + env(safe-area-inset-bottom))",
      },
    },
    ":nth-child(4)": {
      height: {
        default: null,
        [media.tablet]: "calc(64px + env(safe-area-inset-bottom))",
      },
    },
  },
});

export const ContactLinks = ({ locale }: { locale: Locale }) => {
  const t = getTranslator(locale);
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const contact = document.querySelector("#contact");
    const observer = new IntersectionObserver(([entry]) => {
      setContactVisible(entry.isIntersecting);
    });
    if (contact) {
      observer.observe(contact);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <nav
      aria-label={t("Social links")}
      inert={contactVisible}
      {...stylex.props(styles.nav, contactVisible && styles.hidden)}
    >
      <div {...stylex.props(styles.links)}>
        {socials.map(([label, href]) => (
          <a href={href} key={label} {...stylex.props(styles.link)}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
};
