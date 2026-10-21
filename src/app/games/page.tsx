import type { Metadata } from "next";
import { headers } from "next/headers";

import { BladeArt } from "./_components/blade-art";
import { BrushArt } from "./_components/brush-art";
import { CandyArt } from "./_components/candy-art";
import { CutArt } from "./_components/cut-art";
import { EraserArt } from "./_components/eraser-art";
import type { Game } from "./_components/game-card";
import { GamesIndex } from "./_components/games-index";
import { MergeArt } from "./_components/merge-art";
import { MochiArt } from "./_components/mochi-art";
import { PauseArt } from "./_components/pause-art";
import { SkipArt } from "./_components/skip-art";
import { SparkArt } from "./_components/spark-art";
import { langFromHeader } from "./_lib/i18n";
import { copy as enso } from "./enso/_lib/copy";
import { copy as hoshiai } from "./hoshiai/_lib/copy";
import { copy as iai } from "./iai/_lib/copy";
import { copy as itto } from "./itto/_lib/copy";
import { kinds } from "./itto/_lib/foods";
import { copy as katanuki } from "./katanuki/_lib/copy";
import { copy as keshibo } from "./keshibo/_lib/copy";
import { copy as ma } from "./ma/_lib/copy";
import { copy as mizukiri } from "./mizukiri/_lib/copy";
import { copy as mochitsuki } from "./mochitsuki/_lib/copy";
import { copy as senko } from "./senko/_lib/copy";

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
  {
    art: <CandyArt />,
    blurb: {
      en: "Trace the pressed line on a festival candy with a needle to cut the shape out. Too fast, or off the line, and it cracks.",
      ja: "お祭りの型抜きを、針でなぞって抜く。速すぎても、はみ出しても割れる。",
    },
    href: "/games/katanuki",
    tags: [
      { en: "Trace", ja: "なぞる" },
      { en: "Fastest time", ja: "最速タイム" },
      { en: "Challenge a friend", ja: "友だちに挑戦" },
    ],
    title: { en: katanuki.en.name, ja: katanuki.ja.name },
  },
  {
    art: <CutArt />,
    blurb: {
      en: "One piece of Japanese food, one straight swipe. The split is measured by area to 0.1%, from tofu and taiyaki to a skewer of dango, and now and then a rare one turns up.",
      ja: "食べものをひとつ、まっすぐ一刀で真っ二つ。豆腐から鯛焼き、三色団子まで、面積の比を0.1%まで測る。たまにレアなものも出る。",
    },
    href: "/games/itto",
    tags: [
      { en: "One swipe", ja: "ひと振り" },
      { en: `${kinds.length} foods`, ja: `${kinds.length}種の食べもの` },
      { en: "Rare finds", ja: "たまにレア" },
    ],
    title: { en: itto.en.name, ja: itto.ja.name },
  },
  {
    art: <MochiArt />,
    blurb: {
      en: "Pound the mochi on the beat while your partner turns it. The tempo keeps rising, so don't hit their hand.",
      ja: "拍に合わせて杵でつく。拍のあいだは相方が返す。どんどん速くなるなかで、手をつかずに何回つけるか。",
    },
    href: "/games/mochitsuki",
    tags: [
      { en: "Rhythm", ja: "リズム" },
      { en: "Ever faster", ja: "どんどん速く" },
      { en: "Challenge a friend", ja: "友だちに挑戦" },
    ],
    title: { en: mochitsuki.en.name, ja: mochitsuki.ja.name },
  },
  {
    art: <EraserArt />,
    blurb: {
      en: "Bowling on two school desks pushed together. Design your own eraser, then flick it at ten standing ones.",
      ja: "机をくっつけて、消しゴムでボウリング。自分の消しゴムをつくって、10個の消しゴムをはじき倒す。",
    },
    href: "/games/keshibo",
    tags: [
      { en: "Pull & flick", ja: "引いてはじく" },
      { en: "Design an eraser", ja: "消しゴム工房" },
      { en: "Challenge a friend", ja: "友だちに挑戦" },
    ],
    title: { en: keshibo.en.name, ja: keshibo.ja.name },
  },
];

const DESCRIPTION =
  "ブラウザですぐ遊べる、小さなゲーム。 Small games that play right in your browser.";

export const metadata: Metadata = {
  description: DESCRIPTION,
  title: "ゲーム · Games",
};

const Page = async () => {
  const incoming = await headers();
  return (
    <GamesIndex
      games={GAMES}
      hint={langFromHeader(incoming.get("accept-language"))}
    />
  );
};

export default Page;
