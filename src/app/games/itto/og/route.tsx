import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import { cutSvg } from "../_components/food-svg";
import { woodSvg } from "../_components/wood-svg";
import { copy } from "../_lib/copy";
import type { Split } from "../_lib/cut";
import { SPAN } from "../_lib/foods";
import type { Food } from "../_lib/foods";
import {
  demoOf,
  kindTitle,
  rankOf,
  ratioText,
  readResult,
  scoreOf,
  tenths,
} from "../_lib/result";

const ink = {
  counter: "#1a110b",
  gold: "#ffd27a",
  label: "#2a1a10",
  paper: "#fff4ec",
  pill: "rgba(255,252,244,0.95)",
  seal: "#c8352b",
  soft: "rgba(255,250,243,0.78)",
  text: "#fffaf3",
};

const W = 1200;
const H = 630;
const BOARD = 600;
const INSET = 15;
const APART = 1.6;

const at = (value: number) => ((value + SPAN / 2) / SPAN) * BOARD + INSET;

const Labels = ({ split }: { split: Split }) => (
  <>
    {split.sides.map((side, index) => (
      <div
        key={index === 0 ? "plus" : "minus"}
        style={{
          backgroundColor: split.small === 500 ? ink.seal : ink.pill,
          borderRadius: 999,
          boxShadow: "0 6px 18px rgba(60,30,10,0.35)",
          color: split.small === 500 ? ink.paper : ink.label,
          display: "flex",
          fontSize: 30,
          left: at(side.centre.x + side.push.x * APART * 1.4) - 62,
          padding: "4px 18px",
          position: "absolute",
          top: at(side.centre.y + side.push.y * APART * 1.4) - 24,
        }}
      >
        {tenths(side.share)}%
      </div>
    ))}
  </>
);

const Mini = ({
  food,
  split,
  id,
}: {
  food: Food;
  split: Split;
  id: string;
}) => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      width: 92,
    }}
  >
    <svg
      height={84}
      viewBox={`${-SPAN / 2} ${-SPAN / 2} ${SPAN} ${SPAN}`}
      width={84}
    >
      {cutSvg(id, food, split, APART)}
    </svg>
    <span style={{ color: ink.text, fontSize: 17 }}>
      {ratioText(split.small)}
    </span>
  </div>
);

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const shared = readResult(params);
  const scored = shared === null ? null : scoreOf(shared);
  const demo = demoOf(0);
  const hero = scored?.best ?? demo;
  const rank = scored === null ? null : rankOf(scored.total);
  const caption =
    scored === null
      ? words.rule.lead
      : `${words.result.closest} · ${kindTitle(scored.best.food.kind, lang)}`;
  const detail =
    scored === null
      ? words.rule.body
      : `${words.result.off} ${tenths(scored.total)}% · ${rank?.name[lang] ?? ""}`;
  const seal = rank?.seal ?? ["一", "刀"];
  const font = await loadMincho(
    `${caption}${detail}${seal.join("")}${rank?.line[lang] ?? ""}${words.challenge.dare}0123456789.:%·一刀いっとうITTŌ`
  );
  const ratio = hero.split === null ? "" : ratioText(hero.split.small);

  return new ImageResponse(
    <div
      style={{
        backgroundColor: ink.counter,
        backgroundImage:
          "radial-gradient(circle at 75% -10%, #4a3020 0%, #24170f 45%, #110b07 100%)",
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
          borderRadius: 28,
          boxShadow: "0 10px 0 #b0834a, 0 30px 60px rgba(0,0,0,0.55)",
          display: "flex",
          height: BOARD,
          left: INSET,
          overflow: "hidden",
          position: "absolute",
          top: INSET - 4,
          width: BOARD,
        }}
      >
        <svg height={BOARD} viewBox={`0 0 ${BOARD} ${BOARD}`} width={BOARD}>
          {woodSvg("og-wood", BOARD, BOARD)}
        </svg>
      </div>
      <svg
        height={BOARD}
        style={{ left: INSET, position: "absolute", top: INSET - 4 }}
        viewBox={`${-SPAN / 2} ${-SPAN / 2} ${SPAN} ${SPAN}`}
        width={BOARD}
      >
        {cutSvg("og", hero.food, hero.split, APART)}
      </svg>
      {hero.split === null ? null : <Labels split={hero.split} />}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: H,
          justifyContent: "center",
          left: BOARD + INSET * 4,
          position: "absolute",
          top: 0,
          width: W - BOARD - INSET * 7,
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: ink.gold,
            display: "flex",
            fontSize: 28,
            gap: 16,
            letterSpacing: 10,
          }}
        >
          一刀
          <span style={{ fontSize: 20, letterSpacing: 4 }}>
            {lang === "en" ? "ITTŌ" : "いっとう"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            letterSpacing: 1,
            lineHeight: 1.05,
            marginTop: 10,
          }}
        >
          {ratio}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 30,
            gap: 16,
            marginTop: 14,
          }}
        >
          {rank === null ? null : (
            <div
              style={{
                alignItems: "center",
                backgroundColor: ink.seal,
                borderRadius: 6,
                color: ink.paper,
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                fontSize: 22,
                height: 56,
                justifyContent: "center",
                lineHeight: 1.05,
                transform: "rotate(-4deg)",
                width: 56,
              }}
            >
              <span>{seal[0]}</span>
              <span>{seal[1]}</span>
            </div>
          )}
          <span style={{ color: ink.gold }}>{caption}</span>
        </div>
        <div
          style={{
            color: ink.soft,
            display: "flex",
            fontSize: 26,
            marginTop: 14,
          }}
        >
          {detail}
        </div>
        {scored === null ? null : (
          <div style={{ display: "flex", gap: 4, marginTop: 26 }}>
            {scored.pieces.map((piece, index) => (
              <Mini
                food={piece.food}
                id={`og-mini-${index}`}
                key={`${piece.food.kind}-${piece.cut.angle}`}
                split={piece.split}
              />
            ))}
          </div>
        )}
        {scored === null ? null : (
          <div
            style={{
              color: ink.soft,
              display: "flex",
              fontSize: 22,
              marginTop: 22,
            }}
          >
            {words.challenge.dare}
          </div>
        )}
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
