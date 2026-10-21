import type { CSSProperties, ReactNode } from "react";

import {
  armPose,
  bruise,
  curtain,
  floor,
  forearm,
  gloss,
  grains,
  hand,
  kine,
  kinePose,
  lantern,
  lip,
  mochi,
  sleeve,
  snow,
  tub,
  usu,
} from "../_lib/art";
import type { Fill, Part, Place } from "../_lib/art";

interface Hook {
  className?: string;
  style?: CSSProperties;
  opacity?: number;
}

const transformOf = (place: Place) =>
  `translate(${place.x} ${place.y}) rotate(${(place.angle * 180) / Math.PI}) scale(${place.sx} ${place.sy})`;

const gradientOf = (fill: Fill, id: string): ReactNode => {
  if ("solid" in fill) {
    return null;
  }
  const stops = fill.stops.map(([offset, color]) => (
    <stop key={offset} offset={offset} stopColor={color} />
  ));
  if ("linear" in fill) {
    const [x1, y1, x2, y2] = fill.linear;
    return (
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={id}
        key={id}
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
      >
        {stops}
      </linearGradient>
    );
  }
  const [cx, cy, r] = fill.radial;
  const [fx, fy] = fill.focus ?? [cx, cy];
  return (
    <radialGradient
      cx={cx}
      cy={cy}
      fx={fx}
      fy={fy}
      gradientUnits="userSpaceOnUse"
      id={id}
      key={id}
      r={r}
    >
      {stops}
    </radialGradient>
  );
};

const paintOf = (fill: Fill | undefined, id: string) => {
  if (fill === undefined) {
    return "none";
  }
  return "solid" in fill ? fill.solid : `url(#${id})`;
};

const draw = (part: Part, id: string, place?: Place, extra: Hook = {}) => (
  <g
    key={id}
    transform={place === undefined ? undefined : transformOf(place)}
    {...extra}
  >
    {part.map((layer, i) => {
      const fill = `${id}-f${i}`;
      const stroke = `${id}-s${i}`;
      return (
        <g key={fill}>
          {layer.fill === undefined ? null : gradientOf(layer.fill, fill)}
          {layer.stroke === undefined ? null : gradientOf(layer.stroke, stroke)}
          <path
            d={layer.d}
            fill={paintOf(layer.fill, fill)}
            opacity={layer.alpha}
            stroke={paintOf(layer.stroke, stroke)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={layer.width}
          />
        </g>
      );
    })}
  </g>
);

interface Motion {
  kine?: Hook;
  arm?: Hook;
  mochi?: Hook;
}

interface SceneProps {
  id: string;
  lift?: number;
  reach?: number;
  hurt?: boolean;
  smooth?: number;
  motion?: Motion;
}

export const scene = ({
  id,
  lift = 0.75,
  reach = 0,
  hurt = false,
  smooth = 1,
  motion = {},
}: SceneProps) => {
  const arm = armPose(reach, hurt ? 1.1 : 1);
  return (
    <g key={id}>
      {draw(floor, `${id}-floor`)}
      {draw(tub, `${id}-tub`)}
      {draw(usu, `${id}-usu`)}
      <g {...motion.mochi}>
        {draw(mochi, `${id}-mochi`)}
        {smooth >= 1
          ? null
          : draw(grains, `${id}-grains`, undefined, { opacity: 1 - smooth })}
        {draw(gloss, `${id}-gloss`, undefined, {
          opacity: 0.2 + 0.8 * smooth,
        })}
      </g>
      {draw(lip, `${id}-lip`)}
      <g {...motion.arm}>
        {draw(sleeve, `${id}-sleeve`, arm.sleeve)}
        {draw(forearm, `${id}-forearm`, arm.forearm)}
        {draw(hand, `${id}-hand`, arm.hand)}
        {hurt ? draw(bruise, `${id}-bruise`, arm.hand) : null}
      </g>
      <g {...motion.kine}>{draw(kine, `${id}-kine`, kinePose(lift))}</g>
    </g>
  );
};

interface BackdropProps {
  id: string;
  width: number;
  height: number;
  drape: number;
  lanterns: readonly { x: number; y: number; size: number }[];
  flakes: number;
}

export const backdrop = ({
  id,
  width,
  height,
  drape,
  lanterns,
  flakes,
}: BackdropProps) => (
  <g key={id}>
    {draw(curtain(width, drape), `${id}-curtain`)}
    {lanterns.map((spot, i) =>
      draw(lantern, `${id}-lantern-${i}`, {
        angle: 0,
        sx: spot.size,
        sy: spot.size,
        x: spot.x,
        y: spot.y,
      })
    )}
    {draw(snow(width, height, flakes), `${id}-snow`)}
  </g>
);
