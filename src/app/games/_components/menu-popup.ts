import * as stylex from "@stylexjs/stylex";

import { ink, media } from "./theme.stylex";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const styles = stylex.create({
  popup: {
    backgroundColor: "rgb(13 16 26)",
    borderColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 18px 50px rgb(0 0 0 / 0.5)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: "12rem",
    outline: "none",
    padding: 6,
    transformOrigin: "var(--transform-origin)",
    transitionDuration: "180ms",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: EASE,
  },
  popupHidden: {
    opacity: 0,
    transform: { default: "scale(0.92)", [media.reduce]: "none" },
  },
  item: {
    alignItems: "center",
    borderRadius: 12,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 700,
    gap: "0.6rem",
    outline: "none",
    paddingBlock: "0.7rem",
    paddingInline: "0.8rem",
    textDecoration: "none",
    transitionDuration: "120ms",
    transitionProperty: "background-color",
    userSelect: "none",
  },
  highlighted: {
    backgroundColor: "rgb(255 255 255 / 0.1)",
  },
});

export const itemClass = (state: { highlighted: boolean }) =>
  stylex.props(styles.item, state.highlighted && styles.highlighted).className;

export const popupClass = (state: { transitionStatus: string | undefined }) =>
  stylex.props(
    styles.popup,
    (state.transitionStatus === "starting" ||
      state.transitionStatus === "ending") &&
      styles.popupHidden
  ).className;
