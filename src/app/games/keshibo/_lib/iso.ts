import { rubbers, forms, sleeves } from "./eraser";
import type { Design } from "./eraser";
import { hex } from "./scenery";

interface Plate {
  points: string;
  fill: string;
  opacity: number;
}

interface Vec {
  x: number;
  y: number;
  z: number;
}

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const WHITE = "#f8f6f0";
const INK = "#1e1e24";
const BLUE = "#2052b0";

const toScreen = ({ x, y, z }: Vec) => ({
  x: (x - y) * COS,
  y: (x + y) * SIN - z,
});

const tint = (color: string, light: number) =>
  `rgb(${hex(color)
    .map((value) => Math.round(Math.min(255, value * light)))
    .join(" ")})`;

interface Face {
  origin: Vec;
  u: Vec;
  v: Vec;
  light: number;
}

const at = (face: Face, a: number, b: number): Vec => ({
  x: face.origin.x + face.u.x * a + face.v.x * b,
  y: face.origin.y + face.u.y * a + face.v.y * b,
  z: face.origin.z + face.u.z * a + face.v.z * b,
});

export const isoEraser = (design: Design) => {
  const { w, d, h } = forms[design.form];
  const rubber = rubbers[design.rubber].color;
  const sleeve = sleeves[design.sleeve].color;
  const stripe = design.sleeve === "black" ? BLUE : INK;
  const plates: Plate[] = [];
  const points: { x: number; y: number }[] = [];

  const rect = (
    face: Face,
    [a0, a1]: [number, number],
    [b0, b1]: [number, number],
    color: string,
    opacity = 1
  ) => {
    const corners = [
      at(face, a0, b0),
      at(face, a1, b0),
      at(face, a1, b1),
      at(face, a0, b1),
    ].map(toScreen);

    points.push(...corners);
    plates.push({
      fill: tint(color, face.light),
      opacity,
      points: corners
        .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join(" "),
    });
  };

  const dot = (face: Face, a: number, b: number, radius: number) => {
    const ring = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;

      return toScreen(
        at(face, a + Math.cos(angle) * radius, b + Math.sin(angle) * radius)
      );
    });

    plates.push({
      fill: tint(WHITE, face.light),
      opacity: 1,
      points: ring.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "),
    });
  };

  const sleeveOn = (face: Face, across: number) => {
    const s = (w / 2) * 0.64;
    rect(face, [-s, s], [-across, across], sleeve);

    if (design.pattern === "bands") {
      const third = (2 * across) / 3;
      rect(face, [-s, s], [-across + third, -across + 2 * third], WHITE);
      rect(face, [-s, s], [-across + 2 * third, across], stripe);
    } else if (design.pattern === "plain") {
      for (const k of [-1, 1]) {
        const mid = k * s * 0.86;
        rect(
          face,
          [mid - s * 0.035, mid + s * 0.035],
          [-across, across],
          WHITE
        );
      }
    } else if (design.pattern === "check") {
      for (const k of [-0.6, 0, 0.6]) {
        rect(
          face,
          [k * s - s * 0.09, k * s + s * 0.09],
          [-across, across],
          WHITE,
          0.34
        );
      }

      rect(face, [-s, s], [-across * 0.18, across * 0.18], WHITE, 0.34);
    } else {
      const radius = Math.min(across, s) * 0.2;

      for (const i of [-0.72, -0.24, 0.24, 0.72]) {
        for (const j of [-0.5, 0.5]) {
          dot(face, i * s, j * across, radius);
        }
      }
    }
  };

  const top: Face = {
    light: 1.04,
    origin: { x: 0, y: 0, z: h / 2 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 1, z: 0 },
  };

  const front: Face = {
    light: 0.84,
    origin: { x: 0, y: d / 2, z: 0 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 0, z: -1 },
  };

  const end: Face = {
    light: 0.7,
    origin: { x: w / 2, y: 0, z: 0 },
    u: { x: 0, y: -1, z: 0 },
    v: { x: 0, y: 0, z: -1 },
  };

  rect(end, [-d / 2, d / 2], [-h / 2, h / 2], rubber);
  rect(front, [-w / 2, w / 2], [-h / 2, h / 2], rubber);
  sleeveOn(front, h / 2);
  rect(top, [-w / 2, w / 2], [-d / 2, d / 2], rubber);
  sleeveOn(top, d / 2);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return {
    height: Math.max(...ys) - minY,
    plates,
    width: Math.max(...xs) - minX,
    x: minX,
    y: minY,
  };
};
