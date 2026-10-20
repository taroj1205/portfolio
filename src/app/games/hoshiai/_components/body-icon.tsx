import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { paintIcon } from "../_lib/paint";

const styles = stylex.create({
  icon: (size: string) => ({
    display: "block",
    flexShrink: 0,
    height: size,
    width: size,
  }),
});

export const BodyIcon = ({ tier, size }: { tier: number; size: string }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const observer = new ResizeObserver(() => {
      if (canvas) {
        paintIcon(canvas, tier);
      }
    });
    if (canvas) {
      paintIcon(canvas, tier);
      observer.observe(canvas);
    }
    return () => {
      observer.disconnect();
    };
  }, [tier]);
  return (
    <canvas aria-hidden="true" ref={ref} {...stylex.props(styles.icon(size))} />
  );
};
