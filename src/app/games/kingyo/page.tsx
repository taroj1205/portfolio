import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Lang, Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { countOf, countText, queryOf, rankOf, readResult } from "./_lib/result";
import type { Result } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Festival goldfish scooping with one paper scoop. Dip it gently and lift fish into your bowl before the paper tears. Look out for black moors, golden goldfish and the old boss of the tank.",
  ja: "ポイ一枚で、金魚をすくう。そっと入れて、破れる前にお椀へ。黒出目金や黄金の金魚、水槽の主も泳いでいる。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#08101c",
    backgroundImage: [
      "radial-gradient(28rem 20rem at 12% 8%, rgb(255 120 70 / 0.22), transparent 70%)",
      "radial-gradient(22rem 18rem at 88% 14%, rgb(255 190 90 / 0.16), transparent 70%)",
      "radial-gradient(40rem 30rem at 50% 110%, rgb(40 130 190 / 0.28), transparent 70%)",
      "linear-gradient(180deg, #0b0a1c 0%, #08101c 55%, #0a1622 100%)",
    ].join(", "),
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
  const count = countOf(result);
  return `${countText(count, lang)} · ${rankOf(count).name[lang]}`;
};

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/kingyo">): Promise<Metadata> => {
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
    url: `/games/kingyo/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/kingyo">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
