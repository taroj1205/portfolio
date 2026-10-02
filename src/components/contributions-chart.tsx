"use client";

import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Count } from "@/components/count";
import { fmt } from "@/lib/format";
import { getTranslator, intlLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useInView } from "@/lib/use-in-view";
import { shared } from "@/styles/shared";

import { color, ease, font, media } from "../styles/tokens.stylex";

interface Month {
  month: string;
  contributions: number;
}

const monthName = (month: string, style: "short" | "narrow", locale: Locale) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString(intlLocale(locale), {
    month: style,
    timeZone: "UTC",
  });

const VISIBLE = 13;
const FADE = "2.5rem";
const GUTTER = "clamp(2px, 0.5vw, 5px)";
const CRAMPED = "@container (max-width: 460px)";

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const styles = stylex.create({
  bar: {
    appearance: "none",
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "inherit",
    cursor: "crosshair",
    display: "grid",
    font: "inherit",
    gridTemplateColumns: "minmax(0, 1fr)",
    gridTemplateRows: "1.75rem 1fr auto auto",
    height: "100%",
    paddingBlock: 0,
    paddingInline: GUTTER,
    position: "relative",
    width: "100%",
  },
  bars: {
    display: "grid",
    flexShrink: 0,
    gridAutoColumns: `calc((100cqi - ${FADE}) / ${VISIBLE})`,
    gridAutoFlow: "column",
    minHeight: { default: 250, [media.narrow]: 200 },
    paddingLeft: FADE,
  },
  caption: {
    alignItems: "center",
    color: color.muted,
    columnGap: "1rem",
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.85rem",
    justifyContent: "space-between",
    marginTop: "1rem",
    rowGap: "0.5rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
  },
  fill: (height: number, order: number) => ({
    alignSelf: "end",
    backgroundColor: "#cfd8ff",
    borderRadius: "8px 8px 4px 4px",
    gridColumn: 1,
    gridRow: 2,
    height: `max(4px, ${height * 100}%)`,
    transformOrigin: "bottom",
    transitionDelay: `${order * 45 + 100}ms, 0ms`,
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
  flag: {
    color: color.ink,
    fontSize: "0.75rem",
    fontWeight: 650,
    left: "0.45rem",
    position: "absolute",
    top: "-0.1rem",
    whiteSpace: "nowrap",
  },
  head: {
    alignItems: "flex-end",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    marginBottom: { default: "1.75rem", [media.narrow]: "1.25rem" },
  },
  marker: (order: number) => ({
    borderLeftColor: color.ink,
    borderLeftStyle: "dashed",
    borderLeftWidth: 1,
    gridColumn: 1,
    gridRow: "1 / 3",
    justifySelf: "start",
    marginLeft: `calc(-1 * ${GUTTER})`,
    position: "relative",
    transformOrigin: "bottom",
    transitionDelay: `${order * 45 + 500}ms`,
    transitionDuration: "700ms",
    transitionProperty: "transform, opacity",
    transitionTimingFunction: ease.out,
  }),
  markerHidden: {
    opacity: { default: null, "@media (scripting: enabled)": 0 },
    transform: { default: null, "@media (scripting: enabled)": "scaleY(0)" },
  },
  month: {
    color: color.muted,
    fontSize: "0.75rem",
    gridRow: 3,
    marginTop: "0.5rem",
    textAlign: "center",
    transitionDuration: "150ms",
    transitionProperty: "color",
  },
  monthActive: {
    color: color.ink,
    fontWeight: 650,
  },
  narrow: {
    display: { default: "none", [CRAMPED]: "inline" },
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
  scroller: {
    containerType: "inline-size",
    display: "flex",
    flexDirection: "row-reverse",
    flexGrow: 1,
    maskImage: `linear-gradient(to right, transparent, #000 ${FADE})`,
    overflowX: "auto",
    overscrollBehaviorX: "contain",
    paddingBottom: "0.75rem",
    scrollPaddingLeft: FADE,
    scrollbarColor: `${color.line} transparent`,
    scrollbarWidth: "thin",
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
    display: { default: null, [CRAMPED]: "none" },
  },
  jump: {
    appearance: "none",
    backgroundColor: {
      default: "transparent",
      [media.hover]: { default: null, ":hover": color.paper },
    },
    borderRadius: 999,
    borderWidth: 0,
    color: color.muted,
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.8rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 650,
    paddingBlock: "0.3rem",
    paddingInline: "0.65rem",
    transform: { default: null, ":active": "scale(0.94)" },
    transitionDuration: "160ms",
    transitionProperty: "background-color, color, transform",
    transitionTimingFunction: ease.out,
  },
  jumpActive: {
    backgroundColor: color.cobaltSoft,
    color: color.cobaltDeep,
  },
  jumps: {
    display: "flex",
    gap: "0.15rem",
  },
  year: {
    color: color.muted,
    fontSize: "0.7rem",
    fontWeight: 650,
    gridRow: 4,
    height: "1rem",
    letterSpacing: "0.04em",
    marginTop: "0.15rem",
    whiteSpace: "nowrap",
  },
});

export const ContributionsChart = ({
  locale,
  monthly,
  total,
  updated,
}: {
  locale: Locale;
  monthly: Month[];
  total: number;
  updated: string;
}) => {
  const t = getTranslator(locale);
  const milestones = new Map([
    [
      "2024-02",
      {
        long: t("activity.milestones.yamada", "Started helping on Yamada UI"),
        short: "Yamada UI",
      },
    ],
    [
      "2024-10",
      {
        long: t("activity.milestones.zen", "Joined Zen Browser"),
        short: "Zen",
      },
    ],
    [
      "2025-11",
      {
        long: t("activity.milestones.hazumi", "Started at Hazumi"),
        short: "Hazumi",
      },
    ],
  ]);
  const last = monthly.length - 1;
  const firstVisible = last - VISIBLE + 1;
  const [active, setActive] = useState(last);
  const [chart, inView] = useInView<HTMLElement>();
  const readout = useRef<HTMLElement>(null);
  const bars = useRef<HTMLOListElement>(null);
  const peak = Math.max(...monthly.map((m) => m.contributions));
  const label = (i: number) => {
    const month = monthly[i]?.month ?? "";
    return i === last
      ? `${monthName(month, "short", locale)} ${t("activity.soFar", "so far")}`
      : new Date(`${month}-01T00:00:00Z`).toLocaleString(intlLocale(locale), {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
  };

  const select = (i: number) => {
    if (i === active) {
      return;
    }
    setActive(i);
    if (!calm()) {
      readout.current?.animate(
        [
          { filter: "blur(4px)", opacity: 0.4, transform: "translateY(3px)" },
          { filter: "blur(0)", opacity: 1, transform: "none" },
        ],
        { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
      );
    }
  };

  const moves = new Map([
    ["ArrowLeft", -1],
    ["ArrowRight", 1],
    ["Home", -last],
    ["End", last],
  ]);
  const reveal = (i: number, inline: ScrollLogicalPosition) => {
    const bar = bars.current?.querySelectorAll("button")[i];
    bar?.scrollIntoView({
      behavior: calm() ? "auto" : "smooth",
      block: "nearest",
      inline,
    });
    return bar;
  };
  const step = (event: KeyboardEvent<HTMLButtonElement>) => {
    const move = moves.get(event.key);
    if (move === undefined) {
      return;
    }
    event.preventDefault();
    reveal(Math.min(last, Math.max(0, active + move)), "nearest")?.focus({
      preventScroll: true,
    });
  };
  const years = [...new Set(monthly.map((m) => m.month.slice(0, 4)))];
  const activeYear = monthly[active]?.month.slice(0, 4);

  return (
    <figure ref={chart} {...stylex.props(shared.card, styles.card)}>
      <div {...stylex.props(styles.head)}>
        <div>
          <p {...stylex.props(shared.cardLabel)}>
            {t("activity.contributions", "Contributions · last 12 months")}
          </p>
          <p {...stylex.props(styles.total)}>
            <Count locale={locale} value={total} />
          </p>
        </div>
        <p aria-hidden="true" {...stylex.props(styles.readout)}>
          <strong ref={readout} {...stylex.props(styles.readoutValue)}>
            {fmt(monthly[active]?.contributions ?? 0, locale)}
          </strong>
          <span {...stylex.props(styles.readoutMonth)}>{label(active)}</span>
        </p>
      </div>
      <div {...stylex.props(styles.scroller)}>
        <ol
          aria-label={t(
            "activity.history",
            "Contributions each month since 2023"
          )}
          ref={bars}
          {...stylex.props(styles.bars)}
        >
          {monthly.map((m, i) => {
            const order = Math.max(0, i - firstVisible);
            const milestone = milestones.get(m.month);
            return (
              <li key={m.month}>
                <button
                  aria-label={`${label(i)}: ${fmt(m.contributions, locale)} ${t("activity.contributionCount", "contributions")}${milestone ? `. ${milestone.long}` : ""}`}
                  onClick={() => {
                    select(i);
                  }}
                  onFocus={() => {
                    select(i);
                  }}
                  onKeyDown={step}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") {
                      select(i);
                    }
                  }}
                  tabIndex={i === active ? 0 : -1}
                  type="button"
                  {...stylex.props(styles.bar)}
                >
                  {milestone && (
                    <span
                      {...stylex.props(
                        styles.marker(order),
                        !inView && styles.markerHidden
                      )}
                    >
                      <span {...stylex.props(styles.flag)}>
                        <span {...stylex.props(styles.narrow)}>
                          {milestone.short}
                        </span>
                        <span {...stylex.props(styles.wide)}>
                          {milestone.long}
                        </span>
                      </span>
                    </span>
                  )}
                  <span
                    {...stylex.props(
                      styles.fill(m.contributions / peak, order),
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
                      {monthName(m.month, "narrow", locale)}
                    </span>
                    <span {...stylex.props(styles.wide)}>
                      {monthName(m.month, "short", locale)}
                    </span>
                  </span>
                  <span aria-hidden="true" {...stylex.props(styles.year)}>
                    {i === 0 || m.month.endsWith("-01")
                      ? m.month.slice(0, 4)
                      : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption {...stylex.props(styles.caption)}>
        <span>
          {t("activity.updated", "Updated")} {updated}
        </span>
        <span {...stylex.props(styles.jumps)}>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => {
                const i = monthly.findIndex((m) => m.month.startsWith(year));
                select(i);
                reveal(i, "start");
              }}
              type="button"
              {...stylex.props(
                styles.jump,
                year === activeYear && styles.jumpActive
              )}
            >
              {year}
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  );
};
