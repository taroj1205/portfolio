import * as stylex from "@stylexjs/stylex";

import { careerOf, careerShare, describeCareer } from "../_lib/career";
import { distanceParts } from "../_lib/result";
import type { Save } from "../_lib/save";
import { useCopy, useLang } from "./lang";
import { ShareButton } from "./share-button";
import { font, ink, media } from "./theme.stylex";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(16px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  card: {
    animationDuration: "650ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    backgroundImage:
      "radial-gradient(70% 45% at 82% 30%, rgb(255 178 122 / 0.45), transparent 70%), linear-gradient(180deg, #121833, #5b4470 38%, #d29384 55%, #4c4a6e 72%, #0b1b2b)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 24,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 18px 50px rgb(0 0 0 / 0.45)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    gap: "0.35rem",
    overflow: "hidden",
    padding: "1.1rem 1.15rem 1.15rem",
    position: "relative",
    textShadow: "0 2px 18px rgb(0 0 0 / 0.35)",
  },
  sun: {
    backgroundColor: "#ffe9c7",
    borderRadius: 999,
    boxShadow: "0 0 40px 12px rgb(255 178 122 / 0.55)",
    height: "1.6rem",
    insetInlineEnd: "16%",
    position: "absolute",
    top: "18%",
    width: "1.6rem",
  },
  head: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
  },
  brand: {
    alignItems: "center",
    display: "inline-flex",
    fontFamily: font.mincho,
    fontSize: "0.85rem",
    fontWeight: 700,
    gap: "0.45rem",
    letterSpacing: "0.3em",
  },
  seal: {
    backgroundColor: "#c8352b",
    borderRadius: 4,
    display: "inline-grid",
    fontSize: "0.65rem",
    height: "1.15rem",
    letterSpacing: 0,
    placeItems: "center",
    width: "1.15rem",
  },
  badge: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    color: "#2a1d05",
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    paddingBlock: "0.22rem",
    paddingInline: "0.6rem",
    textShadow: "none",
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "calc(0.3em * var(--track, 1))",
    marginTop: "2.4rem",
    position: "relative",
  },
  meter: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(3rem, 15vw, 4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    gap: "0.15em",
    lineHeight: 1,
    margin: 0,
    position: "relative",
  },
  unit: {
    fontSize: "0.4em",
  },
  caption: {
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
    position: "relative",
  },
  facts: {
    backdropFilter: "blur(10px)",
    backgroundColor: "rgb(8 12 24 / 0.42)",
    borderRadius: 16,
    display: "grid",
    gap: 1,
    gridTemplateColumns: "1fr 1fr",
    margin: 0,
    marginTop: "0.8rem",
    overflow: "hidden",
    position: "relative",
    WebkitBackdropFilter: "blur(10px)",
  },
  fact: {
    boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    minWidth: 0,
    paddingBlock: "0.65rem",
    paddingInline: "0.8rem",
  },
  wide: {
    gridColumn: "1 / -1",
  },
  factLabel: {
    color: ink.soft,
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
  },
  factValue: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.2rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 800,
    margin: 0,
    overflowWrap: "anywhere",
  },
  share: {
    alignItems: "center",
    backgroundColor: "#fffaf3",
    borderRadius: 14,
    borderWidth: 0,
    color: "#0d121c",
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    fontFamily: "inherit",
    fontSize: "0.95rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    minHeight: "3.1rem",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  empty: {
    color: ink.soft,
    fontSize: "0.82rem",
    margin: 0,
    textAlign: "center",
  },
});

export const RecordTab = ({ save }: { save: Save }) => {
  const lang = useLang();
  const copy = useCopy();
  const career = careerOf(save);
  const { facts, perfect, reached, title } = describeCareer(career, lang);
  const [value, unit] = distanceParts(career.best);
  return (
    <>
      <div {...stylex.props(styles.card)}>
        <span aria-hidden="true" {...stylex.props(styles.sun)} />
        <div {...stylex.props(styles.head)}>
          <span {...stylex.props(styles.brand)}>
            天の川水切り
            <span aria-hidden="true" {...stylex.props(styles.seal)}>
              石
            </span>
          </span>
          {perfect === null ? null : (
            <span {...stylex.props(styles.badge)}>{perfect}</span>
          )}
        </div>
        <span {...stylex.props(styles.label)}>
          {copy.best} · {reached}
        </span>
        <p {...stylex.props(styles.meter)}>
          {value}
          <span {...stylex.props(styles.unit)}>{unit}</span>
        </p>
        <p {...stylex.props(styles.caption)}>{title}</p>
        <dl {...stylex.props(styles.facts)}>
          {facts.map((fact, index) => (
            <div
              key={fact.label}
              {...stylex.props(
                styles.fact,
                index === facts.length - 1 && index % 2 === 0 && styles.wide
              )}
            >
              <dt {...stylex.props(styles.factLabel)}>{fact.label}</dt>
              <dd {...stylex.props(styles.factValue)}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {career.runs > 0 ? (
        <ShareButton
          share={careerShare(career, window.location.origin, lang)}
          {...stylex.props(styles.share)}
        />
      ) : (
        <p {...stylex.props(styles.empty)}>{copy.workshop.firstThrow}</p>
      )}
    </>
  );
};
