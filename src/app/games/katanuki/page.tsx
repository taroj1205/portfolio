import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Lang, Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { moulds } from "./_lib/moulds";
import { headlineOf, queryOf, rankOf, readResult } from "./_lib/result";
import type { Result } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Cut a shape out of a festival candy with a needle. Too fast, or off the line, and it cracks. Race for the fastest time on six shapes.",
  ja: "お祭りの型抜きを、針で抜く。速すぎても、はみ出しても割れる。6つの型で、最速タイムを競う。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#0a0712",
    backgroundImage: [
      "radial-gradient(28rem 20rem at 12% 8%, rgb(255 120 70 / 0.22), transparent 70%)",
      "radial-gradient(22rem 18rem at 88% 14%, rgb(255 190 90 / 0.18), transparent 70%)",
      "radial-gradient(40rem 30rem at 50% 110%, rgb(200 60 90 / 0.25), transparent 70%)",
      "linear-gradient(180deg, #120b1f 0%, #0a0712 55%, #160a14 100%)",
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
  `${moulds[result.mould].name[lang]} · ${headlineOf(result, lang)} · ${rankOf(result).name[lang]}`;

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/katanuki">): Promise<Metadata> => {
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
    url: `/games/katanuki/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/katanuki">) => {
  const params = await searchParams;
  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
