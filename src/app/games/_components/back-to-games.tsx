import * as stylex from "@stylexjs/stylex";
import Link from "next/link";

import { glass } from "./glass";
import { ink } from "./theme.stylex";

const styles = stylex.create({
  link: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    display: "flex",
    height: "2.75rem",
    justifyContent: "center",
    outlineColor: "#ffd27a",
    outlineOffset: 3,
    pointerEvents: "auto",
    transform: { default: null, ":active": "scale(0.92)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "2.75rem",
  },
});

export const BackToGames = ({ label }: { label: string }) => (
  <Link
    aria-label={label}
    href="/games"
    {...stylex.props(glass.surface, styles.link)}
  >
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  </Link>
);
