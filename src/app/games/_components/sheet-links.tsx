import * as stylex from "@stylexjs/stylex";
import Link from "next/link";

import { ease, media } from "../../../styles/tokens.stylex";
import type { Lang } from "../_lib/i18n";
import { StarLink } from "./star-link";
import { ink } from "./theme.stylex";

const styles = stylex.create({
  footer: {
    alignItems: "center",
    borderTopColor: "rgb(255 255 255 / 0.1)",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    columnGap: "1rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: "0.3rem",
    rowGap: "0.2rem",
  },
  link: {
    alignItems: "center",
    backgroundImage: "linear-gradient(currentColor, currentColor)",
    backgroundPosition: "0 calc(100% - 0.38rem)",
    backgroundRepeat: "no-repeat",
    backgroundSize: {
      default: "0% 1px",
      [media.hover]: { default: null, ":hover": "100% 1px" },
    },
    borderRadius: 8,
    color: {
      default: ink.soft,
      [media.hover]: { default: null, ":hover": ink.text },
    },
    display: "inline-flex",
    fontSize: "0.78rem",
    gap: "0.35rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    outlineColor: "#ffd27a",
    outlineOffset: 2,
    paddingBlock: "0.5rem",
    textDecoration: "none",
    transitionDuration: "240ms",
    transitionProperty: "background-size, color",
    transitionTimingFunction: ease.out,
  },
  arrow: {
    flexShrink: 0,
    transitionDuration: "240ms",
    transitionProperty: "translate",
    transitionTimingFunction: ease.out,
    translate: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: { default: "3px 0", [media.reduce]: null },
      },
    },
  },
  star: {
    display: "flex",
    flexBasis: "100%",
    justifyContent: "center",
    paddingBottom: "0.3rem",
  },
});

const Forward = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="12"
    viewBox="0 0 24 24"
    width="12"
    {...stylex.props(styles.arrow)}
  >
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    />
  </svg>
);

interface SheetLinkLabels {
  games: string;
  maker: string;
  star: string;
}

interface SheetLinksProps {
  lang: Lang;
  labels: SheetLinkLabels;
}

export const SheetLinks = ({ lang, labels }: SheetLinksProps) => (
  <div {...stylex.props(styles.footer)}>
    <Link href="/games" {...stylex.props(styles.link, stylex.defaultMarker())}>
      {labels.games}
      <Forward />
    </Link>
    <Link
      href={`/${lang}`}
      {...stylex.props(styles.link, stylex.defaultMarker())}
    >
      {labels.maker}
      <Forward />
    </Link>
    <div {...stylex.props(styles.star)}>
      <StarLink>{labels.star}</StarLink>
    </div>
  </div>
);
