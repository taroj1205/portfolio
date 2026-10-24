import { TOP, kindOf } from "./bodies";
import { drawBody } from "./paint";
import { COOLDOWN, DROPPABLE, LIMIT, launchRadius } from "./world";
import type { Merge, World } from "./world";

interface Frame {
  world: World;
  aim: number;
  clock: number;
  dt: number;
}

interface Layout {
  cx: number;
  cy: number;
  scale: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
}

interface Wave {
  x: number;
  y: number;
  from: number;
  to: number;
  age: number;
  life: number;
  color: string;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  size: number;
  gold: boolean;
  age: number;
}

const FLOAT_LIFE = 1.1;
const REACH = launchRadius(DROPPABLE - 1) + kindOf(DROPPABLE - 1).radius + 0.04;

const layoutOf = (w: number, h: number): Layout => {
  const top = Math.min(h * 0.19, 150);
  const bottom = Math.min(h * 0.15, 120);
  const room = Math.min((w - 20) / 2, (h - top - bottom) / 2);

  return {
    cx: w / 2,
    cy: top + (h - top - bottom) / 2,
    scale: Math.max(60, room / REACH),
  };
};

const css = (hex: string, alpha: number) =>
  `rgb(${[1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)).join(" ")} / ${alpha})`;

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));

  return canvas;
};

const paintNebula = (side: number) => {
  const canvas = makeCanvas(side, side);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvas;
  }

  const c = side / 2;

  const clouds: [number, number, number, string][] = [
    [-0.18, -0.12, 0.62, "rgb(122 92 214 / 0.32)"],
    [0.22, 0.16, 0.55, "rgb(64 120 220 / 0.26)"],
    [0.05, 0.28, 0.4, "rgb(230 120 170 / 0.16)"],
    [-0.26, 0.2, 0.36, "rgb(255 170 110 / 0.12)"],
    [0, 0, 0.3, "rgb(255 236 200 / 0.18)"],
  ];

  for (const [x, y, r, color] of clouds) {
    const gradient = ctx.createRadialGradient(
      c + x * c,
      c + y * c,
      0,
      c + x * c,
      c + y * c,
      r * c
    );

    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgb(0 0 0 / 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, side, side);
  }

  return canvas;
};

const paintSpiral = (side: number) => {
  const canvas = makeCanvas(side, side);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvas;
  }

  const c = side / 2;
  let seed = 7;

  const roll = () => {
    seed = (seed * 16_807) % 2_147_483_647;

    return seed / 2_147_483_647;
  };

  for (let i = 0; i < 900; i += 1) {
    const arm = i % 2;
    const t = roll();
    const angle = arm * Math.PI + t * 5.2 + (roll() - 0.5) * 0.5;
    const reach = c * (0.06 + t * 0.92) * (0.92 + roll() * 0.16);
    const x = c + Math.cos(angle) * reach;
    const y = c + Math.sin(angle) * reach;
    const size = (0.6 + roll() * 1.6) * (side / 600);
    ctx.fillStyle =
      roll() > 0.7
        ? `rgb(255 214 170 / ${0.25 + roll() * 0.5})`
        : `rgb(200 214 255 / ${0.2 + roll() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D is not available");
  }

  const ctx = context;

  const font =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mincho")
      .trim() || "serif";

  let sparks: Spark[] = [];
  let waves: Wave[] = [];
  let floaters: Floater[] = [];
  let flash = 0;
  let band = 0;
  let shake = 0;
  let layout: Layout = { cx: 0, cy: 0, scale: 100 };

  let backdrop: {
    key: string;
    nebula: HTMLCanvasElement;
    spiral: HTMLCanvasElement;
  } | null = null;

  let dpr = 1;

  const toScreen = (x: number, y: number) => ({
    x: layout.cx + x * layout.scale,
    y: layout.cy + y * layout.scale,
  });

  const spray = (merge: Merge, tier: number, count: number) => {
    const { glow, light } = kindOf(tier);
    const power = 0.5 + tier * 0.09;

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.35 + Math.random() * 0.9);
      sparks.push({
        age: 0,
        color: i % 3 === 0 ? light : glow,
        life: 0.5 + Math.random() * 0.7,
        size: 1 + Math.random() * (1.6 + tier * 0.25),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        x: merge.x,
        y: merge.y,
      });
    }
  };

  const galaxy = (merge: Merge) => {
    flash = 1;
    band = 1;
    shake = calm ? 0 : 18;
    const colors = ["#cfd8ff", "#ffd9a0", "#ff9fd0", "#9fe3ff", "#ffffff"];
    const count = calm ? 60 : 320;

    for (let i = 0; i < count; i += 1) {
      const arm = i % 2;
      const t = Math.random();
      const angle = arm * Math.PI + t * 4;
      const speed = 0.4 + t * 1.8;
      sparks.push({
        age: 0,
        color: colors[i % colors.length] ?? "#ffffff",
        life: 1.2 + Math.random() * 1.6,
        size: 1 + Math.random() * 2.4,
        vx: Math.cos(angle) * speed - Math.sin(angle) * speed * 0.6,
        vy: Math.sin(angle) * speed + Math.cos(angle) * speed * 0.6,
        x: merge.x,
        y: merge.y,
      });
    }

    waves.push({
      age: 0,
      color: "#fff4dc",
      from: kindOf(TOP).radius,
      life: 1.4,
      to: 3,
      x: merge.x,
      y: merge.y,
    });
  };

  const burst = (merge: Merge) => {
    floaters.push({
      age: 0,
      gold: merge.chain > 1 || merge.made === null,
      size: 15 + merge.from * 1.8,
      text:
        merge.chain > 1
          ? `+${merge.points} ×${merge.chain}`
          : `+${merge.points}`,
      x: merge.x,
      y: merge.y,
    });

    if (merge.made === null) {
      galaxy(merge);

      return;
    }

    const tier = merge.made;
    const { radius, glow } = kindOf(tier);
    spray(merge, tier, calm ? 6 : 12 + tier * 6);
    waves.push({
      age: 0,
      color: glow,
      from: radius,
      life: 0.55 + tier * 0.03,
      to: radius * (2.1 + tier * 0.12),
      x: merge.x,
      y: merge.y,
    });

    if (!calm && tier >= 6) {
      shake = Math.max(shake, (tier - 5) * 2.4);
    }

    if (tier === TOP) {
      flash = Math.max(flash, 0.55);
    }
  };

  const age = (dt: number) => {
    const drag = Math.exp(-2.4 * dt);

    for (const spark of sparks) {
      spark.age += dt;
      spark.vx *= drag;
      spark.vy *= drag;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
    }

    sparks = sparks.filter((spark) => spark.age < spark.life);

    for (const wave of waves) {
      wave.age += dt;
    }

    waves = waves.filter((wave) => wave.age < wave.life);

    for (const floater of floaters) {
      floater.age += dt;
    }

    floaters = floaters.filter((floater) => floater.age < FLOAT_LIFE);
    flash = Math.max(0, flash - dt * 1.1);
    band = Math.max(0, band - dt * 0.32);
    shake *= Math.exp(-9 * dt);
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    layout = layoutOf(w, h);
    const side = Math.round(layout.scale * 3.4 * dpr);
    const key = `${side}`;

    if (backdrop?.key !== key) {
      backdrop = { key, nebula: paintNebula(side), spiral: paintSpiral(side) };
    }

    return { h, w };
  };

  const drawCore = (clock: number, world: World) => {
    if (!backdrop) {
      return;
    }

    const size = layout.scale * 3.4;
    ctx.save();
    ctx.translate(layout.cx, layout.cy);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9;
    ctx.drawImage(backdrop.nebula, -size / 2, -size / 2, size, size);
    ctx.rotate(clock * 0.035);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(backdrop.spiral, -size / 2, -size / 2, size, size);
    ctx.globalAlpha = 1;
    ctx.rotate(-clock * 0.035);
    const pulse = 1 + Math.sin(clock * 1.3) * 0.06;
    const heart = layout.scale * 0.32 * pulse;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, heart);
    glow.addColorStop(0, "rgb(255 246 222 / 0.9)");
    glow.addColorStop(0.25, "rgb(255 214 160 / 0.45)");
    glow.addColorStop(1, "rgb(160 120 255 / 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, heart, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const limit = LIMIT * layout.scale;
    const { danger } = world;
    ctx.save();
    ctx.translate(layout.cx, layout.cy);

    const edge = ctx.createRadialGradient(
      0,
      0,
      limit * 0.86,
      0,
      0,
      limit * 1.02
    );

    edge.addColorStop(0, "rgb(120 140 255 / 0)");
    edge.addColorStop(
      1,
      `rgb(${Math.round(120 + danger * 135)} ${Math.round(140 - danger * 90)} ${Math.round(255 - danger * 175)} / ${0.1 + danger * 0.25})`
    );
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.arc(0, 0, limit * 1.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(clock * 0.05);
    ctx.setLineDash([2, 7]);
    ctx.lineCap = "round";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle =
      danger > 0
        ? `rgb(255 ${Math.round(150 - danger * 90)} ${Math.round(140 - danger * 90)} / ${0.45 + danger * 0.45 * (0.6 + 0.4 * Math.sin(clock * 14))})`
        : "rgb(220 228 255 / 0.32)";
    ctx.beginPath();
    ctx.arc(0, 0, limit, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (danger > 0) {
      ctx.save();
      ctx.translate(layout.cx, layout.cy);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgb(255 96 96 / 0.85)";
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        limit + 6,
        -Math.PI / 2,
        -Math.PI / 2 + danger * Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawAim = (frame: Frame) => {
    const { world, aim, clock } = frame;

    if (world.over) {
      return;
    }

    const [tier] = world.queue;
    const kind = kindOf(tier);
    const reach = launchRadius(tier);
    const dx = Math.cos(aim);
    const dy = Math.sin(aim);
    const ox = dx * reach;
    const oy = dy * reach;
    let hit = reach;

    for (const orb of world.orbs) {
      if (orb.falling) {
        continue;
      }

      const gap = kind.radius + kindOf(orb.tier).radius;
      const mx = ox - orb.x;
      const my = oy - orb.y;
      const b = -(mx * dx + my * dy);
      const disc = b * b - (mx * mx + my * my - gap * gap);

      if (disc < 0 || -b + Math.sqrt(disc) < 0) {
        continue;
      }

      hit = Math.min(hit, Math.max(0, -b - Math.sqrt(disc)));
    }

    const ready = Math.min(1, 1 - (world.ready - world.time) / COOLDOWN);
    const start = toScreen(ox, oy);
    const end = toScreen(ox - dx * hit, oy - dy * hit);
    const r = kind.radius * layout.scale;
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.lineDashOffset = -clock * 28;
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    const guide = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    guide.addColorStop(0, css(kind.glow, 0.05));
    guide.addColorStop(1, css(kind.glow, 0.6 * ready));
    ctx.strokeStyle = guide;
    ctx.beginPath();
    ctx.moveTo(start.x - dx * r, start.y - dy * r);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = css(kind.glow, 0.5 * ready);
    ctx.beginPath();
    ctx.arc(end.x, end.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * ready;
    const bob = Math.sin(clock * 2.4) * 2;
    drawBody(
      ctx,
      tier,
      {
        grow: 0.82 + 0.18 * ready,
        out: { x: dx, y: dy },
        r,
        spin: clock * 0.3,
        tilt: -0.3,
        x: start.x + dx * bob,
        y: start.y + dy * bob,
      },
      dpr,
      clock
    );
    ctx.restore();
  };

  const drawOrbs = (frame: Frame) => {
    const { world, clock } = frame;
    const ordered = world.orbs.toSorted((a, b) => a.tier - b.tier);

    for (const orb of ordered) {
      const kind = kindOf(orb.tier);
      const since = world.time - orb.born;
      const pop = 1 - 0.32 * Math.exp(-since * 13) * Math.cos(since * 28);
      const at = toScreen(orb.x, orb.y);
      const d = Math.max(Math.hypot(orb.x, orb.y), 1e-6);
      const r = kind.radius * layout.scale;
      drawBody(
        ctx,
        orb.tier,
        {
          grow: pop,
          out: { x: orb.x / d, y: orb.y / d },
          r,
          spin: orb.spin,
          tilt: orb.tilt,
          x: at.x,
          y: at.y,
        },
        dpr,
        clock
      );

      if (orb.outside > 0) {
        const beat = 0.5 + 0.5 * Math.sin(clock * 16);
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgb(255 90 90 / ${0.4 + beat * 0.5})`;
        ctx.beginPath();
        ctx.arc(at.x, at.y, r * pop + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const drawEffects = (w: number, h: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const wave of waves) {
      const t = wave.age / wave.life;
      const ease = 1 - (1 - t) ** 3;
      const at = toScreen(wave.x, wave.y);
      const r = (wave.from + (wave.to - wave.from) * ease) * layout.scale;
      ctx.lineWidth = Math.max(0.5, (1 - t) * 5);
      ctx.strokeStyle = css(wave.color, (1 - t) * 0.8);
      ctx.beginPath();
      ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const spark of sparks) {
      const t = spark.age / spark.life;
      const at = toScreen(spark.x, spark.y);
      ctx.fillStyle = css(spark.color, (1 - t) ** 1.5);
      ctx.beginPath();
      ctx.arc(at.x, at.y, spark.size * (1 - t * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    if (band > 0) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.52);
      const length = Math.hypot(w, h);
      const open = Math.min(1, (1 - band) * 4);
      ctx.scale(1, 0.16 + open * 0.1);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, length / 2);
      gradient.addColorStop(0, `rgb(255 246 230 / ${band * 0.7})`);
      gradient.addColorStop(0.3, `rgb(200 190 255 / ${band * 0.4})`);
      gradient.addColorStop(0.7, `rgb(120 120 230 / ${band * 0.15})`);
      gradient.addColorStop(1, "rgb(60 60 160 / 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, (length / 2) * open, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (flash > 0) {
      ctx.fillStyle = `rgb(255 248 236 / ${flash ** 2 * 0.75})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const floater of floaters) {
      const t = floater.age / FLOAT_LIFE;
      const at = toScreen(floater.x, floater.y);
      const rise = (1 - (1 - t) ** 2) * 34;
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.font = `700 ${floater.size}px ${font}`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgb(8 10 22 / 0.6)";
      ctx.strokeText(floater.text, at.x, at.y - rise);
      ctx.fillStyle = floater.gold ? "#ffd27a" : "#fffaf3";
      ctx.fillText(floater.text, at.x, at.y - rise);
    }

    ctx.restore();
  };

  return {
    burst,
    draw: (frame: Frame) => {
      age(frame.dt);
      const { h, w } = resize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();

      if (shake > 0.2) {
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake
        );
      }

      drawCore(frame.clock, frame.world);
      drawOrbs(frame);
      drawAim(frame);
      drawEffects(w, h);
      ctx.restore();

      if (frame.world.over) {
        ctx.fillStyle = "rgb(4 6 14 / 0.35)";
        ctx.fillRect(0, 0, w, h);
      }
    },
    layout: () => layout,
    reset: () => {
      sparks = [];
      waves = [];
      floaters = [];
      flash = 0;
      band = 0;
      shake = 0;
    },
  };
};
