"use client";

import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";
import type { PointerEvent } from "react";

import { fmt } from "@/lib/format";
import { useInView } from "@/lib/use-in-view";
import { shared } from "@/styles/shared";

import { color, ease, font, media } from "../styles/tokens.stylex";

interface Month {
  month: string;
  contributions: number;
}

const monthName = (month: string, style: "short" | "narrow") =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString("en-NZ", {
    month: style,
    timeZone: "UTC",
  });

const styles = stylex.create({
  bar: {
    display: "grid",
    gap: "0.5rem",
    gridTemplateRows: "1fr auto",
    height: "100%",
  },
  bars: {
    alignItems: "end",
    cursor: "crosshair",
    display: "grid",
    flexGrow: 1,
    gap: "clamp(4px, 1vw, 10px)",
    gridTemplateColumns: "repeat(12, 1fr)",
    minHeight: { default: 220, [media.narrow]: 170 },
    touchAction: "pan-y",
  },
  caption: {
    color: color.muted,
    fontSize: "0.85rem",
    marginTop: "1.25rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
  },
  fill: (height: number, index: number) => ({
    alignSelf: "end",
    backgroundColor: "#cfd8ff",
    borderRadius: "8px 8px 4px 4px",
    height: `max(4px, ${height * 100}%)`,
    transformOrigin: "bottom",
    transitionDelay: `${index * 45 + 100}ms, 0ms`,
    transitionDuration: "800ms, 150ms",
    transitionProperty: "transform, background-color",
    transitionTimingFunction: `${ease.out}, ease`,
  }),
  fillActive: {
    backgroundColor: color.cobalt,
  },
  fillCurrent: {
    backgroundImage:
      "repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.45) 0 4px, transparent 4px 8px)",
  },
  // Only hide the bars when JS will be there to grow them.
  fillHidden: {
    transform: { default: null, "@media (scripting: enabled)": "scaleY(0)" },
  },
  head: {
    alignItems: "flex-end",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    marginBottom: { default: "1.75rem", [media.narrow]: "1.25rem" },
  },
  month: {
    color: color.muted,
    fontSize: "0.75rem",
    textAlign: "center",
    transitionDuration: "150ms",
    transitionProperty: "color",
  },
  monthActive: {
    color: color.ink,
    fontWeight: 650,
  },
  narrow: {
    display: { default: "none", [media.narrow]: "inline" },
  },
  readout: {
    display: "grid",
    justifyItems: "end",
    textAlign: "right",
  },
  readoutMonth: {
    color: color.muted,
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  },
  readoutValue: {
    color: color.cobalt,
    fontFamily: font.display,
    fontSize: "1.6rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  total: {
    fontFamily: font.display,
    fontSize: "clamp(2.6rem, 6vw, 3.6rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 1,
    marginTop: "0.4rem",
  },
  wide: {
    display: { default: null, [media.narrow]: "none" },
  },
});

export const ContributionsChart = ({
  monthly,
  updated,
}: {
  monthly: Month[];
  updated: string;
}) => {
  const last = monthly.length - 1;
  const [active, setActive] = useState(last);
  const [chart, inView] = useInView<HTMLElement>();
  const readout = useRef<HTMLElement>(null);
  const peak = Math.max(...monthly.map((m) => m.contributions));
  const total = monthly.reduce((sum, m) => sum + m.contributions, 0);
  const label = (i: number) => {
    const month = monthly[i]?.month ?? "";
    return i === last
      ? `${monthName(month, "short")} so far`
      : `${monthName(month, "short")} ${month.slice(0, 4)}`;
  };

  const select = (i: number) => {
    if (i === active) {
      return;
    }
    setActive(i);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      readout.current?.animate(
        [
          { filter: "blur(4px)", opacity: 0.4, transform: "translateY(3px)" },
          { filter: "blur(0)", opacity: 1, transform: "none" },
        ],
        { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
      );
    }
  };

  const pick = (event: PointerEvent<HTMLOListElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const i = Math.floor(
      ((event.clientX - rect.left) / rect.width) * monthly.length
    );
    select(Math.min(last, Math.max(0, i)));
  };

  return (
    <figure ref={chart} {...stylex.props(shared.card, styles.card)}>
      <div {...stylex.props(styles.head)}>
        <div>
          <p {...stylex.props(shared.cardLabel)}>
            Contributions · last 12 months
          </p>
          <p {...stylex.props(styles.total)}>{fmt(total)}</p>
        </div>
        <p aria-hidden="true" {...stylex.props(styles.readout)}>
          <strong ref={readout} {...stylex.props(styles.readoutValue)}>
            {fmt(monthly[active]?.contributions ?? 0)}
          </strong>
          <span {...stylex.props(styles.readoutMonth)}>{label(active)}</span>
        </p>
      </div>
      <ol
        onPointerDown={pick}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            select(last);
          }
        }}
        onPointerMove={pick}
        {...stylex.props(styles.bars)}
      >
        {monthly.map((m, i) => (
          <li key={m.month} {...stylex.props(styles.bar)}>
            <span
              {...stylex.props(
                styles.fill(m.contributions / peak, i),
                i === last && styles.fillCurrent,
                i === active && styles.fillActive,
                !inView && styles.fillHidden
              )}
            />
            <span
              aria-hidden="true"
              {...stylex.props(
                styles.month,
                i === active && styles.monthActive
              )}
            >
              <span {...stylex.props(styles.narrow)}>
                {monthName(m.month, "narrow")}
              </span>
              <span {...stylex.props(styles.wide)}>
                {monthName(m.month, "short")}
              </span>
            </span>
            <span {...stylex.props(shared.srOnly)}>
              {label(i)}: {fmt(m.contributions)} contributions
            </span>
          </li>
        ))}
      </ol>
      <figcaption {...stylex.props(styles.caption)}>
        Updated {updated}
      </figcaption>
    </figure>
  );
};
