import * as stylex from "@stylexjs/stylex";
import { useEffect } from "react";

import { font, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { SHOWN, formatGap, formatTime } from "../_lib/judge";
import { reveal } from "./reveal.stylex";

const GOLD = "#ffd27a";
const GAP = "#ff8a6a";
const MOON = "#f4f6ff";
const LEFT = 14;
const WIDTH = 332;
const MID = LEFT + WIDTH / 2;
const TRACK = 40;
const RULER = 112;
const ZOOM = 30;

const draw = stylex.keyframes({
  "0%": { strokeDashoffset: 1 },
  "100%": { strokeDashoffset: 0 },
});

const appear = stylex.keyframes({
  "0%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const pop = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.2)" },
  "60%": { opacity: 1, transform: "scale(1.35)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const ripple = stylex.keyframes({
  "0%": { opacity: 0.9, transform: "scale(0.6)" },
  "100%": { opacity: 0, transform: "scale(3.2)" },
});

const grow = stylex.keyframes({
  "0%": { transform: "scaleX(0)" },
  "100%": { transform: "scaleX(1)" },
});

const drop = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(-10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const styles = stylex.create({
  figure: {
    margin: 0,
  },
  caption: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  svg: {
    display: "block",
    height: "auto",
    overflow: "visible",
    width: "100%",
  },
  text: {
    fontFamily: font.mincho,
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  soft: {
    fontFamily: "inherit",
    fontWeight: 600,
    letterSpacing: "0.08em",
  },
  seen: {
    animationDuration: reveal.seen,
    animationFillMode: "backwards",
    animationName: { default: draw, [media.reduce]: "none" },
    animationTimingFunction: "linear",
  },
  unseen: {
    animationDelay: reveal.seen,
    animationDuration: reveal.unseen,
    animationFillMode: "backwards",
    animationName: { default: draw, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.3, 0, 0.2, 1)",
  },
  late: {
    animationDelay: reveal.at,
    animationDuration: "500ms",
    animationFillMode: "backwards",
    animationName: { default: appear, [media.reduce]: "none" },
  },
  intro: {
    animationDuration: "400ms",
    animationFillMode: "backwards",
    animationName: { default: appear, [media.reduce]: "none" },
  },
  marker: {
    animationDelay: reveal.at,
    animationDuration: "520ms",
    animationFillMode: "backwards",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1.2)",
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  ripple: {
    animationDelay: reveal.at,
    animationDuration: "1100ms",
    animationFillMode: "both",
    animationName: { default: ripple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    opacity: { default: null, [media.reduce]: 0 },
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  ruler: {
    animationDelay: reveal.ruler,
    animationDuration: "600ms",
    animationFillMode: "backwards",
    animationName: { default: appear, [media.reduce]: "none" },
  },
  band: {
    animationDelay: reveal.band,
    animationDuration: "700ms",
    animationFillMode: "backwards",
    animationName: { default: grow, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.3, 0.7, 0.2, 1)",
    transformBox: "fill-box",
  },
  fromLeft: {
    transformOrigin: "left center",
  },
  fromRight: {
    transformOrigin: "right center",
  },
  pin: {
    animationDelay: reveal.band,
    animationDuration: "700ms",
    animationFillMode: "backwards",
    animationName: { default: drop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1.1)",
  },
});

const secondsOf = (target: number, time: number) =>
  Math.max(Math.ceil(Math.max(target, time) / 100 + 0.8), 6);

interface TimelineProps {
  lang: Lang;
  target: number;
  time: number;
  id: string;
  onLand?: () => void;
}

export const Timeline = ({ lang, target, time, id, onLand }: TimelineProps) => {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onLand?.();
    }
  }, [onLand]);
  const words = copy[lang].timeline;
  const span = secondsOf(target, time) * 100;
  const at = (value: number) => LEFT + (value / span) * WIDTH;

  const ticks = Array.from(
    { length: span / 100 + 1 },
    (_, i) => i * 100
  ).filter((tick) => span <= 2000 || tick % 500 === 0);

  const gap = time - target;
  const near = Math.max(-ZOOM, Math.min(ZOOM, gap));
  const pinX = MID + (near / ZOOM) * (WIDTH / 2);
  const outside = Math.abs(gap) > ZOOM;
  const hiddenMid = (at(SHOWN) + at(time)) / 2;
  const roomy = at(time) - at(SHOWN) > 120;
  const crowded = at(time) - at(SHOWN) < 24;
  const side = gap > 0 ? "end" : "start";
  const fine = Array.from({ length: ZOOM * 2 + 1 }, (_, i) => i - ZOOM);

  return (
    <figure {...stylex.props(styles.figure)}>
      <figcaption {...stylex.props(styles.caption)}>
        {`${words.label}: ${formatTime(time)} / ${formatTime(target)} (${formatGap(gap)})`}
      </figcaption>
      <svg
        aria-hidden="true"
        viewBox="0 0 360 150"
        {...stylex.props(styles.svg)}
      >
        <defs>
          <filter
            height="300%"
            id={`${id}-glow`}
            width="300%"
            x="-100%"
            y="-100%"
          >
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <g {...stylex.props(styles.intro)}>
          {ticks.map((tick) => (
            <line
              key={tick}
              stroke={MOON}
              strokeOpacity="0.28"
              x1={at(tick)}
              x2={at(tick)}
              y1={TRACK - 3}
              y2={TRACK + 3}
            />
          ))}
          <line
            stroke={MOON}
            strokeOpacity="0.12"
            x1={LEFT}
            x2={LEFT + WIDTH}
            y1={TRACK}
            y2={TRACK}
          />
          <text
            fill={MOON}
            fillOpacity="0.55"
            fontSize="9"
            textAnchor="middle"
            x={at(0)}
            y={TRACK + 22}
            {...stylex.props(styles.text)}
          >
            0
          </text>
          {crowded ? null : (
            <text
              fill={MOON}
              fillOpacity="0.55"
              fontSize="9"
              textAnchor="middle"
              x={at(SHOWN)}
              y={TRACK + 22}
              {...stylex.props(styles.text)}
            >
              {formatTime(SHOWN)}
            </text>
          )}
          <line
            stroke={GOLD}
            strokeOpacity="0.85"
            strokeWidth="1.4"
            x1={at(target)}
            x2={at(target)}
            y1={TRACK - 13}
            y2={TRACK + 13}
          />
          <circle cx={at(target)} cy={TRACK - 19} fill={GOLD} r="3.6" />
          <text
            fill={GOLD}
            fontSize="10"
            textAnchor="middle"
            x={at(target)}
            y={TRACK - 27}
            {...stylex.props(styles.text)}
          >
            {formatTime(target)}
          </text>
        </g>
        <path
          d={`M${at(0)} ${TRACK}H${at(SHOWN)}`}
          fill="none"
          pathLength={1}
          stroke={MOON}
          strokeDasharray="1"
          strokeLinecap="round"
          strokeWidth="2.2"
          {...stylex.props(styles.seen)}
        />
        <path
          d={`M${at(SHOWN)} ${TRACK}H${at(time)}`}
          fill="none"
          pathLength={1}
          stroke={MOON}
          strokeDasharray="1"
          strokeLinecap="round"
          strokeOpacity="0.4"
          strokeWidth="1.4"
          {...stylex.props(styles.unseen)}
        />
        {roomy ? (
          <text
            fill={MOON}
            fillOpacity="0.5"
            fontSize="8.5"
            textAnchor="middle"
            x={hiddenMid}
            y={TRACK + 22}
            {...stylex.props(styles.soft, styles.late)}
          >
            {words.hidden}
          </text>
        ) : null}
        <circle
          cx={at(time)}
          cy={TRACK}
          fill="none"
          r="4"
          stroke={MOON}
          strokeWidth="1"
          {...stylex.props(styles.ripple)}
        />
        <g onAnimationStart={onLand} {...stylex.props(styles.marker)}>
          <circle
            cx={at(time)}
            cy={TRACK}
            fill={MOON}
            filter={`url(#${id}-glow)`}
            opacity="0.9"
            r="4.5"
          />
          <circle cx={at(time)} cy={TRACK} fill={MOON} r="3.6" />
        </g>
        <text
          fill={MOON}
          fontSize="10"
          textAnchor="middle"
          x={at(time)}
          y={TRACK + 22}
          {...stylex.props(styles.text, styles.late)}
        >
          {formatTime(time)}
        </text>

        <g {...stylex.props(styles.ruler)}>
          <text
            fill={MOON}
            fillOpacity="0.5"
            fontSize="8.5"
            textAnchor="middle"
            x={MID}
            y={RULER + 27}
            {...stylex.props(styles.soft)}
          >
            {`${words.zoom} ±${formatTime(ZOOM)}`}
          </text>
          <line
            stroke={MOON}
            strokeOpacity="0.3"
            x1={LEFT}
            x2={LEFT + WIDTH}
            y1={RULER}
            y2={RULER}
          />
          {fine.map((step) => {
            const x = MID + (step / ZOOM) * (WIDTH / 2);
            let size = 3;

            if (step % 10 === 0) {
              size = 9;
            } else if (step % 5 === 0) {
              size = 6;
            }

            return (
              <line
                key={step}
                stroke={MOON}
                strokeOpacity={step % 10 === 0 ? 0.6 : 0.3}
                x1={x}
                x2={x}
                y1={RULER}
                y2={RULER - size}
              />
            );
          })}
          {[-20, -10, 10, 20].map((step) => (
            <text
              fill={MOON}
              fillOpacity="0.45"
              fontSize="8"
              key={step}
              textAnchor="middle"
              x={MID + (step / ZOOM) * (WIDTH / 2)}
              y={RULER + 14}
              {...stylex.props(styles.text)}
            >
              {formatGap(step)}
            </text>
          ))}
          <line
            stroke={GOLD}
            strokeWidth="1.6"
            x1={MID}
            x2={MID}
            y1={RULER - 18}
            y2={RULER + 6}
          />
          <circle cx={MID} cy={RULER - 22} fill={GOLD} r="3" />
        </g>
        {gap === 0 ? null : (
          <rect
            fill={GAP}
            fillOpacity="0.55"
            height="5"
            rx="2.5"
            width={Math.abs(pinX - MID)}
            x={Math.min(pinX, MID)}
            y={RULER - 2.5}
            {...stylex.props(
              styles.band,
              gap > 0 ? styles.fromLeft : styles.fromRight
            )}
          />
        )}
        <g {...stylex.props(styles.pin)}>
          <path
            d={`M${pinX - 5} ${RULER - 20}h10l-5 8z`}
            fill={gap === 0 ? GOLD : MOON}
          />
          <line
            stroke={gap === 0 ? GOLD : MOON}
            strokeWidth="1.6"
            x1={pinX}
            x2={pinX}
            y1={RULER - 12}
            y2={RULER + 4}
          />
          {outside ? (
            <text
              fill={GAP}
              fontSize="9"
              textAnchor={side}
              x={pinX + (gap > 0 ? -9 : 9)}
              y={RULER - 12}
              {...stylex.props(styles.text)}
            >
              {gap > 0 ? "»" : "«"}
            </text>
          ) : null}
          <text
            fill={gap === 0 ? GOLD : GAP}
            fontSize="10"
            textAnchor={outside ? side : "middle"}
            x={pinX}
            y={RULER - 25}
            {...stylex.props(styles.text)}
          >
            {formatGap(gap)}
          </text>
        </g>
      </svg>
    </figure>
  );
};
