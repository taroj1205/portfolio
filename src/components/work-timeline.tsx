import * as stylex from "@stylexjs/stylex";

import { shared } from "@/styles/shared";

import { color, ease, media } from "../styles/tokens.stylex";

const roles = [
  {
    end: "2024-02",
    org: "Westlake Boys High School",
    paid: true,
    role: "Teacher aide for international students",
    start: "2024-01",
  },
  { org: "Yamada UI", paid: false, role: "Maintainer", start: "2024-02" },
  {
    end: "2025-12",
    org: "YAGO",
    paid: true,
    role: "Teaching kids to code in Minecraft, over Zoom",
    start: "2024-07",
  },
  {
    org: "Zen Browser",
    paid: false,
    role: "Core website architect",
    start: "2024-10",
  },
  {
    end: "2025-10",
    org: "WDCC",
    paid: true,
    role: "Web developer in the uni web development club",
    start: "2025-04",
  },
  {
    org: "Hazumi",
    paid: true,
    role: "Software engineer, remote from Auckland",
    start: "2025-11",
  },
  {
    end: "2026-02",
    org: "Crie Anabuki",
    paid: true,
    role: "Temporary staff, on site in Ehime",
    start: "2025-12",
  },
];

const FIRST_YEAR = 2024;
const index = (ym: string) => {
  const [y = FIRST_YEAR, m = 1] = ym.split("-").map(Number);
  return (y - FIRST_YEAR) * 12 + m - 1;
};
const format = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleString("en-NZ", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

const grow = stylex.keyframes({ from: { transform: "scaleX(0)" } });

const styles = stylex.create({
  at: (left: string) => ({ left }),
  axis: {
    color: color.muted,
    fontSize: "0.875rem",
    height: "1.5rem",
    marginLeft: { default: "18.5rem", [media.tablet]: 0 },
    position: "relative",
  },
  axisLabel: {
    position: "absolute",
    translate: "-50% 0",
  },
  dates: {
    color: color.muted,
    fontSize: "0.8125rem",
    position: "absolute",
    top: "1.65rem",
    whiteSpace: "nowrap",
  },
  datesEnd: {
    left: "auto",
    right: 0,
  },
  key: {
    borderRadius: 3,
    height: "0.625rem",
    width: "1.5rem",
  },
  legend: {
    alignItems: "center",
    color: color.muted,
    columnGap: "1.5rem",
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.9375rem",
    marginBottom: "1.5rem",
    rowGap: "0.5rem",
  },
  legendItem: {
    alignItems: "center",
    display: "flex",
    gap: "0.5rem",
  },
  list: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
  },
  now: {
    color: color.ink,
    fontWeight: 600,
    translate: "-100% 0",
  },
  org: {
    fontSize: "1.125rem",
    letterSpacing: "-0.02em",
  },
  paid: {
    backgroundColor: color.cobalt,
  },
  role: {
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.4,
    marginTop: "0.15rem",
  },
  row: {
    alignItems: "center",
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    columnGap: "1.5rem",
    display: "grid",
    gridTemplateColumns: { default: "17rem 1fr", [media.tablet]: "1fr" },
    paddingBlock: "0.9rem",
    rowGap: "0.6rem",
  },
  segment: (left: string, width: string) => ({
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": grow,
      },
    },
    animationRange: "entry 40% cover 40%",
    animationTimeline: "view()",
    animationTimingFunction: ease.out,
    borderRadius: 4,
    height: "0.875rem",
    left,
    minWidth: "0.875rem",
    position: "absolute",
    top: "0.5rem",
    transformOrigin: "left",
    width,
  }),
  tick: {
    borderLeftColor: color.line,
    borderLeftStyle: "dashed",
    borderLeftWidth: 1,
    bottom: 0,
    position: "absolute",
    top: 0,
  },
  track: {
    height: "3.25rem",
    position: "relative",
  },
  volunteer: {
    backgroundColor: color.tangerine,
  },
});

export const WorkTimeline = ({ now }: { now: Date }) => {
  const months = index(now.toISOString().slice(0, 7)) + 1;
  const years = Array.from(
    { length: now.getUTCFullYear() - FIRST_YEAR + 1 },
    (_, i) => FIRST_YEAR + i
  ).map((y) => ({ left: `${(index(`${y}-01`) / months) * 100}%`, y }));

  return (
    <div>
      <p aria-hidden="true" {...stylex.props(styles.legend)}>
        <span {...stylex.props(styles.legendItem)}>
          <span {...stylex.props(styles.key, styles.paid)} />
          Work
        </span>
        <span {...stylex.props(styles.legendItem)}>
          <span {...stylex.props(styles.key, styles.volunteer)} />
          Open source, volunteer
        </span>
      </p>
      <div aria-hidden="true" {...stylex.props(styles.axis)}>
        {years.map((year) => (
          <span
            key={year.y}
            {...stylex.props(styles.axisLabel, styles.at(year.left))}
          >
            {year.y}
          </span>
        ))}
        <span
          {...stylex.props(styles.axisLabel, styles.now, styles.at("100%"))}
        >
          Now
        </span>
      </div>
      <ul {...stylex.props(styles.list)}>
        {roles.map((r) => {
          const from = index(r.start);
          const to = r.end === undefined ? months : index(r.end) + 1;
          const left = (from / months) * 100;
          return (
            <li key={r.org} {...stylex.props(styles.row, shared.reveal)}>
              <div>
                <h3 {...stylex.props(styles.org)}>{r.org}</h3>
                <p {...stylex.props(styles.role)}>{r.role}</p>
              </div>
              <div {...stylex.props(styles.track)}>
                {years.map((year) => (
                  <span
                    key={year.y}
                    {...stylex.props(styles.tick, styles.at(year.left))}
                  />
                ))}
                <span
                  {...stylex.props(
                    styles.segment(
                      `${left}%`,
                      `${((to - from) / months) * 100}%`
                    ),
                    r.paid ? styles.paid : styles.volunteer
                  )}
                />
                <span
                  {...stylex.props(
                    styles.dates,
                    left > 55 ? styles.datesEnd : styles.at(`${left}%`)
                  )}
                >
                  {format(r.start)} to{" "}
                  {r.end === undefined ? "now" : format(r.end)}
                  <span {...stylex.props(shared.srOnly)}>
                    {r.paid ? " (work)" : " (open source, volunteer)"}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
