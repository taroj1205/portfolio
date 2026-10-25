import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { READING, copy } from "../_lib/copy";
import { SIZE, puzzlesOf, totalOf } from "../_lib/puzzles";
import type { Puzzle } from "../_lib/puzzles";
import { rankOf, readShared, verdictColors, verdictOf } from "../_lib/result";
import type { Shared } from "../_lib/result";

const W = 1200;
const H = 630;
const BOARD = 440;
const DEMO_SEED = 1205;

const paint = {
  answer: "#1d8a5a",
  gold: "#ffd27a",
  ink: "#1f1b16",
  paper: "#f4ecdc",
  sky: ["#3a2a1c", "#1a1410", "#0a0807"],
  text: "#fffaf3",
} as const;

interface Face {
  tag: string;
  headline: string;
  line: string;
  marks: number[];
}

const faceOf = (shared: Shared | null, lang: Lang): Face => {
  const words = copy[lang];

  if (shared === null) {
    return {
      headline: lang === "en" ? "No ruler" : "定規なし",
      line: words.pitch,
      marks: [],
      tag: words.tagline,
    };
  }

  const total = totalOf(shared.marks);

  return {
    headline: words.points(total),
    line: words.share.dare,
    marks: shared.marks,
    tag: words.result.rank[rankOf(total)],
  };
};

const Squares = ({ marks }: { marks: number[] }) => (
  <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
    {marks.map((mark, i) => (
      <div
        key={i}
        style={{
          backgroundColor: verdictColors[verdictOf(mark)],
          borderRadius: 10,
          display: "flex",
          height: 44,
          width: 44,
        }}
      />
    ))}
  </div>
);

const Board = ({ puzzle }: { puzzle: Puzzle }) => {
  const [answer] = puzzle.answers;

  return (
    <div
      style={{
        backgroundColor: paint.paper,
        borderRadius: 28,
        boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        display: "flex",
        height: BOARD,
        left: W - BOARD - 70,
        position: "absolute",
        top: (H - BOARD) / 2,
        width: BOARD,
      }}
    >
      <svg height={BOARD} viewBox={`0 0 ${SIZE} ${SIZE}`} width={BOARD}>
        {puzzle.circles.map(({ centre, radius }) => (
          <circle
            cx={centre.x}
            cy={centre.y}
            fill="none"
            key={radius}
            r={radius}
            stroke={paint.ink}
            strokeWidth={4}
          />
        ))}
        {answer === undefined ? null : (
          <g stroke={paint.answer} strokeLinecap="round" strokeWidth={4}>
            <circle cx={answer.x} cy={answer.y} fill="none" r={18} />
            <path
              d={`M${answer.x - 40} ${answer.y}H${answer.x - 9}M${answer.x + 9} ${answer.y}H${answer.x + 40}M${answer.x} ${answer.y - 40}V${answer.y - 9}M${answer.x} ${answer.y + 9}V${answer.y + 40}`}
              fill="none"
            />
            <circle cx={answer.x} cy={answer.y} fill={paint.answer} r={4} />
          </g>
        )}
      </svg>
    </div>
  );
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const shared = readShared(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const { tag, headline, line, marks } = faceOf(shared, lang);
  const reading = lang === "en" ? copy.en.name : READING;

  const centre = puzzlesOf(shared?.seed ?? DEMO_SEED).find(
    (puzzle) => puzzle.kind === "centre"
  );

  const font = await loadMincho(
    `${copy.ja.name}${reading}${tag}${headline}${line}0123456789`
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
      {centre === undefined ? null : <Board puzzle={centre} />}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 72,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 64,
          width: 600,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ color: paint.gold, fontSize: 22, letterSpacing: 3 }}>
            {reading}
          </span>
          <span style={{ fontSize: 50 }}>{copy.ja.name}</span>
        </div>
        <div
          style={{
            color: paint.gold,
            display: "flex",
            fontSize: 30,
            marginTop: 30,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 112,
            lineHeight: 1,
            marginTop: 10,
          }}
        >
          {headline}
        </div>
        {marks.length > 0 ? <Squares marks={marks} /> : null}
        <div
          style={{
            color: paint.text,
            display: "flex",
            fontSize: 30,
            lineHeight: 1.4,
            marginTop: 26,
            maxWidth: 560,
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
