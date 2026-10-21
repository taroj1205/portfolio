import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { cutSvg, tagAt } from "../_components/food-svg";
import { woodSvg } from "../_components/wood-svg";
import { copy } from "../_lib/copy";
import { errorOf } from "../_lib/cut";
import type { Split } from "../_lib/cut";
import { SPAN, isRare } from "../_lib/foods";
import {
  demoOf,
  kindTitle,
  pieceOf,
  rankOf,
  ratioText,
  readResult,
  tenths,
} from "../_lib/result";
import type { Piece } from "../_lib/result";

const ink = {
  counter: "#1a110b",
  gold: "#ffd27a",
  goldDeep: "#d9962a",
  label: "#2a1a10",
  paper: "#fff4ec",
  pill: "rgba(255,252,244,0.95)",
  rareInk: "#2a1d05",
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

const Label = ({
  side,
  small,
}: {
  side: Split["sides"][number];
  small: number;
}) => {
  const tag = tagAt(side, APART);
  return (
    <div
      style={{
        backgroundColor: small === 500 ? ink.seal : ink.pill,
        borderRadius: 999,
        boxShadow: "0 6px 18px rgba(60,30,10,0.35)",
        color: small === 500 ? ink.paper : ink.label,
        display: "flex",
        fontSize: 30,
        left: at(tag.x) - 62,
        padding: "4px 18px",
        position: "absolute",
        top: at(tag.y) - 24,
      }}
    >
      {tenths(side.share)}%
    </div>
  );
};

const Labels = ({ split }: { split: Split }) => (
  <>
    {split.sides.map((side, index) => (
      <Label
        key={index === 0 ? "plus" : "minus"}
        side={side}
        small={split.small}
      />
    ))}
  </>
);

const textOf = (piece: Piece | null, lang: Lang) => {
  const words = copy[lang];
  if (piece === null) {
    return {
      detail: words.rule.body,
      lead: null,
      name: "",
      rare: false,
      seal: ["一", "刀"] as const,
      title: words.rule.lead,
    };
  }
  const rank = rankOf(piece.split.small);
  return {
    detail: words.result.off(tenths(errorOf(piece.split.small))),
    lead: rank.line[lang],
    name: kindTitle(piece.food.kind, lang),
    rare: isRare(piece.food.kind),
    seal: rank.seal,
    title: rank.name[lang],
  };
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const shared = readResult(params);
  const piece = shared === null ? null : pieceOf(shared);
  const hero = piece ?? demoOf(0);
  const ratio = hero.split === null ? "" : ratioText(hero.split.small);
  const { detail, lead, name, rare, seal, title } = textOf(piece, lang);
  const font = await loadMincho(
    `${name}${detail}${title}${lead ?? ""}${seal.join("")}${words.rare}${words.challenge.dare}0123456789.:%·${copy.ja.name}はんぶんこどうじょう${copy.en.name}`
  );

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
          boxShadow: rare
            ? `0 0 0 4px ${ink.gold}, 0 0 60px rgba(255,190,80,0.55), 0 10px 0 #b0834a`
            : "0 10px 0 #b0834a, 0 30px 60px rgba(0,0,0,0.55)",
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
      {piece === null ? null : (
        <div
          style={{
            alignItems: "center",
            backgroundColor: rare ? ink.gold : "rgba(42,26,16,0.85)",
            borderRadius: 8,
            color: rare ? ink.rareInk : ink.paper,
            display: "flex",
            fontSize: 24,
            gap: 10,
            left: INSET + 20,
            padding: "6px 14px",
            position: "absolute",
            top: INSET + 16,
          }}
        >
          {rare ? (
            <span style={{ alignItems: "center", display: "flex", gap: 6 }}>
              <svg height={18} viewBox="-1 -1 2 2" width={18}>
                <path
                  d="M0-1Q0.12-0.12 1 0Q0.12 0.12 0 1Q-0.12 0.12-1 0Q-0.12-0.12 0-1Z"
                  fill={ink.rareInk}
                />
              </svg>
              {words.rare}
            </span>
          ) : null}
          <span>{name}</span>
        </div>
      )}
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
          {copy.ja.name}
          <span style={{ fontSize: 20, letterSpacing: 4 }}>
            {lang === "en" ? copy.en.name : "はんぶんこどうじょう"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 86,
            letterSpacing: 1,
            lineHeight: 1.05,
            marginTop: 12,
            whiteSpace: "nowrap",
          }}
        >
          {ratio}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 32,
            gap: 18,
            marginTop: 18,
          }}
        >
          <div
            style={{
              alignItems: "center",
              backgroundColor: ink.seal,
              borderRadius: 6,
              color: ink.paper,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              fontSize: 24,
              height: 62,
              justifyContent: "center",
              lineHeight: 1.05,
              transform: "rotate(-4deg)",
              width: 62,
            }}
          >
            <span>{seal[0]}</span>
            <span>{seal[1]}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxWidth: W - BOARD - INSET * 7 - 80,
            }}
          >
            <span style={{ color: ink.gold }}>{title}</span>
            <span style={{ color: ink.soft, fontSize: 24 }}>{detail}</span>
          </div>
        </div>
        {lead === null ? null : (
          <div
            style={{
              color: ink.text,
              display: "flex",
              fontSize: 28,
              marginTop: 26,
            }}
          >
            {lead}
          </div>
        )}
        {piece === null ? null : (
          <div
            style={{
              color: ink.soft,
              display: "flex",
              fontSize: 22,
              marginTop: 18,
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
