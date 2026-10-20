import { TIER, TOP, bodies, kindOf } from "../_lib/bodies";

const BANDED = new Set<number>([TIER.neptune, TIER.saturn, TIER.jupiter]);

const ink = {
  disk: "#ff9a4a",
  diskHot: "#fff1d6",
  hole: "#030106",
  land: "#4f9a45",
  lens: "#ffd8a0",
  photon: "#ffe2b0",
  ring: "#ecd7a8",
  spot: "#c4502e",
  spark: "#ffffff",
  tail: "#bfe8ff",
};

export const orbDefs = (id: string) => (
  <defs>
    {bodies.map((kind, tier) => (
      <radialGradient
        cx="0.36"
        cy="0.32"
        id={`${id}-${tier}`}
        key={kind.name.en}
        r="0.78"
      >
        <stop offset="0" stopColor={kind.light} />
        <stop offset="0.5" stopColor={kind.base} />
        <stop offset="1" stopColor={kind.deep} />
      </radialGradient>
    ))}
    {bodies.map((kind, tier) => (
      <radialGradient id={`${id}-glow-${tier}`} key={kind.name.en}>
        <stop offset="0.3" stopColor={kind.glow} stopOpacity="0.55" />
        <stop offset="1" stopColor={kind.glow} stopOpacity="0" />
      </radialGradient>
    ))}
  </defs>
);

const bands = ({ r, x, y, tier }: OrbProps) => {
  const { deep, light } = kindOf(tier);
  return [-0.55, -0.22, 0.12, 0.42].map((at, i) => (
    <ellipse
      cx={x}
      cy={y + at * r}
      fill={i % 2 === 0 ? deep : light}
      key={at}
      opacity={0.32}
      rx={r * Math.sqrt(1 - at * at) * 0.96}
      ry={r * 0.09}
    />
  ));
};

interface OrbProps {
  id: string;
  tier: number;
  x: number;
  y: number;
  r: number;
}

export const orbSvg = ({ id, tier, x, y, r }: OrbProps) => {
  const glow = (
    <circle
      cx={x}
      cy={y}
      fill={`url(#${id}-glow-${tier})`}
      r={r * (tier === TIER.sun || tier === TOP ? 2.4 : 1.7)}
    />
  );
  if (tier === TIER.stardust) {
    const arm = r * 1.5;
    const waist = r * 0.28;
    return (
      <g>
        {glow}
        <path
          d={`M${x} ${y - arm}Q${x + waist} ${y - waist} ${x + arm} ${y}Q${x + waist} ${y + waist} ${x} ${y + arm}Q${x - waist} ${y + waist} ${x - arm} ${y}Q${x - waist} ${y - waist} ${x} ${y - arm}Z`}
          fill={kindOf(tier).light}
        />
        <circle cx={x} cy={y} fill={ink.spark} r={r * 0.35} />
      </g>
    );
  }
  if (tier === TOP) {
    const disk = (front: boolean) =>
      [
        { alpha: 0.45, color: ink.disk, width: 0.42 },
        { alpha: 0.95, color: ink.diskHot, width: 0.14 },
      ].map((layer) => (
        <path
          d={`M${x - r * 1.8} ${y}A${r * 1.8} ${r * 0.46} 0 0 ${front ? 0 : 1} ${x + r * 1.8} ${y}`}
          fill="none"
          key={layer.width}
          stroke={layer.color}
          strokeLinecap="round"
          strokeOpacity={layer.alpha * (front ? 1 : 0.8)}
          strokeWidth={r * layer.width}
        />
      ));
    const lens = (top: boolean) => (
      <path
        d={`M${x - r * 1.06} ${y}A${r * 1.06} ${r * 1.14} 0 0 ${top ? 1 : 0} ${x + r * 1.06} ${y}`}
        fill="none"
        stroke={ink.lens}
        strokeLinecap="round"
        strokeOpacity={top ? 0.95 : 0.45}
        strokeWidth={r * (top ? 0.16 : 0.08)}
      />
    );
    return (
      <g transform={`rotate(-12 ${x} ${y})`}>
        {glow}
        {disk(false)}
        <circle cx={x} cy={y} fill={ink.hole} r={r} />
        {lens(true)}
        {lens(false)}
        <circle
          cx={x}
          cy={y}
          fill="none"
          r={r * 1.01}
          stroke={ink.photon}
          strokeWidth={r * 0.035}
        />
        {disk(true)}
      </g>
    );
  }
  const ring = (front: boolean) => (
    <path
      d={`M${x - r * 1.85} ${y}A${r * 1.85} ${r * 0.58} 0 0 ${front ? 0 : 1} ${x + r * 1.85} ${y}`}
      fill="none"
      stroke={ink.ring}
      strokeOpacity={front ? 0.95 : 0.6}
      strokeWidth={r * 0.36}
      transform={`rotate(-16 ${x} ${y})`}
    />
  );
  return (
    <g>
      {glow}
      {tier === TIER.comet ? (
        <path
          d={`M${x} ${y - r * 0.8}Q${x - r * 2} ${y - r * 1.6} ${x - r * 4} ${y - r * 1.4}Q${x - r * 2} ${y - r * 0.3} ${x} ${y + r * 0.8}Z`}
          fill={ink.tail}
          opacity="0.45"
        />
      ) : null}
      {tier === TIER.saturn ? ring(false) : null}
      <circle cx={x} cy={y} fill={`url(#${id}-${tier})`} r={r} />
      {BANDED.has(tier) ? bands({ id, r, tier, x, y }) : null}
      {tier === TIER.earth ? (
        <g fill={ink.land} opacity="0.85">
          <ellipse
            cx={x - r * 0.3}
            cy={y - r * 0.2}
            rx={r * 0.32}
            ry={r * 0.22}
          />
          <ellipse
            cx={x + r * 0.35}
            cy={y + r * 0.25}
            rx={r * 0.24}
            ry={r * 0.3}
          />
        </g>
      ) : null}
      {tier === TIER.jupiter ? (
        <ellipse
          cx={x + r * 0.3}
          cy={y + r * 0.3}
          fill={ink.spot}
          opacity="0.85"
          rx={r * 0.24}
          ry={r * 0.13}
        />
      ) : null}
      {tier === TIER.saturn ? ring(true) : null}
    </g>
  );
};
