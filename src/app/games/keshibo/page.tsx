import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Lang, Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { pointsText, queryOf, rankOf, readResult } from "./_lib/result";
import type { Result } from "./_lib/result";
import { scoreOf } from "./_lib/score";

const DESCRIPTION: Text = {
  en: "Eraser bowling on two school desks pushed together. Pull back and flick your own eraser at ten standing ones. Ten frames, up to 300.",
  ja: "机をくっつけたレーンで、消しゴムボウリング。自分でつくった消しゴムをはじいて、10個の消しゴムを倒す。10フレームで最高300点。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#1a120c",
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
  const score = scoreOf(result.rolls);
  return `${pointsText(score, lang)} · ${rankOf(score).name[lang]}`;
};

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/keshibo">): Promise<Metadata> => {
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
    url: `/games/keshibo/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/keshibo">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
