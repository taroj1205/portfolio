import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { moulds } from "../_lib/moulds";
import type { MouldId, Point } from "../_lib/moulds";
import { PERFECT, headlineOf, rankOf, readResult } from "../_lib/result";
import type { Result } from "../_lib/result";

const W = 1200;
const H = 630;
const CANDY = { r: 236, x: 900, y: 315 };
const SCALE = (CANDY.r * 2) / 0.86;

const ink = {
  candy: ["#fff4f2", "#fbdce2", "#f2bccb", "#de98ad"],
  carved: "#a35a70",
  crack: "#6e2e42",
  dim: "rgba(255,246,240,0.5)",
  glow: "#ffd68c",
  gold: "#ffd27a",
  groove: "rgba(176,104,128,0.75)",
  lantern: ["#ff7846", "#ffbe5a", "#c83c5a"],
  text: "#fffaf3",
};

const toCanvas = ({ x, y }: Point) => ({
  x: CANDY.x + (x - 0.5) * SCALE,
  y: CANDY.y + (y - 0.5) * SCALE,
});

const pathOf = (points: readonly Point[], closed: boolean) =>
  `${points
    .map((point, i) => {
      const { x, y } = toCanvas(point);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ")}${closed ? " Z" : ""}`;

const crackOf = (at: Point) => {
  const angle = Math.atan2(0.5 - at.y, 0.5 - at.x) + 0.35;
  const points = Array.from({ length: 71 }, (_, i) => {
    const walked = (i - 35) * 0.014;
    const wobble = Math.sin(i * 1.7) * 0.008 + Math.sin(i * 0.6) * 0.006;
    return {
      x: at.x + Math.cos(angle) * walked - Math.sin(angle) * wobble,
      y: at.y + Math.sin(angle) * walked + Math.cos(angle) * wobble,
    };
  });
  return points.filter(
    (point) => Math.hypot(point.x - 0.5, point.y - 0.5) < 0.43
  );
};

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Trace it. Don't crack it.",
    detail: "Too fast, or off the line, and it breaks.",
  },
  ja: {
    caption: "割らずに、抜け。",
    detail: "速すぎても、はみ出しても割れる。",
  },
};

interface Face {
  tag: string;
  headline: string;
  caption: string;
  detail: string;
  dare: string;
  clear: boolean;
  perfect: boolean;
}

const faceOf = (result: Result | null, mould: MouldId, lang: Lang): Face => {
  const words = copy[lang];
  const name = moulds[mould].name[lang];
  if (result === null) {
    return {
      caption: pitch[lang].detail,
      clear: false,
      dare: "",
      detail: "",
      headline: pitch[lang].caption,
      perfect: false,
      tag: name,
    };
  }
  const rank = rankOf(result);
  return {
    caption: rank.name[lang],
    clear: result.time !== null,
    dare: result.time === null ? words.challenge.beat : words.challenge.dare,
    detail: rank.line[lang],
    headline: headlineOf(result, lang),
    perfect: rank.level === PERFECT,
    tag: name,
  };
};

const Candy = ({
  result,
  mould,
}: {
  result: Result | null;
  mould: MouldId;
}) => {
  const { outline } = moulds[mould];
  const carved = result === null ? 0.34 : result.carved / 100;
  const cut = outline.slice(0, Math.round(outline.length * carved));
  const broke = result !== null && result.time === null;
  const clear = result !== null && result.time !== null;
  const end = outline[Math.max(0, cut.length - 1)];
  return (
    <svg
      height={H}
      style={{ left: 0, position: "absolute", top: 0 }}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
    >
      <defs>
        <radialGradient cx="0.42" cy="0.38" id="og-candy" r="0.6">
          <stop offset="0" stopColor={ink.candy[0]} />
          <stop offset="0.45" stopColor={ink.candy[1]} />
          <stop offset="0.85" stopColor={ink.candy[2]} />
          <stop offset="1" stopColor={ink.candy[3]} />
        </radialGradient>
        <radialGradient id="og-lantern-a">
          <stop offset="0" stopColor={ink.lantern[0]} stopOpacity="0.4" />
          <stop offset="1" stopColor={ink.lantern[0]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="og-lantern-b">
          <stop offset="0" stopColor={ink.lantern[1]} stopOpacity="0.3" />
          <stop offset="1" stopColor={ink.lantern[1]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="og-lantern-c">
          <stop offset="0" stopColor={ink.lantern[2]} stopOpacity="0.35" />
          <stop offset="1" stopColor={ink.lantern[2]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="og-glow">
          <stop offset="0.6" stopColor={ink.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={ink.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={120} cy={70} fill="url(#og-lantern-a)" r={260} />
      <circle cx={560} cy={40} fill="url(#og-lantern-b)" r={200} />
      <circle cx={600} cy={700} fill="url(#og-lantern-c)" r={380} />
      <circle
        cx={CANDY.x + 6}
        cy={CANDY.y + 18}
        fill={ink.crack}
        opacity={0.5}
        r={CANDY.r + 4}
      />
      {clear ? (
        <circle
          cx={CANDY.x}
          cy={CANDY.y}
          fill="url(#og-glow)"
          r={CANDY.r + 60}
        />
      ) : null}
      <circle cx={CANDY.x} cy={CANDY.y} fill="url(#og-candy)" r={CANDY.r} />
      <path
        d={pathOf(outline, true)}
        fill="none"
        stroke={ink.groove}
        strokeLinejoin="round"
        strokeWidth={5}
      />
      {cut.length > 1 ? (
        <path
          d={pathOf(cut, carved === 1)}
          fill="none"
          stroke={clear ? ink.gold : ink.carved}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={9}
        />
      ) : null}
      {broke ? (
        <path
          d={pathOf(crackOf(end), false)}
          fill="none"
          stroke={ink.crack}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={5}
        />
      ) : null}
    </svg>
  );
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const mould = result?.mould ?? "umbrella";
  const { tag, headline, caption, detail, dare, clear, perfect } = faceOf(
    result,
    mould,
    lang
  );
  const font = await loadMincho(
    `${tag}${headline}${caption}${detail}${dare}型抜きかたぬきKatanuki0123456789.%秒s#·`
  );
  const accent = clear ? ink.gold : ink.text;

  return new ImageResponse(
    <div
      style={{
        backgroundImage:
          "linear-gradient(180deg, #120b1f 0%, #0a0712 55%, #160a14 100%)",
        color: ink.text,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <Candy mould={mould} result={result} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 72,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 72,
          width: 560,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 34,
            gap: 20,
          }}
        >
          <span style={{ fontSize: 44 }}>型抜き</span>
          <span style={{ color: ink.gold, fontSize: 24, letterSpacing: 4 }}>
            {lang === "en" ? "Katanuki" : "かたぬき"}
          </span>
        </div>
        <div
          style={{
            color: ink.dim,
            display: "flex",
            fontSize: 28,
            marginTop: 14,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            color: accent,
            display: "flex",
            fontSize: result === null ? 68 : 150,
            lineHeight: 1,
            marginTop: 30,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: perfect ? ink.gold : ink.text,
            display: "flex",
            fontSize: result === null ? 32 : 52,
            marginTop: 24,
          }}
        >
          {caption}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            marginTop: 10,
            opacity: 0.82,
          }}
        >
          {detail}
        </div>
        {dare === "" ? null : (
          <div
            style={{
              color: ink.gold,
              display: "flex",
              fontSize: 30,
              marginTop: 22,
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
