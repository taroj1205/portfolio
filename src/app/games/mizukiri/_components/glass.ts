import * as stylex from "@stylexjs/stylex";

export const glass = stylex.create({
  surface: {
    backdropFilter: "blur(18px) saturate(140%)",
    backgroundColor: "rgb(12 16 28 / 0.42)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderStyle: "solid",
    borderWidth: 1,
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
  },
});
