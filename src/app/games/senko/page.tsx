import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { Sky } from "../_components/sky";
import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { queryOf, readResult, timeText, titleOf } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Hold the screen to keep a sparkler burning. Keep still so the fireball doesn't drop, all the way down to the last sparks.",
  ja: "押しているあいだだけ火がともる。火玉を落とさずに、散り菊まで持たせよう。",
};

const styles = stylex.create({
  page: {
    backgroundImage:
      "linear-gradient(180deg, #04050d 0%, #0a0a18 50%, #120c0e 100%)",
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
}: PageProps<"/games/senko">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readResult(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);

  const title = shared
    ? `${timeText(shared.time, lang)} · ${titleOf(shared, lang)} | ${copy[lang].name}`
    : copy[lang].name;

  const image = {
    alt: title,
    height: 630,
    url: `/games/senko/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/senko">) => {
  const params = await searchParams;

  return (
    <div {...stylex.props(styles.page)}>
      <Sky />
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
