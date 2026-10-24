import { rubbers, sleeves } from "./eraser";
import type { Design, PatternId } from "./eraser";
import { PIN } from "./physics";
import type { Ball, Pin } from "./physics";
import { LIGHT, css, hex, lit, sunOn } from "./scenery";
import type { Rgb } from "./scenery";

export interface Vec {
  x: number;
  y: number;
  z: number;
}

export interface View {
  eye: Vec;
  sin: number;
  cos: number;
  focal: number;
  cx: number;
  cy: number;
}

export interface Look {
  rubber: Rgb;
  sleeve: Rgb;
  stripe: Rgb;
  pattern: PatternId;
}

type Axes = readonly [Vec, Vec, Vec];

export interface Box {
  center: Vec;
  axes: Axes;
  half: readonly [number, number, number];
  long: 0 | 1 | 2;
  look: Look;
  alpha: number;
}

const WHITE: Rgb = [248, 246, 240];
const INK: Rgb = [30, 30, 36];
const BLUE: Rgb = hex("#2052b0");
const EDGE = "rgb(40 26 16 / 0.2)";

export const lookOf = (
  design: Pick<Design, "pattern" | "rubber" | "sleeve">
): Look => {
  const sleeve = hex(sleeves[design.sleeve].color);

  return {
    pattern: design.pattern,
    rubber: hex(rubbers[design.rubber].color),
    sleeve,
    stripe: design.sleeve === "black" ? BLUE : INK,
  };
};

const PIN_LOOKS: Look[] = [
  lookOf({ pattern: "bands", rubber: "white", sleeve: "blue" }),
  lookOf({ pattern: "plain", rubber: "white", sleeve: "red" }),
  lookOf({ pattern: "dots", rubber: "sakura", sleeve: "pink" }),
  lookOf({ pattern: "plain", rubber: "lemon", sleeve: "yellow" }),
  lookOf({ pattern: "bands", rubber: "white", sleeve: "black" }),
  lookOf({ pattern: "check", rubber: "sky", sleeve: "green" }),
  lookOf({ pattern: "plain", rubber: "white", sleeve: "blue" }),
  lookOf({ pattern: "check", rubber: "white", sleeve: "red" }),
  lookOf({ pattern: "bands", rubber: "lemon", sleeve: "green" }),
  lookOf({ pattern: "dots", rubber: "white", sleeve: "yellow" }),
];

const add = (a: Vec, b: Vec): Vec => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

const scale = (a: Vec, k: number): Vec => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});

const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;

const cross = (a: Vec, b: Vec): Vec => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const rotate = (v: Vec, axis: Vec, angle: number): Vec => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return add(
    add(scale(v, cos), scale(cross(axis, v), sin)),
    scale(axis, dot(axis, v) * (1 - cos))
  );
};

export const project = (view: View, p: Vec) => {
  const dx = p.x - view.eye.x;
  const dy = p.y - view.eye.y;
  const dz = p.z - view.eye.z;
  const depth = dy * view.cos - dz * view.sin;
  const up = dy * view.sin + dz * view.cos;

  return {
    depth,
    x: view.cx + (view.focal * dx) / depth,
    y: view.cy - (view.focal * up) / depth,
  };
};

export const depthOf = (view: View, p: Vec) =>
  (p.y - view.eye.y) * view.cos - (p.z - view.eye.z) * view.sin;

const STANDING: Axes = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
];

export const pinBox = (pin: Pin, lift: number, alpha: number): Box => {
  const toward = { x: Math.sin(pin.toward), y: Math.cos(pin.toward), z: 0 };
  const hinge = { x: -Math.cos(pin.toward), y: Math.sin(pin.toward), z: 0 };

  const reach =
    (Math.abs(toward.x) * PIN.w) / 2 + (Math.abs(toward.y) * PIN.d) / 2;

  const pivot = {
    x: pin.x + toward.x * reach,
    y: pin.y + toward.y * reach,
    z: 0,
  };

  const middle = { x: pin.x - pivot.x, y: pin.y - pivot.y, z: PIN.h / 2 };
  const center = add(pivot, rotate(middle, hinge, pin.tilt));

  return {
    alpha,
    axes: [
      rotate(STANDING[0], hinge, pin.tilt),
      rotate(STANDING[1], hinge, pin.tilt),
      rotate(STANDING[2], hinge, pin.tilt),
    ],
    center: { ...center, z: center.z + pin.z + lift },
    half: [PIN.w / 2, PIN.d / 2, PIN.h / 2],
    long: 2,
    look: PIN_LOOKS[pin.id % PIN_LOOKS.length],
  };
};

export const ballBox = (
  ball: Pick<Ball, "angle" | "d" | "h" | "pitch" | "w" | "x" | "y" | "z">,
  look: Look,
  lift = 0,
  alpha = 1
): Box => {
  const cos = Math.cos(ball.angle);
  const sin = Math.sin(ball.angle);
  const up = Math.cos(ball.pitch);
  const tip = -Math.sin(ball.pitch);
  const reach = (Math.abs(up) * ball.h + Math.abs(tip) * ball.d) / 2;

  return {
    alpha,
    axes: [
      { x: cos, y: -sin, z: 0 },
      { x: sin * up, y: cos * up, z: tip },
      { x: -sin * tip, y: -cos * tip, z: up },
    ],
    center: { x: ball.x, y: ball.y, z: ball.z + reach + lift },
    half: [ball.w / 2, ball.d / 2, ball.h / 2],
    long: 0,
    look,
  };
};

const corner = (box: Box, signs: readonly [number, number, number]) =>
  add(
    add(
      add(box.center, scale(box.axes[0], box.half[0] * signs[0])),
      scale(box.axes[1], box.half[1] * signs[1])
    ),
    scale(box.axes[2], box.half[2] * signs[2])
  );

export const cornersOf = (box: Box) =>
  [-1, 1].flatMap((a) =>
    [-1, 1].flatMap((b) => [-1, 1].map((c) => corner(box, [a, b, c])))
  );

const quad = (
  ctx: CanvasRenderingContext2D,
  view: View,
  center: Vec,
  u: Vec,
  v: Vec
) => {
  ctx.beginPath();

  for (const [i, [a, b]] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].entries()) {
    const point = project(view, add(center, add(scale(u, a), scale(v, b))));

    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.closePath();
};

interface Face {
  center: Vec;
  long: Vec;
  longHalf: number;
  across: Vec;
  acrossHalf: number;
}

const paintSleeve = (
  ctx: CanvasRenderingContext2D,
  view: View,
  face: Face,
  look: Look,
  shade: (color: Rgb) => string
) => {
  const length = face.longHalf * 0.64;
  const along = scale(face.long, length);
  const across = scale(face.across, face.acrossHalf);
  ctx.fillStyle = shade(look.sleeve);
  quad(ctx, view, face.center, along, across);
  ctx.fill();

  if (look.pattern === "bands") {
    const third = scale(face.across, face.acrossHalf / 3);

    for (const [k, color] of [
      [0, WHITE],
      [2 / 3, look.stripe],
    ] as const) {
      ctx.fillStyle = shade(color);
      quad(
        ctx,
        view,
        add(face.center, scale(face.across, face.acrossHalf * k)),
        along,
        third
      );
      ctx.fill();
    }

    return;
  }

  if (look.pattern === "plain") {
    ctx.fillStyle = shade(WHITE);

    for (const k of [-1, 1]) {
      quad(
        ctx,
        view,
        add(face.center, scale(face.long, k * length * 0.86)),
        scale(face.long, length * 0.035),
        across
      );
      ctx.fill();
    }

    return;
  }

  if (look.pattern === "check") {
    ctx.fillStyle = css(WHITE, 0.32);

    for (const k of [-0.6, 0, 0.6]) {
      quad(
        ctx,
        view,
        add(face.center, scale(face.long, k * length)),
        scale(face.long, length * 0.09),
        across
      );
      ctx.fill();
    }

    quad(
      ctx,
      view,
      face.center,
      along,
      scale(face.across, face.acrossHalf * 0.18)
    );
    ctx.fill();

    return;
  }

  ctx.fillStyle = shade(WHITE);
  const radius = Math.min(face.acrossHalf, length) * 0.2;

  for (const i of [-0.72, -0.24, 0.24, 0.72]) {
    for (const j of [-0.5, 0.5]) {
      const point = project(
        view,
        add(
          face.center,
          add(
            scale(face.long, i * length),
            scale(face.across, j * face.acrossHalf)
          )
        )
      );

      ctx.beginPath();
      ctx.arc(
        point.x,
        point.y,
        (radius * view.focal) / point.depth,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
};

export const paintBox = (
  ctx: CanvasRenderingContext2D,
  view: View,
  box: Box,
  sunlit = true
) => {
  const sunshine = sunlit
    ? sunOn(box.center.x, box.center.y, box.center.z) * 0.8 + 0.2
    : 0.6;

  ctx.save();
  ctx.globalAlpha = box.alpha;
  ctx.lineJoin = "round";

  for (let i = 0; i < 3; i += 1) {
    for (const sign of [-1, 1]) {
      const normal = scale(box.axes[i], sign);
      const center = add(box.center, scale(normal, box.half[i]));
      const toEye = add(view.eye, scale(center, -1));

      if (dot(normal, toEye) <= 0) {
        continue;
      }

      const [j, k] = [0, 1, 2].filter((axis) => axis !== i);
      const light = Math.max(0, dot(normal, LIGHT)) * sunshine;

      const shade = (color: Rgb) =>
        css(lit(color, 0.7 + normal.z * 0.12, light * 0.62 + 0.03));

      ctx.fillStyle = shade(box.look.rubber);
      quad(
        ctx,
        view,
        center,
        scale(box.axes[j], box.half[j]),
        scale(box.axes[k], box.half[k])
      );
      ctx.fill();
      ctx.strokeStyle = EDGE;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (i !== box.long) {
        const across = j === box.long ? k : j;
        paintSleeve(
          ctx,
          view,
          {
            across: box.axes[across],
            acrossHalf: box.half[across],
            center,
            long: box.axes[box.long],
            longHalf: box.half[box.long],
          },
          box.look,
          shade
        );
      }

      if (normal.z > 0.7) {
        ctx.strokeStyle = "rgb(255 250 240 / 0.35)";
        quad(
          ctx,
          view,
          center,
          scale(box.axes[j], box.half[j]),
          scale(box.axes[k], box.half[k])
        );
        ctx.stroke();
      }
    }
  }

  ctx.restore();
};
