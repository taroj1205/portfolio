import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { numberText } from "../_lib/compare";
import { copy } from "../_lib/copy";
import type { Item } from "../_lib/items";
import { ratioOf, weightText } from "../_lib/scale";
import { heavierOf, pairOf } from "../_lib/versus";
import type { Pair } from "../_lib/versus";
import { Balance, Load } from "./balance";
import { ItemPicture } from "./item-art";
import { VersusSheet } from "./result-sheet";

const GOLD = "#ffd27a";
const RIGHT = "#5ee08a";
const WRONG = "#ff5d6c";
const REVEAL_MS = 1500;
const LEAN = 15;

const bounce = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(18px) scale(0.6)" },
  "55%": { opacity: 1, transform: "translateY(-6px) scale(1.12)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const bump = stylex.keyframes({
  "0%": { transform: "scale(1)" },
  "40%": { transform: "scale(1.45)" },
  "100%": { transform: "scale(1)" },
});

const styles = stylex.create({
  board: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.6rem",
    marginInline: "auto",
    maxWidth: "30rem",
    minHeight: 0,
    pointerEvents: "auto",
    width: "100%",
  },
  meta: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  ask: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.35rem, 6.2vw, 1.9rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.06em * var(--track, 1))",
    margin: 0,
    textShadow: shade.large,
  },
  score: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
  },
  chain: {
    color: GOLD,
    display: "inline-block",
    fontFamily: font.mincho,
    fontSize: "1.6rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: "0 0 18px rgb(255 210 122 / 0.6)",
  },
  bumped: {
    animationDuration: "480ms",
    animationName: { default: bump, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  best: {
    color: ink.soft,
    fontSize: "0.72rem",
  },
  stage: {
    flexGrow: 1,
    maxHeight: "19rem",
    minHeight: "9rem",
    width: "100%",
  },
  verdict: {
    animationDuration: "520ms",
    animationName: { default: bounce, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    fontFamily: font.mincho,
    fontSize: "clamp(1.9rem, 9vw, 2.6rem)",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: "0 0 24px currentColor, 0 2px 10px rgb(0 0 0 / 0.6)",
    whiteSpace: "nowrap",
  },
  cue: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minHeight: "3rem",
  },
  tint: (color: string) => ({ color }),
  hint: {
    color: ink.soft,
    fontSize: "0.8rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  choices: {
    display: "grid",
    gap: "0.7rem",
    gridTemplateColumns: "1fr 1fr",
    width: "100%",
  },
  choice: {
    alignItems: "center",
    borderRadius: 22,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    justifyContent: "flex-start",
    minHeight: "9.5rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingBlock: "0.8rem",
    paddingInline: "0.6rem",
    textAlign: "center",
    transform: {
      default: null,
      ":active": "scale(0.96)",
    },
    transitionDuration: "200ms",
    transitionProperty: "transform, border-color, box-shadow",
  },
  choiceRight: {
    borderColor: RIGHT,
    boxShadow: `0 0 0 2px ${RIGHT}, 0 0 30px rgb(94 224 138 / 0.35)`,
  },
  choiceWrong: {
    borderColor: WRONG,
    boxShadow: `0 0 0 2px ${WRONG}, 0 0 30px rgb(255 93 108 / 0.35)`,
  },
  name: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontWeight: 700,
    lineHeight: 1.3,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  weight: {
    color: GOLD,
    fontSize: "0.9rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 800,
  },
  times: {
    color: ink.soft,
    fontSize: "0.72rem",
  },
  challenge: {
    borderRadius: 16,
    fontSize: "0.82rem",
    margin: 0,
    paddingBlock: "0.45rem",
    paddingInline: "0.9rem",
    textAlign: "center",
  },
  challengeLabel: {
    color: GOLD,
    fontWeight: 700,
    marginInlineEnd: "0.5rem",
  },
});

const secondsSince = (start: number) => (performance.now() - start) / 1000;

interface Over {
  chain: number;
  best: number;
  record: boolean;
}

interface VersusProps {
  lang: Lang;
  best: number;
  challenge: number | null;
  onPick: (right: boolean) => void;
  onSettle: (chain: number, seconds: number) => Over;
  onToday: () => void;
}

export const Versus = ({
  lang,
  best,
  challenge,
  onPick,
  onSettle,
  onToday,
}: VersusProps) => {
  const words = copy[lang];
  const [pair, setPair] = useState<Pair>(() => pairOf(Math.random, null));
  const [chain, setChain] = useState(0);
  const [picked, setPicked] = useState<Item | null>(null);
  const [over, setOver] = useState<Over | null>(null);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    started.current = performance.now();

    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const heavier = heavierOf(pair);
  const right = picked === null ? null : picked === heavier;

  const pick = (item: Item) => {
    const correct = item === heavier;
    setPicked(item);
    onPick(correct);

    const settled = correct
      ? null
      : onSettle(chain, secondsSince(started.current));

    timer.current = setTimeout(() => {
      timer.current = null;

      if (settled === null) {
        setChain(chain + 1);
        setPair(pairOf(Math.random, pair));
        setPicked(null);

        return;
      }

      setOver(settled);
    }, REVEAL_MS);
  };

  const again = () => {
    started.current = performance.now();
    setOver(null);
    setChain(0);
    setPicked(null);
    setPair((previous) => pairOf(Math.random, previous));
  };

  let tilt = 0;

  if (picked !== null) {
    tilt = heavier === pair.left ? -LEAN : LEAN;
  }

  const ratio = ratioOf(pair.left.grams, pair.right.grams);

  return (
    <section aria-labelledby="tenbin-versus" {...stylex.props(styles.board)}>
      <div {...stylex.props(styles.meta)}>
        <h2 id="tenbin-versus" {...stylex.props(styles.ask)}>
          {words.versus.ask}
        </h2>
        <div {...stylex.props(styles.score)}>
          <span
            aria-live="polite"
            key={chain}
            {...stylex.props(styles.chain, chain > 0 && styles.bumped)}
          >
            {words.versus.chain(chain)}
          </span>
          {best > 0 ? (
            <span {...stylex.props(styles.best)}>
              {words.versus.best(best)}
            </span>
          ) : null}
        </div>
      </div>
      {challenge !== null && chain === 0 && over === null ? (
        <p {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.challengeLabel)}>
            {words.challenge.received}
          </span>
          {words.share.versus(challenge)}
        </p>
      ) : null}
      <div {...stylex.props(styles.cue)}>
        {right === null ? (
          <p {...stylex.props(styles.hint)}>{words.versus.pick}</p>
        ) : (
          <span
            aria-live="polite"
            {...stylex.props(
              styles.verdict,
              styles.tint(right ? RIGHT : WRONG)
            )}
          >
            {right ? words.versus.right : words.versus.wrong}
          </span>
        )}
      </div>
      <div {...stylex.props(styles.stage)}>
        <Balance
          glow={right === true ? chain + 1 : null}
          idle={picked === null}
          left={<Load id={pair.left.id} />}
          right={<Load id={pair.right.id} />}
          tag={null}
          tilt={tilt}
        />
      </div>
      <div {...stylex.props(styles.choices)}>
        {[pair.left, pair.right].map((item) => {
          const shown = picked !== null;
          const isHeavier = item === heavier;

          return (
            <button
              disabled={shown}
              key={item.id}
              onClick={() => {
                pick(item);
              }}
              type="button"
              {...stylex.props(
                glass.surface,
                styles.choice,
                shown && isHeavier && styles.choiceRight,
                shown && picked === item && !isHeavier && styles.choiceWrong
              )}
            >
              <ItemPicture id={item.id} size="4.4rem" />
              <span {...stylex.props(styles.name)}>{item.name[lang]}</span>
              {shown ? (
                <span {...stylex.props(styles.weight)}>
                  {weightText(item.grams, lang)}
                </span>
              ) : null}
              {shown && isHeavier ? (
                <span {...stylex.props(styles.times)}>
                  {words.versus.times(numberText(ratio, lang))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {over === null ? null : (
        <VersusSheet
          best={over.best}
          chain={over.chain}
          lang={lang}
          onAgain={again}
          onToday={onToday}
          record={over.record}
        />
      )}
    </section>
  );
};
