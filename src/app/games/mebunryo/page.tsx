import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { langFrom, langFromHeader } from "../_lib/i18n";
import { Game } from "./_components/game";
import { copy } from "./_lib/copy";
import { queryOf, readShared, titleOf } from "./_lib/result";

const styles = stylex.create({
  page: {
    backgroundImage:
      "radial-gradient(120% 70% at 50% 0%, #3a2a1c 0%, #1a1410 45%, #0a0807 100%)",
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
}: PageProps<"/games/mebunryo">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = await langOf(params.l);
  const shared = readShared(params);
  const query = new URLSearchParams(shared ? queryOf(shared) : "");
  query.set("l", lang);
  const words = copy[lang];

  const title = shared
    ? `${titleOf(shared, lang)} | ${words.name}`
    : words.name;

  const image = {
    alt: title,
    height: 630,
    url: `/games/mebunryo/og?${query.toString()}`,
    width: 1200,
  };

  return {
    description: words.pitch,
    openGraph: {
      description: words.pitch,
      images: [image],
      title,
      type: "website",
    },
    title,
    twitter: {
      card: "summary_large_image",
      description: words.pitch,
      images: [image],
      title,
    },
  };
};

const Page = async ({ searchParams }: PageProps<"/games/mebunryo">) => {
  const params = await searchParams;

  return (
    <div {...stylex.props(styles.page)}>
      <Game hint={await langOf(params.l)} shared={readShared(params)} />
    </div>
  );
};

export default Page;
