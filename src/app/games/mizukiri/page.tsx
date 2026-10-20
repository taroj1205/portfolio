import type { Metadata } from "next";

import { Game } from "./_components/game";
import { langFrom } from "./_lib/i18n";
import type { Text } from "./_lib/i18n";
import { describe, formatDistance, readResult } from "./_lib/result";

const DESCRIPTION: Text = {
  en: "Flick a stone across the river and see how far it skips.",
  ja: "スマホではじいて、石がどこまで跳ねるか。",
};

const NAME: Text = { en: "Mizukiri", ja: "水切り" };

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/mizukiri">): Promise<Metadata> => {
  const params = await searchParams;
  const lang = langFrom(params.l);
  const shared = readResult(params);
  const title = shared
    ? `${formatDistance(shared.distance)} · ${describe(shared, lang).title} | ${NAME[lang]}`
    : NAME[lang];
  return {
    description: DESCRIPTION[lang],
    openGraph: { description: DESCRIPTION[lang], title, type: "website" },
    title,
  };
};

const Page = async ({ searchParams }: PageProps<"/games/mizukiri">) => {
  const params = await searchParams;
  return (
    <Game
      challenge={readResult(params)}
      hint={params.l === undefined ? null : langFrom(params.l)}
    />
  );
};

export default Page;
