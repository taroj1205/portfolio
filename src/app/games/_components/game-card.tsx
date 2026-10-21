import * as stylex from "@stylexjs/stylex";
import Link from "next/link";
import type { ReactNode } from "react";

import { media } from "../../../styles/tokens.stylex";
import type { Text } from "../_lib/i18n";

const GOLD = "#ffd27a";

const styles = stylex.create({
  art: {
    minHeight: { default: null, [media.stack]: "13rem" },
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
    display: "flex",
    flexDirection: "column",
    fontSize: "0.98rem",
    gap: "0.35rem",
    lineHeight: 1.7,
    margin: 0,
  },
  blurbEn: {
    color: "rgb(255 255 255 / 0.66)",
    fontSize: "0.9rem",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "1.15rem",
    justifyContent: "center",
    padding: { default: "2.25rem", [media.narrow]: "1.5rem" },
  },
  card: {
    backdropFilter: "blur(14px)",
    backgroundColor: "rgb(13 16 26 / 0.7)",
    borderColor: {
      default: "rgb(255 255 255 / 0.12)",
      [media.hover]: { default: null, ":hover": "rgb(255 210 122 / 0.5)" },
    },
    borderRadius: 28,
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
    gridTemplateColumns: { default: "1.15fr 1fr", [media.stack]: "1fr" },
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
    display: "inline-flex",
    fontFamily: "var(--font-mincho), serif",
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.6rem",
    letterSpacing: "0.12em",
    minHeight: "3rem",
    paddingInline: "1.5rem",
  },
  ctaEn: {
    fontSize: "0.9rem",
    letterSpacing: "0.04em",
    opacity: 0.75,
  },
  tag: {
    backgroundColor: "rgb(255 255 255 / 0.07)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(255 255 255 / 0.9)",
    fontSize: "0.8rem",
    paddingBlock: "0.3rem",
    paddingInline: "0.8rem",
  },
  tagEn: {
    color: "rgb(255 255 255 / 0.62)",
    marginInlineStart: "0.45em",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  title: {
    fontFamily: "var(--font-mincho), serif",
    fontSize: "clamp(2rem, 4.5vw, 2.8rem)",
    fontWeight: 700,
    letterSpacing: "0.1em",
    lineHeight: 1.2,
    margin: 0,
    textShadow: "0 2px 24px rgb(255 190 120 / 0.25)",
  },
  titleEn: {
    color: GOLD,
    display: "block",
    fontFamily: "var(--font-mincho), serif",
    fontSize: "1rem",
    fontWeight: 500,
    letterSpacing: "0.14em",
    marginBlockStart: "0.6rem",
  },
});

interface GameCardProps {
  href: string;
  art: ReactNode;
  title: Text;
  blurb: Text;
  tags: Text[];
}

export const GameCard = ({ href, art, title, blurb, tags }: GameCardProps) => (
  <Link href={href} prefetch={false} {...stylex.props(styles.card)}>
    <div {...stylex.props(styles.art)}>
      <div {...stylex.props(styles.artInner)}>{art}</div>
    </div>
    <div {...stylex.props(styles.body)}>
      <h2 {...stylex.props(styles.title)}>
        {title.ja}
        <span lang="en" {...stylex.props(styles.titleEn)}>
          {title.en}
        </span>
      </h2>
      <p {...stylex.props(styles.blurb)}>
        <span>{blurb.ja}</span>
        <span lang="en" {...stylex.props(styles.blurbEn)}>
          {blurb.en}
        </span>
      </p>
      <ul {...stylex.props(styles.tags)}>
        {tags.map((tag) => (
          <li key={tag.en} {...stylex.props(styles.tag)}>
            {tag.ja}
            <span lang="en" {...stylex.props(styles.tagEn)}>
              {tag.en}
            </span>
          </li>
        ))}
      </ul>
      <span {...stylex.props(styles.cta)}>
        あそぶ
        <span lang="en" {...stylex.props(styles.ctaEn)}>
          Play
        </span>
        <span aria-hidden="true">→</span>
      </span>
    </div>
  </Link>
);
