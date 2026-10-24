import { seeded } from "../_lib/random";

const wood = {
  base: ["#f2ddb2", "#e8cb97", "#efd6a8"],
  edge: "#c99d62",
  grain: ["#b88b52", "#c79a5f", "#a97c46", "#d4ad74"],
  mark: "#fff6e2",
  scratch: "#8a6438",
} as const;

const round = (value: number) => Math.round(value * 10) / 10;

const grainOf = (w: number, h: number) => {
  const roll = seeded(1205);

  return Array.from({ length: 38 }, (_, i) => {
    const y = (i / 38) * h + (roll() - 0.5) * (h / 30);
    const amp = 2 + roll() * h * 0.012;
    const freq = 0.004 + roll() * 0.006;
    const phase = roll() * Math.PI * 2;

    const points = Array.from({ length: 25 }, (__, k) => {
      const x = (k / 24) * (w + 40) - 20;

      return `${round(x)} ${round(y + Math.sin(x * freq + phase) * amp + (roll() - 0.5) * 1.6)}`;
    });

    return {
      colour: wood.grain[i % wood.grain.length],
      d: `M${points.join("L")}`,
      opacity: 0.12 + roll() * 0.3,
      width: 0.6 + roll() ** 2 * 2.6,
    };
  });
};

const marksOf = (w: number, h: number) => {
  const roll = seeded(4242);

  return Array.from({ length: 26 }, () => {
    const x = roll() * w;
    const y = roll() * h;
    const a = -0.5 + roll() * 1;
    const length = 14 + roll() * 46;

    return `M${round(x)} ${round(y)}l${round(Math.cos(a) * length)} ${round(Math.sin(a) * length)}`;
  });
};

export const woodSvg = (id: string, w: number, h: number) => (
  <>
    <defs>
      <linearGradient id={`${id}-wood`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={wood.base[0]} />
        <stop offset="0.55" stopColor={wood.base[1]} />
        <stop offset="1" stopColor={wood.base[2]} />
      </linearGradient>
      <radialGradient cx="0.5" cy="0.42" id={`${id}-glow`} r="0.75">
        <stop offset="0" stopColor={wood.mark} stopOpacity="0.32" />
        <stop offset="0.7" stopColor={wood.mark} stopOpacity="0" />
        <stop offset="1" stopColor={wood.edge} stopOpacity="0.35" />
      </radialGradient>
    </defs>
    <rect fill={`url(#${id}-wood)`} height={h} width={w} />
    {grainOf(w, h).map((line) => (
      <path
        d={line.d}
        fill="none"
        key={line.d}
        opacity={line.opacity}
        stroke={line.colour}
        strokeWidth={line.width}
      />
    ))}
    {marksOf(w, h).map((d) => (
      <g key={d}>
        <path d={d} opacity={0.35} stroke={wood.mark} strokeWidth={1.1} />
        <path
          d={d}
          opacity={0.1}
          stroke={wood.scratch}
          strokeWidth={0.8}
          transform="translate(0.8 0.8)"
        />
      </g>
    ))}
    <rect fill={`url(#${id}-glow)`} height={h} width={w} />
  </>
);
