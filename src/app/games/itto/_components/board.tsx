import * as stylex from "@stylexjs/stylex";
import { useEffect, useId, useRef } from "react";
import type { Ref } from "react";

import { font, media } from "../../_components/theme.stylex";
import { lineOf, reachOf } from "../_lib/cut";
import type { Cut, Split } from "../_lib/cut";
import { SPAN } from "../_lib/foods";
import type { Food } from "../_lib/foods";
import { pointOn } from "../_lib/geometry";
import { tenths } from "../_lib/result";
import type { Slash, View } from "../_lib/session";
import { cutSvg, layersOf, pieceSvg, tagAt } from "./food-svg";
import { knifeSvg } from "./knife-svg";
import { woodSvg } from "./wood-svg";

const SUMI = "#2a1a10";
const VERMILION = "#c8352b";
const GOLD = "#ffd27a";
const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";
const VIEW = `${-SPAN / 2} ${-SPAN / 2} ${SPAN} ${SPAN}`;

const ink = {
  guide: "#3b2614",
  nick: "#4a2c14",
  slash: "#ffffff",
} as const;

const serve = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(-6%) scale(0.9)" },
  "100%": { opacity: 1, transform: "none" },
});

const part = stylex.keyframes({
  "0%": { transform: "none" },
});

const pop = stylex.keyframes({
  "0%": { opacity: 0, transform: "translate(-50%, -50%) scale(0.5)" },
  "100%": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
});

const flash = stylex.keyframes({
  "0%": { opacity: 1, strokeDashoffset: 1 },
  "25%": { opacity: 1, strokeDashoffset: 0 },
  "100%": { opacity: 0, strokeDashoffset: 0 },
});

const fade = stylex.keyframes({
  "0%, 40%": { opacity: 1 },
  "100%": { opacity: 0 },
});

const drop = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(-6px)" },
  "100%": { opacity: 1, transform: "none" },
});

const leave = stylex.keyframes({
  "0%": { opacity: 1 },
  "100%": { opacity: 0, transform: "scale(0.96)" },
});

const styles = stylex.create({
  board: {
    backgroundColor: "#e8cb97",
    borderRadius: "clamp(14px, 3vmin, 26px)",
    boxShadow:
      "inset 0 2px 0 rgb(255 255 255 / 0.5), inset 0 -3px 0 rgb(120 80 40 / 0.25), 0 10px 0 #b0834a, 0 12px 0 #8e6534, 0 30px 60px rgb(0 0 0 / 0.55)",
    containerType: "size",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  wood: {
    display: "block",
    height: "100%",
    inset: 0,
    position: "absolute",
    width: "100%",
  },
  box: {
    aspectRatio: "1",
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(96cqw, 96cqh)",
  },
  layer: {
    height: "100%",
    inset: 0,
    overflow: "visible",
    pointerEvents: "none",
    position: "absolute",
    width: "100%",
  },
  served: {
    animationDuration: "520ms",
    animationName: { default: serve, [media.reduce]: "none" },
    animationTimingFunction: SPRING,
  },
  cleared: {
    animationDuration: "450ms",
    animationFillMode: "forwards",
    animationName: { default: leave, [media.reduce]: "none" },
  },
  parted: {
    animationDuration: "560ms",
    animationName: { default: part, [media.reduce]: "none" },
    animationTimingFunction: SPRING,
  },
  apart: (x: string, y: string, turn: string, origin: string) => ({
    transform: `translate(${x}, ${y}) rotate(${turn})`,
    transformOrigin: origin,
  }),
  slash: {
    animationDuration: "750ms",
    animationFillMode: "forwards",
    animationName: { default: flash, [media.reduce]: fade },
    animationTimingFunction: "ease-out",
  },
  fumble: {
    animationDuration: "1400ms",
    animationFillMode: "forwards",
    animationName: fade,
  },
  label: {
    animationDelay: "220ms",
    animationDuration: "420ms",
    animationFillMode: "backwards",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: SPRING,
    backgroundColor: "rgb(255 252 244 / 0.94)",
    borderRadius: 999,
    boxShadow: "0 4px 14px rgb(60 30 10 / 0.3)",
    color: SUMI,
    fontFamily: font.mincho,
    fontSize: "clamp(0.7rem, 4.2cqmin, 1.3rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    paddingBlock: "0.2em",
    paddingInline: "0.65em",
    pointerEvents: "none",
    position: "absolute",
    transform: "translate(-50%, -50%)",
    whiteSpace: "nowrap",
  },
  even: {
    backgroundColor: VERMILION,
    color: "#fff6ee",
  },
  at: (left: string, top: string) => ({ left, top }),
  tag: {
    alignItems: "center",
    animationDuration: "420ms",
    animationName: { default: drop, [media.reduce]: "none" },
    animationTimingFunction: SPRING,
    backgroundColor: "rgb(42 26 16 / 0.82)",
    display: "flex",
    gap: "0.5rem",
    borderRadius: 6,
    color: "#fff3df",
    fontFamily: font.mincho,
    fontSize: "0.78rem",
    fontWeight: 700,
    insetBlockStart: "0.8rem",
    insetInlineStart: "0.8rem",
    letterSpacing: "calc(0.3em * var(--track, 1))",
    margin: 0,
    paddingBlock: "0.25rem",
    paddingInline: "0.6rem",
    pointerEvents: "none",
    position: "absolute",
  },
  rareTag: {
    backgroundImage: "linear-gradient(135deg, #3a2608, #6b4510 55%, #3a2608)",
    boxShadow:
      "0 0 0 1px rgb(255 210 122 / 0.7), 0 6px 22px rgb(255 190 80 / 0.35)",
    color: GOLD,
  },
  rareMark: {
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    borderRadius: 4,
    color: "#2a1d05",
    fontSize: "0.68rem",
    paddingBlock: "0.05rem",
    paddingInline: "0.35rem",
  },
});

const percent = (value: number) => `${((value + SPAN / 2) / SPAN) * 100}%`;

const share = (value: number) => `${(value / SPAN) * 100}%`;

const Whole = ({ food, leaving }: { food: Food; leaving: boolean }) => {
  const scene = useId().replaceAll(":", "");
  return (
    <svg
      aria-hidden="true"
      viewBox={VIEW}
      {...stylex.props(styles.layer, styles.served, leaving && styles.cleared)}
    >
      {cutSvg(scene, food, null, 0)}
    </svg>
  );
};

const Parts = ({
  food,
  split,
  leaving,
}: {
  food: Food;
  split: Split;
  leaving: boolean;
}) => {
  const scene = useId().replaceAll(":", "");
  return (
    <>
      {layersOf(split).map(({ faces, half, key, side, turn }) => (
        <svg
          aria-hidden="true"
          key={key}
          viewBox={VIEW}
          {...stylex.props(
            styles.layer,
            styles.parted,
            styles.apart(
              share(side.push.x),
              share(side.push.y),
              `${turn * 1.6}deg`,
              `${percent(side.centre.x)} ${percent(side.centre.y)}`
            ),
            leaving && styles.cleared
          )}
        >
          {pieceSvg({
            chunks: side.chunks,
            faces,
            food,
            half,
            id: `${scene}-${key}`,
            split,
          })}
        </svg>
      ))}
      {split.sides.map((side, index) => {
        const tag = tagAt(side, 1);
        return (
          <span
            key={index === 0 ? "plus" : "minus"}
            {...stylex.props(
              styles.label,
              split.small === 500 && styles.even,
              styles.at(percent(tag.x), percent(tag.y))
            )}
          >
            {tenths(side.share)}%
          </span>
        );
      })}
    </>
  );
};

const Sweep = ({ slash }: { slash: Slash }) => {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const x = slash.from.x + (slash.to.x - slash.from.x) * k;
      const y = slash.from.y + (slash.to.y - slash.from.y) * k;
      ref.current?.setAttribute(
        "transform",
        `translate(${(x - slash.from.x).toFixed(4)} ${(y - slash.from.y).toFixed(4)})`
      );
      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [slash]);
  return (
    <g ref={ref}>
      {knifeSvg(slash.from, {
        x: slash.from.x * 2 - slash.to.x,
        y: slash.from.y * 2 - slash.to.y,
      })}
    </g>
  );
};

const line = (slash: Slash) =>
  `M${slash.from.x.toFixed(4)} ${slash.from.y.toFixed(4)}L${slash.to.x.toFixed(4)} ${slash.to.y.toFixed(4)}`;

const aimSlash = (food: Food, aim: Cut): Slash => {
  const reach = reachOf(food.parts, aim);
  const hit =
    Math.hypot(reach.to.x - reach.from.x, reach.to.y - reach.from.y) > 0.7;
  if (hit) {
    return reach;
  }
  const guide = lineOf(aim);
  return { from: pointOn(guide, -1.3), to: pointOn(guide, 1.3) };
};

interface BoardProps {
  view: View;
  trail: Slash | null;
  tag: string;
  rare: string | null;
  boxRef: Ref<HTMLDivElement>;
}

export const Board = ({ view, trail, tag, rare, boxRef }: BoardProps) => {
  const scene = useId().replaceAll(":", "");
  const leaving = view.beat === "clear";
  const aim = view.aim === null ? null : aimSlash(view.food, view.aim);
  const key = `${view.stage === "title" ? "demo" : "dish"}-${view.serving}`;
  return (
    <div {...stylex.props(styles.board)}>
      <svg
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 900 900"
        {...stylex.props(styles.wood)}
      >
        {woodSvg(scene, 900, 900)}
      </svg>
      <p
        key={`tag-${key}`}
        {...stylex.props(styles.tag, rare !== null && styles.rareTag)}
      >
        {rare === null ? null : (
          <span {...stylex.props(styles.rareMark)}>✦ {rare}</span>
        )}
        {tag}
      </p>
      <div ref={boxRef} {...stylex.props(styles.box)}>
        {view.split === null ? (
          <Whole key={key} leaving={leaving} food={view.food} />
        ) : (
          <Parts
            key={key}
            leaving={leaving}
            food={view.food}
            split={view.split}
          />
        )}
        <svg aria-hidden="true" viewBox={VIEW} {...stylex.props(styles.layer)}>
          {view.beat === "slice" && view.knife !== null ? (
            <Sweep slash={view.knife} />
          ) : null}
          {view.split !== null && view.knife !== null ? (
            <path
              d={line(view.knife)}
              key={`slash-${key}`}
              pathLength={1}
              stroke={ink.slash}
              strokeDasharray="1"
              strokeLinecap="round"
              strokeWidth={0.025}
              {...stylex.props(styles.slash)}
            />
          ) : null}
          {view.fumble?.slash ? (
            <path
              d={line(view.fumble.slash)}
              key={`fumble-${view.fumble.count}`}
              stroke={ink.nick}
              strokeDasharray={
                view.fumble.kind === "partial" ? undefined : "0.04 0.05"
              }
              strokeLinecap="round"
              strokeOpacity={0.6}
              strokeWidth={0.018}
              {...stylex.props(styles.fumble)}
            />
          ) : null}
          {trail === null ? null : (
            <>
              <path
                d={line(trail)}
                stroke={ink.guide}
                strokeDasharray="0.05 0.04"
                strokeLinecap="round"
                strokeOpacity={0.55}
                strokeWidth={0.014}
              />
              {knifeSvg(trail.to, trail.from)}
            </>
          )}
          {aim === null ? null : (
            <>
              <path
                d={line(aim)}
                stroke={ink.guide}
                strokeDasharray="0.05 0.04"
                strokeLinecap="round"
                strokeOpacity={0.7}
                strokeWidth={0.016}
              />
              {knifeSvg(aim.from, {
                x: aim.from.x * 2 - aim.to.x,
                y: aim.from.y * 2 - aim.to.y,
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
