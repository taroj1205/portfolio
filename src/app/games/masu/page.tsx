import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import {
  glassOf,
  percent,
  queryOf,
  rankOf,
  readResult,
  spilledOf,
} from "./_lib/result";

const DESCRIPTION: Text = {
  en: "One pour of sake into a wooden masu. Hold to pour and let go once, before it spills. It keeps trickling after you let go, so the surface tension dome is yours only if you stop early.",
  ja: "枡に酒を注ぐ、一杯勝負。押して注ぎ、こぼれる前に一度だけ離す。離してもとくとく垂れるから、表面張力で盛り上がった一杯は、早めに止めた人だけのもの。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#0a0503",
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

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/masu">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);
  const poured = shared === null ? null : glassOf(shared);
  const score =
    poured === null || spilledOf(poured)
      ? copy[lang].spilled
      : `${copy[lang].tension} ${percent(poured.outcome.tenths)}%`;
  const title =
    poured === null
      ? copy[lang].name
      : `${score} · ${rankOf(poured).name[lang]} | ${copy[lang].name}`;
  const image = {
    alt: title,
    height: 630,
    url: `/games/masu/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/masu">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
