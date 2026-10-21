import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { firstDesign } from "../keshibo/_lib/eraser";
import { isoEraser } from "../keshibo/_lib/iso";

const W = 640;
const H = 360;
const BALL = isoEraser(firstDesign);
const BALL_SCALE = 34;

const paint = {
  band: "#f8f6f0",
  deskDark: "#a8774a",
  deskLight: "#e0b783",
  edge: "#6e4628",
  floor: "#2a1a10",
  ink: "#1e1e24",
  rubber: "#f3f0e8",
  shade: "#3a2414",
  sleeves: ["#2052b0", "#c3343b", "#2e7a4e", "#e6ad24", "#23232a", "#e3859f"],
  sun: "#ffd9a0",
};

const ROWS = [
  { count: 4, scale: 0.62, y: 92 },
  { count: 3, scale: 0.7, y: 108 },
  { count: 2, scale: 0.78, y: 126 },
  { count: 1, scale: 0.86, y: 146 },
];

const PINS = ROWS.flatMap((row, r) =>
  Array.from({ length: row.count }, (_, i) => ({
    color: paint.sleeves[(r * 3 + i) % paint.sleeves.length],
    scale: row.scale,
    x: W / 2 + (i - (row.count - 1) / 2) * 30 * row.scale,
    y: row.y,
  }))
);

const slide = stylex.keyframes({
  "0%": { opacity: 0, transform: "translate(0, 70px) scale(1.15)" },
  "12%": { opacity: 1 },
  "52%, 100%": { opacity: 1, transform: "translate(0, -96px) scale(0.72)" },
});

const topple = stylex.keyframes({
  "0%, 50%": { opacity: 1, transform: "rotate(0deg)" },
  "64%, 88%": { opacity: 1, transform: "rotate(var(--fall)) translateY(6px)" },
  "100%": { opacity: 0, transform: "rotate(var(--fall)) translateY(6px)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  ball: {
    animationDuration: "4.2s",
    animationIterationCount: "infinite",
    animationName: { default: slide, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  pin: (fall: string) => ({
    "--fall": fall,
    animationDuration: "4.2s",
    animationIterationCount: "infinite",
    animationName: { default: topple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.3, 0.6, 0.3, 1)",
    transformBox: "fill-box",
    transformOrigin: "bottom center",
  }),
});

export const EraserArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${W} ${H}`}
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="eraser-art-desk" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.deskDark} />
        <stop offset="1" stopColor={paint.deskLight} />
      </linearGradient>
      <radialGradient cx="0.25" cy="0.1" id="eraser-art-sun" r="0.8">
        <stop offset="0" stopColor={paint.sun} stopOpacity="0.55" />
        <stop offset="1" stopColor={paint.sun} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect fill={paint.floor} height={H} width={W} />
    <polygon
      fill="url(#eraser-art-desk)"
      points={`${W / 2 - 90},70 ${W / 2 + 90},70 ${W / 2 + 230},${H} ${W / 2 - 230},${H}`}
    />
    <line
      stroke={paint.edge}
      strokeOpacity={0.6}
      strokeWidth={2}
      x1={W / 2 - 150}
      x2={W / 2 + 150}
      y1={190}
      y2={190}
    />
    {PINS.map((pin, i) => (
      <g
        key={`${pin.x}-${pin.y}`}
        transform={`translate(${pin.x} ${pin.y}) scale(${pin.scale})`}
      >
        <g
          {...stylex.props(
            styles.pin(`${(i % 2 === 0 ? 1 : -1) * (60 + i * 3)}deg`)
          )}
        >
          <ellipse
            cx={4}
            cy={0}
            fill={paint.shade}
            opacity={0.35}
            rx={14}
            ry={3}
          />
          <rect
            fill={paint.rubber}
            height={40}
            rx={2}
            width={18}
            x={-9}
            y={-40}
          />
          <rect fill={pin.color} height={22} width={18} x={-9} y={-31} />
          <rect fill={paint.band} height={7} width={18} x={-9} y={-24} />
          <rect fill={paint.ink} height={7} width={18} x={-9} y={-17} />
        </g>
      </g>
    ))}
    <g transform={`translate(${W / 2} ${H - 70})`}>
      <g {...stylex.props(styles.ball)}>
        <g
          transform={`scale(${BALL_SCALE}) translate(${-BALL.x - BALL.width / 2} ${-BALL.y - BALL.height / 2})`}
        >
          {BALL.plates.map((plate) => (
            <polygon
              fill={plate.fill}
              key={`${plate.fill}${plate.points}`}
              opacity={plate.opacity}
              points={plate.points}
            />
          ))}
        </g>
      </g>
    </g>
    <rect fill="url(#eraser-art-sun)" height={H} width={W} />
  </svg>
);
