import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { firstDesign } from "../_lib/eraser";
import { isoEraser } from "../_lib/iso";
import { pointsText, rankOf, readResult } from "../_lib/result";
import { PERFECT, frameSlots, framesOf, scoreOf } from "../_lib/score";

const W = 1200;
const H = 630;

const ink = {
  gold: "#ffd27a",
  paper: "#f6efdf",
  pencil: "#2c2a30",
  red: "#c23b32",
  rule: "rgba(60,40,30,0.3)",
  text: "#fffaf3",
};

const pitch: Record<Lang, { headline: string; detail: string }> = {
  en: {
    detail: "Flick your eraser down the desks.",
    headline: "Eraser bowling",
  },
  ja: {
    detail: "机の上で、自分の消しゴムをはじく。",
    headline: "消しゴムでボウリング",
  },
};

const Eraser = ({ design }: { design: typeof firstDesign }) => {
  const { plates, x, y, width, height } = isoEraser(design);
  const box = 330;
  const fit = Math.min(box / width, (box * 0.75) / height);
  return (
    <svg
      height={height * fit}
      viewBox={`${x} ${y} ${width} ${height}`}
      width={width * fit}
    >
      {plates.map((plate) => (
        <polygon
          fill={plate.fill}
          key={`${plate.fill}${plate.points}`}
          opacity={plate.opacity}
          points={plate.points}
          stroke={plate.fill}
          strokeWidth={0.02}
        />
      ))}
    </svg>
  );
};

const Sheet = ({ rolls }: { rolls: number[] }) => {
  const frames = framesOf(rolls);
  return (
    <div
      style={{
        backgroundColor: ink.paper,
        borderRadius: 8,
        boxShadow: "0 18px 40px rgba(20,10,4,0.45)",
        color: ink.pencil,
        display: "flex",
        width: W - 144,
      }}
    >
      {frameSlots.map(({ index, last, boxes }) => {
        const frame = frames.at(index);
        return (
          <div
            key={index}
            style={{
              borderRight: last ? "none" : `2px solid ${ink.rule}`,
              display: "flex",
              flexDirection: "column",
              flexGrow: last ? 1.45 : 1,
              flexBasis: 0,
            }}
          >
            <div
              style={{
                borderBottom: `2px solid ${ink.rule}`,
                color: "rgba(60,40,30,0.55)",
                display: "flex",
                fontSize: 18,
                justifyContent: "center",
              }}
            >
              {String(index + 1)}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {boxes.map((box) => {
                const mark = frame?.marks.at(box) ?? "";
                return (
                  <div
                    key={box}
                    style={{
                      alignItems: "center",
                      borderBottom: `2px solid ${ink.rule}`,
                      borderLeft: box === 0 ? "none" : `2px solid ${ink.rule}`,
                      color:
                        mark === "X" || mark === "/" ? ink.red : ink.pencil,
                      display: "flex",
                      fontSize: 26,
                      height: 38,
                      justifyContent: "center",
                      width: 36,
                    }}
                  >
                    {mark}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                justifyContent: "center",
                paddingBottom: 6,
                paddingTop: 4,
              }}
            >
              {String(frame?.total ?? "")}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const design = result?.design ?? firstDesign;
  const score = result === null ? null : scoreOf(result.rolls);
  const rank = score === null ? null : rankOf(score);
  const headline =
    score === null ? pitch[lang].headline : pointsText(score, lang);
  const caption = rank === null ? pitch[lang].detail : rank.name[lang];
  const dare = score === null ? "" : copy[lang].challenge.dare(score);
  const font = await loadMincho(
    `${headline}${caption}${dare}${copy.ja.name}${copy.en.reading}けしボウ0123456789X/-点`
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage:
          "radial-gradient(60% 80% at 22% 10%, rgba(255,200,120,0.35), rgba(255,200,120,0) 70%), linear-gradient(180deg, #3a2618 0%, #24170f 60%, #1a100a 100%)",
        color: ink.text,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Shippori Mincho",
        height: "100%",
        justifyContent: "space-between",
        padding: 72,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
            <span style={{ fontSize: 44 }}>{copy.ja.name}</span>
            <span style={{ color: ink.gold, fontSize: 24, letterSpacing: 4 }}>
              {lang === "en" ? copy.en.reading : copy.ja.reading}
            </span>
          </div>
          <div
            style={{
              color: score === PERFECT ? ink.gold : ink.text,
              display: "flex",
              fontSize: score === null ? 60 : 132,
              lineHeight: 1,
              marginTop: 18,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: score === null ? 34 : 44,
              marginTop: 12,
            }}
          >
            {caption}
          </div>
          {dare === "" ? null : (
            <div
              style={{
                color: ink.gold,
                display: "flex",
                fontSize: 30,
                marginTop: 14,
              }}
            >
              {dare}
            </div>
          )}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.5))",
            justifyContent: "center",
            width: 380,
          }}
        >
          <Eraser design={design} />
        </div>
      </div>
      <Sheet rolls={result?.rolls ?? []} />
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
