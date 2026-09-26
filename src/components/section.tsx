import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { shared } from "@/styles/shared";

import { color, media } from "../styles/tokens.stylex";

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
  section: {
    paddingTop: "clamp(5rem, 11vw, 8.5rem)",
  },
});

export const Section = ({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) => (
  <section {...stylex.props(shared.wrap, styles.section)} id={id}>
    <div {...stylex.props(styles.head, shared.reveal)}>
      <h2 {...stylex.props(shared.title)}>{title}</h2>
      {intro !== undefined && <p {...stylex.props(styles.intro)}>{intro}</p>}
    </div>
    {children}
  </section>
);
