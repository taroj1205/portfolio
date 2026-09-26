"use client";

import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { land } from "@/lib/land";
import { useInView } from "@/lib/use-in-view";
import { shared } from "@/styles/shared";

import { color, ease, font, media, shadow } from "../styles/tokens.stylex";

const W = 600;
const H = 722;
// The land path spans 108°E–182°E and 42°N–47°S.
const x = (lon: number) => ((lon - 108) / 74) * W;
const y = (lat: number) => ((42 - lat) / 89) * H;

const meridians = [110, 120, 130, 140, 150, 160, 170, 180].map(x);
const parallels = [40, 30, 20, 10, -10, -20, -30, -40].map(y);
const EQUATOR = y(0);

const tokyo = [257, 51] as const;
const ehime = [201, 66] as const;
const philippines = [129, 257] as const;
const auckland = [541, 639] as const;

const route = [
  `M${tokyo.join(",")}`,
  `Q229,26 ${ehime.join(",")}`,
  `Q480,240 ${auckland.join(",")}`,
  `Q250,600 ${philippines.join(",")}`,
  `Q420,400 ${auckland.join(",")}`,
].join(" ");

// `delay` roughly matches when the drawing route reaches each place.
const places = [
  { at: tokyo, delay: 0, dy: 0, left: false, name: "Tokyo", stops: [0] },
  { at: ehime, delay: 250, dy: 18, left: true, name: "Ehime", stops: [1] },
  {
    at: auckland,
    delay: 1250,
    dy: 0,
    left: true,
    name: "Auckland",
    stops: [2, 4],
  },
  {
    at: philippines,
    delay: 1900,
    dy: 0,
    left: false,
    name: "Philippines",
    stops: [3],
  },
];

const stops = [
  { place: "Tokyo", text: "Born here in 2005." },
  { place: "Ehime", text: "Moved here after the 2011 earthquake." },
  { place: "Auckland", text: "A year at an intermediate school." },
  {
    place: "The Philippines",
    text: "Three months learning English in Cebu, then a year at a British school.",
  },
  {
    place: "Auckland",
    text: "Back for good in 2019. Westlake Boys, then the University of Auckland.",
  },
];

const styles = stylex.create({
  at: (left: string, top: string) => ({ left, top }),
  chip: (dy: number, delay: number) => ({
    alignItems: "center",
    backgroundColor: color.surface,
    borderRadius: 999,
    boxShadow: "0 6px 18px rgb(18 16 14 / 0.12)",
    color: color.ink,
    display: "flex",
    fontSize: { default: "0.875rem", [media.narrow]: "0.75rem" },
    fontWeight: 650,
    gap: "0.4rem",
    left: 14,
    paddingBlock: "0.25rem",
    paddingInline: "0.25rem 0.7rem",
    position: "absolute",
    top: `${dy}px`,
    transformOrigin: "left center",
    transitionDelay: `${delay + 200}ms, 0ms, 0ms, 0ms`,
    transitionDuration: "500ms, 500ms, 200ms, 200ms",
    transitionProperty: "opacity, scale, background-color, color",
    transitionTimingFunction: `${ease.out}, ${ease.spring}, ease, ease`,
    translate: "0 -50%",
    whiteSpace: "nowrap",
  }),
  chipActive: {
    backgroundColor: color.ink,
    color: "#fff",
  },
  chipHidden: {
    opacity: { default: null, "@media (scripting: enabled)": 0 },
    scale: { default: null, "@media (scripting: enabled)": 0.6 },
  },
  chipLeft: {
    left: "auto",
    right: 14,
    transformOrigin: "right center",
  },
  dot: {
    backgroundColor: color.ink,
    borderColor: "#fff",
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 3,
    boxShadow: "0 2px 6px rgb(18 16 14 / 0.3)",
    height: 14,
    left: -7,
    position: "absolute",
    top: -7,
    transitionDuration: "200ms",
    transitionProperty: "scale",
    transitionTimingFunction: ease.spring,
    width: 14,
  },
  dotActive: {
    scale: 1.35,
  },
  equator: {
    stroke: "#8e9bb5",
    strokeDasharray: "2 6",
  },
  equatorLabel: {
    fill: "#7c89a3",
    fontSize: 14,
    letterSpacing: "0.08em",
  },
  frame: {
    backgroundColor: "#e7ecf5",
    borderColor: color.line,
    borderRadius: 28,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.soft,
    gridColumn: { default: "1 / span 6", [media.tablet]: "1 / -1" },
    marginBottom: { default: null, [media.tablet]: "2.5rem" },
    overflow: "hidden",
    position: "relative",
  },
  grid: {
    stroke: "rgb(255 255 255 / 0.75)",
    strokeWidth: 1,
  },
  land: {
    fill: color.paper,
    stroke: "#d9cfc0",
    strokeLinejoin: "round",
    strokeWidth: 0.75,
  },
  map: {
    display: "block",
    height: "auto",
    width: "100%",
  },
  num: {
    alignItems: "center",
    backgroundColor: color.tangerine,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    fontSize: "0.75em",
    height: "1.6em",
    justifyContent: "center",
    minWidth: "1.6em",
    paddingInline: "0.35em",
  },
  pin: {
    height: 0,
    position: "absolute",
    width: 0,
  },
  // The route draws itself once, the first time the map comes into view.
  route: {
    fill: "none",
    stroke: color.tangerine,
    strokeDasharray: 1,
    strokeDashoffset: 0,
    strokeLinecap: "round",
    strokeWidth: 3,
    transitionDuration: "2600ms",
    transitionProperty: "stroke-dashoffset",
    transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  routeGlow: {
    opacity: 0.2,
    strokeWidth: 10,
  },
  routeHidden: {
    strokeDashoffset: { default: null, "@media (scripting: enabled)": 1 },
  },
  stop: {
    columnGap: "1rem",
    display: "grid",
    gridTemplateColumns: "2rem 1fr",
    paddingBottom: "1.75rem",
    position: "relative",
    // The rail joining each stop to the next.
    "::before": {
      backgroundColor: color.line,
      bottom: 0,
      content: '""',
      left: "calc(1rem - 1px)",
      position: "absolute",
      top: "2.35rem",
      width: 2,
    },
  },
  stopLast: {
    paddingBottom: 0,
    "::before": { display: "none" },
  },
  stopNumber: {
    alignItems: "center",
    backgroundColor: color.paper,
    borderColor: color.tangerine,
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 2,
    color: color.tangerineInk,
    display: "flex",
    fontFamily: font.display,
    fontSize: "0.9rem",
    fontWeight: 750,
    gridRow: "span 2",
    height: "2rem",
    justifyContent: "center",
    transitionDuration: "200ms",
    transitionProperty: "background-color, color",
    width: "2rem",
  },
  stopNumberActive: {
    backgroundColor: color.tangerine,
    color: "#fff",
  },
  stopPlace: {
    fontSize: "1.25rem",
    letterSpacing: "-0.02em",
    lineHeight: "2rem",
  },
  stopText: {
    color: color.muted,
    fontSize: "1rem",
  },
  stops: {
    alignSelf: "center",
    gridColumn: { default: "8 / -1", [media.tablet]: "1 / -1" },
  },
  wrap: {
    columnGap: "1.5rem",
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
  },
});

// Pointing at a stop in the list lights up its pin on the map.
export const JourneyMap = () => {
  const [frame, inView] = useInView<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  return (
    <div {...stylex.props(styles.wrap)}>
      <div ref={frame} {...stylex.props(styles.frame)}>
        <svg viewBox={`0 0 ${W} ${H}`} {...stylex.props(styles.map)}>
          <title>
            Map from Japan to New Zealand showing the places I&apos;ve lived, in
            order: Tokyo, Ehime, Auckland, the Philippines, and back to
            Auckland.
          </title>
          <g {...stylex.props(styles.grid)}>
            {meridians.map((mx) => (
              <line key={mx} x1={mx} x2={mx} y1="0" y2={H} />
            ))}
            {parallels.map((py) => (
              <line key={py} x1="0" x2={W} y1={py} y2={py} />
            ))}
          </g>
          <path d={land} {...stylex.props(styles.land)} />
          <line
            x1="0"
            x2={W}
            y1={EQUATOR}
            y2={EQUATOR}
            {...stylex.props(styles.equator)}
          />
          <text x="16" y={EQUATOR - 10} {...stylex.props(styles.equatorLabel)}>
            EQUATOR
          </text>
          {[styles.routeGlow, null].map((extra, i) => (
            <path
              d={route}
              key={i}
              pathLength={1}
              {...stylex.props(
                styles.route,
                extra,
                !inView && styles.routeHidden
              )}
            />
          ))}
        </svg>

        {places.map((p) => {
          const lit = active !== null && p.stops.includes(active);
          return (
            <span
              aria-hidden="true"
              key={p.name}
              {...stylex.props(
                styles.pin,
                styles.at(`${(p.at[0] / W) * 100}%`, `${(p.at[1] / H) * 100}%`)
              )}
            >
              <span {...stylex.props(styles.dot, lit && styles.dotActive)} />
              <span
                {...stylex.props(
                  styles.chip(p.dy, p.delay),
                  p.left && styles.chipLeft,
                  lit && styles.chipActive,
                  !inView && styles.chipHidden
                )}
              >
                {p.stops.map((s) => (
                  <span key={s} {...stylex.props(styles.num)}>
                    {s + 1}
                  </span>
                ))}
                {p.name}
              </span>
            </span>
          );
        })}
      </div>

      <ol {...stylex.props(styles.stops)}>
        {stops.map((stop, i) => (
          <li
            key={`${stop.place}-${i}`}
            onPointerEnter={() => {
              setActive(i);
            }}
            onPointerLeave={() => {
              setActive(null);
            }}
            {...stylex.props(
              styles.stop,
              i === stops.length - 1 && styles.stopLast,
              shared.reveal
            )}
          >
            <span
              aria-hidden="true"
              {...stylex.props(
                styles.stopNumber,
                i === active && styles.stopNumberActive
              )}
            >
              {i + 1}
            </span>
            <h3 {...stylex.props(styles.stopPlace)}>{stop.place}</h3>
            <p {...stylex.props(styles.stopText)}>{stop.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
};
