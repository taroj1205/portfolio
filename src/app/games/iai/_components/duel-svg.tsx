import type { Fake, Side } from "../_lib/duel";
import {
  BLADE_Y,
  CAT_SIZE,
  EARLY_REACH,
  INK,
  LIFT,
  RIM,
  SIGNAL_Y,
  cat,
  crow,
  figures,
  homeOf,
  leaf,
  lungeOf,
  mark,
  paint,
  seeded,
  splash,
  tints,
  VERMILION,
} from "../_lib/scene";
import type { Layout, Pose } from "../_lib/scene";

const sprout = seeded(4242);

const BLADES = Array.from({ length: 70 }, (_, i) => ({
  h: sprout(),
  lean: (sprout() - 0.4) * 0.5,
  x: i / 70,
}));

const twinkle = seeded(1021);

const STARS = Array.from({ length: 90 }, () => ({
  o: Math.round((0.25 + twinkle() * 0.6) * 100) / 100,
  x: twinkle(),
  y: twinkle() ** 1.4,
}));

export const skySvg = (id: string, at: Layout) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.skyTop} />
        <stop offset="0.55" stopColor={paint.skyMid} />
        <stop offset="1" stopColor={paint.skyLow} />
      </linearGradient>
      <radialGradient id={`${id}-halo`}>
        <stop offset="0.3" stopColor={paint.halo} stopOpacity="0.34" />
        <stop offset="1" stopColor={paint.haze} stopOpacity="0" />
      </radialGradient>
      <radialGradient cx="0.35" cy="0.3" id={`${id}-moon`} r="0.75">
        <stop offset="0" stopColor={paint.moon} />
        <stop offset="0.65" stopColor={paint.moonMid} />
        <stop offset="1" stopColor={paint.moonEdge} />
      </radialGradient>
      <linearGradient id={`${id}-field`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.field} />
        <stop offset="1" stopColor={paint.fieldLow} />
      </linearGradient>
    </defs>
    <rect fill={`url(#${id}-sky)`} height={at.h} width={at.w} />
    {STARS.map((star) => (
      <circle
        cx={star.x * at.w}
        cy={star.y * at.ground * 0.85}
        fill={paint.moon}
        key={`${star.x}-${star.y}`}
        opacity={star.o}
        r={Math.max(0.6, at.scale * 0.7)}
      />
    ))}
    <circle
      cx={at.moon.x}
      cy={at.moon.y}
      fill={`url(#${id}-halo)`}
      r={at.moon.r * 3}
    />
    <circle
      cx={at.moon.x}
      cy={at.moon.y}
      fill={`url(#${id}-moon)`}
      r={at.moon.r}
    />
    <path
      d={`M0 ${at.ground}L0 ${at.ground - at.h * 0.14}Q${at.w * 0.18} ${at.ground - at.h * 0.24} ${at.w * 0.34} ${at.ground - at.h * 0.12}T${at.w * 0.7} ${at.ground - at.h * 0.1}T${at.w} ${at.ground - at.h * 0.18}L${at.w} ${at.ground}Z`}
      fill={paint.far}
      opacity="0.55"
    />
    <path
      d={`M0 ${at.ground}L0 ${at.ground - at.h * 0.06}Q${at.w * 0.25} ${at.ground - at.h * 0.11} ${at.w * 0.5} ${at.ground - at.h * 0.05}T${at.w} ${at.ground - at.h * 0.07}L${at.w} ${at.ground}Z`}
      fill={paint.near}
    />
    <rect
      fill={`url(#${id}-field)`}
      height={at.h - at.ground}
      width={at.w}
      y={at.ground}
    />
  </>
);

export const grassSvg = (at: Layout) => (
  <path
    d={BLADES.map(({ h, lean, x }) => {
      const bx = x * at.w;
      const by = at.h - (h * 0.2 + 0.01) * (at.h - at.ground);
      const tall = (40 + h * 60) * at.scale;

      return `M${bx.toFixed(1)} ${by.toFixed(1)}Q${(bx + lean * tall * 0.2).toFixed(1)} ${(by - tall * 0.6).toFixed(1)} ${(bx + lean * tall).toFixed(1)} ${(by - tall).toFixed(1)}`;
    }).join("")}
    fill="none"
    stroke={paint.grass}
    strokeLinecap="round"
    strokeWidth={2.2 * at.scale}
  />
);

export const figureSvg = (
  at: Layout,
  side: Side,
  pose: Pose,
  x: number,
  colour: string
) => {
  const figure = figures[pose];
  const flip = side === "left" ? 1 : -1;
  const [kx, ky] = figure.knot;

  const parts = (fill: string) => (
    <>
      {figure.body.map((d) => (
        <path d={d} fill={fill} key={d} />
      ))}
      {figure.lines.map((line) => (
        <path
          d={line.d}
          fill="none"
          key={line.d}
          stroke={fill}
          strokeLinecap="round"
          strokeWidth={line.width}
        />
      ))}
    </>
  );

  return (
    <g
      transform={`translate(${x} ${at.ground}) scale(${at.scale * LIFT * flip} ${at.scale * LIFT})`}
    >
      <g transform="translate(1.3 -1.2)">{parts(RIM)}</g>
      {parts(INK)}
      {figure.blade === null ? null : (
        <path d={figure.blade} fill={paint.blade} />
      )}
      <path
        d={`M${kx} ${ky}Q${kx - 13} ${ky + 2} ${kx - 26} ${ky + 7}M${kx} ${ky}Q${kx - 10} ${ky + 7} ${kx - 20} ${ky + 12}M${kx - 2} ${ky - 6}L${kx + 9} ${ky - 7}`}
        fill="none"
        stroke={colour}
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </g>
  );
};

const glyph = (r: number) => (
  <>
    <path
      d={`M${splash
        .map(
          (point) => `${(point.x * r).toFixed(2)} ${(point.y * r).toFixed(2)}`
        )
        .join("L")}Z`}
      fill={VERMILION}
    />
    <g transform={`scale(${(r / 44) * 1.05}) translate(0 -2)`}>
      <path d={mark.stem} fill={paint.moon} />
      <path d={mark.dot} fill={paint.moon} />
    </g>
  </>
);

export const signalSvg = (at: Layout) => {
  const r = 44 * at.scale;

  return (
    <g transform={`translate(${at.mid} ${at.ground - SIGNAL_Y * at.scale})`}>
      {glyph(r)}
    </g>
  );
};

export const SignalMark = ({ size }: { size: number | string }) => (
  <svg aria-hidden="true" height={size} viewBox="-50 -50 100 100" width={size}>
    {glyph(46)}
  </svg>
);

export const MARK = "「！」";

export const slashSvg = (at: Layout, side: Side) => {
  const from = homeOf(at, side);

  const to =
    homeOf(at, side === "left" ? "right" : "left") +
    (side === "left" ? 1 : -1) * at.gap * 0.5;

  const y = at.ground - BLADE_Y * at.scale * LIFT;

  return (
    <path
      d={`M${from} ${y + 6 * at.scale}Q${(from + to) / 2} ${y - 4 * at.scale} ${to} ${y - 6 * at.scale}Q${(from + to) / 2} ${y + 4 * at.scale} ${from} ${y + 6 * at.scale}Z`}
      fill={paint.slash}
      opacity="0.85"
    />
  );
};

const catParts = (fill: string) => (
  <>
    {cat.body.map((d) => (
      <path d={d} fill={fill} key={d} />
    ))}
    <path
      d={cat.tail}
      fill="none"
      stroke={fill}
      strokeLinecap="round"
      strokeWidth="2.2"
    />
    {cat.legs.map(([lx, ly]) => (
      <path
        d={`M${lx} ${ly}L${lx} 0`}
        fill="none"
        key={lx}
        stroke={fill}
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    ))}
  </>
);

const fakeSvg = (at: Layout, kind: Fake) => {
  if (kind === "cat") {
    const size = at.scale * CAT_SIZE * 0.85;

    return (
      <g
        transform={`translate(${at.mid + at.gap * 0.1} ${at.ground + 22 * at.scale}) scale(${size})`}
      >
        <g transform="translate(0.9 -0.9)">{catParts(RIM)}</g>
        {catParts(INK)}
        {cat.eyes.map(([ex, ey]) => (
          <ellipse
            cx={ex}
            cy={ey}
            fill={paint.eye}
            key={ex}
            rx="1.2"
            ry="1.6"
          />
        ))}
      </g>
    );
  }

  if (kind === "leaf") {
    return (
      <g
        transform={`translate(${at.mid + 10 * at.scale} ${at.ground - 70 * at.scale}) rotate(24) scale(${at.scale * 1.7})`}
      >
        <path d={leaf} fill={paint.leaf} />
        <path d="M0 4L0 14" stroke={paint.stem} strokeWidth="0.9" />
      </g>
    );
  }

  if (kind === "crow") {
    return (
      <g
        transform={`translate(${at.moon.x + at.moon.r * 0.2} ${at.moon.y - at.moon.r * 0.3}) scale(${-at.scale * 1.6} ${at.scale * 1.6})`}
      >
        <path d={crow.body} fill={INK} />
        <path d={crow.up} fill={INK} />
      </g>
    );
  }

  return (
    <g
      fill="none"
      stroke={paint.wind}
      strokeLinecap="round"
      strokeOpacity="0.55"
      strokeWidth="1.6"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const x = at.mid - at.gap * (1.1 - i * 0.18);
        const y = at.ground - (30 + i * 26) * at.scale;
        const length = (120 + (i % 3) * 50) * at.scale;

        return (
          <path
            d={`M${x} ${y}C${x + length * 0.35} ${y - 8 * at.scale} ${x + length * 0.7} ${y + 6 * at.scale} ${x + length} ${y - 4 * at.scale}`}
            key={i}
          />
        );
      })}
    </g>
  );
};

export interface Moment {
  left: Pose;
  right: Pose;
  lunge: Side | null;
  signal: boolean;
  slash: Side | null;
  fake: Fake | null;
}

const standAt = (at: Layout, moment: Moment, side: Side) => {
  if (moment.lunge !== side) {
    return homeOf(at, side);
  }

  const reach = moment.slash === null ? EARLY_REACH : 1;

  return homeOf(at, side) + (lungeOf(at, side) - homeOf(at, side)) * reach;
};

export const duelSvg = (id: string, at: Layout, moment: Moment) => (
  <>
    {skySvg(id, at)}
    {moment.fake === "crow" ? fakeSvg(at, "crow") : null}
    {figureSvg(
      at,
      "left",
      moment.left,
      standAt(at, moment, "left"),
      tints.duel.left
    )}
    {figureSvg(
      at,
      "right",
      moment.right,
      standAt(at, moment, "right"),
      tints.duel.right
    )}
    {grassSvg(at)}
    {moment.fake !== null && moment.fake !== "crow"
      ? fakeSvg(at, moment.fake)
      : null}
    {moment.signal ? signalSvg(at) : null}
    {moment.slash === null ? null : slashSvg(at, moment.slash)}
  </>
);
