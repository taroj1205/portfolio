import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { Sky } from "../_components/sky";
import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { careerQuery, readCareer } from "./_lib/career";
import { copy } from "./_lib/copy";
import { queryOf, readResult, scoreText, titleOf } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Drop stars into the ring and merge matching ones, from stardust all the way to a black hole.",
  ja: "同じ星をくっつけて、星屑からブラックホールまで育てよう。",
};

const styles = stylex.create({
  page: {
    backgroundImage:
      "radial-gradient(90% 70% at 50% 52%, #1a1640 0%, #0b0f24 55%, #05060f 100%)",
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
}: PageProps<"/games/hoshiai">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const career = shared === null ? readCareer(params) : null;
  let title = copy[lang].name;
  let query = new URLSearchParams();
  if (shared) {
    title = `${titleOf(shared, lang)} · ${scoreText(shared.score, lang)} | ${copy[lang].name}`;
    query = new URLSearchParams(queryOf(shared));
  } else if (career) {
    title = `${copy[lang].career.title} · ${titleOf(career, lang)} · ${scoreText(career.best, lang)} | ${copy[lang].name}`;
    query = new URLSearchParams(careerQuery(career));
  }
  query.set("l", lang);
  const image = {
    alt: title,
    height: 630,
    url: `/games/hoshiai/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/hoshiai">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Sky />
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
