import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import Image from "next/image";
import type { StaticImageData } from "next/image";

import { shared } from "@/styles/shared";

import { color, ease } from "../styles/tokens.stylex";

const styles = stylex.create({
  bar: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: color.muted,
    display: "block",
    fontSize: "0.72rem",
    paddingBlock: "0.4rem",
    paddingInline: "0.75rem",
    position: "relative",
    textAlign: "center",
  },
  dots: {
    backgroundColor: color.line,
    borderRadius: "50%",
    boxShadow: `11px 0 ${color.line}, 22px 0 ${color.line}`,
    height: 7,
    left: "0.75rem",
    position: "absolute",
    top: "50%",
    translate: "0 -50%",
    width: 7,
  },
  frame: {
    backgroundColor: color.surface,
    borderColor: "rgb(18 16 14 / 0.08)",
    borderRadius: 14,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 18px 40px -18px rgb(18 16 14 / 0.3)",
    display: "block",
    overflow: "clip",
    transitionDuration: "400ms",
    transitionProperty: "transform, box-shadow",
    transitionTimingFunction: ease.out,
  },
  image: {
    aspectRatio: "16 / 10",
    objectFit: "cover",
    objectPosition: "top",
    width: "100%",
  },
});

export const Shot = ({
  href,
  shot,
  alt,
  xstyle,
}: {
  href: string;
  shot: StaticImageData;
  alt: string;
  xstyle?: StyleXStyles;
}) => (
  <span {...stylex.props(styles.frame, xstyle)}>
    <span aria-hidden="true" {...stylex.props(styles.bar)}>
      <span {...stylex.props(styles.dots)} />
      {new URL(href).host}
    </span>
    <span data-reveal="wipe" {...stylex.props(shared.unveil)}>
      <Image
        alt={alt}
        placeholder="blur"
        sizes="(max-width: 900px) 90vw, 520px"
        src={shot}
        {...stylex.props(styles.image)}
      />
    </span>
  </span>
);
