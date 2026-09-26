import * as stylex from "@stylexjs/stylex";

import { ease, media } from "../styles/tokens.stylex";

const styles = stylex.create({
  arrow: {
    flexShrink: 0,
    transitionDuration: "200ms",
    transitionProperty: "translate",
    transitionTimingFunction: ease.out,
    translate: {
      default: null,
      [stylex.when.ancestor(":hover")]: {
        default: null,
        [media.hover]: "2px -2px",
      },
    },
  },
});

// Nudges up and right when the nearest stylex.defaultMarker() is hovered.
export const Arrow = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="14"
    viewBox="0 0 24 24"
    width="14"
    {...stylex.props(styles.arrow)}
  >
    <path
      d="M7 17L17 7M9 7h8v8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    />
  </svg>
);

export const MergedIcon = () => (
  <svg aria-hidden="true" height="12" viewBox="0 0 16 16" width="12">
    <path
      d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"
      fill="currentColor"
    />
  </svg>
);
