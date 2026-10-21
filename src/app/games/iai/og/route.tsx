import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { MARK, SignalMark, duelSvg } from "../_components/duel-svg";
import type { Moment } from "../_components/duel-svg";
import { copy } from "../_lib/copy";
import {
  formatMs,
  isEarly,
  lineOf,
  rankOf,
  reachText,
  readResult,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Layout } from "../_lib/scene";

const ink = {
  gold: "#ffd27a",
  night: "#05060f",
  paper: "#fff4ec",
  seal: "#c8352b",
  star: "#fffaf3",
};

const W = 1200;
const H = 630;

const at: Layout = {
  gap: 180,
  ground: 548,
  h: H,
  mid: 340,
  moon: { r: 175, x: 340, y: 300 },
  scale: 2.2,
  w: W,
};

const momentOf = (result: Result | null): Moment => {
  if (result === null) {
    return {
      fake: null,
      left: "stance",
      lunge: null,
      right: "stance",
      signal: true,
      slash: null,
    };
  }
  if (result.end === "clear") {
    return {
      fake: null,
      left: "strike",
      lunge: "left",
      right: "fallen",
      signal: false,
      slash: "left",
    };
  }
  if (result.end === "slow") {
    return {
      fake: null,
      left: "fallen",
      lunge: "right",
      right: "strike",
      signal: false,
      slash: "right",
    };
  }
  return {
    fake: result.end === "early" ? null : result.end,
    left: "strike",
    lunge: "left",
    right: "stance",
    signal: false,
    slash: null,
  };
};

const sizes: Record<
  Lang,
  Record<
    "caption" | "dare" | "detail" | "gap" | "headline" | "spacing" | "stat",
    number
  >
> = {
  en: {
    caption: 36,
    dare: 24,
    detail: 22,
    gap: 20,
    headline: 88,
    spacing: 8,
    stat: 34,
  },
  ja: {
    caption: 44,
    dare: 26,
    detail: 24,
    gap: 28,
    headline: 104,
    spacing: 24,
    stat: 40,
  },
};

const textOf = (result: Result | null, lang: Lang) => {
  const words = copy[lang];
  if (result === null) {
    return {
      caption: words.rule.lead,
      dare: "",
      detail: words.rule.body,
      headline: words.name,
      rank: null,
    };
  }
  const rank = rankOf(result.reach);
  const fooled = isEarly(result.end);
  const reach = reachText(result.reach, lang);
  return {
    caption: fooled ? lineOf(result, lang) : rank.name[lang],
    dare: result.best === null ? words.challenge.still : words.challenge.dare,
    detail: fooled ? reach : lineOf(result, lang),
    headline: fooled ? words.verdict.early : reach,
    rank: fooled ? null : rank,
  };
};

const Caption = ({ text, size }: { text: string; size: number }) => {
  const [before, after] = text.split(MARK);
  return after === undefined ? (
    <span>{text}</span>
  ) : (
    <span style={{ alignItems: "center", display: "flex", gap: 6 }}>
      {before === "" ? null : <span>{before}</span>}
      <SignalMark size={size * 1.15} />
      <span>{after}</span>
    </span>
  );
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const { caption, dare, detail, headline, rank } = textOf(result, lang);
  const seal = rank?.seal ?? ["居", "合"];
  const font = await loadMincho(
    `${headline}${caption}${detail}${dare}${seal.join("")}${words.result.fastest}${words.result.average}0123456789ms居合いあいIAI`
  );
  const size = sizes[lang];
  const big = result === null ? 150 : size.headline;
  const stats =
    result === null || result.best === null || result.average === null
      ? []
      : [
          { label: words.result.fastest, value: result.best },
          { label: words.result.average, value: result.average },
        ];

  return new ImageResponse(
    <div
      style={{
        backgroundColor: ink.night,
        color: ink.star,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <svg
        height={H}
        style={{ left: 0, position: "absolute", top: 0 }}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
      >
        {duelSvg("og", at, momentOf(result))}
        <defs>
          <linearGradient id="og-shade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={ink.night} stopOpacity="0" />
            <stop offset="0.35" stopColor={ink.night} stopOpacity="0.7" />
            <stop offset="1" stopColor={ink.night} stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <rect fill="url(#og-shade)" height={H} width={560} x={640} />
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: H,
          justifyContent: "center",
          left: 712,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
          top: 0,
          width: 450,
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: ink.gold,
            display: "flex",
            fontSize: 26,
            gap: 16,
            letterSpacing: 10,
          }}
        >
          {result === null ? "いあい" : "居合"}
          {lang === "en" ? (
            <span style={{ fontSize: 22, letterSpacing: 4 }}>IAI</span>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: big,
            letterSpacing: result === null ? size.spacing : 1,
            lineHeight: 1.05,
            marginTop: 12,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            alignItems: "center",
            color: ink.gold,
            display: "flex",
            fontSize: size.caption,
            gap: 16,
            marginTop: 16,
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
          <Caption size={size.caption} text={caption} />
        </div>
        {stats.length === 0 ? null : (
          <div style={{ display: "flex", gap: size.gap, marginTop: 22 }}>
            {stats.map(({ label, value }) => (
              <div
                key={label}
                style={{ alignItems: "baseline", display: "flex", gap: 10 }}
              >
                <span style={{ fontSize: 22, opacity: 0.75 }}>{label}</span>
                <span style={{ fontSize: size.stat }}>{formatMs(value)}</span>
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: size.detail,
            lineHeight: 1.5,
            marginTop: 14,
            opacity: 0.82,
          }}
        >
          {detail}
        </div>
        {dare === "" ? null : (
          <div
            style={{
              display: "flex",
              fontSize: size.dare,
              lineHeight: 1.5,
              marginTop: 24,
            }}
          >
            {dare}
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
