import * as stylex from "@stylexjs/stylex";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";

import { Island } from "@/components/island";
import { shared } from "@/styles/shared";

import { color } from "../styles/tokens.stylex";

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

const styles = stylex.create({
  footer: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: color.muted,
    fontSize: "0.9375rem",
    paddingBlock: "2rem 3rem",
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
    <body>
      <a href="#main" {...stylex.props(styles.skip)}>
        Skip to content
      </a>
      <header>
        <Island />
      </header>
      <main id="main">{children}</main>
      <footer {...stylex.props(shared.wrap, styles.footer)}>
        <p>© {new Date().getFullYear()} Shintaro Jokagi</p>
      </footer>
    </body>
  </html>
);

export default RootLayout;
