import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { ART, BASE, artUri } from "../_lib/art";
import { copy } from "../_lib/copy";
import { TRIES, outcomeOf } from "../_lib/daily";
import { readShared, scoreOf } from "../_lib/result";
import type { Shared } from "../_lib/result";
import { gradeColors } from "../_lib/scale";
import type { Grade } from "../_lib/scale";

const W = 1200;
const H = 630;
const PIVOT = { x: 900, y: 250 };
const ARM = 175;
const HANG = 120;
const SHORT = 6;

const paint = {
  brass: ["#ffe7a8", "#e0aa4c", "#7a4f17"],
  dim: "rgba(255,250,243,0.4)",
  gold: "#ffd27a",
  sky: ["#22465a", "#0f2130", "#070c14"],
  text: "#fffaf3",
} as const;

interface Face {
  tag: string;
  headline: string;
  line: string;
  grades: Grade[];
  art: string;
  tilt: number;
}

const faceOf = (shared: Shared | null, lang: Lang): Face => {
  const words = copy[lang];

  if (shared === null) {
    return {
      art: "cloud",
      grades: [],
      headline: lang === "en" ? "1 g → 100M t" : "1g〜1億トン",
      line: words.pitch,
      tag: words.modes.daily,
      tilt: -8,
    };
  }

  if (shared.kind === "versus") {
    return {
      art: "elephant",
      grades: [],
      headline: words.versus.chain(shared.chain),
      line: words.versus.dare,
      tag: words.modes.versus,
      tilt: -12,
    };
  }

  const { solve } = shared;

  return {
    art: solve.item.id,
    grades: solve.grades,
    headline: scoreOf(solve.grades),
    line: words.share.dare(solve.item.name[lang]),
    tag: words.daily.day(solve.day),
    tilt: outcomeOf(solve.grades) === "won" ? 0 : -10,
  };
};

const Squares = ({ grades }: { grades: Grade[] }) => (
  <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
    {Array.from({ length: TRIES }, (_, i) => {
      const grade = grades[i];

      return (
        <div
          key={i}
          style={{
            backgroundColor:
              grade === undefined ? "transparent" : gradeColors[grade],
            border: `3px solid ${grade === undefined ? paint.dim : gradeColors[grade]}`,
            borderRadius: 14,
            display: "flex",
            height: 72,
            width: 72,
          }}
        />
      );
    })}
  </div>
);

const ITEM = 190;

const Scale = ({ tilt, art }: { tilt: number; art: string }) => {
  const theta = (tilt * Math.PI) / 180;

  const ends = [-1, 1].map((side) => ({
    x: PIVOT.x + side * ARM * Math.cos(theta),
    y: PIVOT.y + side * ARM * Math.sin(theta),
  }));

  const [left, right] = ends;

  if (left === undefined || right === undefined) {
    return null;
  }

  const pan = (x: number, y: number) =>
    `M${x - 80} ${y + HANG}Q${x} ${y + HANG + 50} ${x + 80} ${y + HANG}Z`;

  return (
    <div
      style={{
        display: "flex",
        height: H,
        left: 0,
        position: "absolute",
        top: 0,
        width: W,
      }}
    >
      <svg height={H} viewBox={`0 0 ${W} ${H}`} width={W}>
        <defs>
          <linearGradient id="og-brass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={paint.brass[0]} />
            <stop offset="0.45" stopColor={paint.brass[1]} />
            <stop offset="1" stopColor={paint.brass[2]} />
          </linearGradient>
        </defs>
        <path
          d={`M${PIVOT.x - 10} ${PIVOT.y}L${PIVOT.x - 14} 560H${PIVOT.x + 14}L${PIVOT.x + 10} ${PIVOT.y}Z`}
          fill="url(#og-brass)"
        />
        <path
          d={`M${PIVOT.x - 100} 590Q${PIVOT.x - 90} 556 ${PIVOT.x - 40} 552H${PIVOT.x + 40}Q${PIVOT.x + 90} 556 ${PIVOT.x + 100} 590Z`}
          fill="url(#og-brass)"
        />
        <line
          stroke={paint.brass[1]}
          strokeLinecap="round"
          strokeWidth={12}
          x1={left.x}
          x2={right.x}
          y1={left.y}
          y2={right.y}
        />
        {[left, right].map((end) => (
          <g key={end.x}>
            <path
              d={`M${end.x} ${end.y}L${end.x - 70} ${end.y + HANG}M${end.x} ${end.y}L${end.x + 70} ${end.y + HANG}`}
              stroke={paint.brass[0]}
              strokeOpacity={0.7}
              strokeWidth={2.5}
            />
            <path d={pan(end.x, end.y)} fill="url(#og-brass)" />
          </g>
        ))}
        <path
          d={`M${right.x - 40} ${right.y + HANG}L${right.x - 30} ${right.y + HANG - 56}H${right.x + 30}L${right.x + 40} ${right.y + HANG}Z`}
          fill="url(#og-brass)"
        />
        <circle
          cx={right.x}
          cy={right.y + HANG - 66}
          fill="url(#og-brass)"
          r={12}
        />
        <circle cx={PIVOT.x} cy={PIVOT.y} fill="url(#og-brass)" r={16} />
      </svg>
      <div
        style={{
          backgroundImage: `url(${artUri(art)})`,
          backgroundSize: "100% 100%",
          display: "flex",
          height: ITEM,
          left: left.x - ITEM / 2,
          position: "absolute",
          top: left.y + HANG - (ITEM * BASE) / ART + 4,
          width: ITEM,
        }}
      />
    </div>
  );
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const shared = readShared(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const { tag, headline, line, grades, art, tilt } = faceOf(shared, lang);
  const reading = lang === "en" ? copy.en.name : "いちおくトンてんびん";

  const font = await loadMincho(
    `${copy.ja.name}${reading}${tag}${headline}${line}·0123456789/X`
  );

  return await ogImage(
    <div
      style={{
        backgroundImage: `radial-gradient(120% 90% at 30% 0%, ${paint.sky[0]} 0%, ${paint.sky[1]} 50%, ${paint.sky[2]} 100%)`,
        color: paint.text,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <Scale art={art} tilt={tilt} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 72,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 64,
          width: 640,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
          <span style={{ fontSize: 46 }}>{copy.ja.name}</span>
          <span style={{ color: paint.gold, fontSize: 24, letterSpacing: 4 }}>
            {reading}
          </span>
        </div>
        <div
          style={{
            color: paint.gold,
            display: "flex",
            fontSize: 30,
            marginTop: 34,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: headline.length > SHORT ? 88 : 132,
            lineHeight: 1,
            marginTop: 14,
          }}
        >
          {headline}
        </div>
        {grades.length > 0 ? <Squares grades={grades} /> : null}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            lineHeight: 1.4,
            marginTop: 30,
            maxWidth: 540,
            opacity: 0.9,
          }}
        >
          {line}
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
