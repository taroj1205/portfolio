import * as stylex from "@stylexjs/stylex";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Link from "next/link";

import { socials } from "@/lib/socials";
import { shared } from "@/styles/shared";

import { color, ease, font, media, size } from "../styles/tokens.stylex";

import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  description:
    "Shintaro Jokagi studies computer science at the University of Auckland, works as a software engineer at Hazumi, helps maintain Yamada UI and the Zen Browser website, and takes a lot of photos of the coast.",
  title: "Shintaro Jokagi",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5f1ea",
};

// Each id is also the name of its section's view timeline (see Section).
const sections = [
  ["work", "Work"],
  ["lately", "Lately"],
  ["photos", "Photos"],
] as const;

// At the top the bar sits flat on the page. Over the first 200px of scroll it
// gathers into a floating pane of liquid glass, so `from` is the flat state
// and the glass is the resting style (all that older browsers ever see).
// Every shadow in the glass has a transparent twin here so they interpolate.
const island = stylex.keyframes({
  from: {
    backdropFilter: "blur(0px) saturate(1) brightness(1)",
    backgroundColor: "rgb(255 255 255 / 0)",
    borderColor: "rgb(255 255 255 / 0)",
    boxShadow:
      "inset 0 1px 0 rgb(255 255 255 / 0), inset 0 0 0 rgb(255 255 255 / 0), 0 0 0 rgb(18 16 14 / 0), 0 0 0 rgb(18 16 14 / 0)",
    height: "4rem",
    paddingInline: "0 0",
    translate: "0 0",
    width: `min(${size.wrap}, 100% - 2 * ${size.gutter})`,
  },
});

// The link for the section you're reading gets its own little lens of glass,
// fading in and out at the edges instead of snapping.
const current = stylex.keyframes({
  "0%, 100%": {
    backgroundColor: "rgb(255 255 255 / 0)",
    boxShadow:
      "inset 0 1px 0 rgb(255 255 255 / 0), 0 1px 3px rgb(18 16 14 / 0)",
    color: color.muted,
  },
  "12%, 88%": {
    backgroundColor: "rgb(255 255 255 / 0.7)",
    boxShadow:
      "inset 0 1px 0 rgb(255 255 255 / 1), 0 1px 3px rgb(18 16 14 / 0.1)",
    color: color.ink,
  },
});

const scrolls = "@supports (animation-timeline: scroll())";

const styles = stylex.create({
  // Clear glass: a heavy blur that saturates what's behind it, a bright rim,
  // a specular line along the top edge and a soft glow inside.
  bar: {
    animationFillMode: "both",
    animationName: { default: null, [scrolls]: island },
    animationRange: "0 200px",
    animationTimeline: "scroll()",
    animationTimingFunction: ease.out,
    backdropFilter: "blur(14px) saturate(1.8) brightness(1.05)",
    backgroundColor: "rgb(255 255 255 / 0.55)",
    borderColor: "rgb(255 255 255 / 0.7)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 0 14px rgb(255 255 255 / 0.45), 0 10px 30px rgb(18 16 14 / 0.1), 0 1px 3px rgb(18 16 14 / 0.06)",
    height: "3.25rem",
    paddingInline: {
      default: "1.25rem 0.3rem",
      [media.narrow]: "1rem 0.3rem",
    },
    pointerEvents: "auto",
    position: "relative",
    translate: "0 0.625rem",
    width: "min(44rem, 100% - 1.5rem)",
  },
  body: {
    timelineScope: "--work, --lately, --photos",
  },
  cta: {
    backgroundColor: {
      default: color.ink,
      [media.hover]: { default: null, ":hover": color.cobalt },
    },
    boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.25)",
    color: "#fff",
    paddingInline: "1rem",
    transitionProperty: "background-color, transform",
  },
  flex: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
  },
  footer: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: color.muted,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.9375rem",
    gap: "1rem",
    justifyContent: "space-between",
    paddingBlock: "2rem 3rem",
  },
  // A fixed height, so the island changing shape never nudges the page.
  // Only the island itself catches clicks.
  header: {
    height: "4rem",
    pointerEvents: "none",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  link: {
    color: {
      default: color.muted,
      [media.hover]: { default: null, ":hover": color.ink },
    },
    textDecoration: "none",
    transitionDuration: "150ms",
    transitionProperty: "color",
  },
  navLink: {
    alignItems: "center",
    backgroundColor: {
      default: null,
      [media.hover]: { default: null, ":hover": "rgb(255 255 255 / 0.45)" },
    },
    borderRadius: 999,
    display: "flex",
    height: "2.4rem",
    paddingInline: { default: "0.8rem", [media.narrow]: "0.6rem" },
    transitionProperty: "color, background-color",
  },
  // Lit while the section's top is past the middle of the screen and its
  // bottom isn't yet.
  on: (section: string) => ({
    animationFillMode: "none",
    animationName: { default: null, [scrolls]: current },
    animationRange: "entry 50% exit 50%",
    animationTimeline: section,
    animationTimingFunction: "linear",
  }),
  name: {
    color: color.ink,
    fontFamily: font.display,
    fontSize: { default: "1.125rem", [media.narrow]: "1rem" },
    fontWeight: 700,
    letterSpacing: "-0.02em",
    // On the very smallest phones the name gives way before the links do.
    minWidth: 0,
    overflow: "hidden",
    textDecoration: "none",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  links: {
    flexShrink: 0,
    fontSize: "0.9375rem",
    gap: "0.15rem",
  },
  nav: {
    display: "flex",
    fontSize: "0.9375rem",
    gap: "clamp(0.85rem, 2.5vw, 1.75rem)",
  },
  optional: {
    display: { default: "flex", [media.narrow]: "none" },
  },
  skip: {
    backgroundColor: color.ink,
    borderRadius: 999,
    color: "#fff",
    left: "0.75rem",
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    position: "absolute",
    top: "0.75rem",
    translate: { default: "0 -200%", ":focus": "0" },
    zIndex: 100,
  },
});

const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html className={`${display.variable} ${body.variable}`} lang="en">
    <body {...stylex.props(styles.body)}>
      <a href="#main" {...stylex.props(styles.skip)}>
        Skip to content
      </a>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(shared.wrap, styles.flex, styles.bar)}>
          <Link href="/" {...stylex.props(styles.name)}>
            Shintaro Jokagi
          </Link>
          <nav aria-label="Main" {...stylex.props(styles.flex, styles.links)}>
            {sections.map(([id, label]) => (
              <a
                href={`#${id}`}
                key={id}
                {...stylex.props(
                  styles.link,
                  styles.navLink,
                  styles.on(`--${id}`),
                  id === "lately" && styles.optional
                )}
              >
                {label}
              </a>
            ))}
            <a
              href="#contact"
              {...stylex.props(
                styles.link,
                styles.navLink,
                shared.pressable,
                styles.cta
              )}
            >
              Say hi
            </a>
          </nav>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer {...stylex.props(shared.wrap, styles.footer)}>
        <p>© {new Date().getFullYear()} Shintaro Jokagi</p>
        <p {...stylex.props(styles.nav)}>
          {socials.map(([label, href]) => (
            <a href={href} key={label} {...stylex.props(styles.link)}>
              {label}
            </a>
          ))}
        </p>
      </footer>
    </body>
  </html>
);

export default RootLayout;
