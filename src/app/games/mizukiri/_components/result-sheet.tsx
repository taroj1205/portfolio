import * as stylex from "@stylexjs/stylex";
import Link from "next/link";

import { describe, postUrl } from "../_lib/result";
import type { Result } from "../_lib/result";
import { glass } from "./glass";
import { font, ink, media } from "./theme.stylex";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  sheet: {
    animationDuration: "650ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 26,
    bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
    boxShadow: "0 24px 60px rgb(0 0 0 / 0.35)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    insetInline: "1rem",
    marginInline: "auto",
    maxWidth: "26rem",
    padding: "1.25rem",
    position: "fixed",
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  badge: {
    borderRadius: 999,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    paddingBlock: "0.25rem",
    paddingInline: "0.65rem",
  },
  rare: {
    backgroundColor: "#ffd27a",
    color: "#2a1d05",
  },
  record: {
    boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.5)",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.6rem, 7vw, 2rem)",
    fontWeight: 700,
    lineHeight: 1.25,
    margin: 0,
    textWrap: "balance",
  },
  stats: {
    color: ink.soft,
    fontSize: "0.9rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.06em",
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "0.6rem",
    marginTop: "0.3rem",
  },
  action: {
    alignItems: "center",
    borderRadius: 14,
    cursor: "pointer",
    display: "flex",
    flex: 1,
    fontFamily: "inherit",
    fontSize: "0.95rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "0.08em",
    minHeight: "3.1rem",
    textDecoration: "none",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  post: {
    backgroundColor: "#fffaf3",
    borderWidth: 0,
    color: "#0d121c",
  },
  again: {
    color: ink.text,
  },
  maker: {
    alignSelf: "center",
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "0.12em",
    paddingBlock: "0.35rem",
    textDecoration: "none",
  },
});

const XMark = () => (
  <svg aria-hidden="true" height="15" viewBox="0 0 24 24" width="15">
    <path
      d="M17.75 3h3.07l-6.71 7.67L22 21h-6.17l-4.84-6.32L5.45 21H2.37l7.18-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z"
      fill="currentColor"
    />
  </svg>
);

interface ResultSheetProps {
  result: Result;
  record: boolean;
  onAgain: () => void;
}

export const ResultSheet = ({ result, record, onAgain }: ResultSheetProps) => {
  const story = describe(result);
  return (
    <section aria-live="polite" {...stylex.props(glass.surface, styles.sheet)}>
      {story.rarity === null && !record ? null : (
        <div {...stylex.props(styles.badges)}>
          {story.rarity === null ? null : (
            <span {...stylex.props(styles.badge, styles.rare)}>
              {story.rarity}
            </span>
          )}
          {record ? (
            <span {...stylex.props(styles.badge, styles.record)}>
              自己ベスト更新
            </span>
          ) : null}
        </div>
      )}
      <h2 {...stylex.props(styles.title)}>{story.title}</h2>
      <p {...stylex.props(styles.stats)}>
        {result.skips}回 · {result.distance.toFixed(1)} m
      </p>
      <div {...stylex.props(styles.actions)}>
        <a
          href={postUrl(result, window.location.origin)}
          rel="noopener noreferrer"
          target="_blank"
          {...stylex.props(styles.action, styles.post)}
        >
          <XMark />
          ポスト
        </a>
        <button
          onClick={onAgain}
          type="button"
          {...stylex.props(glass.surface, styles.action, styles.again)}
        >
          もう一回
        </button>
      </div>
      <Link href="/ja" {...stylex.props(styles.maker)}>
        つくった人
      </Link>
    </section>
  );
};
