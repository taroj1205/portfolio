import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { cupSvg } from "../_components/cup-svg";
import { copy } from "../_lib/copy";
import {
  brimful,
  heroOf,
  lineOf,
  percent,
  rankOf,
  readResult,
  tallyOf,
} from "../_lib/result";
import type { Tally } from "../_lib/result";
import { box, fillOf, paint } from "../_lib/scene";
import type { Fill } from "../_lib/scene";

const ink = {
  dim: "rgba(255,250,243,0.6)",
  gold: "#ffd27a",
  spill: "#ff8a6a",
  text: "#fffaf3",
};

const W = 1200;
const H = 630;

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Can you stop right before it spills?",
    detail: "It keeps trickling after you let go",
  },
  ja: {
    caption: "こぼれる直前で、止められる？",
    detail: "離しても、とくとく垂れる",
  },
};

const brimming: Fill = { dome: 3.6, glass: null, level: box.height };

const Pours = ({ tally, lang }: { tally: Tally; lang: Lang }) => (
  <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
    {tally.glasses.map((glass, index) => {
      const spilled = glass.outcome.spilledAt !== null;
      const good = brimful(glass.outcome);
      return (
        <div
          key={`${index}-${glass.outcome.hold}`}
          style={{
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.08)",
            border: `2px solid ${good ? ink.gold : "rgba(255,255,255,0.16)"}`,
            borderRadius: 18,
            color: spilled ? ink.spill : ink.text,
            display: "flex",
            fontSize: 28,
            height: 62,
            justifyContent: "center",
            width: 112,
          }}
        >
          {spilled ? copy[lang].spill : percent(glass.outcome.tenths)}
        </div>
      );
    })}
  </div>
);

const cardOf = (tally: Tally | null, lang: Lang) => {
  const words = copy[lang];
  if (tally === null) {
    return {
      caption: pitch[lang].caption,
      detail: pitch[lang].detail,
      fill: brimming,
      headline: words.name,
      label: "ます",
      spilled: false,
    };
  }
  const hero = heroOf(tally);
  return {
    caption: `${rankOf(tally.average).name[lang]} · ${lineOf(tally, lang)}`,
    detail: words.challenge.dare,
    fill: fillOf(hero.pour, hero.outcome.volume),
    headline: percent(tally.average),
    label: words.result.average,
    spilled: hero.outcome.spilledAt !== null,
  };
};

export const GET = async (request: NextRequest) => {
  const result = readResult(Object.fromEntries(request.nextUrl.searchParams));
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const tally = result === null ? null : tallyOf(result);
  const { caption, detail, fill, headline, label, spilled } = cardOf(
    tally,
    lang
  );
  const font = await loadMincho(
    `${headline}${caption}${detail}${label}${copy[lang].spill}0123456789.%枡ます`
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage: `linear-gradient(180deg, ${paint.night} 0%, ${paint.room} 55%, ${paint.counter} 100%)`,
        color: ink.text,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(42,23,13,0) 0%, ${paint.counter} 45%, ${paint.counterDark} 100%)`,
          display: "flex",
          height: 330,
          left: 0,
          position: "absolute",
          top: 300,
          width: W,
        }}
      />
      <div
        style={{
          backgroundImage: `radial-gradient(circle at 50% 45%, rgba(255,207,138,0.32), rgba(255,207,138,0) 62%)`,
          display: "flex",
          height: 640,
          left: 640,
          position: "absolute",
          top: 0,
          width: 560,
        }}
      />
      <svg
        height={560}
        style={{ left: 650, position: "absolute", top: 50 }}
        viewBox="-70 -72 140 140"
        width={560}
      >
        {cupSvg({ fill, id: "og", spilled })}
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 80,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 84,
          width: 620,
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: ink.gold,
            display: "flex",
            fontSize: 30,
            gap: 18,
            letterSpacing: lang === "ja" ? 10 : 2,
          }}
        >
          {tally === null ? null : (
            <div
              style={{
                alignItems: "center",
                backgroundColor: "#c8352b",
                borderRadius: 6,
                color: ink.text,
                display: "flex",
                fontSize: 24,
                height: 40,
                justifyContent: "center",
                letterSpacing: 0,
                width: 40,
              }}
            >
              枡
            </div>
          )}
          {label}
        </div>
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            fontSize: tally === null ? 150 : 168,
            letterSpacing: tally === null && lang === "ja" ? 20 : 0,
            lineHeight: 1,
            marginTop: 16,
          }}
        >
          {headline}
          {tally === null ? null : (
            <span style={{ fontSize: 72, marginLeft: 8 }}>%</span>
          )}
        </div>
        <div
          style={{
            color: tally === null ? ink.text : ink.gold,
            display: "flex",
            fontSize: tally === null ? 40 : 34,
            lineHeight: 1.4,
            marginTop: 20,
          }}
        >
          {caption}
        </div>
        {tally === null ? null : <Pours lang={lang} tally={tally} />}
        <div
          style={{
            color: ink.dim,
            display: "flex",
            fontSize: 28,
            marginTop: 26,
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
