import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { Arrow } from "../../../components/icons";
import { ease, media } from "../../../styles/tokens.stylex";
import { ink } from "./theme.stylex";

const REPO_URL = "https://github.com/taroj1205/portfolio";
const GOLD = "#ffd27a";

const styles = stylex.create({
  link: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: {
      default: "rgb(255 210 122 / 0.06)",
      [media.hover]: { default: null, ":hover": "rgb(255 210 122 / 0.14)" },
    },
    borderColor: {
      default: "rgb(255 210 122 / 0.28)",
      [media.hover]: { default: null, ":hover": "rgb(255 210 122 / 0.6)" },
    },
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: {
      default: ink.soft,
      [media.hover]: { default: null, ":hover": ink.text },
    },
    display: "inline-flex",
    fontSize: "0.76rem",
    gap: "0.45rem",
    letterSpacing: "0.04em",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingBlock: "0.38rem",
    paddingInlineEnd: "0.7rem",
    paddingInlineStart: "0.8rem",
    textDecoration: "none",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "180ms",
    transitionProperty: "background-color, border-color, color, transform",
    transitionTimingFunction: ease.out,
  },
  star: {
    color: GOLD,
    filter: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: {
          default: "drop-shadow(0 0 5px rgb(255 210 122 / 0.8))",
          [media.reduce]: null,
        },
      },
    },
    flexShrink: 0,
    rotate: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: { default: "72deg", [media.reduce]: null },
      },
    },
    scale: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: { default: "1.2", [media.reduce]: null },
      },
    },
    transitionDuration: "420ms",
    transitionProperty: "rotate, scale, filter",
    transitionTimingFunction: ease.spring,
  },
  label: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0 0.5rem",
    justifyContent: "center",
  },
});

const StarMark = () => (
  <svg
    aria-hidden="true"
    height="14"
    viewBox="0 0 24 24"
    width="14"
    {...stylex.props(styles.star)}
  >
    <path
      d="M12 3.4l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.9 1.1-6L3.4 9.7l6-.8L12 3.4Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const StarLink = ({ children }: { children: ReactNode }) => (
  <a
    href={REPO_URL}
    rel="noopener noreferrer"
    target="_blank"
    {...stylex.props(styles.link, stylex.defaultMarker())}
  >
    <StarMark />
    <span {...stylex.props(styles.label)}>{children}</span>
    <Arrow />
  </a>
);
