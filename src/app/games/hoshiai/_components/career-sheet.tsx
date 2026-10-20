import { Dialog } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { ShareButton } from "../../_components/share-button";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { bodies } from "../_lib/bodies";
import { careerShare } from "../_lib/career";
import { copy } from "../_lib/copy";
import { formatScore, titleOf } from "../_lib/result";
import type { Save } from "../_lib/save";
import { BodyIcon } from "./body-icon";
import { Ladder } from "./ladder";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(16px) scale(0.98)" },
  "100%": { opacity: 1, transform: "none" },
});

const styles = stylex.create({
  backdrop: {
    backdropFilter: "blur(6px)",
    backgroundColor: "rgb(3 5 10 / 0.55)",
    inset: 0,
    position: "fixed",
  },
  popup: {
    animationDuration: "500ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    backgroundColor: "rgb(13 16 26 / 0.94)",
    backgroundImage:
      "radial-gradient(120% 60% at 50% 0%, rgb(255 210 122 / 0.16), transparent 62%)",
    borderColor: "rgb(255 255 255 / 0.1)",
    borderRadius: 28,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 30px 80px rgb(0 0 0 / 0.55)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    insetInline: "1.25rem",
    marginInline: "auto",
    maxHeight: "min(88vh, 42rem)",
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.25rem",
    position: "fixed",
    top: "50%",
    translate: "0 -50%",
  },
  head: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    display: "inline-flex",
    fontFamily: font.mincho,
    fontSize: "0.85rem",
    fontWeight: 700,
    gap: "0.45rem",
    letterSpacing: "0.3em",
    margin: 0,
  },
  seal: {
    alignItems: "center",
    backgroundColor: "#c8352b",
    borderRadius: 4,
    display: "inline-flex",
    fontSize: "0.65rem",
    height: "1.15rem",
    justifyContent: "center",
    letterSpacing: 0,
    width: "1.15rem",
  },
  close: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderRadius: 999,
    borderWidth: 0,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    height: "2.5rem",
    justifyContent: "center",
    padding: 0,
    transform: { default: null, ":active": "scale(0.92)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "2.5rem",
  },
  hero: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    minWidth: 0,
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "calc(0.3em * var(--track, 1))",
    margin: 0,
  },
  score: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.4rem, 12vw, 3.2rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
  },
  unit: {
    fontSize: "0.36em",
    marginInlineStart: "0.2em",
  },
  caption: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
  },
  facts: {
    backgroundColor: "rgb(255 255 255 / 0.05)",
    borderRadius: 16,
    display: "grid",
    gap: 1,
    gridTemplateColumns: "1fr 1fr",
    margin: 0,
    overflow: "hidden",
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
  factLabel: {
    color: ink.soft,
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
  },
  factValue: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 800,
    margin: 0,
    overflowWrap: "anywhere",
  },
  share: {
    alignItems: "center",
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.2rem",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
});

const Cross = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
    <path
      d="m6 6 12 12M18 6 6 18"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);

interface CareerSheetProps {
  save: Save;
  lang: Lang;
  open: boolean;
  opener: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export const CareerSheet = ({
  save,
  lang,
  open,
  opener,
  onClose,
}: CareerSheetProps) => {
  const words = copy[lang];
  const facts = [
    { label: words.career.runs, value: save.runs },
    { label: words.career.merges, value: save.merges },
    { label: words.career.chain, value: save.chain },
    { label: words.career.galaxies, value: save.galaxies },
  ];
  return (
    <Dialog.Root
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      open={open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop {...stylex.props(styles.backdrop)} />
        <Dialog.Popup finalFocus={opener} {...stylex.props(styles.popup)}>
          <div {...stylex.props(styles.head)}>
            <Dialog.Title {...stylex.props(styles.brand)}>
              <span lang="ja">星合</span>
              <span aria-hidden="true" {...stylex.props(styles.seal)}>
                星
              </span>
              <span>{words.career.title}</span>
            </Dialog.Title>
            <Dialog.Close
              aria-label={words.career.close}
              {...stylex.props(styles.close)}
            >
              <Cross />
            </Dialog.Close>
          </div>
          <div {...stylex.props(styles.hero)}>
            <BodyIcon size="5rem" tier={save.top} />
            <div {...stylex.props(styles.titles)}>
              <p {...stylex.props(styles.label)}>{words.best}</p>
              <p {...stylex.props(styles.score)}>
                {formatScore(save.best, lang)}
                <span {...stylex.props(styles.unit)}>{words.points}</span>
              </p>
              <p {...stylex.props(styles.caption)}>{titleOf(save, lang)}</p>
            </div>
          </div>
          <Ladder
            label={words.found(save.top + 1, bodies.length)}
            reached={save.top}
            scale={0.9}
          />
          <dl {...stylex.props(styles.facts)}>
            {facts.map((fact) => (
              <div key={fact.label} {...stylex.props(styles.fact)}>
                <dt {...stylex.props(styles.factLabel)}>{fact.label}</dt>
                <dd {...stylex.props(styles.factValue)}>
                  {fact.value.toLocaleString(words.locale)}
                </dd>
              </div>
            ))}
          </dl>
          <ShareButton
            fileName="hoshiai-stats.png"
            labels={words.result}
            share={careerShare(save, window.location.origin, lang)}
            {...stylex.props(styles.share)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
