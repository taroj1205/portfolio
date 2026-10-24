import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import {
  dataUri,
  ellipse,
  landmarkBody,
  linear,
  lookAt,
  moonBodyAt,
  plates,
  pullDoc,
  seeded,
} from "../_lib/art";
import { copy } from "../_lib/copy";
import { dishes } from "../_lib/dishes";
import type { DishId } from "../_lib/dishes";
import {
  cmOf,
  isMoon,
  measure,
  readResult,
  reachedBy,
  titleOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";

const W = 1200;
const H = 630;
const SIZE = 430;

const baseOf = (dish: DishId) => ({
  x: 905,
  y: 560 - ((plates[dish].feet - 200) * SIZE) / 1000,
});

const ink = {
  dim: "rgba(255,250,243,0.78)",
  gold: "#ffd27a",
  scrim:
    "linear-gradient(90deg, rgba(8,5,14,0.88) 0%, rgba(8,5,14,0.7) 42%, rgba(8,5,14,0) 68%)",
  text: "#fffaf3",
};

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "How far will your cheese stretch?",
    detail: "Too fast and it snaps. Too slow and it sets.",
  },
  ja: {
    caption: "チーズ、どこまでのびる？",
    detail: "速すぎるとちぎれて、遅すぎると固まる。",
  },
};

const pitchSize: Record<Lang, number> = { en: 84, ja: 104 };

const starsOf = (alpha: number) => {
  const roll = seeded(5);
  return Array.from({ length: 120 }, () => {
    const r = 0.6 + roll() * 1.6;
    return ellipse(
      roll() * W,
      roll() * H * 0.8,
      r,
      r,
      `fill="#ffffff" fill-opacity="${(alpha * (0.3 + roll() * 0.6)).toFixed(2)}"`
    );
  }).join("");
};

const marksOf = (reached: number) => {
  const parts: string[] = [];
  if (reached >= 7 && reached < 9) {
    parts.push(
      landmarkBody("fuji", "og-fuji", { x: 760, y: H }, 260, 0.9),
      landmarkBody("snow", "og-snow", { x: 760, y: H }, 260)
    );
  }
  if (reached >= 5 && reached < 8) {
    parts.push(
      landmarkBody("tower", "og-tower", { x: 1080, y: H }, 330),
      landmarkBody("skytree", "og-tree", { x: 690, y: H }, 470, 0.9)
    );
  }
  if (reached === 8) {
    parts.push(landmarkBody("airliner", "og-plane", { x: 690, y: 170 }, 120));
  }
  if (reached >= 9) {
    parts.push(
      `<defs>${linear(
        "og-earth",
        [0, 0, 0, 1],
        [
          [0, "#4f9be8"],
          [1, "#0a1f52"],
        ]
      )}</defs>`,
      ellipse(
        905,
        reached >= 11 ? 1240 : 3400,
        reached >= 11 ? 700 : 2900,
        reached >= 11 ? 700 : 2900,
        `fill="url(#og-earth)" stroke="#9ec8ff" stroke-opacity="0.8" stroke-width="6"`
      )
    );
  }
  if (reached === 10) {
    parts.push(landmarkBody("iss", "og-iss", { x: 690, y: 150 }, 110));
  }
  return parts.join("");
};

const sceneOf = (result: Result | null) => {
  const reached = result === null ? 6 : reachedBy(result);
  const altitude =
    result === null ? 5.2 : Math.log10(Math.max(3, cmOf(result)));
  const look = lookAt(altitude);
  const sky = `<defs>${linear(
    "og-sky",
    [0, 0, 0, 1],
    [
      [0, look.skyTop],
      [1, look.skyLow],
    ]
  )}</defs><rect width="${W}" height="${H}" fill="url(#og-sky)"/>`;
  const moonArt =
    result !== null && isMoon(result)
      ? moonBodyAt(true, { x: 905, y: 40 }, 150)
      : "";
  return `${sky}${starsOf(look.stars)}${marksOf(reached)}${moonArt}`;
};

const Art = ({ result }: { result: Result | null }) => (
  <div
    style={{
      backgroundImage: `url(${dataUri(
        pullDoc(
          W,
          H,
          {
            base: baseOf(result?.dish ?? "pizza"),
            dish: result?.dish ?? "pizza",
            size: SIZE,
            top: result !== null && isMoon(result) ? 150 : 205,
          },
          ["back", "cheese", "held"],
          sceneOf(result)
        )
      )})`,
      backgroundSize: `${W}px ${H}px`,
      display: "flex",
      height: H,
      left: 0,
      position: "absolute",
      top: 0,
      width: W,
    }}
  />
);

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const length = result === null ? null : measure(cmOf(result));
  const caption = result === null ? pitch[lang].caption : titleOf(result, lang);
  const detail =
    result === null
      ? pitch[lang].detail
      : `${dishes[result.dish].name[lang]} · ${words.challenge.dare}`;
  const font = await loadMincho(
    `${copy.ja.name}${copy.ja.reading}${caption}${detail}${length?.value ?? ""}${length?.unit ?? ""}${words.name}`
  );
  return await ogImage(
    <div
      style={{
        backgroundColor: "#140c16",
        color: ink.text,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <Art result={result} />
      <div
        style={{
          backgroundImage: ink.scrim,
          height: H,
          left: 0,
          position: "absolute",
          top: 0,
          width: W,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 76,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: result === null ? 150 : 110,
          width: 640,
        }}
      >
        <div
          style={{
            color: ink.gold,
            display: "flex",
            fontSize: 26,
            letterSpacing: 10,
          }}
        >
          {copy.ja.reading}
        </div>
        {length === null ? (
          <div
            style={{
              display: "flex",
              fontSize: pitchSize[lang],
              lineHeight: 1.1,
              marginTop: 12,
            }}
          >
            {words.name}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 40, marginTop: 6 }}>
              {copy.ja.name}
            </div>
            <div
              style={{
                alignItems: "baseline",
                color: ink.gold,
                display: "flex",
                fontSize: length.value.length > 5 ? 124 : 150,
                lineHeight: 1,
                marginTop: 22,
              }}
            >
              {length.value}
              <span style={{ fontSize: 64, marginLeft: 12 }}>
                {length.unit}
              </span>
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: length === null ? 42 : 52,
            marginTop: 24,
          }}
        >
          {caption}
        </div>
        <div
          style={{
            color: ink.dim,
            display: "flex",
            fontSize: 28,
            marginTop: 18,
          }}
        >
          {detail}
        </div>
      </div>
    </div>,
    {
      fonts: [
        { data: font, name: "Shippori Mincho", style: "normal", weight: 700 },
      ],
      height: H,
      width: W,
    }
  );
};
