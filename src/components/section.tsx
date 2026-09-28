import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { Fragment } from "react";
import type { ReactNode } from "react";

import { night, shared } from "@/styles/shared";

import { color, media, size } from "../styles/tokens.stylex";

const scrollDriven = "@supports (animation-timeline: view())";
const card = `inset(0 calc(50vw - min(${size.wrap} / 2 + 1.5rem, 50vw - ${size.gutter} / 2)) round 2rem)`;
const open = stylex.keyframes({ from: { clipPath: card } });
const close = stylex.keyframes({ to: { clipPath: card } });

const styles = stylex.create({
  head: {
    alignItems: "end",
    columnGap: "2rem",
    display: "grid",
    gridTemplateColumns: { default: "1.2fr 0.8fr", [media.tablet]: "1fr" },
    marginBottom: "clamp(2.25rem, 5vw, 3.5rem)",
    rowGap: "1rem",
  },
  intro: {
    color: color.muted,
    lineHeight: 1.7,
  },
  dusk: {
    "--dusk": { default: "0", [scrollDriven]: "1" },
    color: color.ink,
    paddingBottom: "clamp(5rem, 11vw, 8.5rem)",
    position: "relative",
    viewTimelineName: "--gallery",
  },
  night: {
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: `${open}, ${close}`,
    },
    animationRange: "entry 0% entry 80%, exit 20% exit 100%",
    animationTimeline: "view()",
    animationTimingFunction: "linear",
    backgroundColor: "#100f0d",
    backgroundImage:
      "radial-gradient(1100px 620px at 12% 0%, rgb(255 122 69 / 0.14), transparent 60%), radial-gradient(900px 600px at 100% 100%, rgb(43 76 255 / 0.12), transparent 60%)",
    bottom: 0,
    display: { default: "none", [scrollDriven]: "block" },
    left: "calc(50% - 50vw)",
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    width: "100vw",
    zIndex: -1,
  },
  section: {
    paddingTop: "clamp(5rem, 11vw, 8.5rem)",
  },
});

export const Title = ({
  text,
  xstyle,
}: {
  text: string;
  xstyle?: StyleXStyles;
}) => (
  <h2 data-reveal="words" {...stylex.props(shared.title, xstyle)}>
    {text.split(" ").map((word, i) => (
      <Fragment key={i}>
        {i > 0 && " "}
        <span {...stylex.props(shared.mask)}>
          <span {...stylex.props(shared.word)}>{word}</span>
        </span>
      </Fragment>
    ))}
  </h2>
);

export const Section = ({
  id,
  title,
  intro,
  children,
  dusk = false,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  dusk?: boolean;
}) => (
  <section
    {...stylex.props(shared.wrap, styles.section, dusk && [night, styles.dusk])}
    id={id}
  >
    {dusk && <span aria-hidden="true" {...stylex.props(styles.night)} />}
    <div {...stylex.props(styles.head)}>
      <Title text={title} />
      {intro !== undefined && (
        <p data-reveal {...stylex.props(styles.intro)}>
          {intro}
        </p>
      )}
    </div>
    {children}
  </section>
);
