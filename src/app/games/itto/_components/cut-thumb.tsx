import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { useId } from "react";

import { SPAN } from "../_lib/foods";
import type { Piece } from "../_lib/result";
import { cutSvg } from "./food-svg";

export const CutThumb = ({
  piece,
  xstyle,
}: {
  piece: Piece;
  xstyle: StyleXStyles;
}) => {
  const scene = useId().replaceAll(":", "");

  return (
    <svg
      aria-hidden="true"
      viewBox={`${-SPAN / 2} ${-SPAN / 2} ${SPAN} ${SPAN}`}
      {...stylex.props(xstyle)}
    >
      {cutSvg(scene, piece.food, piece.split, 1.4)}
    </svg>
  );
};
