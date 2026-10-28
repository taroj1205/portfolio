import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { queryOf, readResult, titleOf } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "A festival shooting gallery. Hold to aim the cork rifle and let go to fire. Hit small prizes high to tip them, and hit the big ones on a top corner until they twist off the shelf.",
  ja: "お祭りの射的。押してコルク銃で狙って、離して撃つ。小さい景品は上を狙って倒して、大物は上の角に当ててねじって棚から落とそう。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#120c2a",
    backgroundImage: [
      "radial-gradient(30rem 22rem at 85% 10%, rgb(255 154 90 / 0.3), transparent 70%)",
      "radial-gradient(36rem 26rem at 15% 90%, rgb(216 38 46 / 0.22), transparent 70%)",
      "linear-gradient(180deg, #120c2a 0%, #2a1240 60%, #3a1430 100%)",
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

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/kadouchi">): Promise<Metadata> => {
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
    url: `/games/kadouchi/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/kadouchi">) => {
  const params = await searchParams;

  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
