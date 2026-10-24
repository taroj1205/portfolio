import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
}

const BAND_SLOPE = -30.3;

const ink = {
  core: "#fff4dc",
  dust: "#c9d3ff",
  haze: "#6a5bd6",
  mid: "#8f8cf0",
  star: "#fffaf3",
};

const round = (value: number) => Math.round(value * 100) / 100;

const makeStars = () => {
  let seed = 20_261_021;

  const roll = () => {
    seed = (seed * 16_807) % 2_147_483_647;

    return seed / 2_147_483_647;
  };

  const star = (x: number, y: number): Star => ({
    o: round(0.4 + roll() * 0.6),
    r: round(0.05 + roll() ** 3 * 0.14),
    x: round(x),
    y: round(y),
  });

  const stars: Star[] = [];

  for (let i = 0; i < 150; i += 1) {
    stars.push(star(roll() * 100, roll() * 100));
  }

  while (stars.length < 430) {
    const t = roll();
    const spread = (roll() + roll() + roll() - 1.5) * 15;
    const x = -10 + t * 120;
    const y = 85 - t * 70 + spread;

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      stars.push(star(x, y));
    }
  }

  return {
    blinkA: stars.filter((_, i) => i % 9 === 0),
    blinkB: stars.filter((_, i) => i % 9 === 4),
    still: stars.filter((_, i) => i % 9 !== 0 && i % 9 !== 4),
  };
};

const { blinkA, blinkB, still } = makeStars();

const dim = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.25 },
});

const styles = stylex.create({
  blinkA: {
    animationDuration: "4.6s",
    animationIterationCount: "infinite",
    animationName: { default: dim, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
  },
  blinkB: {
    animationDelay: "-2.1s",
    animationDuration: "6.4s",
    animationIterationCount: "infinite",
    animationName: { default: dim, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
  },
  sky: {
    height: "100%",
    inset: 0,
    pointerEvents: "none",
    position: "absolute",
    width: "100%",
  },
});

const Stars = ({ list }: { list: Star[] }) =>
  list.map(({ x, y, r, o }) => (
    <circle cx={x} cy={y} fill={ink.star} key={`${x}-${y}`} opacity={o} r={r} />
  ));

export const Sky = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 100 100"
    {...stylex.props(styles.sky)}
  >
    <defs>
      <radialGradient id="sky-band">
        <stop offset="0" stopColor={ink.dust} stopOpacity="0.34" />
        <stop offset="0.55" stopColor={ink.mid} stopOpacity="0.14" />
        <stop offset="1" stopColor={ink.haze} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sky-core">
        <stop offset="0" stopColor={ink.core} stopOpacity="0.5" />
        <stop offset="1" stopColor={ink.core} stopOpacity="0" />
      </radialGradient>
      <filter height="300%" id="sky-soft" width="140%" x="-20%" y="-100%">
        <feGaussianBlur stdDeviation="1.4" />
      </filter>
    </defs>
    <g transform={`rotate(${BAND_SLOPE} 50 50)`}>
      <ellipse cx="50" cy="50" fill="url(#sky-band)" rx="92" ry="13" />
      <ellipse
        cx="50"
        cy="50"
        fill="url(#sky-core)"
        filter="url(#sky-soft)"
        rx="70"
        ry="4.5"
      />
    </g>
    <Stars list={still} />
    <g {...stylex.props(styles.blinkA)}>
      <Stars list={blinkA} />
    </g>
    <g {...stylex.props(styles.blinkB)}>
      <Stars list={blinkB} />
    </g>
  </svg>
);
