import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { queryOf, readResult, titleOf } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Turn the crank and pile fluffy shaved ice as high as it goes. The taller it gets, the more it wobbles, so slide the glass to keep it standing, then pour the syrup before it falls.",
  ja: "ハンドルを回して、ふわふわのかき氷をどこまでも高く盛る。高くなるほどぐらぐらするから、器を動かして立て直して、崩れる前にシロップをかけよう。",
};

const styles = stylex.create({
  page: {
    backgroundColor: "#0f4f9a",
    backgroundImage: [
      "radial-gradient(30rem 22rem at 85% 10%, rgb(255 250 220 / 0.35), transparent 70%)",
      "radial-gradient(36rem 26rem at 15% 90%, rgb(255 255 255 / 0.18), transparent 70%)",
      "linear-gradient(180deg, #0d4a92 0%, #1f76d8 55%, #4e9fe6 100%)",
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
}: PageProps<"/games/kakigori">): Promise<Metadata> => {
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
    url: `/games/kakigori/og?${query.toString()}`,
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

const Page = async ({ searchParams }: PageProps<"/games/kakigori">) => {
  const params = await searchParams;

  return (
    <div {...stylex.props(styles.page)}>
      <Game challenge={readResult(params)} hint={await langOf(params.l)} />
    </div>
  );
};

export default Page;
