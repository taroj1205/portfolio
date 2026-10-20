import { Popover } from "@base-ui/react/popover";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { axes } from "../_lib/cosmetics";
import type { Axis } from "../_lib/cosmetics";
import type { statsOf } from "../_lib/simulate";
import { useLang } from "./lang";
import { font, ink } from "./theme.stylex";

type Stats = ReturnType<typeof statsOf>;

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 78;
const HIT_WIDTH = 48;
const HIT_HEIGHT = 30;
const GOLD = "#ffd27a";

const point = (index: number, value: number) => {
  const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2;
  const reach = RADIUS * (0.12 + 0.88 * value);
  return [CENTER + Math.cos(angle) * reach, CENTER + Math.sin(angle) * reach];
};

const polygon = (stats: Stats, tier: number) =>
  axes
    .map(({ key }, index) => point(index, stats[key] / tier).join(","))
    .join(" ");

const tierOf = (...shown: Stats[]) =>
  Math.max(
    1,
    Math.ceil(Math.max(...shown.flatMap((s) => axes.map(({ key }) => s[key]))))
  );

const styles = stylex.create({
  rim: {
    fill: GOLD,
    fontFamily: font.mincho,
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  grid: {
    fill: "none",
    stroke: "rgb(255 255 255 / 0.16)",
  },
  area: {
    fill: "rgb(255 210 122 / 0.32)",
    stroke: GOLD,
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
  target: {
    cursor: "pointer",
    outline: { default: "none", ":focus-visible": `2px solid ${GOLD}` },
  },
  hit: {
    fill: "transparent",
  },
  label: {
    fill: ink.text,
    fontFamily: font.mincho,
    fontSize: 13,
    fontWeight: 700,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: "rgb(255 255 255 / 0.45)",
    textUnderlineOffset: 3,
  },
  labelOpen: {
    fill: GOLD,
  },
  positioner: {
    pointerEvents: "none",
    zIndex: 10,
  },
  popup: {
    backgroundColor: "rgb(13 16 26 / 0.96)",
    borderColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 14,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 18px 50px rgb(0 0 0 / 0.5)",
    color: ink.soft,
    maxWidth: "15rem",
    outline: "none",
    paddingBlock: "0.65rem",
    paddingInline: "0.8rem",
  },
  popupTitle: {
    color: ink.text,
    fontFamily: font.mincho,
    fontSize: "0.9rem",
    fontWeight: 700,
    margin: 0,
  },
  popupValue: {
    color: GOLD,
    fontVariantNumeric: "tabular-nums",
    marginInlineStart: "0.5rem",
  },
  popupNote: {
    fontSize: "0.8rem",
    lineHeight: 1.5,
    margin: 0,
    marginTop: "0.2rem",
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
  const [open, setOpen] = useState<Axis | null>(null);
  const tier = tierOf(...(preview === null ? [stats] : [stats, preview]));
  return (
    <figure {...stylex.props(styles.figure)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} {...stylex.props(styles.chart)}>
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
        <polygon points={polygon(stats, tier)} {...stylex.props(styles.area)} />
        {preview === null ? null : (
          <polygon
            points={polygon(preview, tier)}
            {...stylex.props(styles.ghost)}
          />
        )}
        {tier > 1 ? (
          <text
            aria-hidden="true"
            textAnchor="end"
            x={SIZE - 4}
            y={SIZE - 6}
            {...stylex.props(styles.rim)}
          >
            ×{tier}
          </text>
        ) : null}
        {axes.map(({ key, label, note }, index) => {
          const [x = 0, y = 0] = point(index, 1.32);
          return (
            <Popover.Root
              key={key}
              onOpenChange={(next) => {
                setOpen(next ? key : null);
              }}
              open={open === key}
            >
              <Popover.Trigger
                nativeButton={false}
                openOnHover
                render={<g {...stylex.props(styles.target)} />}
              >
                <rect
                  height={HIT_HEIGHT}
                  width={HIT_WIDTH}
                  x={x - HIT_WIDTH / 2}
                  y={y - HIT_HEIGHT / 2}
                  {...stylex.props(styles.hit)}
                />
                <text
                  dominantBaseline="middle"
                  textAnchor="middle"
                  x={x}
                  y={y}
                  {...stylex.props(
                    styles.label,
                    open === key && styles.labelOpen
                  )}
                >
                  {label[lang]}
                </text>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner
                  sideOffset={6}
                  {...stylex.props(styles.positioner)}
                >
                  <Popover.Popup {...stylex.props(styles.popup)}>
                    <Popover.Title {...stylex.props(styles.popupTitle)}>
                      {label[lang]}
                      <span {...stylex.props(styles.popupValue)}>
                        {Math.round(stats[key] * 100)}
                      </span>
                    </Popover.Title>
                    <Popover.Description {...stylex.props(styles.popupNote)}>
                      {note[lang]}
                    </Popover.Description>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
