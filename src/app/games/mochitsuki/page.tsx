import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Lang, Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import {
  poundsText,
  queryOf,
  rankOf,
  readResult,
  tempoText,
} from "./_lib/result";
import type { Result } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Pound mochi on the beat while your partner turns it. The tempo keeps rising. Tap between beats and you hit their hand. How many times can you pound?",
  ja: "拍に合わせて杵でつく。拍のあいだは相方が返す。テンポはどんどん上がって、そこでつくと手をつく。何回つけるか。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#0b0814",
    backgroundImage: [
      "radial-gradient(30rem 22rem at 50% 78%, rgb(255 168 90 / 0.2), transparent 70%)",
      "radial-gradient(24rem 18rem at 10% 6%, rgb(214 52 60 / 0.2), transparent 70%)",
      "radial-gradient(22rem 18rem at 92% 12%, rgb(255 214 140 / 0.14), transparent 70%)",
      "linear-gradient(180deg, #141027 0%, #0b0814 55%, #1a0d0c 100%)",
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

const titleOf = (result: Result, lang: Lang) =>
  `${poundsText(result.pounds, lang)} · ${tempoText(result.tempo)} · ${rankOf(result.pounds).name[lang]}`;

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/mochitsuki">): Promise<Metadata> => {
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
    url: `/games/mochitsuki/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/mochitsuki">) => {
  const params = await searchParams;

  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
