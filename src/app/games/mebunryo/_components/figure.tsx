import * as stylex from "@stylexjs/stylex";

import { media } from "../../_components/theme.stylex";
import type { Point } from "../../_lib/svg";
import { SIZE, rayEnd } from "../_lib/puzzles";
import type { Puzzle, Segment } from "../_lib/puzzles";

export const paint = {
  answer: "#1d8a5a",
  gold: "#b8862b",
  guess: "#e2432a",
  ink: "#1f1b16",
  paper: "#f4ecdc",
} as const;

const pop = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(3)" },
  "60%": { opacity: 1, transform: "scale(0.85)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const fade = stylex.keyframes({
  "0%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const draw = stylex.keyframes({
  "0%": { strokeDashoffset: 1 },
  "100%": { strokeDashoffset: 0 },
});

const styles = stylex.create({
  pop: {
    animationDuration: "520ms",
    animationFillMode: "backwards",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.4, 0.64, 1)",
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  fade: {
    animationDuration: "420ms",
    animationFillMode: "backwards",
    animationName: { default: fade, [media.reduce]: "none" },
  },
  draw: {
    animationDelay: "200ms",
    animationDuration: "420ms",
    animationFillMode: "backwards",
    animationName: { default: draw, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
  },
});

const toneOf = (line: Segment) => {
  if (line.tone === "gold") {
    return { dash: undefined, stroke: paint.gold, width: 4 };
  }

  if (line.tone === "guide") {
    return { dash: "2 9", stroke: paint.ink, width: 2 };
  }

  return { dash: undefined, stroke: paint.ink, width: 3 };
};

const Lines = ({ puzzle }: { puzzle: Puzzle }) => (
  <>
    <rect fill={paint.paper} height={SIZE} width={SIZE} />
    {puzzle.circles.map(({ centre, radius }) => (
      <circle
        cx={centre.x}
        cy={centre.y}
        fill="none"
        key={`${centre.x}-${radius}`}
        r={radius}
        stroke={paint.ink}
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
    ))}
    {puzzle.lines.map((line) => {
      const { dash, stroke, width } = toneOf(line);

      return (
        <line
          key={`${line.from.x}-${line.from.y}-${line.to.x}`}
          stroke={stroke}
          strokeDasharray={dash}
          strokeLinecap="round"
          strokeWidth={width}
          vectorEffect="non-scaling-stroke"
          x1={line.from.x}
          x2={line.to.x}
          y1={line.from.y}
          y2={line.to.y}
        />
      );
    })}
    {puzzle.dots.map((dot) => (
      <circle
        cx={dot.x}
        cy={dot.y}
        fill={paint.ink}
        key={`${dot.x}-${dot.y}`}
        r={5}
      />
    ))}
  </>
);

interface MarkProps {
  at: Point;
  color: string;
  size: number;
  weight: number;
}

const Cross = ({ at, color, size, weight }: MarkProps) => {
  const gap = 7 * size;
  const arm = 30 * size;

  return (
    <g stroke={color} strokeLinecap="round">
      <circle
        cx={at.x}
        cy={at.y}
        fill="none"
        r={13 * size}
        strokeWidth={2.5 * weight}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${at.x - arm} ${at.y}H${at.x - gap}M${at.x + gap} ${at.y}H${at.x + arm}M${at.x} ${at.y - arm}V${at.y - gap}M${at.x} ${at.y + gap}V${at.y + arm}`}
        strokeWidth={2.5 * weight}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={at.x} cy={at.y} fill={color} r={2.4 * size} stroke="none" />
    </g>
  );
};

const Ray = ({
  pivot,
  at,
  color,
  size,
  weight,
}: MarkProps & { pivot: Point }) => {
  const end = rayEnd(pivot, at);

  return (
    <g stroke={color} strokeLinecap="round">
      <line
        strokeWidth={3.5 * weight}
        vectorEffect="non-scaling-stroke"
        x1={pivot.x}
        x2={end.x}
        y1={pivot.y}
        y2={end.y}
      />
      <circle
        cx={at.x}
        cy={at.y}
        fill="none"
        r={11 * size}
        strokeWidth={2.5 * weight}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
};

const Mark = ({ puzzle, ...mark }: MarkProps & { puzzle: Puzzle }) =>
  puzzle.pivot === null ? (
    <Cross {...mark} />
  ) : (
    <Ray {...mark} pivot={puzzle.pivot} />
  );

interface FigureProps {
  puzzle: Puzzle;
  guess: Point | null;
  answer: Point | null;
  size?: number;
  animate?: boolean;
}

export const Figure = ({
  puzzle,
  guess,
  answer,
  size = 1,
  animate = false,
}: FigureProps) => (
  <>
    <Lines puzzle={puzzle} />
    {answer !== null && guess !== null && puzzle.pivot === null ? (
      <line
        pathLength={1}
        stroke={paint.answer}
        strokeDasharray="1"
        strokeLinecap="round"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        x1={guess.x}
        x2={answer.x}
        y1={guess.y}
        y2={answer.y}
        {...stylex.props(animate && styles.draw)}
      />
    ) : null}
    {answer === null ? null : (
      <g
        opacity={0.7}
        {...stylex.props(
          animate && (puzzle.pivot === null ? styles.pop : styles.fade)
        )}
      >
        <Mark
          at={answer}
          color={paint.answer}
          puzzle={puzzle}
          size={size}
          weight={2.2}
        />
      </g>
    )}
    {guess === null ? null : (
      <Mark
        at={guess}
        color={paint.guess}
        puzzle={puzzle}
        size={size}
        weight={1}
      />
    )}
  </>
);
