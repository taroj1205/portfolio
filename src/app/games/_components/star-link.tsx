import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { media } from "../../../styles/tokens.stylex";
import { ink } from "./theme.stylex";

const REPO_URL = "https://github.com/taroj1205/portfolio";
const GOLD = "#ffd27a";

const styles = stylex.create({
  link: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 6,
    color: {
      default: ink.soft,
      [media.hover]: { default: null, ":hover": ink.text },
    },
    display: "inline-flex",
    fontSize: "0.78rem",
    gap: "0.4rem",
    letterSpacing: "0.06em",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingBlock: "0.35rem",
    textDecoration: {
      default: "none",
      [media.hover]: { default: null, ":hover": "underline" },
    },
    textUnderlineOffset: "0.2em",
    transitionDuration: "160ms",
    transitionProperty: "color",
  },
  star: {
    color: GOLD,
    flexShrink: 0,
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
    height="13"
    viewBox="0 0 24 24"
    width="13"
    {...stylex.props(styles.star)}
  >
    <path
      d="M12 3.4l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.9 1.1-6L3.4 9.7l6-.8L12 3.4Z"
      fill="currentColor"
      fillOpacity="0.28"
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
    {...stylex.props(styles.link)}
  >
    <StarMark />
    <span {...stylex.props(styles.label)}>{children}</span>
    <span aria-hidden="true">↗</span>
  </a>
);
