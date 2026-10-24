export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Frame {
  x: number;
  y: number;
  size: number;
}

export interface Sprite {
  box: Box;
  body: string;
}

export interface Point {
  x: number;
  y: number;
}

export type Stop = readonly [number, string, number?];

export const n = (value: number) => Number(value.toFixed(2));

export const seeded = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 16_807) % 2_147_483_647;

    return state / 2_147_483_647;
  };
};

export const stopsOf = (stops: readonly Stop[]) =>
  stops
    .map(
      ([offset, color, opacity = 1]) =>
        `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`
    )
    .join("");

export const linear = (
  id: string,
  [x1, y1, x2, y2]: readonly [number, number, number, number],
  stops: readonly Stop[]
) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsOf(stops)}</linearGradient>`;

export const shade = (id: string, stops: readonly Stop[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stopsOf(stops)}</linearGradient>`;

export const radial = (
  id: string,
  [cx, cy, r]: readonly [number, number, number],
  stops: readonly Stop[],
  focus: readonly [number, number] = [cx, cy]
) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fx="${n(focus[0])}" fy="${n(focus[1])}">${stopsOf(stops)}</radialGradient>`;

export const blur = (id: string, deviation: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n(deviation)}"/></filter>`;

export const curve = (points: readonly Point[]) => {
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  const parts = [`M${n(points[0].x)} ${n(points[0].y)}`];

  for (let i = 0; i < points.length - 1; i += 1) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    parts.push(
      `C${n(b.x + (c.x - a.x) / 6)} ${n(b.y + (c.y - a.y) / 6)} ${n(c.x - (d.x - b.x) / 6)} ${n(c.y - (d.y - b.y) / 6)} ${n(c.x)} ${n(c.y)}`
    );
  }

  return parts.join("");
};

export const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  attributes: string
) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${attributes}/>`;

export const path = (d: string, attributes: string) =>
  `<path d="${d}" ${attributes}/>`;

export const docOf = (box: Box, width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(box.x)} ${n(box.y)} ${n(box.w)} ${n(box.h)}" width="${Math.round(width)}" height="${Math.round(height)}" preserveAspectRatio="none">${body}</svg>`;

export const spriteDoc = (sprite: Sprite, scale: number) =>
  docOf(sprite.box, sprite.box.w * scale, sprite.box.h * scale, sprite.body);

export const dataUri = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(svg)}`;
