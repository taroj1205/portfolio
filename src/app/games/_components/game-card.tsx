import * as stylex from "@stylexjs/stylex";
import Link from "next/link";
import type { ReactNode } from "react";

import { media } from "../../../styles/tokens.stylex";
import type { Lang, Text } from "../_lib/i18n";

const GOLD = "#ffd27a";

const styles = stylex.create({
  art: {
    aspectRatio: { default: null, [media.stack]: "16 / 10" },
    overflow: "hidden",
    position: "relative",
  },
  artInner: {
    height: "100%",
    inset: 0,
    position: "absolute",
    transform: {
      default: null,
      [media.hover]: { default: null, ":hover": "scale(1.04)" },
    },
    transitionDuration: "900ms",
    transitionProperty: "transform",
    transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    width: "100%",
  },
  blurb: {
    color: "rgb(255 255 255 / 0.86)",
    fontSize: {
      default: "1.02rem",
      [media.stack]: "0.9rem",
      [media.narrow]: "0.8rem",
    },
    lineHeight: { default: 1.7, [media.stack]: 1.6 },
    margin: 0,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: { default: "1.15rem", [media.stack]: "0.55rem" },
    justifyContent: { default: "center", [media.stack]: "flex-start" },
    minWidth: 0,
    padding: {
      default: "2.25rem",
      [media.stack]: "0.9rem 1rem 1.1rem",
      [media.narrow]: "0.7rem 0.75rem 0.9rem",
    },
  },
  card: {
    backdropFilter: "blur(14px)",
    backgroundColor: "rgb(13 16 26 / 0.7)",
    borderColor: {
      default: "rgb(255 255 255 / 0.12)",
      [media.hover]: { default: null, ":hover": "rgb(255 210 122 / 0.5)" },
    },
    borderRadius: { default: 28, [media.stack]: 22 },
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 30px 80px rgb(0 0 0 / 0.45)",
      [media.hover]: {
        default: null,
        ":hover":
          "0 36px 90px rgb(0 0 0 / 0.55), 0 0 60px rgb(255 190 80 / 0.12)",
      },
    },
    color: "inherit",
    display: "grid",
    gridTemplateColumns: {
      default: "1.15fr 1fr",
      [media.stack]: "minmax(0, 1fr)",
    },
    gridTemplateRows: { default: null, [media.stack]: "auto 1fr" },
    height: { default: null, [media.stack]: "100%" },
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
  cta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
    display: { default: "inline-flex", [media.stack]: "none" },
    fontFamily: "var(--font-mincho), serif",
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.6rem",
    letterSpacing: "0.12em",
    minHeight: "3rem",
    paddingInline: "1.5rem",
  },
  tag: {
    backgroundColor: "rgb(255 255 255 / 0.07)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(255 255 255 / 0.9)",
    fontSize: { default: "0.8rem", [media.stack]: "0.74rem" },
    paddingBlock: { default: "0.3rem", [media.stack]: "0.2rem" },
    paddingInline: { default: "0.8rem", [media.stack]: "0.65rem" },
  },
  tags: {
    display: { default: "flex", [media.narrow]: "none" },
    flexWrap: "wrap",
    gap: { default: "0.5rem", [media.stack]: "0.35rem" },
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  snug: {
    fontSize: { default: null, [media.stack]: "clamp(0.85rem, 4.1vw, 1.7rem)" },
    letterSpacing: { default: null, [media.stack]: "0.02em" },
  },
  title: {
    fontFamily: "var(--font-mincho), serif",
    fontSize: {
      default: "clamp(2rem, 4.5vw, 2.8rem)",
      [media.stack]: "clamp(1.2rem, 4vw, 1.7rem)",
    },
    fontWeight: 700,
    letterSpacing: { default: "0.1em", [media.stack]: "0.06em" },
    lineHeight: 1.2,
    margin: 0,
    textShadow: "0 2px 24px rgb(255 190 120 / 0.25)",
  },
});

const PLAY: Text = { en: "Play", ja: "あそぶ" };

export interface Game {
  href: string;
  art: ReactNode;
  title: Text;
  blurb: Text;
  tags: Text[];
  snug?: boolean;
}

export const GameCard = ({
  href,
  art,
  title,
  blurb,
  tags,
  snug = false,
  lang,
}: Game & { lang: Lang }) => (
  <Link href={href} prefetch={false} {...stylex.props(styles.card)}>
    <div {...stylex.props(styles.art)}>
      <div {...stylex.props(styles.artInner)}>{art}</div>
    </div>
    <div {...stylex.props(styles.body)}>
      <h2 {...stylex.props(styles.title, snug && styles.snug)}>
        {title[lang]}
      </h2>
      <p {...stylex.props(styles.blurb)}>{blurb[lang]}</p>
      <ul {...stylex.props(styles.tags)}>
        {tags.map((tag) => (
          <li key={tag.en} {...stylex.props(styles.tag)}>
            {tag[lang]}
          </li>
        ))}
      </ul>
      <span {...stylex.props(styles.cta)}>
        {PLAY[lang]}
        <span aria-hidden="true">→</span>
      </span>
    </div>
  </Link>
);
