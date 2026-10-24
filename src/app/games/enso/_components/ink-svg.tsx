import { seeded } from "../_lib/brush";
import { inkPaths } from "../_lib/stroke";
import type { Trace } from "../_lib/stroke";

const tone = {
  bleed: "#2e3244",
  gold: "#c99a3e",
  ink: "#141118",
  paper: "#f4ecdc",
  paperEdge: "#e7dbc2",
  thread: "#9c7f52",
};

const roll = seeded(1021);

const FIBRES = Array.from({ length: 56 }, () => {
  const x = 0.1 + roll() * 0.8;
  const y = 0.1 + roll() * 0.8;
  const angle = roll() * Math.PI * 2;
  const reach = 0.03 + roll() * 0.08;

  return {
    light: roll() > 0.6,
    x0: x,
    x1: x + Math.cos(angle) * reach,
    y0: y,
    y1: y + Math.sin(angle) * reach,
  };
});

const FLECKS = Array.from({ length: 26 }, (_, i) => {
  const spread = roll() ** 2 * 0.3;
  const along = roll();
  const near = i % 2 === 0;

  return {
    r: 0.003 + roll() ** 2 * 0.011,
    x: 0.02 + (near ? spread : 0.96 - spread * along),
    y: 0.02 + (near ? spread * along : 0.96 - spread),
  };
});

interface Place {
  id: string;
  x: number;
  y: number;
  size: number;
}

export const paperSvg = ({ id, x, y, size }: Place) => (
  <>
    <defs>
      <linearGradient id={`${id}-paper`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={tone.paper} />
        <stop offset="1" stopColor={tone.paperEdge} />
      </linearGradient>
    </defs>
    <rect
      fill={`url(#${id}-paper)`}
      height={size}
      stroke={tone.gold}
      strokeOpacity="0.8"
      strokeWidth={Math.max(1, size * 0.004)}
      width={size}
      x={x}
      y={y}
    />
    {FIBRES.map((fibre) => (
      <line
        key={`${fibre.x0}-${fibre.y0}`}
        stroke={fibre.light ? "#ffffff" : tone.thread}
        strokeLinecap="round"
        strokeOpacity={fibre.light ? 0.32 : 0.1}
        strokeWidth={Math.max(0.5, size * 0.0015)}
        x1={x + fibre.x0 * size}
        x2={x + fibre.x1 * size}
        y1={y + fibre.y0 * size}
        y2={y + fibre.y1 * size}
      />
    ))}
    {FLECKS.map((fleck) => (
      <circle
        cx={x + fleck.x * size}
        cy={y + fleck.y * size}
        fill={tone.gold}
        fillOpacity="0.75"
        key={`${fleck.x}-${fleck.y}`}
        r={fleck.r * size}
      />
    ))}
  </>
);

export const inkSvg = ({
  id,
  x,
  y,
  size,
  trace,
}: Place & { trace: Trace[] }) => {
  const { body, streaks } = inkPaths(trace, { size, x, y });

  return (
    <>
      <defs>
        <filter height="140%" id={`${id}-bleed`} width="140%" x="-20%" y="-20%">
          <feGaussianBlur stdDeviation={size * 0.008} />
        </filter>
        <filter height="120%" id={`${id}-rough`} width="120%" x="-10%" y="-10%">
          <feTurbulence
            baseFrequency={60 / size}
            numOctaves="2"
            result="noise"
            seed="4"
            type="fractalNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={size * 0.008}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <path
        d={body}
        fill={tone.bleed}
        filter={`url(#${id}-bleed)`}
        opacity="0.4"
        stroke={tone.bleed}
        strokeWidth={size * 0.018}
      />
      <g filter={`url(#${id}-rough)`}>
        <path d={body} fill={tone.ink} />
        {streaks.map((streak) => (
          <path
            d={streak.d}
            fill="none"
            key={streak.lane}
            stroke={tone.paper}
            strokeDasharray={streak.dash}
            strokeLinecap="round"
            strokeOpacity={streak.opacity}
            strokeWidth={streak.width}
          />
        ))}
      </g>
    </>
  );
};
