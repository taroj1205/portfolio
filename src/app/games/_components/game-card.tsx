import * as stylex from "@stylexjs/stylex";
import Link from "next/link";
import type { ReactNode } from "react";

import { media } from "../../../styles/tokens.stylex";
import type { Lang, Text } from "../_lib/i18n";
import { glass } from "./glass";

const GOLD = "#ffd27a";

const styles = stylex.create({
  art: {
    aspectRatio: "16 / 10",
    overflow: "hidden",
    position: "relative",
  },
  artInner: {
    height: "100%",
    inset: 0,
    position: "absolute",
    transform: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "scale(1.05)",
      },
    },
    transitionDuration: "900ms",
    transitionProperty: "transform",
    transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    width: "100%",
  },
  blurb: {
    color: "rgb(255 255 255 / 0.86)",
    display: { default: null, [media.narrow]: "-webkit-box" },
    fontSize: { default: "0.9rem", [media.narrow]: "0.8rem" },
    lineHeight: 1.6,
    margin: 0,
    overflow: { default: null, [media.narrow]: "hidden" },
    WebkitBoxOrient: { default: null, [media.narrow]: "vertical" },
    WebkitLineClamp: { default: null, [media.narrow]: 3 },
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    minWidth: 0,
    padding: {
      default: "1.1rem 1rem",
      [media.narrow]: "0.95rem 0.75rem 0.9rem",
    },
    position: "relative",
  },
  card: {
    backdropFilter: "blur(14px)",
    backgroundColor: "rgb(13 16 26 / 0.7)",
    borderColor: {
      default: "rgb(255 255 255 / 0.12)",
      [media.hover]: { default: null, ":hover": "rgb(255 210 122 / 0.5)" },
    },
    borderRadius: 22,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 30px 80px rgb(0 0 0 / 0.45)",
      [media.hover]: {
        default: null,
        ":hover":
          "0 36px 90px rgb(0 0 0 / 0.55), 0 0 60px rgb(255 190 80 / 0.14)",
      },
    },
    color: "inherit",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gridTemplateRows: "auto 1fr",
    height: "100%",
    outlineColor: GOLD,
    outlineOffset: 4,
    overflow: "hidden",
    textDecoration: "none",
    transform: {
      default: null,
      [media.hover]: { default: null, ":hover": "translateY(-4px)" },
    },
    transitionDuration: "500ms",
    transitionProperty: "transform, box-shadow, border-color",
    transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
  },
  mode: {
    borderRadius: 999,
    color: "#fffaf3",
    fontSize: { default: "0.74rem", [media.narrow]: "0.68rem" },
    fontWeight: 600,
    insetBlockStart: { default: "0.7rem", [media.narrow]: "0.5rem" },
    insetInlineStart: { default: "0.7rem", [media.narrow]: "0.5rem" },
    letterSpacing: "0.04em",
    paddingBlock: { default: "0.28rem", [media.narrow]: "0.22rem" },
    paddingInline: { default: "0.75rem", [media.narrow]: "0.6rem" },
    position: "absolute",
  },
  play: {
    alignItems: "center",
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    boxShadow:
      "0 8px 22px rgb(255 190 80 / 0.35), inset 0 1px 0 rgb(255 255 255 / 0.6)",
    color: "#1c1406",
    display: "flex",
    fontSize: { default: "1.1rem", [media.narrow]: "0.95rem" },
    fontWeight: 700,
    height: { default: "2.25rem", [media.narrow]: "1.9rem" },
    insetBlockStart: { default: "-1.125rem", [media.narrow]: "-0.95rem" },
    insetInlineEnd: { default: "1rem", [media.narrow]: "0.75rem" },
    justifyContent: "center",
    position: "absolute",
    transform: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "translateX(3px) scale(1.08)",
      },
    },
    transitionDuration: "500ms",
    transitionProperty: "transform",
    transitionTimingFunction: "cubic-bezier(0.34, 1.3, 0.64, 1)",
    width: { default: "2.25rem", [media.narrow]: "1.9rem" },
  },
  scrim: {
    backgroundImage:
      "linear-gradient(180deg, rgb(8 10 20 / 0.4) 0%, transparent 32%, transparent 60%, rgb(13 16 26 / 0.8) 100%)",
    inset: 0,
    pointerEvents: "none",
    position: "absolute",
  },
  tag: {
    backgroundColor: "rgb(255 255 255 / 0.07)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(255 255 255 / 0.9)",
    fontSize: "0.74rem",
    paddingBlock: "0.2rem",
    paddingInline: "0.65rem",
  },
  tags: {
    display: { default: "flex", [media.narrow]: "none" },
    flexWrap: "wrap",
    gap: "0.35rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  title: {
    color: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "#fff1b8",
      },
    },
    fontFamily: "var(--font-mincho), serif",
    fontSize: "clamp(1.2rem, 4vw, 1.7rem)",
    fontWeight: 700,
    letterSpacing: "0.06em",
    lineHeight: 1.2,
    margin: 0,
    textShadow: "0 2px 24px rgb(255 190 120 / 0.25)",
    transitionDuration: "400ms",
    transitionProperty: "color",
  },
});

export interface Game {
  href: string;
  art: ReactNode;
  title: Text;
  blurb: Text;
  tags: [Text, ...Text[]];
}

export const GameCard = ({
  href,
  art,
  title,
  blurb,
  tags: [mode, ...tags],
  lang,
}: Game & { lang: Lang }) => (
  <Link href={href} prefetch={false} {...stylex.props(styles.card)}>
    <div {...stylex.props(styles.art)}>
      <div {...stylex.props(styles.artInner)}>{art}</div>
      <div {...stylex.props(styles.scrim)} />
      <span {...stylex.props(glass.surface, styles.mode)}>{mode[lang]}</span>
    </div>
    <div {...stylex.props(styles.body)}>
      <span aria-hidden="true" {...stylex.props(styles.play)}>
        →
      </span>
      <h2 {...stylex.props(styles.title)}>{title[lang]}</h2>
      <p {...stylex.props(styles.blurb)}>{blurb[lang]}</p>
      <ul {...stylex.props(styles.tags)}>
        {tags.map((tag) => (
          <li key={tag.en} {...stylex.props(styles.tag)}>
            {tag[lang]}
          </li>
        ))}
      </ul>
    </div>
  </Link>
);
