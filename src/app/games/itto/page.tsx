import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import type { Text } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import {
  kindTitle,
  pieceOf,
  queryOf,
  rankOf,
  ratioText,
  readResult,
} from "./_lib/result";

const DESCRIPTION: Text = {
  en: "One piece of Japanese food, one straight swipe. See how close to exactly half you got, to 0.1%, and send a friend the same piece.",
  ja: "食べものをひとつ、まっすぐ一刀で真っ二つ。どれだけぴったり半分に切れたかを0.1%まで測って、同じものを友だちに送れる。",
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
  const piece = shared === null ? null : pieceOf(shared);
  const query = new URLSearchParams(shared === null ? "" : queryOf(shared));
  query.set("l", lang);

  const title =
    piece === null
      ? copy[lang].name
      : `${ratioText(piece.split.small)} · ${kindTitle(piece.food.kind, lang)} · ${rankOf(piece.split.small).name[lang]} | ${copy[lang].name}`;

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
