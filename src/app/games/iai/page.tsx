import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Lang, Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import {
  challengeOf,
  isEarly,
  lineOf,
  queryOf,
  rankOf,
  reachText,
  readResult,
} from "./_lib/result";
import type { Result } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "A quick-draw duel. Draw the moment 「！」 appears, and don't fall for the cat.",
  ja: "「！」が出た瞬間に斬る、居合の早抜き勝負。猫や落ち葉につられたら、お手つき。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#05060f",
    inset: 0,
    overflow: "hidden",
    position: "fixed",
  },
});

const headlineOf = (shared: Result, lang: Lang) =>
  isEarly(shared.end)
    ? lineOf(shared, lang)
    : `${reachText(shared.reach, lang)} · ${rankOf(shared.reach).name[lang]}`;

const langOf = async (param: string | string[] | undefined) => {
  if (param !== undefined) {
    return langFrom(param);
  }
  const incoming = await headers();
  return langFromHeader(incoming.get("accept-language"));
};

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/iai">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);
  const title =
    shared === null
      ? copy[lang].name
      : `${headlineOf(shared, lang)} | ${copy[lang].name}`;
  const image = {
    alt: title,
    height: 630,
    url: `/games/iai/og?${query.toString()}`,
    width: 1200,
  };
  return {
    description: DESCRIPTION[lang],
    openGraph: {
      description: DESCRIPTION[lang],
      images: [image],
      title,
      type: "website",
    },
    title,
    twitter: {
      card: "summary_large_image",
      description: DESCRIPTION[lang],
      images: [image],
      title,
    },
  };
};

const Page = async ({ searchParams }: PageProps<"/games/iai">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game
        challenge={challengeOf(readResult(params))}
        hint={await langOf(params.l)}
      />
    </div>
  );
};

export default Page;
