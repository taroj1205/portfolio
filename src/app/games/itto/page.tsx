import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { queryOf, rankOf, ratioText, readResult, scoreOf } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Cut tofu, yōkan, taiyaki and more in one straight swipe, and see how close to exactly half you got, to 0.1%.",
  ja: "豆腐も羊羹も鯛焼きも、まっすぐ一刀で真っ二つ。どれだけぴったり半分に切れたか、0.1%まで測る。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#140d09",
    backgroundImage:
      "radial-gradient(120% 70% at 50% -10%, #4a3020 0%, #24170f 45%, #110b07 100%)",
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
}: PageProps<"/games/itto">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const scored = shared === null ? null : scoreOf(shared);
  const query = new URLSearchParams(shared === null ? "" : queryOf(shared));
  query.set("l", lang);
  const title =
    scored === null
      ? copy[lang].name
      : `${ratioText(scored.best.split.small)} · ${rankOf(scored.total).name[lang]} | ${copy[lang].name}`;
  const image = {
    alt: title,
    height: 630,
    url: `/games/itto/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/itto">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
