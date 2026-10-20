const ink = {
  ball: ["#fffbe6", "#ffd27a", "#ff8a3c", "#c2341a"],
  cool: ["#ffb27a", "#e0632c", "#8a2a12", "#3d1209"],
  glow: "#ff9a4a",
  hot: "#fff4d6",
  spark: "#ffc46a",
  paper: "#2a211d",
  string: "#3a2a22",
} as const;

const HANDLE = ["#b2332a", "#6d3b8f", "#2f7a52", "#d39a27"];

interface Burst {
  radius: number;
  light: number;
  rays: number;
  reach: [number, number];
  forks: number;
  twigs: number;
  droop: number;
  spread: number;
}

const bursts: readonly Burst[] = [
  {
    droop: 0,
    forks: 0,
    light: 0.5,
    radius: 3.2,
    rays: 7,
    reach: [5, 10],
    spread: 0,
    twigs: 0,
  },
  {
    droop: 0,
    forks: 2,
    light: 0.9,
    radius: 6.6,
    rays: 18,
    reach: [16, 32],
    spread: 0.6,
    twigs: 0,
  },
  {
    droop: 0,
    forks: 3,
    light: 1,
    radius: 6.4,
    rays: 30,
    reach: [30, 66],
    spread: 0.8,
    twigs: 2,
  },
  {
    droop: 1,
    forks: 0,
    light: 0.85,
    radius: 5.8,
    rays: 24,
    reach: [46, 92],
    spread: 0,
    twigs: 0,
  },
  {
    droop: 0,
    forks: 4,
    light: 0.7,
    radius: 4.6,
    rays: 30,
    reach: [12, 30],
    spread: 1.5,
    twigs: 0,
  },
];

const burstOf = (phase: number) =>
  bursts[Math.min(bursts.length - 1, Math.max(0, phase))] ?? bursts[0];

const randomFrom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const pt = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

const sparkPaths = (phase: number, variant: number) => {
  const burst = burstOf(phase);
  const roll = randomFrom(97 + phase * 31 + variant * 7919);
  const rays: string[] = [];
  const forks: string[] = [];
  for (let i = 0; i < burst.rays; i += 1) {
    const angle =
      burst.droop > 0
        ? Math.PI * (0.05 + roll() * 0.9)
        : (i / burst.rays) * Math.PI * 2 + roll() * 0.4;
    const reach = burst.reach[0] + roll() * (burst.reach[1] - burst.reach[0]);
    const sx = Math.cos(angle) * burst.radius;
    const sy = Math.sin(angle) * burst.radius;
    const ex = Math.cos(angle) * reach;
    const ey = Math.sin(angle) * reach;
    if (burst.droop > 0) {
      const sag = reach * (0.5 + roll() * 0.5);
      rays.push(
        `M${pt(sx, sy)}Q${pt(ex * 0.9, ey * 0.5)} ${pt(ex * 1.15, ey + sag)}`
      );
      continue;
    }
    rays.push(`M${pt(sx, sy)}L${pt(ex, ey)}`);
    for (let f = 0; f < burst.forks; f += 1) {
      const turn = angle + (roll() * 2 - 1) * burst.spread;
      const length = reach * (0.18 + roll() * 0.2);
      const fx = ex + Math.cos(turn) * length;
      const fy = ey + Math.sin(turn) * length;
      forks.push(`M${pt(ex, ey)}L${pt(fx, fy)}`);
      for (let t = 0; t < burst.twigs; t += 1) {
        const bend = turn + (roll() * 2 - 1) * burst.spread;
        const short = length * (0.35 + roll() * 0.2);
        forks.push(
          `M${pt(fx, fy)}L${pt(fx + Math.cos(bend) * short, fy + Math.sin(bend) * short)}`
        );
      }
    }
  }
  return { forks: forks.join(""), rays: rays.join("") };
};

export const sparklerDefs = (id: string) => (
  <defs>
    <radialGradient id={`${id}-glow`}>
      <stop offset="0" stopColor={ink.hot} stopOpacity="0.9" />
      <stop offset="0.25" stopColor={ink.glow} stopOpacity="0.45" />
      <stop offset="1" stopColor={ink.glow} stopOpacity="0" />
    </radialGradient>
    <radialGradient cx="0.4" cy="0.36" id={`${id}-ball`} r="0.7">
      {ink.ball.map((color, i) => (
        <stop key={color} offset={String(i / 3)} stopColor={color} />
      ))}
    </radialGradient>
    <radialGradient cx="0.4" cy="0.36" id={`${id}-cool`} r="0.7">
      {ink.cool.map((color, i) => (
        <stop key={color} offset={String(i / 3)} stopColor={color} />
      ))}
    </radialGradient>
  </defs>
);

interface SparklerProps {
  id: string;
  phase: number;
  x: number;
  y: number;
  scale: number;
  variant?: number;
  top?: number;
}

export const sparklerParts = ({
  id,
  phase,
  x,
  y,
  scale,
  variant = 0,
  top = y - 220 * scale,
}: SparklerProps) => {
  const burst = burstOf(phase);
  const { forks, rays } = sparkPaths(phase, variant);
  const pivot = y - 100 * scale;
  const handle = pivot - top;
  const transform = `translate(${x} ${y}) scale(${scale})`;
  return {
    back: (
      <>
        <circle
          cx={x}
          cy={y}
          fill={`url(#${id}-glow)`}
          opacity={burst.light}
          r={120 * scale}
        />
        {HANDLE.map((color, i) => {
          const from = pivot - handle * (0.45 + i * 0.14);
          return (
            <line
              key={color}
              stroke={color}
              strokeWidth={3.4 * scale}
              x1={x}
              x2={x}
              y1={from}
              y2={Math.max(top, from - handle * 0.14)}
            />
          );
        })}
        <line
          stroke={ink.paper}
          strokeWidth={3 * scale}
          x1={x}
          x2={x}
          y1={pivot}
          y2={pivot - handle * 0.45}
        />
        <line
          stroke={ink.string}
          strokeLinecap="round"
          strokeWidth={1.8 * scale}
          x1={x}
          x2={x}
          y1={pivot}
          y2={y - burst.radius * scale}
        />
      </>
    ),
    front: (
      <>
        <circle
          cx={x}
          cy={y}
          fill={`url(#${id}-glow)`}
          opacity={burst.light * 0.9}
          r={burst.radius * 4 * scale}
        />
        <circle
          cx={x}
          cy={y}
          fill={`url(#${id}-${phase === bursts.length - 1 ? "cool" : "ball"})`}
          r={burst.radius * scale}
        />
      </>
    ),
    sparks: (
      <g transform={transform}>
        <path
          d={rays}
          fill="none"
          stroke={ink.spark}
          strokeLinecap="round"
          strokeOpacity="0.85"
          strokeWidth={1.3}
        />
        <path
          d={forks}
          fill="none"
          stroke={ink.hot}
          strokeLinecap="round"
          strokeOpacity="0.8"
          strokeWidth={0.9}
        />
      </g>
    ),
  };
};
