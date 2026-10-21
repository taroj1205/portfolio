import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { media } from "../../styles/tokens.stylex";
import { BladeArt } from "./_components/blade-art";
import { BrushArt } from "./_components/brush-art";
import { GameCard } from "./_components/game-card";
import { MergeArt } from "./_components/merge-art";
import { PauseArt } from "./_components/pause-art";
import { SkipArt } from "./_components/skip-art";
import { Sky } from "./_components/sky";
import { SparkArt } from "./_components/spark-art";
import { StarLink } from "./_components/star-link";
import type { Text } from "./_lib/i18n";
import { copy as enso } from "./enso/_lib/copy";
import { copy as hoshiai } from "./hoshiai/_lib/copy";
import { copy as iai } from "./iai/_lib/copy";
import { copy as ma } from "./ma/_lib/copy";
import { copy as mizukiri } from "./mizukiri/_lib/copy";
import { copy as senko } from "./senko/_lib/copy";

interface Game {
  href: string;
  art: ReactNode;
  title: Text;
  blurb: Text;
  tags: Text[];
}

const GAMES: Game[] = [
  {
    art: <SkipArt />,
    blurb: {
      en: "Flick a stone across the river, then tap as it touches down to keep it skipping toward the Milky Way.",
      ja: "スマホで石を川にはじいて、着水の瞬間にタップ。天の川まで跳ねさせよう。",
    },
    href: "/games/mizukiri",
    tags: [
      { en: "Flick & tap", ja: "はじく・タップ" },
      { en: "Stones & tuning", ja: "石と調整" },
      { en: "Challenge a friend", ja: "友だちに挑戦" },
    ],
    title: { en: mizukiri.en.name, ja: mizukiri.ja.name },
  },
  {
    art: <MergeArt />,
    blurb: {
      en: "Drop stars into the ring. Matching ones merge into the next size up, from stardust to a black hole.",
      ja: "輪の中に星を落として、同じ星同士をくっつける。星屑からブラックホールまで育てよう。",
    },
    href: "/games/hoshiai",
    tags: [
      { en: "Drag & drop", ja: "なぞって落とす" },
      { en: "Merge & chain", ja: "合体・連鎖" },
      { en: "11 bodies", ja: "11の天体" },
    ],
    title: { en: hoshiai.en.name, ja: hoshiai.ja.name },
  },
  {
    art: <SparkArt />,
    blurb: {
      en: "Hold the screen to keep a sparkler burning. Keep still so the fireball doesn't drop before the last sparks.",
      ja: "押しているあいだだけ火がともる。火玉を落とさずに、散り菊まで持たせよう。",
    },
    href: "/games/senko",
    tags: [
      { en: "Press & hold", ja: "長押し" },
      { en: "Timed to 0.01s", ja: "0.01秒を競う" },
      { en: "Same-stick challenge", ja: "同じ一本で挑戦" },
    ],
    title: { en: senko.en.name, ja: senko.ja.name },
  },
  {
    art: <BrushArt />,
    blurb: {
      en: "Draw a circle in one brush stroke. Let go, and see how close to perfect it is, to one decimal place.",
      ja: "筆で一筆、まるを描く。離すと、真円にどれだけ近いかが小数1桁の％で出る。",
    },
    href: "/games/enso",
    tags: [
      { en: "One stroke", ja: "一筆書き" },
      { en: "Ink & brush", ja: "墨と筆" },
      { en: "Challenge a friend", ja: "友だちに挑戦" },
    ],
    title: { en: enso.en.name, ja: enso.ja.name },
  },
  {
    art: <PauseArt />,
    blurb: {
      en: "Stop the timer at exactly 10.00 seconds. It vanishes after 3, so the rest is down to your inner clock.",
      ja: "10.00秒ぴったりで止める。タイマーは3秒で消えるから、あとは体内時計だけが頼り。",
    },
    href: "/games/ma",
    tags: [
      { en: "Press & stop", ja: "押して止める" },
      { en: "Timed to 0.01s", ja: "0.01秒を競う" },
      { en: "Daily target", ja: "今日のお題" },
    ],
    title: { en: ma.en.name, ja: ma.ja.name },
  },
  {
    art: <BladeArt />,
    blurb: {
      en: "Two samurai wait in silence. Draw the moment 「！」 appears, and don't fall for the cat. Solo against five, or two players on one screen.",
      ja: "静寂のなか、「！」が出た瞬間に斬る。猫や落ち葉につられたらお手つき。ひとりで五人抜きか、ふたりで対決。",
    },
    href: "/games/iai",
    tags: [
      { en: "Reaction time", ja: "反射神経" },
      { en: "Two players", ja: "ふたりで対決" },
      { en: "Challenge a friend", ja: "友だちに挑戦" },
    ],
    title: { en: iai.en.name, ja: iai.ja.name },
  },
];

const DESCRIPTION =
  "ブラウザですぐ遊べる、小さなゲーム。 Small games that play right in your browser.";

export const metadata: Metadata = {
  description: DESCRIPTION,
  title: "ゲーム · Games",
};

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(18px)" },
  "100%": { opacity: 1, transform: "none" },
});

const styles = stylex.create({
  eyebrow: {
    color: "#ffd27a",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.32em",
    margin: 0,
    textTransform: "uppercase",
  },
  header: {
    animationDuration: "900ms",
    animationFillMode: "backwards",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
  },
  inner: {
    display: "flex",
    flexDirection: "column",
    gap: "clamp(2rem, 5vw, 3.5rem)",
    marginInline: "auto",
    maxWidth: "72rem",
    paddingBlock:
      "calc(clamp(2.5rem, 8vw, 5.5rem) + env(safe-area-inset-top)) calc(2.5rem + env(safe-area-inset-bottom))",
    paddingInline: "max(1.25rem, env(safe-area-inset-left))",
  },
  intro: {
    color: "rgb(255 255 255 / 0.82)",
    display: "flex",
    flexDirection: "column",
    fontSize: "1.05rem",
    gap: "0.2rem",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: "36rem",
  },
  introEn: {
    color: "rgb(255 255 255 / 0.62)",
    fontSize: "0.95rem",
  },
  list: {
    animationDelay: "150ms",
    animationDuration: "1000ms",
    animationFillMode: "backwards",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    display: "grid",
    gap: { default: "1.5rem", [media.stack]: "0.9rem" },
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  page: {
    backgroundImage:
      "linear-gradient(180deg, #060912 0%, #0d1330 52%, #1b1737 100%)",
    inset: 0,
    overflow: "hidden",
    position: "fixed",
  },
  scroll: {
    inset: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    position: "absolute",
  },
  starEn: {
    color: "rgb(255 255 255 / 0.66)",
  },
  title: {
    fontFamily: "var(--font-mincho), serif",
    fontSize: "clamp(3.2rem, 11vw, 6.5rem)",
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1.05,
    margin: 0,
    textShadow: "0 4px 40px rgb(255 190 120 / 0.28)",
  },
});

const Page = () => (
  <div {...stylex.props(styles.page)}>
    <Sky />
    <main {...stylex.props(styles.scroll)}>
      <div {...stylex.props(styles.inner)}>
        <header {...stylex.props(styles.header)}>
          <p lang="en" {...stylex.props(styles.eyebrow)}>
            Games
          </p>
          <h1 {...stylex.props(styles.title)}>ゲーム</h1>
          <p {...stylex.props(styles.intro)}>
            <span>ブラウザですぐ遊べる、小さなゲーム。</span>
            <span lang="en" {...stylex.props(styles.introEn)}>
              Small games that play right in your browser.
            </span>
          </p>
        </header>
        <ul {...stylex.props(styles.list)}>
          {GAMES.map((game) => (
            <li key={game.href}>
              <GameCard {...game} />
            </li>
          ))}
        </ul>
        <StarLink>
          <span>GitHubでスター</span>
          <span lang="en" {...stylex.props(styles.starEn)}>
            Star on GitHub
          </span>
        </StarLink>
      </div>
    </main>
  </div>
);

export default Page;
