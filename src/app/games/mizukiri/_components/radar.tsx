import * as stylex from "@stylexjs/stylex";

import { axes } from "../_lib/cosmetics";
import type { statsOf } from "../_lib/simulate";
import { useLang } from "./lang";
import { font, ink } from "./theme.stylex";

type Stats = ReturnType<typeof statsOf>;

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 78;

const point = (index: number, value: number) => {
  const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2;
  const reach = RADIUS * (0.12 + 0.88 * value);
  return [CENTER + Math.cos(angle) * reach, CENTER + Math.sin(angle) * reach];
};

const polygon = (stats: Stats) =>
  axes.map(({ key }, index) => point(index, stats[key]).join(",")).join(" ");

const styles = stylex.create({
  grid: {
    fill: "none",
    stroke: "rgb(255 255 255 / 0.16)",
  },
  area: {
    fill: "rgb(255 210 122 / 0.32)",
    stroke: "#ffd27a",
    strokeLinejoin: "round",
    strokeWidth: 2,
  },
  ghost: {
    fill: "rgb(255 255 255 / 0.08)",
    stroke: "rgb(255 255 255 / 0.85)",
    strokeDasharray: "4 4",
    strokeLinejoin: "round",
    strokeWidth: 1.5,
  },
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  figure: {
    margin: 0,
  },
  chart: {
    display: "block",
    height: "auto",
    marginInline: "auto",
    maxWidth: "15rem",
    width: "100%",
  },
  label: {
    fill: ink.text,
    fontFamily: font.mincho,
    fontSize: 13,
    fontWeight: 700,
  },
});

export const Radar = ({
  stats,
  preview,
}: {
  stats: Stats;
  preview: Stats | null;
}) => {
  const lang = useLang();
  return (
    <figure {...stylex.props(styles.figure)}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        {...stylex.props(styles.chart)}
      >
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={axes
              .map((_, index) => point(index, ring).join(","))
              .join(" ")}
            {...stylex.props(styles.grid)}
          />
        ))}
        {axes.map(({ key }, index) => {
          const [x, y] = point(index, 1);
          return (
            <line
              key={key}
              x1={CENTER}
              x2={x}
              y1={CENTER}
              y2={y}
              {...stylex.props(styles.grid)}
            />
          );
        })}
        <polygon points={polygon(stats)} {...stylex.props(styles.area)} />
        {preview === null ? null : (
          <polygon points={polygon(preview)} {...stylex.props(styles.ghost)} />
        )}
        {axes.map(({ key, label }, index) => {
          const [x = 0, y = 0] = point(index, 1.32);
          return (
            <text
              dominantBaseline="middle"
              key={key}
              textAnchor="middle"
              x={x}
              y={y}
              {...stylex.props(styles.label)}
            >
              {label[lang]}
            </text>
          );
        })}
      </svg>
      <figcaption {...stylex.props(styles.hidden)}>
        {axes
          .map(
            ({ key, label }) => `${label[lang]} ${Math.round(stats[key] * 100)}`
          )
          .join("、")}
      </figcaption>
    </figure>
  );
};
