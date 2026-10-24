import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { cmOf, lengthText, queryOf, readResult, titleOf } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Pull the cheese as far as it goes. Too fast and it snaps, too slow and it sets. The longer it gets, the further the camera pulls back, past Tokyo Tower, Mt Fuji and out into space. Can you get it to the Moon?",
  ja: "チーズを引っぱって、どこまでのばせるか。速すぎるとちぎれて、遅すぎると固まる。のびるほどカメラが引いて、東京タワー、富士山、宇宙の先へ。月まで届くか。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#1a0f14",
    backgroundImage:
      "linear-gradient(180deg, #3a2a50 0%, #1a0f14 60%, #0d0a14 100%)",
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
}: PageProps<"/games/cheese">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);

  const title = shared
    ? `${lengthText(cmOf(shared), lang)} · ${titleOf(shared, lang)} | ${copy[lang].name}`
    : copy[lang].name;

  const image = {
    alt: title,
    height: 630,
    url: `/games/cheese/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/cheese">) => {
  const params = await searchParams;

  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
