import * as stylex from "@stylexjs/stylex";
import Link from "next/link";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { font, ink, media } from "../../_components/theme.stylex";
import { keyOf, noteOf, parts } from "../_lib/cosmetics";
import type { Part } from "../_lib/cosmetics";
import { describe, distanceParts, shareOf, toKmh } from "../_lib/result";
import { pointsLeft, progressOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import type { Landing } from "../_lib/session";
import { useCopy, useLang } from "./lang";
import { Preview } from "./preview";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const crown = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.6)" },
  "60%": { opacity: 1, transform: "scale(0.96)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const shine = stylex.keyframes({
  "0%": { backgroundPosition: "160% 0" },
  "100%": { backgroundPosition: "-60% 0" },
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
    letterSpacing: "calc(0.1em * var(--track, 1))",
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
    letterSpacing: "calc(0.2em * var(--track, 1))",
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
    letterSpacing: "calc(0.04em * var(--track, 1))",
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
    flex: "1 1 auto",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    minHeight: "3.1rem",
    paddingInline: "0.75rem",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  primary: {
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.35)",
    color: "#1c1406",
    flex: "none",
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    letterSpacing: "calc(0.3em * var(--track, 1))",
    minHeight: "3.6rem",
    width: "100%",
  },
  dot: {
    backgroundColor: "#ffd27a",
    borderRadius: 999,
    color: "#1c1406",
    fontSize: "0.7rem",
    fontWeight: 800,
    lineHeight: "1.2rem",
    minWidth: "1.2rem",
    paddingInline: "0.3rem",
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
    letterSpacing: "calc(0.4em * var(--track, 1))",
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
  unlocks: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  unlock: {
    alignItems: "center",
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationName: { default: shine, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
    backgroundColor: "rgb(255 210 122 / 0.08)",
    backgroundImage:
      "linear-gradient(105deg, transparent 35%, rgb(255 241 184 / 0.22) 50%, transparent 65%)",
    backgroundSize: "250% 100%",
    borderColor: "rgb(255 210 122 / 0.55)",
    borderRadius: 16,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    gap: "0.75rem",
    paddingBlock: "0.65rem",
    paddingInline: "0.8rem",
    textAlign: "start",
    transform: { default: null, ":active": "scale(0.98)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  unlockWorn: {
    animationName: "none",
    backgroundColor: "rgb(255 210 122 / 0.16)",
    borderColor: "#ffd27a",
  },
  unlockText: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "0.1rem",
    minWidth: 0,
  },
  unlockKind: {
    color: "#ffd27a",
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "calc(0.12em * var(--track, 1))",
  },
  wear: {
    borderColor: "rgb(255 210 122 / 0.6)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: "#ffd27a",
    flexShrink: 0,
    fontSize: "0.75rem",
    fontWeight: 800,
    paddingBlock: "0.35rem",
    paddingInline: "0.75rem",
  },
  wearOn: {
    backgroundColor: "#ffd27a",
    color: "#1c1406",
  },
  maker: {
    alignSelf: "center",
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    paddingBlock: "0.35rem",
    textDecoration: "none",
  },
});

const PART_NAMES = new Map(parts.map(({ part, name }) => [part, name]));

interface ResultSheetProps {
  landing: Landing;
  save: Save;
  onAgain: () => void;
  onWear: (part: Part, id: string) => void;
  onWorkshop: () => void;
}

export const ResultSheet = ({
  landing,
  save,
  onAgain,
  onWear,
  onWorkshop,
}: ResultSheetProps) => {
  const { result, record, gained, climbed, combo, topSpeed, unlocked } =
    landing;
  const lang = useLang();
  const copy = useCopy();
  const story = describe(result, lang);
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
            {copy.result.record}
          </span>
        ) : null}
        {climbed > 0 ? (
          <span {...stylex.props(styles.badge, styles.gold)}>
            {copy.result.levelUp} Lv.{progress.level}
          </span>
        ) : null}
      </div>
      <h2 {...stylex.props(styles.title)}>{story.title}</h2>
      <p {...stylex.props(styles.meter)}>
        {value}
        <span {...stylex.props(styles.meterUnit)}>{unit}</span>
      </p>
      <p {...stylex.props(styles.stats)}>
        {copy.result.stats(
          result.skips,
          combo,
          result.quality,
          toKmh(topSpeed)
        )}
      </p>
      {unlocked.length > 0 ? (
        <div {...stylex.props(styles.unlocks)}>
          <span {...stylex.props(styles.levelLabel)}>
            {copy.result.unlocked}
          </span>
          {unlocked.map(({ part, option }) => {
            const worn = save.look[part] === option.id;
            return (
              <button
                aria-pressed={worn}
                key={keyOf({ option, part })}
                onClick={() => {
                  onWear(part, option.id);
                }}
                type="button"
                {...stylex.props(styles.unlock, worn && styles.unlockWorn)}
              >
                <Preview option={option} part={part} />
                <span {...stylex.props(styles.unlockText)}>
                  <span {...stylex.props(styles.unlockKind)}>
                    {copy.result.newPart(PART_NAMES.get(part)?.[lang] ?? "")}
                  </span>
                  <span {...stylex.props(styles.name)}>
                    {option.name[lang]}
                  </span>
                  {option.perks === undefined ? null : (
                    <span {...stylex.props(styles.note)}>
                      {noteOf(option.perks, lang)}
                    </span>
                  )}
                </span>
                <span {...stylex.props(styles.wear, worn && styles.wearOn)}>
                  {worn ? copy.result.worn : copy.result.wear}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <button
        onClick={onAgain}
        type="button"
        {...stylex.props(styles.action, styles.primary)}
      >
        {copy.result.again}
      </button>
      <div {...stylex.props(styles.actions)}>
        <ShareButton
          fileName="mizukiri.png"
          labels={copy.result}
          share={shareOf(result, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.post)}
        />
        <button
          onClick={onWorkshop}
          type="button"
          {...stylex.props(glass.surface, styles.action, styles.again)}
        >
          {copy.result.workshop}
          {left > 0 ? <span {...stylex.props(styles.dot)}>{left}</span> : null}
        </button>
      </div>

      {climbed > 0 ? (
        <div {...stylex.props(styles.levelUp)}>
          <span {...stylex.props(styles.levelLabel)}>
            {copy.result.levelUp}
          </span>
          <span {...stylex.props(styles.levelNumber)}>Lv.{progress.level}</span>
          <span {...stylex.props(styles.small)}>
            {copy.result.points(climbed)}
          </span>
        </div>
      ) : null}
      <div {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.head)}>
          <h3 {...stylex.props(styles.heading)}>Lv.{progress.level}</h3>
          <span {...stylex.props(styles.small)}>
            {copy.result.xp(gained.toLocaleString(copy.locale))}
          </span>
        </div>
        <div {...stylex.props(styles.bar)}>
          <div
            {...stylex.props(styles.barFill, styles.barWidth(progress.part))}
          />
        </div>
      </div>

      <Link href={`/${lang}`} {...stylex.props(styles.maker)}>
        {copy.result.maker}
      </Link>
    </section>
  );
};
