import * as stylex from "@stylexjs/stylex";
import Image from "next/image";

import { ContributionsChart } from "@/components/contributions-chart";
import { Arrow } from "@/components/icons";
import { day, splitTitle } from "@/lib/format";
import type { GitHub } from "@/lib/github";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { shared } from "@/styles/shared";

import { color, ease, font, media } from "../styles/tokens.stylex";

const styles = stylex.create({
  avatar: {
    backgroundColor: color.paperDeep,
    borderRadius: 9,
  },
  date: {
    color: color.muted,
    fontSize: "0.8rem",
    fontVariantNumeric: "tabular-nums",
    gridArea: { default: null, [media.narrow]: "1 / 2" },
    justifySelf: { default: null, [media.narrow]: "end" },
    lineHeight: { default: null, [media.narrow]: 1.65 },
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gap: "1.15rem",
    gridTemplateColumns: {
      default: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
      [media.stack]: "1fr",
    },
  },
  feed: {
    display: "flex",
    flexDirection: "column",
  },
  item: {
    borderTopColor: {
      default: "rgb(228 220 209 / 0.7)",
      ":first-child": "transparent",
    },
    borderTopStyle: "solid",
    borderTopWidth: 1,
  },
  list: {
    flexBasis: 0,
    flexGrow: 1,
    marginTop: "0.75rem",
    maskImage: "linear-gradient(to bottom, #000 70%, transparent)",
    minHeight: { default: 0, [media.stack]: "26rem" },
    overflow: "hidden",
  },
  more: {
    marginTop: "1rem",
  },
  meta: {
    display: "grid",
    gap: "0.15rem",
    gridArea: { default: null, [media.narrow]: "1 / 2" },
    minWidth: 0,
  },
  number: {
    opacity: 0.75,
  },
  repo: {
    color: color.muted,
    fontSize: "0.8rem",
    overflow: "hidden",
    paddingRight: { default: null, [media.narrow]: "4rem" },
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  row: {
    alignItems: { default: "center", [media.narrow]: "start" },
    backgroundColor: {
      default: null,
      [media.hover]: { default: null, ":hover": color.paper },
    },
    borderRadius: 14,
    color: color.ink,
    display: "grid",
    gap: "0.85rem",
    gridTemplateColumns: {
      default: "32px minmax(0, 1fr) auto",
      [media.narrow]: "32px minmax(0, 1fr)",
    },
    marginInline: "-0.65rem",
    paddingBlock: "0.8rem",
    paddingInline: "0.65rem",
    textDecoration: "none",
    transform: { default: null, ":active": "scale(0.98)" },
    transitionDuration: "160ms, 150ms",
    transitionProperty: "transform, background-color",
    transitionTimingFunction: `${ease.out}, ease`,
  },
  title: {
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    display: "-webkit-box",
    fontSize: "0.95rem",
    fontWeight: 550,
    lineHeight: 1.4,
    overflow: "hidden",
  },
  type: {
    backgroundColor: color.paper,
    borderRadius: 6,
    color: color.muted,
    display: "inline-block",
    fontFamily: font.mono,
    fontSize: "0.72rem",
    fontWeight: 600,
    marginRight: "0.4rem",
    paddingBlock: "0.05rem",
    paddingInline: "0.4rem",
    verticalAlign: "0.1em",
  },
  typeFeat: {
    backgroundColor: color.cobaltSoft,
    color: color.cobaltDeep,
  },
  typeFix: {
    backgroundColor: color.tangerineSoft,
    color: color.tangerineInk,
  },
});

export const Lately = ({
  locale,
  monthly,
  recent,
  updated,
}: Pick<GitHub, "monthly" | "recent"> & {
  updated: string;
  locale: Locale;
}) => {
  const t = getTranslator(locale);
  return (
    <div {...stylex.props(styles.grid)}>
      <ContributionsChart locale={locale} monthly={monthly} updated={updated} />

      <div {...stylex.props(shared.card, styles.feed, shared.reveal)}>
        <p {...stylex.props(shared.cardLabel)}>
          {t("activity.recentlyMerged", "Recently merged")}
        </p>
        <ul {...stylex.props(styles.list)}>
          {recent.map((pr) => {
            const { type, text } = splitTitle(pr.title);
            const [owner = ""] = pr.repo.split("/");
            return (
              <li key={pr.url} {...stylex.props(styles.item)}>
                <a href={pr.url} {...stylex.props(styles.row)}>
                  <Image
                    alt=""
                    height={32}
                    src={`https://avatars.githubusercontent.com/${owner}?s=64`}
                    width={32}
                    {...stylex.props(styles.avatar)}
                  />
                  <span {...stylex.props(styles.meta)}>
                    <span {...stylex.props(styles.repo)}>
                      {pr.repo}{" "}
                      <span {...stylex.props(styles.number)}>#{pr.number}</span>
                    </span>
                    <span {...stylex.props(styles.title)}>
                      {type !== "" && (
                        <span
                          {...stylex.props(
                            styles.type,
                            type === "feat" && styles.typeFeat,
                            type === "fix" && styles.typeFix
                          )}
                        >
                          {type}
                        </span>
                      )}
                      {text}
                    </span>
                  </span>
                  <time dateTime={pr.mergedAt} {...stylex.props(styles.date)}>
                    {day(pr.mergedAt, locale)}
                  </time>
                </a>
              </li>
            );
          })}
        </ul>
        <a
          href="https://github.com/search?q=author%3Ataroj1205+is%3Apr+is%3Amerged&type=pullrequests&s=updated&o=desc"
          {...stylex.props(shared.textLink, shared.pressable, styles.more)}
        >
          {t("activity.allMerged", "Every merged PR on GitHub")}
          <Arrow />
        </a>
      </div>
    </div>
  );
};
