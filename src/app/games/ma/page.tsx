import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Lang, Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { formatGap, formatTime, rankOf, secondsText } from "./_lib/judge";
import { gapOf, queryOf, readResult } from "./_lib/result";
import type { Result } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Stop at exactly 10.00 seconds. The timer vanishes after 3, so it's all your inner clock.",
  ja: "10.00秒ぴったりで止める。タイマーは3秒で消えるから、あとは体内時計だけが頼り。",
};

const styles = stylex.create({
  page: {
    backgroundImage:
      "linear-gradient(180deg, #04060f 0%, #0b1230 50%, #1c2752 80%, #141c3d 100%)",
    inset: 0,
    overflow: "hidden",
    position: "fixed",
  },
});

const langOf = async (param: string | string[] | undefined) => {
  if (param !== undefined) {
    return langFrom(param);
  }
  const incoming = await headers();
  return langFromHeader(incoming.get("accept-language"));
};

const titleOf = (result: Result, lang: Lang) => {
  const gap = gapOf(result);
  const rank = rankOf(gap).name[lang];
  if (result.day !== null) {
    return `${copy[lang].challenge.day(result.day)} · ${secondsText(formatGap(gap), lang)} · ${rank}`;
  }
  return `${secondsText(formatTime(result.time), lang)} (${formatGap(gap)}) · ${rank}`;
};

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/ma">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);
  const title = shared
    ? `${titleOf(shared, lang)} | ${copy[lang].name}`
    : copy[lang].name;
  const image = {
    alt: title,
    height: 630,
    url: `/games/ma/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/ma">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
