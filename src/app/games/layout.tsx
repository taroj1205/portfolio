import * as stylex from "@stylexjs/stylex";
import type { Viewport } from "next";
import { Shippori_Mincho } from "next/font/google";

import { Analytics } from "@/components/analytics";

import "./games.css";

const mincho = Shippori_Mincho({
  preload: false,
  subsets: ["latin"],
  variable: "--font-mincho",
  weight: ["500", "700"],
});

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0f1c",
  viewportFit: "cover",
};

const styles = stylex.create({
  body: {
    backgroundColor: "#0b0f1c",
    color: "#fffaf3",
    fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
    overflow: "hidden",
    overscrollBehavior: "none",
    WebkitFontSmoothing: "antialiased",
  },
});

const GamesLayout = ({ children }: LayoutProps<"/games">) => (
  <html className={mincho.variable} lang="ja">
    <body {...stylex.props(styles.body)}>
      {children}
      <Analytics />
    </body>
  </html>
);

export default GamesLayout;
