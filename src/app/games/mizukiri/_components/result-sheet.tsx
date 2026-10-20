import * as stylex from "@stylexjs/stylex";
import Link from "next/link";

import { describe, distanceParts, postUrl } from "../_lib/result";
import { pointsLeft, progressOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import type { Landing } from "../_lib/session";
import { glass } from "./glass";
import { font, ink, media } from "./theme.stylex";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const crown = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.6)" },
  "60%": { opacity: 1, transform: "scale(0.96)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const fill = stylex.keyframes({
  "0%": { transform: "scaleX(0)" },
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
    gap: "0.75rem",
    insetInline: "1rem",
    marginInline: "auto",
    maxHeight: "min(80vh, 44rem)",
    maxWidth: "27rem",
    overflowY: "auto",
    overscrollBehavior: "contain",
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
  gold: {
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    color: "#2a1d05",
  },
  outline: {
    boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.5)",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    margin: 0,
  },
  meter: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.8rem, 13vw, 3.6rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    gap: "0.15em",
    lineHeight: 1,
    margin: 0,
  },
  meterUnit: {
    fontSize: "0.4em",
  },
  stats: {
    color: ink.soft,
    fontSize: "0.9rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.04em",
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "0.6rem",
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
  levelUp: {
    alignItems: "center",
    backgroundImage:
      "radial-gradient(ellipse at center, rgb(255 210 122 / 0.28), transparent 70%)",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    paddingBlock: "0.9rem",
  },
  levelLabel: {
    color: "#ffd27a",
    fontSize: "0.8rem",
    fontWeight: 800,
    letterSpacing: "0.4em",
  },
  levelNumber: {
    animationDuration: "900ms",
    animationName: { default: crown, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    backgroundClip: "text",
    backgroundImage: "linear-gradient(180deg, #fff4c2, #ffd27a 45%, #c98a1e)",
    color: "transparent",
    filter: "drop-shadow(0 4px 16px rgb(255 190 80 / 0.5))",
    fontFamily: font.mincho,
    fontSize: "3.4rem",
    fontWeight: 800,
    lineHeight: 1.1,
    WebkitBackgroundClip: "text",
  },
  section: {
    borderTopColor: "rgb(255 255 255 / 0.12)",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    paddingTop: "0.85rem",
  },
  head: {
    alignItems: "baseline",
    display: "flex",
    justifyContent: "space-between",
  },
  heading: {
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    margin: 0,
  },
  small: {
    color: ink.soft,
    fontSize: "0.75rem",
  },
  bar: {
    backgroundColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  barFill: {
    animationDuration: "1.2s",
    animationName: { default: fill, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    backgroundImage: "linear-gradient(90deg, #ffd27a, #fff1b8)",
    height: "100%",
    transformOrigin: "left",
  },
  barWidth: (part: number) => ({
    width: `${Math.round(part * 100)}%`,
  }),
  row: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: 700,
  },
  level: {
    color: ink.soft,
    fontSize: "0.75rem",
    marginInlineStart: "0.4rem",
  },
  note: {
    color: ink.soft,
    display: "block",
    fontSize: "0.72rem",
  },
  stepper: {
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    gap: "0.4rem",
  },
  step: {
    alignItems: "center",
    borderRadius: 12,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: "1.15rem",
    fontWeight: 700,
    height: "2.6rem",
    justifyContent: "center",
    opacity: { default: 1, ":disabled": 0.3 },
    padding: 0,
    transform: { default: null, ":active": "scale(0.94)" },
    width: "2.6rem",
  },
  chips: {
    display: "flex",
    gap: "0.45rem",
    overflowX: "auto",
    paddingBottom: "0.2rem",
    scrollbarWidth: "none",
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 14,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    fontFamily: "inherit",
    fontSize: "0.78rem",
    fontWeight: 700,
    gap: "0.3rem",
    minWidth: "4.6rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.6rem",
    transform: { default: null, ":active": "scale(0.96)" },
  },
  worn: {
    backgroundColor: "rgb(255 210 122 / 0.16)",
    borderColor: "#ffd27a",
  },
  locked: {
    opacity: 0.45,
  },
  swatch: (light: string, mid: string, dark: string) => ({
    backgroundImage: `radial-gradient(circle at 35% 30%, ${light}, ${mid} 50%, ${dark})`,
    borderRadius: 999,
    boxShadow: "inset 0 -3px 6px rgb(0 0 0 / 0.35)",
    height: "1.6rem",
    width: "2.2rem",
  }),
  condition: {
    color: ink.soft,
    fontSize: "0.65rem",
    fontWeight: 600,
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
  landing: Landing;
  save: Save;
  onAgain: () => void;
  onWorkshop: () => void;
}

export const ResultSheet = ({
  landing,
  save,
  onAgain,
  onWorkshop,
}: ResultSheetProps) => {
  const { result, record, gained, climbed, combo, unlocked } = landing;
  const story = describe(result);
  const [value, unit] = distanceParts(result.distance);
  const progress = progressOf(save.xp);
  const left = pointsLeft(save);
  return (
    <section aria-live="polite" {...stylex.props(glass.surface, styles.sheet)}>
      <div {...stylex.props(styles.badges)}>
        {story.rarity === null ? null : (
          <span {...stylex.props(styles.badge, styles.gold)}>
            {story.rarity}
          </span>
        )}
        {record ? (
          <span {...stylex.props(styles.badge, styles.outline)}>
            自己ベスト更新
          </span>
        ) : null}
        {climbed > 0 ? (
          <span {...stylex.props(styles.badge, styles.gold)}>
            レベルアップ Lv.{progress.level}
          </span>
        ) : null}
        {unlocked.map((option) => (
          <span key={option.id} {...stylex.props(styles.badge, styles.outline)}>
            解放：{option.name}
          </span>
        ))}
      </div>
      <h2 {...stylex.props(styles.title)}>{story.title}</h2>
      <p {...stylex.props(styles.meter)}>
        {value}
        <span {...stylex.props(styles.meterUnit)}>{unit}</span>
      </p>
      <p {...stylex.props(styles.stats)}>
        {result.skips}回跳ねた · 最大コンボ ×{combo} · 投げの質 {result.quality}
        %
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

      {climbed > 0 ? (
        <div {...stylex.props(styles.levelUp)}>
          <span {...stylex.props(styles.levelLabel)}>レベルアップ</span>
          <span {...stylex.props(styles.levelNumber)}>Lv.{progress.level}</span>
          <span {...stylex.props(styles.small)}>スキルポイント +{climbed}</span>
        </div>
      ) : null}
      <div {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.head)}>
          <h3 {...stylex.props(styles.heading)}>Lv.{progress.level}</h3>
          <span {...stylex.props(styles.small)}>
            +{gained.toLocaleString("ja-JP")} 経験値
          </span>
        </div>
        <div {...stylex.props(styles.bar)}>
          <div
            {...stylex.props(styles.barFill, styles.barWidth(progress.part))}
          />
        </div>
        <button
          onClick={onWorkshop}
          type="button"
          {...stylex.props(glass.surface, styles.action, styles.again)}
        >
          石と腕前
          {left > 0 ? `（ポイント ${left}）` : ""}
        </button>
      </div>

      <Link href="/ja" {...stylex.props(styles.maker)}>
        つくった人
      </Link>
    </section>
  );
};
