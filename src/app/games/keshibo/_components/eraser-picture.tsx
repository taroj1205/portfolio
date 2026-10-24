import * as stylex from "@stylexjs/stylex";

import type { Design } from "../_lib/eraser";
import { isoEraser } from "../_lib/iso";

const PAD = 0.6;

const styles = stylex.create({
  picture: {
    display: "block",
    height: "100%",
    overflow: "visible",
    width: "100%",
  },
});

export const EraserPicture = ({ design }: { design: Design }) => {
  const { plates, x, y, width, height } = isoEraser(design);

  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`${x - PAD} ${y - PAD} ${width + PAD * 2} ${height + PAD * 2}`}
      {...stylex.props(styles.picture)}
    >
      {plates.map((plate) => (
        <polygon
          fill={plate.fill}
          key={`${plate.fill}${plate.points}`}
          opacity={plate.opacity}
          points={plate.points}
          stroke={plate.fill}
          strokeLinejoin="round"
          strokeWidth={0.02}
        />
      ))}
    </svg>
  );
};
