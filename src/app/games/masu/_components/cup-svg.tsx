import type { Bottle } from "../_lib/pour";
import {
  backWall,
  box,
  crestMark,
  drips,
  domeOutline,
  face,
  grain,
  joints,
  level,
  overflow,
  paint,
  project,
  radiusAt,
  raised,
  rimOf,
  ring,
  sideWalls,
  stamp,
  tumbler,
  vesselScale,
  vessels,
} from "../_lib/scene";
import type { Fill, Point } from "../_lib/scene";

const H = box.height;
const GLASS_TOP = box.floor + tumbler.height;
const TAU = Math.PI * 2;

const round = (value: number) => Math.round(value * 100) / 100;

const pathOf = (points: readonly Point[], close = true) =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${round(point.x)} ${round(point.y)}`
    )
    .join("") + (close ? "Z" : "");

const curveOf = ([from, mid, to]: readonly [Point, Point, Point]) =>
  `M${round(from.x)} ${round(from.y)}Q${round(mid.x)} ${round(mid.y)} ${round(to.x)} ${round(to.y)}`;

interface CupProps {
  id: string;
  fill: Fill;
  spilled: boolean;
}

const glassSvg = (id: string, fill: Fill) => {
  const { glass } = fill;
  if (glass === null) {
    return null;
  }
  const base = box.floor + tumbler.base;
  const r = radiusAt(glass.level);
  const filled = glass.level > base + 0.2;
  return (
    <>
      <path
        d={pathOf([
          ...ring(GLASS_TOP, tumbler.top, Math.PI, TAU),
          ...ring(box.floor, tumbler.bottom, 0, Math.PI),
        ])}
        fill={`url(#${id}-glass)`}
      />
      {filled ? (
        <>
          <path
            d={pathOf([
              ...ring(glass.level, r, Math.PI, TAU),
              ...ring(base, radiusAt(base), 0, Math.PI),
            ])}
            fill={paint.sake}
            fillOpacity="0.38"
          />
          <path
            d={pathOf(ring(glass.level + glass.dome * 0.6, r))}
            fill={paint.sheen}
            fillOpacity="0.45"
          />
        </>
      ) : null}
      {glass.over
        ? overflow(Math.max(fill.level, box.floor), () => 0).map((line) => (
            <path
              d={pathOf(line, false)}
              fill="none"
              key={`${line[0]?.x}`}
              stroke={paint.sake}
              strokeOpacity="0.6"
              strokeWidth="1.6"
            />
          ))
        : null}
      <path
        d={pathOf(ring(GLASS_TOP, tumbler.top))}
        fill="none"
        stroke={paint.glass}
        strokeOpacity="0.7"
        strokeWidth="0.55"
      />
      <path
        d={pathOf(
          [
            project(-(tumbler.top - 2.5), GLASS_TOP - 4, 2),
            project(-(tumbler.bottom - 2), box.floor + 8, 2),
          ],
          false
        )}
        stroke={paint.glass}
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
    </>
  );
};

const rimSvg = (id: string, side: -1 | 1) => {
  const rim = rimOf(side);
  return (
    <>
      <path
        d={pathOf([...rim.outer, ...rim.inner])}
        fill={`url(#${id}-rim${side < 0 ? "Back" : "Front"})`}
      />
      {rim.ends.map((end) => (
        <path
          d={pathOf(end)}
          fill={paint.endGrain}
          fillOpacity="0.55"
          key={`${end[0]?.x}`}
        />
      ))}
    </>
  );
};

const defsSvg = (id: string, top: number) => {
  const back = rimOf(-1).outer;
  const front = rimOf(1).outer;
  const surface = level(box.floor);
  return (
    <defs>
      <radialGradient id={`${id}-shadow`}>
        <stop offset="0" stopColor={paint.shadow} stopOpacity="0.75" />
        <stop offset="0.55" stopColor={paint.shadow} stopOpacity="0.35" />
        <stop offset="1" stopColor={paint.shadow} stopOpacity="0" />
      </radialGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-face`}
        x1="0"
        x2="0"
        y1={face[0]?.y}
        y2={face[3]?.y}
      >
        <stop offset="0" stopColor={paint.woodLight} />
        <stop offset="0.35" stopColor={paint.wood} />
        <stop offset="1" stopColor={paint.woodDark} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-rimBack`}
        x1="0"
        x2="0"
        y1={back[1]?.y}
        y2={back[0]?.y}
      >
        <stop offset="0" stopColor={paint.woodDark} />
        <stop offset="1" stopColor={paint.wood} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-rimFront`}
        x1="0"
        x2="0"
        y1={front[1]?.y}
        y2={front[0]?.y}
      >
        <stop offset="0" stopColor={paint.woodLight} />
        <stop offset="1" stopColor={paint.wood} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-wall`}
        x1="0"
        x2="0"
        y1={backWall[0]?.y}
        y2={surface[0]?.y}
      >
        <stop offset="0" stopColor={paint.inner} />
        <stop offset="1" stopColor={paint.innerDark} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-sake`}
        x1="0"
        x2="0"
        y1={top}
        y2={project(0, box.floor, box.inner).y}
      >
        <stop offset="0" stopColor={paint.mirror} stopOpacity="0.9" />
        <stop offset="0.1" stopColor={paint.sheen} stopOpacity="0.85" />
        <stop offset="0.22" stopColor={paint.sakeDeep} stopOpacity="0.75" />
        <stop offset="0.6" stopColor={paint.sake} stopOpacity="0.45" />
        <stop offset="1" stopColor={paint.sake} stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={paint.glass} stopOpacity="0.2" />
        <stop offset="0.2" stopColor={paint.glass} stopOpacity="0.05" />
        <stop offset="0.9" stopColor={paint.glass} stopOpacity="0.16" />
        <stop offset="1" stopColor={paint.glass} stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id={`${id}-band`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.sheen} stopOpacity="0.9" />
        <stop offset="0.35" stopColor={paint.sake} stopOpacity="0.6" />
        <stop offset="1" stopColor={paint.sakeDeep} stopOpacity="0.5" />
      </linearGradient>
      <radialGradient id={`${id}-glint`}>
        <stop offset="0" stopColor={paint.sheen} stopOpacity="0.75" />
        <stop offset="0.5" stopColor={paint.sheen} stopOpacity="0.25" />
        <stop offset="1" stopColor={paint.sheen} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-puddle`}>
        <stop offset="0" stopColor={paint.sake} stopOpacity="0.4" />
        <stop offset="0.8" stopColor={paint.sake} stopOpacity="0.25" />
        <stop offset="1" stopColor={paint.sheen} stopOpacity="0.45" />
      </radialGradient>
    </defs>
  );
};

const liquidSvg = (id: string, fill: Fill) => {
  if (fill.dome > 0) {
    const dome = domeOutline(fill.dome);
    const glint = project(-10, H + raised(fill) * 0.85, -18);
    return (
      <>
        <path d={pathOf(dome.outline)} fill={`url(#${id}-sake)`} />
        <ellipse
          cx={glint.x}
          cy={glint.y}
          fill={`url(#${id}-glint)`}
          rx="40"
          ry="10"
        />
        <path
          d={pathOf(dome.upper, false)}
          fill="none"
          stroke={paint.sheen}
          strokeOpacity="0.6"
          strokeWidth="0.45"
        />
      </>
    );
  }
  const surface = level(fill.level);
  const glint = project(-8, fill.level, -16);
  return (
    <>
      <path d={pathOf(surface)} fill={`url(#${id}-sake)`} />
      <ellipse
        cx={glint.x}
        cy={glint.y}
        fill={`url(#${id}-glint)`}
        rx="38"
        ry="9"
      />
    </>
  );
};

const domeFrontSvg = (id: string, fill: Fill) => {
  if (fill.dome <= 0) {
    return null;
  }
  const dome = domeOutline(fill.dome);
  return (
    <>
      <path
        d={pathOf([...dome.crest, ...dome.lower])}
        fill={`url(#${id}-band)`}
      />
      <path
        d={pathOf(dome.crest, false)}
        fill="none"
        stroke={paint.sheen}
        strokeOpacity="0.9"
        strokeWidth="0.7"
      />
    </>
  );
};

export const cupSvg = ({ id, fill, spilled }: CupProps) => {
  const shadow = project(0, 0, 4);
  const puddle = project(-4, 0, box.outer + 16);
  const top =
    fill.dome > 0
      ? Math.min(...domeOutline(fill.dome).upper.map((point) => point.y))
      : (level(fill.level)[0]?.y ?? 0);
  return (
    <>
      {defsSvg(id, top)}
      <ellipse
        cx={shadow.x}
        cy={shadow.y}
        fill={`url(#${id}-shadow)`}
        rx="78"
        ry="33"
      />
      {spilled ? (
        <ellipse
          cx={puddle.x}
          cy={puddle.y}
          fill={`url(#${id}-puddle)`}
          rx="62"
          ry="13"
        />
      ) : null}
      {rimSvg(id, -1)}
      <path d={pathOf(level(box.floor))} fill={paint.innerDark} />
      {sideWalls.map((wall) => (
        <path d={pathOf(wall)} fill={paint.innerDark} key={`${wall[0]?.x}`} />
      ))}
      <path d={pathOf(backWall)} fill={`url(#${id}-wall)`} />
      {liquidSvg(id, fill)}
      {glassSvg(id, fill)}
      <path d={pathOf(face)} fill={`url(#${id}-face)`} />
      {grain.map((line) => (
        <path
          d={curveOf(line.points)}
          fill="none"
          key={`${line.points[0].y}`}
          stroke={paint.grain}
          strokeOpacity={line.alpha}
          strokeWidth={line.width}
        />
      ))}
      {joints.map((joint) => (
        <path
          d={pathOf(joint)}
          fill={paint.endGrain}
          fillOpacity="0.7"
          key={`${joint[0]?.x}-${joint[0]?.y}`}
        />
      ))}
      <ellipse
        cx={stamp.x}
        cy={stamp.y}
        fill="none"
        rx="11.5"
        ry="11"
        stroke={paint.brand}
        strokeOpacity="0.62"
        strokeWidth="1.1"
      />
      <path
        d={crestMark(6.5)}
        fill="none"
        stroke={paint.brand}
        strokeOpacity="0.62"
        strokeWidth="1.4"
      />
      {rimSvg(id, 1)}
      <path
        d={pathOf(face.slice(0, 2), false)}
        stroke={paint.sheen}
        strokeOpacity="0.55"
        strokeWidth="0.45"
      />
      {domeFrontSvg(id, fill)}
      {spilled
        ? drips(1).map((drip) => (
            <rect
              fill={paint.sheen}
              fillOpacity="0.4"
              height={round(drip.bottom.y - drip.top.y)}
              key={drip.top.x}
              rx={drip.width / 2}
              width={drip.width}
              x={round(drip.top.x - drip.width / 2)}
              y={round(drip.top.y - drip.width / 2)}
            />
          ))
        : null}
    </>
  );
};

export const vesselTransform = (bottle: Bottle, at: Point, tilt: number) => {
  const vessel = vessels[bottle];
  const angle =
    ((vessel.rest + (vessel.tip - vessel.rest) * tilt) * 180) / Math.PI;
  return `translate(${round(at.x)} ${round(at.y)}) scale(${-vesselScale} ${vesselScale}) rotate(${round(angle)}) translate(${-vessel.lip.x} ${-vessel.lip.y})`;
};

export const vesselPath = (bottle: Bottle) =>
  pathOf(vessels[bottle].outline.map(([x, y]) => ({ x, y })));
