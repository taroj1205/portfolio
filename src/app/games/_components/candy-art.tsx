import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { moulds } from "../katanuki/_lib/moulds";

const W = 640;
const H = 360;
const R = 140;
const SCALE = (R * 2) / 0.86;

const paint = {
  candy: ["#fff4f2", "#fbdce2", "#f2bccb", "#de98ad"],
  carved: "#a35a70",
  glow: "#ffd68c",
  groove: "rgb(176 104 128 / 0.7)",
  lantern: ["#ff7846", "#ffbe5a", "#c83c5a"],
  night: ["#120b1f", "#0a0712", "#160a14"],
  shadow: "#1a0710",
};

const outline = `${moulds.umbrella.outline
  .map(
    ({ x, y }, i) =>
      `${i === 0 ? "M" : "L"}${(W / 2 + (x - 0.5) * SCALE).toFixed(1)},${(H / 2 + (y - 0.5) * SCALE).toFixed(1)}`
  )
  .join(" ")} Z`;

const carve = stylex.keyframes({
  "0%": { strokeDashoffset: 1 },
  "70%, 100%": { strokeDashoffset: 0 },
});

const shine = stylex.keyframes({
  "0%, 70%": { opacity: 0 },
  "78%, 92%": { opacity: 1 },
  "100%": { opacity: 0 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  carve: {
    animationDuration: "6s",
    animationIterationCount: "infinite",
    animationName: { default: carve, [media.reduce]: "none" },
    animationTimingFunction: "linear",
    strokeDashoffset: { default: null, [media.reduce]: 0.4 },
  },
  shine: {
    animationDuration: "6s",
    animationIterationCount: "infinite",
    animationName: { default: shine, [media.reduce]: "none" },
    opacity: 0,
  },
});

export const CandyArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${W} ${H}`}
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="candy-art-night" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.night[0]} />
        <stop offset="0.55" stopColor={paint.night[1]} />
        <stop offset="1" stopColor={paint.night[2]} />
      </linearGradient>
      <radialGradient cx="0.42" cy="0.38" id="candy-art-body" r="0.6">
        <stop offset="0" stopColor={paint.candy[0]} />
        <stop offset="0.45" stopColor={paint.candy[1]} />
        <stop offset="0.85" stopColor={paint.candy[2]} />
        <stop offset="1" stopColor={paint.candy[3]} />
      </radialGradient>
      {paint.lantern.map((color, i) => (
        <radialGradient id={`candy-art-lantern-${i}`} key={color}>
          <stop offset="0" stopColor={color} stopOpacity="0.38" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      ))}
      <radialGradient id="candy-art-glow">
        <stop offset="0.6" stopColor={paint.glow} stopOpacity="0.55" />
        <stop offset="1" stopColor={paint.glow} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect fill="url(#candy-art-night)" height={H} width={W} />
    <circle cx={90} cy={50} fill="url(#candy-art-lantern-0)" r={200} />
    <circle cx={560} cy={40} fill="url(#candy-art-lantern-1)" r={170} />
    <circle cx={330} cy={420} fill="url(#candy-art-lantern-2)" r={260} />
    <circle
      cx={W / 2}
      cy={H / 2}
      fill="url(#candy-art-glow)"
      r={R + 50}
      {...stylex.props(styles.shine)}
    />
    <circle
      cx={W / 2 + 5}
      cy={H / 2 + 12}
      fill={paint.shadow}
      opacity={0.5}
      r={R + 3}
    />
    <circle cx={W / 2} cy={H / 2} fill="url(#candy-art-body)" r={R} />
    <path
      d={outline}
      fill="none"
      stroke={paint.groove}
      strokeLinejoin="round"
      strokeWidth={3}
    />
    <path
      d={outline}
      fill="none"
      pathLength={1}
      stroke={paint.carved}
      strokeDasharray="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      {...stylex.props(styles.carve)}
    />
  </svg>
);
