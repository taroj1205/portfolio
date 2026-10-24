import type { Carving } from "./carve";
import type { Point, Mould } from "./moulds";

const CANDY = { r: 0.43, x: 0.5, y: 0.5 };
const GROOVE = 0.0105;
const SPLIT = 620;
const POP = 900;
const GLINT = 2600;
const NEEDLE_ANGLE = Math.PI * 0.36;
const NEEDLE_LENGTH = 0.3;

const paint = {
  candy: ["#fff4f2", "#fbdce2", "#f2bccb", "#de98ad"],
  carved: "#a35a70",
  carvedLight: "rgb(255 255 255 / 0.55)",
  crack: "rgb(110 46 66 / 0.85)",
  crackLight: "rgb(255 246 248 / 0.7)",
  dust: "#fff8f6",
  glow: "rgb(255 214 140 / 0.55)",
  groove: "rgb(176 104 128 / 0.75)",
  grooveDark: "rgb(140 70 96 / 0.45)",
  grooveLight: "rgb(255 255 255 / 0.85)",
  needle: ["#f4f6fb", "#a8afbd", "#5b6272"],
  rim: "rgb(255 255 255 / 0.65)",
  shadow: "rgb(10 4 8 / 0.55)",
  speck: ["rgb(255 255 255 / 0.5)", "rgb(196 120 146 / 0.22)"],
} as const;

interface Crack {
  points: Point[];
  born: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
}

interface Split {
  line: Point[];
  normal: Point;
  born: number;
}

const seeded = (seed: number) => {
  let state = seed % 2_147_483_647 || 1;

  return () => {
    state = (state * 16_807) % 2_147_483_647;

    return state / 2_147_483_647;
  };
};

const easeOut = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

const makeCanvas = (size: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(size));
  canvas.height = canvas.width;

  return canvas;
};

const tracePath = (
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  fresh = true
) => {
  if (fresh) {
    ctx.beginPath();
  }

  for (const [i, point] of points.entries()) {
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
};

const disc = (ctx: CanvasRenderingContext2D, grow = 0) => {
  ctx.beginPath();
  ctx.arc(CANDY.x, CANDY.y, CANDY.r + grow, 0, Math.PI * 2);
};

const paintCandy = (
  ctx: CanvasRenderingContext2D,
  mould: Mould,
  px: number
) => {
  ctx.save();
  ctx.shadowColor = paint.shadow;
  ctx.shadowBlur = 0.06 * px;
  ctx.shadowOffsetY = 0.025 * px;
  const body = ctx.createRadialGradient(0.42, 0.38, 0.02, 0.5, 0.5, CANDY.r);
  body.addColorStop(0, paint.candy[0]);
  body.addColorStop(0.45, paint.candy[1]);
  body.addColorStop(0.85, paint.candy[2]);
  body.addColorStop(1, paint.candy[3]);
  ctx.fillStyle = body;
  disc(ctx);
  ctx.fill();
  ctx.restore();

  ctx.save();
  disc(ctx);
  ctx.clip();
  const roll = seeded(4127);

  for (let i = 0; i < 900; i += 1) {
    const angle = roll() * Math.PI * 2;
    const reach = Math.sqrt(roll()) * CANDY.r;
    ctx.fillStyle = paint.speck[i % 2];
    ctx.beginPath();
    ctx.arc(
      CANDY.x + Math.cos(angle) * reach,
      CANDY.y + Math.sin(angle) * reach,
      0.0012 + roll() * 0.0028,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();

  ctx.save();
  ctx.lineWidth = 0.006;
  ctx.strokeStyle = paint.rim;
  disc(ctx, -0.012);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const press = (dx: number, dy: number, color: string, width: number) => {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    tracePath(ctx, mould.outline);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  press(0.0018, 0.0022, paint.grooveLight, 0.0055);
  press(-0.001, -0.0012, paint.grooveDark, 0.0055);
  press(0, 0, paint.groove, 0.0042);
  ctx.restore();
};

const jagged = (
  from: Point,
  angle: number,
  length: number,
  roll: () => number
) => {
  const points = [from];
  let tip = from;
  let heading = angle;
  let walked = 0;

  while (walked < length) {
    const step = 0.008 + roll() * 0.01;
    heading += (roll() - 0.5) * 0.9;
    tip = {
      x: tip.x + Math.cos(heading) * step,
      y: tip.y + Math.sin(heading) * step,
    };
    points.push(tip);
    walked += step;
  }

  return points;
};

const splitLine = (at: Point, angle: number, roll: () => number) => {
  const half = (direction: number) => {
    const points: Point[] = [];
    let wobble = 0;

    for (let walked = 0.012; walked < 1; walked += 0.014) {
      wobble = Math.max(-0.02, Math.min(0.02, wobble + (roll() - 0.5) * 0.012));
      points.push({
        x:
          at.x +
          Math.cos(angle) * walked * direction -
          Math.sin(angle) * wobble,
        y:
          at.y +
          Math.sin(angle) * walked * direction +
          Math.cos(angle) * wobble,
      });
    }

    return points;
  };

  return [...half(-1).toReversed(), at, ...half(1)];
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D is not available");
  }

  const ctx = context;
  let size = 0;
  let dpr = 1;
  let mould: Mould | null = null;
  let carving: Carving | null = null;
  let sprite = makeCanvas(1);
  let plate: HTMLCanvasElement | null = null;
  let cracks: Crack[] = [];
  let motes: Mote[] = [];
  let split: Split | null = null;
  let popped: number | null = null;
  let needle: { at: Point; down: boolean; shake: number } | null = null;

  const unit = (target: CanvasRenderingContext2D) => {
    target.setTransform(dpr * size, 0, 0, dpr * size, 0, 0);
  };

  const repaint = () => {
    sprite = makeCanvas(size * dpr);
    const spriteContext = sprite.getContext("2d");

    if (spriteContext && mould) {
      unit(spriteContext);
      paintCandy(spriteContext, mould, size * dpr);
    }
  };

  const fit = () => {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextSize = Math.min(canvas.clientWidth, canvas.clientHeight);

    if (nextSize === 0 || (nextSize === size && nextDpr === dpr)) {
      return;
    }

    size = nextSize;
    dpr = nextDpr;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    repaint();
    plate = null;
  };

  const grooves = (target: CanvasRenderingContext2D) => {
    if (!carving) {
      return;
    }

    const {
      carved,
      mould: { outline },
    } = carving;

    target.save();
    target.lineCap = "round";

    for (const [color, width, dx] of [
      [paint.carvedLight, GROOVE * 1.25, 0.0016],
      [paint.carved, GROOVE, 0],
    ] as const) {
      target.strokeStyle = color;
      target.lineWidth = width;
      target.beginPath();

      for (const [i, point] of outline.entries()) {
        const next = (i + 1) % outline.length;

        if (carved[i] && carved[next]) {
          target.moveTo(point.x + dx, point.y + dx);
          target.lineTo(outline[next].x + dx, outline[next].y + dx);
        }
      }

      target.stroke();
    }

    target.restore();
  };

  const crackLines = (target: CanvasRenderingContext2D, now: number) => {
    target.save();
    target.lineCap = "round";
    target.lineJoin = "round";

    for (const crack of cracks) {
      const grown = calm ? 1 : easeOut((now - crack.born) / 140);

      const shown = crack.points.slice(
        0,
        Math.max(2, Math.ceil(crack.points.length * grown))
      );

      target.strokeStyle = paint.crackLight;
      target.lineWidth = 0.004;
      target.save();
      target.translate(0.0012, 0.0014);
      tracePath(target, shown);
      target.stroke();
      target.restore();
      target.strokeStyle = paint.crack;
      target.lineWidth = 0.0022;
      tracePath(target, shown);
      target.stroke();
    }

    target.restore();
  };

  const candy = (target: CanvasRenderingContext2D, now: number) => {
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.drawImage(
      sprite,
      (canvas.width - sprite.width) / 2,
      (canvas.height - sprite.height) / 2
    );
    target.restore();
    grooves(target);
    crackLines(target, now);
  };

  const offsetX = () => (canvas.width - size * dpr) / 2;
  const offsetY = () => (canvas.height - size * dpr) / 2;

  const snapshot = () => {
    const next = makeCanvas(1);
    next.width = canvas.width;
    next.height = canvas.height;
    const plateContext = next.getContext("2d");

    if (plateContext) {
      plateContext.setTransform(
        dpr * size,
        0,
        0,
        dpr * size,
        offsetX(),
        offsetY()
      );
      candy(plateContext, Infinity);
    }

    return next;
  };

  const place = () => {
    ctx.setTransform(dpr * size, 0, 0, dpr * size, offsetX(), offsetY());
  };

  const drawPlate = (
    image: HTMLCanvasElement,
    clip: () => void,
    move: { x: number; y: number; turn: number; scale: number }
  ) => {
    ctx.save();
    place();
    ctx.translate(0.5 + move.x, 0.5 + move.y);
    ctx.rotate(move.turn);
    ctx.scale(move.scale, move.scale);
    ctx.translate(-0.5, -0.5);
    clip();
    ctx.clip("evenodd");
    ctx.scale(1 / (dpr * size), 1 / (dpr * size));
    ctx.drawImage(image, -offsetX(), -offsetY());
    ctx.restore();
  };

  const halves = (now: number) => {
    if (!split || !plate) {
      return;
    }

    const t = calm ? 1 : easeOut((now - split.born) / SPLIT);
    const { line, normal } = split;

    for (const side of [1, -1]) {
      const far = line.toReversed().map((point) => ({
        x: point.x + normal.x * side * 2,
        y: point.y + normal.y * side * 2,
      }));

      drawPlate(
        plate,
        () => {
          tracePath(ctx, [...line, ...far]);
          ctx.closePath();
        },
        {
          scale: 1,
          turn: side * 0.05 * t,
          x: normal.x * side * 0.022 * t,
          y: normal.y * side * 0.022 * t + 0.01 * t,
        }
      );
    }
  };

  const glints = (age: number) => {
    if (!mould || age > GLINT) {
      return;
    }

    ctx.save();
    place();
    const roll = seeded(91);

    for (let i = 0; i < 14; i += 1) {
      const point = mould.outline[Math.floor(roll() * mould.outline.length)];
      const phase = (age / 900 + roll()) % 1;
      const fade = Math.sin(phase * Math.PI) * (1 - age / GLINT);
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = paint.dust;
      const r = 0.006 + 0.008 * fade;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y - 0.03 - r * 2);
      ctx.lineTo(point.x + r * 0.35, point.y - 0.03);
      ctx.lineTo(point.x, point.y - 0.03 + r * 2);
      ctx.lineTo(point.x - r * 0.35, point.y - 0.03);
      ctx.fill();
    }

    ctx.restore();
  };

  const lift = (now: number) => {
    if (popped === null || !plate || !mould) {
      return;
    }

    const { outline } = mould;
    const t = calm ? 1 : easeOut((now - popped) / POP);
    drawPlate(
      plate,
      () => {
        disc(ctx);
        tracePath(ctx, outline, false);
        ctx.closePath();
      },
      { scale: 1, turn: 0, x: 0, y: 0.012 * t }
    );
    ctx.save();
    place();
    ctx.globalAlpha = 0.5 * t;
    ctx.fillStyle = paint.shadow;
    ctx.translate(0, 0.02);
    tracePath(ctx, outline);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    place();
    ctx.translate(0.5, 0.5 - 0.025 * t);
    ctx.scale(1 + 0.05 * t, 1 + 0.05 * t);
    ctx.translate(-0.5, -0.5);
    ctx.shadowColor = paint.glow;
    ctx.shadowBlur = 0.08 * size * dpr * t;
    ctx.strokeStyle = paint.glow;
    ctx.lineWidth = 0.012;
    ctx.globalAlpha = t;
    tracePath(ctx, outline);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    drawPlate(
      plate,
      () => {
        tracePath(ctx, outline);
        ctx.closePath();
      },
      { scale: 1 + 0.05 * t, turn: 0, x: 0, y: -0.025 * t }
    );

    if (!calm) {
      glints(now - popped);
    }
  };

  const dust = (now: number) => {
    motes = motes.filter((mote) => now - mote.born < 900);
    ctx.save();
    place();
    ctx.fillStyle = paint.dust;

    for (const mote of motes) {
      const age = (now - mote.born) / 1000;
      ctx.globalAlpha = Math.max(0, 1 - age / 0.9);
      ctx.beginPath();
      ctx.arc(
        mote.x + mote.vx * age,
        mote.y + mote.vy * age + 0.08 * age * age,
        0.0022,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  };

  const drawNeedle = () => {
    if (!needle) {
      return;
    }

    const { at, down, shake } = needle;
    const jitter = calm ? 0 : shake * 0.0025;

    const tip = {
      x: at.x + (Math.random() - 0.5) * jitter,
      y: at.y + (Math.random() - 0.5) * jitter,
    };

    const end = {
      x: tip.x + Math.cos(NEEDLE_ANGLE) * NEEDLE_LENGTH,
      y: tip.y + Math.sin(NEEDLE_ANGLE) * NEEDLE_LENGTH,
    };

    ctx.save();
    place();
    const hover = down ? 0.006 : 0.03;
    ctx.strokeStyle = paint.shadow;
    ctx.globalAlpha = down ? 0.45 : 0.25;
    ctx.lineWidth = 0.007;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tip.x + hover, tip.y + hover * 0.6);
    ctx.lineTo(end.x + hover + 0.04, end.y + hover * 0.6 + 0.02);
    ctx.stroke();
    ctx.globalAlpha = down ? 1 : 0.7;

    const steel = ctx.createLinearGradient(
      tip.x - 0.006,
      tip.y,
      tip.x + 0.006,
      tip.y
    );

    const [shine, mid, dark] = paint.needle;
    steel.addColorStop(0, shine);
    steel.addColorStop(0.5, mid);
    steel.addColorStop(1, dark);
    ctx.strokeStyle = steel;
    ctx.lineWidth = 0.008;
    const raise = down ? 0 : -0.012;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y + raise);
    ctx.lineTo(end.x, end.y + raise);
    ctx.stroke();
    ctx.lineWidth = 0.0025;
    ctx.strokeStyle = shine;
    ctx.beginPath();
    ctx.ellipse(
      end.x,
      end.y + raise,
      0.012,
      0.004,
      NEEDLE_ANGLE,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  };

  return {
    crack: (at: Point, level: number, now: number) => {
      const roll = seeded(Math.floor(now * 1000 + level));
      const away = Math.atan2(at.y - CANDY.y, at.x - CANDY.x);

      for (let i = 0; i < 1 + level; i += 1) {
        const side = i % 2 === 0 ? 0 : Math.PI;
        cracks.push({
          born: now,
          points: jagged(
            at,
            away + side + (roll() - 0.5) * 1.6,
            0.03 + level * 0.022 + roll() * 0.03,
            roll
          ),
        });
      }

      cracks = cracks.slice(-24);
    },
    draw: (now: number) => {
      fit();

      if (plate === null && (split !== null || popped !== null)) {
        plate = snapshot();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (split) {
        halves(now);
      } else if (popped === null) {
        place();
        candy(ctx, now);
      } else {
        lift(now);
      }

      dust(now);
      drawNeedle();
    },
    dust: (at: Point, now: number) => {
      if (calm || motes.length > 120) {
        return;
      }

      motes.push({
        born: now,
        vx: (Math.random() - 0.5) * 0.05,
        vy: -0.02 - Math.random() * 0.03,
        x: at.x,
        y: at.y,
      });
    },
    needle: (at: Point | null, down: boolean, shake: number) => {
      needle = at === null ? null : { at, down, shake };
    },
    pop: (now: number) => {
      plate = null;
      popped = now;
    },
    reset: (next: Carving) => {
      carving = next;

      if (mould !== next.mould) {
        ({ mould } = next);
        repaint();
      }

      cracks = [];
      motes = [];
      split = null;
      popped = null;
      plate = null;
    },
    shatter: (at: Point, now: number) => {
      const roll = seeded(Math.floor(now * 1000) + 3);
      const toward = Math.atan2(CANDY.y - at.y, CANDY.x - at.x);
      const angle = toward + (roll() - 0.5) * 1.2;
      plate = null;
      split = {
        born: now,
        line: splitLine(at, angle, roll),
        normal: { x: -Math.sin(angle), y: Math.cos(angle) },
      };
    },
  };
};
