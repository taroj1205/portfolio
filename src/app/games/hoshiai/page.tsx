import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";

import { Sky } from "../_components/sky";
import { langFrom } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
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

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/hoshiai">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = langFrom(params.l);
  const shared = readResult(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);
  const title = shared
    ? `${titleOf(shared, lang)} · ${scoreText(shared.score, lang)} | ${copy[lang].name}`
    : copy[lang].name;
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
      <Game
        challenge={readResult(params)}
        hint={params.l === undefined ? null : langFrom(params.l)}
      />
    </div>
  );
};

export default Page;
