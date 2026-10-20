import type { Metadata } from "next";

import { Game } from "./_components/game";
import { describe, readResult } from "./_lib/result";

const DESCRIPTION = "スマホではじいて、石が何回跳ねるか。";

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/games/mizukiri">): Promise<Metadata> => {
  const shared = readResult(await searchParams);
  const title = shared
    ? `${shared.skips}回 · ${describe(shared).title} | 水切り`
    : "水切り";
  return {
    description: DESCRIPTION,
    openGraph: { description: DESCRIPTION, title, type: "website" },
    title,
  };
};

const Page = async ({ searchParams }: PageProps<"/games/mizukiri">) => (
  <Game challenge={readResult(await searchParams)} />
);

export default Page;
