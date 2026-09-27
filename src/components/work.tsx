import * as stylex from "@stylexjs/stylex";
import type { StaticImageData } from "next/image";

import hazumiShot from "@/assets/shots/hazumi.jpg";
import yamadaShot from "@/assets/shots/yamada.jpg";
import zenShot from "@/assets/shots/zen.jpg";
import { Arrow, MergedIcon } from "@/components/icons";
import { Shot } from "@/components/shot";
import { compact, day, fmt, splitTitle } from "@/lib/format";
import type { GitHub } from "@/lib/github";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { shared } from "@/styles/shared";

import { color, ease, font, media, shadow } from "../styles/tokens.stylex";

const styles = stylex.create({
  body: {
    color: color.muted,
    lineHeight: 1.75,
    marginBottom: "1.75rem",
    maxWidth: "36rem",
  },
  count: {
    color: color.muted,
    fontVariantNumeric: "tabular-nums",
  },
  heading: {
    fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
    letterSpacing: "-0.04em",
  },
  list: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
  },
  meta: {
    color: color.muted,
    fontSize: "0.9375rem",
    marginBottom: "1.25rem",
    marginTop: "0.45rem",
  },
  point: {
    color: color.muted,
    fontSize: "0.9375rem",
    paddingLeft: "1.1rem",
    position: "relative",
    "::before": {
      color: color.line,
      content: '"—"',
      left: 0,
      position: "absolute",
    },
  },
  points: {
    display: "grid",
    gap: "0.35rem",
    marginBottom: "1.5rem",
  },
  repoLink: {
    color: color.ink,
    fontWeight: 650,
    textDecorationColor: color.line,
  },
  row: {
    alignItems: "center",
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    columnGap: "1.5rem",
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    paddingBlock: "clamp(2.5rem, 5vw, 4rem)",
    rowGap: "2rem",
  },
  shot: {
    boxShadow: {
      default: "0 30px 60px -30px rgb(18 16 14 / 0.35)",
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: shadow.lift,
      },
    },
    transform: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "translateY(-6px)",
      },
    },
  },
  side: {
    display: "block",
    gridColumn: { default: "7 / -1", [media.tablet]: "1 / -1" },
    gridRow: { default: 1, [media.tablet]: "auto" },
    textDecoration: "none",
  },
  sideFlip: {
    gridColumn: { default: "1 / span 6", [media.tablet]: "1 / -1" },
  },
  stat: {
    borderLeftColor: { default: color.line, ":first-child": "transparent" },
    borderLeftStyle: "solid",
    borderLeftWidth: 1,
    color: color.muted,
    display: "grid",
    fontSize: "0.8125rem",
    paddingInline: { default: "1.25rem", ":first-child": "0 1.25rem" },
  },
  statValue: {
    color: color.ink,
    fontFamily: font.display,
    fontSize: "clamp(2rem, 3.4vw, 2.75rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 1.05,
    order: -1,
  },
  stats: {
    display: "flex",
    marginBottom: "1.75rem",
  },
  text: {
    gridColumn: { default: "1 / span 5", [media.tablet]: "1 / -1" },
  },
  textFlip: {
    gridColumn: { default: "8 / -1", [media.tablet]: "1 / -1" },
  },
  ticket: {
    backgroundColor: "rgb(255 255 255 / 0.95)",
    borderColor: "rgb(18 16 14 / 0.06)",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 16px 36px rgb(18 16 14 / 0.1)",
      [media.hover]: { default: null, ":hover": shadow.lift },
    },
    color: color.ink,
    display: "grid",
    gap: "0.2rem",
    paddingBlock: "0.95rem",
    paddingInline: "1.1rem",
    textDecoration: "none",
    transitionDuration: { default: "350ms, 250ms", ":active": "120ms, 250ms" },
    transitionProperty: "transform, box-shadow",
    transitionTimingFunction: `${ease.spring}, ease`,
    width: "min(100%, 320px)",
  },
  ticketName: {
    fontFamily: font.display,
    fontSize: "1.2rem",
    letterSpacing: "-0.03em",
  },
  ticketNote: {
    color: color.muted,
    fontSize: "0.76rem",
    fontVariantNumeric: "tabular-nums",
  },
  ticketNumber: {
    color: color.muted,
    fontWeight: 500,
  },
  ticketState: {
    alignItems: "center",
    backgroundColor: color.merged,
    borderRadius: 999,
    color: "#fff",
    display: "inline-flex",
    fontSize: "0.72rem",
    fontWeight: 650,
    gap: "0.35rem",
    justifySelf: "start",
    marginBottom: "0.35rem",
    paddingBlock: "0.2rem",
    paddingInline: "0.45rem 0.55rem",
  },
  ticketTitle: {
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    display: "-webkit-box",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    overflow: "hidden",
  },
  tickets: {
    backgroundImage:
      "radial-gradient(circle at 25% 80%, rgb(130 80 223 / 0.16), transparent 45%), radial-gradient(circle at 80% 20%, rgb(246 159 0 / 0.16), transparent 40%), linear-gradient(145deg, #f5f0ff, #fff4e0)",
    borderRadius: 28,
    display: "grid",
    gap: "0.9rem",
    justifyItems: "center",
    padding: "clamp(1.75rem, 5vw, 3rem)",
  },
});

const tilts = stylex.create({
  a: {
    transform: {
      default: "translateX(-10px) rotate(-2.5deg)",
      [media.hover]: { default: null, ":hover": "translateX(-10px)" },
      ":active": "translateX(-10px) rotate(-2.5deg) scale(0.97)",
    },
  },
  b: {
    transform: {
      default: "translateX(12px) rotate(2deg)",
      [media.hover]: { default: null, ":hover": "translateX(12px)" },
      ":active": "translateX(12px) rotate(2deg) scale(0.97)",
    },
  },
  c: {
    transform: {
      default: "translateX(-4px) rotate(-1deg)",
      [media.hover]: { default: null, ":hover": "translateX(-4px)" },
      ":active": "translateX(-4px) rotate(-1deg) scale(0.97)",
    },
  },
});
const tiltOrder = [tilts.a, tilts.b, tilts.c];

interface Project {
  body: string;
  href: string;
  name: string;
  points: string[];
  role: string;
  shot: StaticImageData;
  stats: { label: string; value: string }[];
}

const Stats = ({ stats }: { stats: Project["stats"] }) => (
  <dl {...stylex.props(styles.stats)}>
    {stats.map((stat) => (
      <div key={stat.label} {...stylex.props(styles.stat)}>
        <dt>{stat.label}</dt>
        <dd {...stylex.props(styles.statValue)}>{stat.value}</dd>
      </div>
    ))}
  </dl>
);

const Row = ({
  item,
  flip,
  locale,
}: {
  item: Project;
  flip: boolean;
  locale: Locale;
}) => {
  const t = getTranslator(locale);
  return (
    <li {...stylex.props(styles.row, shared.reveal)}>
      <div {...stylex.props(styles.text, flip && styles.textFlip)}>
        <h3 {...stylex.props(styles.heading)}>{item.name}</h3>
        <p {...stylex.props(styles.meta)}>{item.role}</p>
        <p {...stylex.props(styles.body)}>{item.body}</p>
        {item.stats.length > 0 && <Stats stats={item.stats} />}
        {item.points.length > 0 && (
          <ul {...stylex.props(styles.points)}>
            {item.points.map((point) => (
              <li key={point} {...stylex.props(styles.point)}>
                {point}
              </li>
            ))}
          </ul>
        )}
        <a
          href={item.href}
          {...stylex.props(shared.textLink, shared.pressable)}
        >
          {new URL(item.href).host} <Arrow />
        </a>
      </div>
      <a
        aria-label={`${t("work.visit", "Visit")} ${item.name}`}
        href={item.href}
        tabIndex={-1}
        {...stylex.props(
          styles.side,
          flip && styles.sideFlip,
          stylex.defaultMarker()
        )}
      >
        <Shot
          alt={`${item.name} — ${t("work.website", "website")}`}
          href={item.href}
          shot={item.shot}
          xstyle={styles.shot}
        />
      </a>
    </li>
  );
};

export const Work = ({
  locale,
  projects,
  upstream,
}: Pick<GitHub, "projects" | "upstream"> & {
  locale: Locale;
}) => {
  const t = getTranslator(locale);
  const upstreamNotes = new Map([
    [
      "anomalyco/opencode",
      t(
        "work.upstream.notes.opencode",
        "Japanese translations for the WSL integration, and a fix for cut-off labels in the language menu."
      ),
    ],
    [
      "dohooo/helmor",
      t(
        "work.upstream.notes.helmor",
        "A new sidebar view option, plus fixes for fish shell users, GitHub links and scripts."
      ),
    ],
    [
      "emilkowalski/sonner",
      t(
        "work.upstream.notes.sonner",
        "Support for more than one toast area on a page. It shipped in v2.0.7."
      ),
    ],
    [
      "pnpm/pnpm",
      t(
        "work.upstream.notes.pnpm",
        "Approving one project's build scripts no longer rebuilds a package other projects still share."
      ),
    ],
  ]);
  const work: Project[] = [
    {
      body: t(
        "work.zen.description",
        "Zen is a free, calm web browser built on Firefox, with over 44,000 stars on GitHub. I redesigned the download page, made the site lighter on older laptops and phones, added a Japanese version, and set up the checks that catch things before they break."
      ),
      href: "https://zen-browser.app",
      name: "Zen Browser",
      points: [
        t(
          "work.zen.points.performance",
          "Tailwind v4 migration and Turborepo performance work"
        ),
        t("work.zen.points.testing", "Playwright, Vitest and CI foundations"),
      ],
      role: t("work.zen.role", "Core Website Architect"),
      shot: zenShot,
      stats: [
        {
          label: t("work.stats.websitePrs", "website PRs merged"),
          value: fmt(projects.zen, locale),
        },
        { label: t("work.stats.firstPr", "first PR"), value: "2024" },
      ],
    },
    {
      body: t(
        "work.yamada.description",
        "A kit of ready-made pieces, like buttons, menus and pop-ups, that people use to build websites with React. I started helping in 2024 and I'm now one of its maintainers. I've built some of the pieces myself, and I review other people's changes too."
      ),
      href: "https://yamada-ui.com",
      name: "Yamada UI",
      points: [
        t(
          "work.yamada.points.notice",
          "Notice rebuilt on Sonner, after adding multi-toaster support to Sonner itself"
        ),
        t(
          "work.yamada.points.components",
          "New components: NativeAccordion, NativePopover, FormatNumber and FormatByte"
        ),
        t(
          "work.yamada.points.ci",
          "Faster CI: Turborepo caching, sharded browser tests, no runs on draft PRs"
        ),
        t(
          "work.yamada.points.testing",
          "Tests moved to real browsers with Vitest Browser Mode, plus a11y checks in Storybook"
        ),
      ],
      role: t("work.yamada.role", "Maintainer since Feb 2024"),
      shot: yamadaShot,
      stats: [
        {
          label: t("work.stats.mergedPrs", "PRs merged"),
          value: fmt(projects.yamada, locale),
        },
        {
          label: t("work.stats.issues", "issues opened"),
          value: fmt(projects.yamadaIssues, locale),
        },
      ],
    },
    {
      body: t(
        "work.hazumi.description",
        "My job. I build web apps at Hazumi, working remotely from Auckland."
      ),
      href: "https://hazumi.co.jp",
      name: "Hazumi",
      points: [],
      role: t("work.hazumi.role", "Software engineer since Nov 2025"),
      shot: hazumiShot,
      // Zero means the token can't read Hazumi's private repos, not no work.
      stats:
        projects.hazumi > 0
          ? [
              {
                label: t("work.stats.mergedPrs", "PRs merged"),
                value: fmt(projects.hazumi, locale),
              },
            ]
          : [],
    },
  ];
  const byReach = upstream.toSorted(
    (a, b) => (b.prs[0]?.stars ?? 0) - (a.prs[0]?.stars ?? 0)
  );

  return (
    <ul {...stylex.props(styles.list)}>
      {work.map((item, i) => (
        <Row locale={locale} flip={i % 2 === 1} item={item} key={item.name} />
      ))}

      {byReach.length > 0 && (
        <li {...stylex.props(styles.row, shared.reveal)}>
          <div {...stylex.props(styles.text, styles.textFlip)}>
            <h3 {...stylex.props(styles.heading)}>
              {t(
                "work.upstream.title",
                "Fixes in tools a lot of people install"
              )}
            </h3>
            <p {...stylex.props(styles.meta)}>
              {t("work.upstream.role", "Upstream, as I find them")}
            </p>
            <p {...stylex.props(styles.body)}>
              {t(
                "work.upstream.description",
                "I fix things where I find them, even in projects I don't help run. Everything here is merged, and new ones appear on their own."
              )}
            </p>
            <Stats
              stats={[
                {
                  label: t("work.stats.mergedPrs", "PRs merged"),
                  value: fmt(
                    byReach.reduce((n, r) => n + r.prs.length, 0),
                    locale
                  ),
                },
                {
                  label: t("work.stats.projects", "projects"),
                  value: fmt(byReach.length, locale),
                },
              ]}
            />
            <ul {...stylex.props(styles.points)}>
              {byReach.map(({ repo, prs }) => (
                <li key={repo} {...stylex.props(styles.point)}>
                  <a
                    href={`https://github.com/${repo}/pulls?q=is:pr+is:merged+author:taroj1205`}
                    {...stylex.props(styles.repoLink)}
                  >
                    {repo.split("/")[1]}
                  </a>
                  {prs.length > 1 && (
                    <span {...stylex.props(styles.count)}> ×{prs.length}</span>
                  )}
                  :{" "}
                  {upstreamNotes.get(repo) ??
                    splitTitle(prs[0]?.title ?? "").text}
                </li>
              ))}
            </ul>
          </div>
          <div {...stylex.props(styles.side, styles.sideFlip, styles.tickets)}>
            {byReach.slice(0, 3).map(({ repo, prs: [pr] }, i) =>
              pr === undefined ? null : (
                <a
                  href={pr.url}
                  key={repo}
                  {...stylex.props(styles.ticket, tiltOrder[i])}
                >
                  <span {...stylex.props(styles.ticketState)}>
                    <MergedIcon />
                    {t("work.merged", "Merged")}
                  </span>
                  <strong {...stylex.props(styles.ticketName)}>
                    {repo.split("/")[1]}{" "}
                    <span {...stylex.props(styles.ticketNumber)}>
                      #{pr.number}
                    </span>
                  </strong>
                  <span {...stylex.props(styles.ticketTitle)}>
                    {splitTitle(pr.title).text}
                  </span>
                  <small {...stylex.props(styles.ticketNote)}>
                    ★ {compact(pr.stars, locale)} ·{" "}
                    {t("work.mergedDate", "merged")} {day(pr.mergedAt, locale)}
                  </small>
                </a>
              )
            )}
          </div>
        </li>
      )}
    </ul>
  );
};
