import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { media } from "../../../styles/tokens.stylex";
import { ink } from "./theme.stylex";

const REPO_URL = "https://github.com/taroj1205/portfolio";
const GOLD = "#ffd27a";

const styles = stylex.create({
  link: {
    alignItems: "center",
    alignSelf: "center",
    backdropFilter: "blur(14px)",
    backgroundColor: {
      default: "rgb(40 32 22 / 0.62)",
      [media.hover]: { default: null, ":hover": "rgb(70 54 28 / 0.7)" },
    },
    borderColor: {
      default: "rgb(255 210 122 / 0.4)",
      [media.hover]: { default: null, ":hover": "rgb(255 210 122 / 0.75)" },
    },
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    display: "inline-flex",
    fontSize: "0.82rem",
    fontWeight: 700,
    gap: "0.5rem",
    letterSpacing: "0.04em",
    minHeight: "2.5rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingInline: "1rem",
    textAlign: "center",
    textDecoration: "none",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform, background-color, border-color",
    WebkitBackdropFilter: "blur(14px)",
  },
  star: {
    color: GOLD,
    flexShrink: 0,
  },
  label: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.15rem 0.5rem",
    justifyContent: "center",
  },
});

const StarMark = () => (
  <svg
    aria-hidden="true"
    height="16"
    viewBox="0 0 24 24"
    width="16"
    {...stylex.props(styles.star)}
  >
    <path
      d="M12 3.4l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.9 1.1-6L3.4 9.7l6-.8L12 3.4Z"
      fill="currentColor"
      fillOpacity="0.28"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
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
  </a>
);
