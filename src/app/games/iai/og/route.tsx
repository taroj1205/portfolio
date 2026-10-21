import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { MARK, SignalMark, duelSvg } from "../_components/duel-svg";
import type { Moment } from "../_components/duel-svg";
import { copy } from "../_lib/copy";
import { beatenBy, fakes } from "../_lib/duel";
import {
  headlineOf,
  isFooled,
  lineOf,
  rankOf,
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
  if (isFooled(result)) {
    return {
      fake: fakes.find((kind) => kind === result.miss) ?? null,
      left: "strike",
      lunge: "left",
      right: "stance",
      signal: false,
      slash: null,
    };
  }
  if (beatenBy(result.reaction) > 0) {
    return {
      fake: null,
      left: "strike",
      lunge: "left",
      right: "fallen",
      signal: false,
      slash: "left",
    };
  }
  return {
    fake: null,
    left: "fallen",
    lunge: "right",
    right: "strike",
    signal: false,
    slash: "right",
  };
};

const sizes: Record<
  Lang,
  Record<"caption" | "dare" | "detail" | "headline" | "spacing", number>
> = {
  en: {
    caption: 36,
    dare: 24,
    detail: 22,
    headline: 88,
    spacing: 8,
  },
  ja: {
    caption: 44,
    dare: 24,
    detail: 22,
    headline: 104,
    spacing: 24,
  },
};

const dareOf = (result: Result, lang: Lang) => {
  const words = copy[lang].challenge;
  if (result.reaction !== null) {
    return words.dare;
  }
  return isFooled(result) ? words.still : "";
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
  const rank = rankOf(result.reaction);
  const fooled = isFooled(result);
  return {
    caption: fooled ? lineOf(result, lang) : rank.name[lang],
    dare: dareOf(result, lang),
    detail: fooled ? "" : lineOf(result, lang),
    headline: headlineOf(result, lang),
    rank: fooled ? null : rank,
  };
};

const bigOf = (result: Result | null, lang: Lang) => {
  if (result === null) {
    return 150;
  }
  return result.reaction === null ? sizes[lang].headline : 136;
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
  const { caption, dare, detail, headline, rank } = textOf(result, lang);
  const seal = rank?.seal ?? ["居", "合"];
  const font = await loadMincho(
    `${headline}${caption}${detail}${dare}${seal.join("")}居合いあいIAI`
  );
  const size = sizes[lang];
  const big = bigOf(result, lang);

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
        {detail === "" ? null : (
          <div
            style={{
              display: "flex",
              fontSize: size.detail,
              lineHeight: 1.5,
              marginTop: 18,
              opacity: 0.82,
            }}
          >
            {detail}
          </div>
        )}
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
