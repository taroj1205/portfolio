interface Flake {
  x: number;
  y: number;
  z: number;
  phase: number;
  sway: number;
  glint: number;
}

const SPRITE = 48;

const seeded = (seed: number) => {
  let state = seed % 2_147_483_647 || 1;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const makeCanvas = (width: number, height = width) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

const paintFlake = (core: string, rim: string) => {
  const canvas = makeCanvas(SPRITE);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const glow = ctx.createRadialGradient(
      SPRITE / 2,
      SPRITE / 2,
      0,
      SPRITE / 2,
      SPRITE / 2,
      SPRITE / 2
    );
    glow.addColorStop(0, core);
    glow.addColorStop(0.35, rim);
    glow.addColorStop(1, "rgb(255 255 255 / 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SPRITE, SPRITE);
  }
  return canvas;
};

const ridge = (
  roll: () => number,
  width: number,
  base: number,
  height: number
) => {
  const waves = Array.from({ length: 4 }, (_, i) => ({
    amp: height * (0.5 / (i + 1)) * (0.6 + roll() * 0.8),
    freq: (i + 1) * (1.2 + roll() * 1.4),
    phase: roll() * Math.PI * 2,
  }));
  const points: [number, number][] = [];
  for (let x = 0; x <= width + 8; x += 8) {
    const u = x / width;
    let y = base;
    for (const wave of waves) {
      y -=
        wave.amp * (0.5 + 0.5 * Math.sin(u * wave.freq * Math.PI + wave.phase));
    }
    points.push([x, y]);
  }
  return points;
};

const trace = (
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  bottom: number
) => {
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  for (const [x, y] of points) {
    ctx.lineTo(x, y);
  }
  ctx.lineTo(points.at(-1)?.[0] ?? 0, bottom);
  ctx.closePath();
};

const moonOf = (width: number, height: number) => {
  const wide = width > height;
  return {
    r: Math.max(
      26,
      Math.min(84, Math.min(width, height) * (wide ? 0.07 : 0.085))
    ),
    x: width * (wide ? 0.8 : 0.76),
    y: height * (wide ? 0.2 : 0.15),
  };
};

const paintScene = (width: number, height: number, dpr: number) => {
  const canvas = makeCanvas(width * dpr, height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.scale(dpr, dpr);
  const roll = seeded(1205);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#04060f");
  sky.addColorStop(0.5, "#0b1230");
  sky.addColorStop(0.8, "#1c2752");
  sky.addColorStop(1, "#141c3d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 90; i += 1) {
    const x = roll() * width;
    const y = roll() ** 1.6 * height * 0.62;
    ctx.globalAlpha = 0.15 + roll() * 0.45;
    ctx.fillStyle = "#e9eeff";
    ctx.beginPath();
    ctx.arc(x, y, 0.4 + roll() * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const moon = moonOf(width, height);
  const halo = ctx.createRadialGradient(
    moon.x,
    moon.y,
    moon.r * 0.8,
    moon.x,
    moon.y,
    moon.r * 7
  );
  halo.addColorStop(0, "rgb(214 224 255 / 0.32)");
  halo.addColorStop(0.25, "rgb(160 178 240 / 0.12)");
  halo.addColorStop(1, "rgb(120 140 220 / 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);
  const disc = ctx.createRadialGradient(
    moon.x - moon.r * 0.3,
    moon.y - moon.r * 0.35,
    moon.r * 0.1,
    moon.x,
    moon.y,
    moon.r
  );
  disc.addColorStop(0, "#fffdf4");
  disc.addColorStop(0.7, "#f1efe2");
  disc.addColorStop(1, "#d9d9d2");
  ctx.save();
  ctx.shadowBlur = moon.r * 0.9;
  ctx.shadowColor = "rgb(235 240 255 / 0.85)";
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 9; i += 1) {
    const angle = roll() * Math.PI * 2;
    const reach = roll() ** 0.7 * moon.r * 0.72;
    const size = moon.r * (0.14 + roll() * 0.24);
    const spot = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    spot.addColorStop(0, `rgb(140 146 166 / ${0.12 + roll() * 0.14})`);
    spot.addColorStop(1, "rgb(140 146 166 / 0)");
    ctx.save();
    ctx.translate(
      moon.x + Math.cos(angle) * reach,
      moon.y + Math.sin(angle) * reach
    );
    ctx.rotate(roll() * Math.PI);
    ctx.scale(1, 0.6 + roll() * 0.4);
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  const far = ridge(roll, width, height * 0.8, height * 0.12);
  const farFill = ctx.createLinearGradient(0, height * 0.66, 0, height);
  farFill.addColorStop(0, "#232d5c");
  farFill.addColorStop(1, "#0e1430");
  ctx.fillStyle = farFill;
  trace(ctx, far, height);
  ctx.fill();
  ctx.strokeStyle = "rgb(170 186 240 / 0.28)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const near = ridge(roll, width, height * 0.9, height * 0.07);
  const snow = ctx.createLinearGradient(0, height * 0.82, 0, height);
  snow.addColorStop(0, "#4a5891");
  snow.addColorStop(0.4, "#2d3868");
  snow.addColorStop(1, "#101632");
  ctx.fillStyle = snow;
  trace(ctx, near, height);
  ctx.fill();
  ctx.strokeStyle = "rgb(214 224 255 / 0.5)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const sheen = ctx.createRadialGradient(
    moon.x,
    height * 0.92,
    0,
    moon.x,
    height * 0.92,
    Math.max(width, height) * 0.45
  );
  sheen.addColorStop(0, "rgb(200 214 255 / 0.16)");
  sheen.addColorStop(1, "rgb(200 214 255 / 0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, height * 0.78, width, height * 0.22);

  const edge = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    Math.min(width, height) * 0.35,
    width / 2,
    height * 0.45,
    Math.hypot(width, height) * 0.62
  );
  edge.addColorStop(0, "rgb(2 3 10 / 0)");
  edge.addColorStop(1, "rgb(2 3 10 / 0.55)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);
  return canvas;
};

const ease = (from: number, to: number, rate: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-rate * dt));

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const roll = Math.random;
  const white = paintFlake("rgb(255 255 255 / 1)", "rgb(230 238 255 / 0.55)");
  const gold = paintFlake("rgb(255 246 214 / 1)", "rgb(255 205 120 / 0.6)");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let scene = makeCanvas(1);
  let flakes: Flake[] = [];
  let pace = 1;
  let paceTo = 1;
  let gilt = 0;
  let giltTo = 0;
  let wind = 0;
  let gust = 0;
  let gustRate = 0.6;
  let nextGust = 0;
  let clock = 0;
  let dirty = true;

  const spawn = (flake: Flake, anywhere: boolean) => {
    flake.z = roll() ** 1.8;
    flake.x = roll() * (width + 80) - 40;
    flake.y = anywhere ? roll() * height : -12 - roll() * height * 0.25;
    flake.phase = roll() * Math.PI * 2;
    flake.sway = 0.4 + roll() * 1.3;
    flake.glint = roll() * Math.PI * 2;
    return flake;
  };

  const fit = () => {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (
      nextWidth === 0 ||
      nextHeight === 0 ||
      (nextWidth === width && nextHeight === height && nextDpr === dpr)
    ) {
      return;
    }
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    scene = paintScene(width, height, dpr);
    const count = Math.round(
      Math.max(70, Math.min(260, (width * height) / 4200))
    );
    flakes = Array.from({ length: count }, () =>
      spawn({ glint: 0, phase: 0, sway: 0, x: 0, y: 0, z: 0 }, true)
    );
    dirty = true;
  };

  const blow = (dt: number) => {
    clock += dt;
    if (clock > nextGust) {
      gust = (roll() * 2 - 1) * (0.2 + roll() * 0.8);
      gustRate = 0.2 + roll() * 0.9;
      nextGust = clock + 1.2 + roll() * 5.5;
    }
    wind = ease(wind, gust, gustRate, dt);
  };

  const fall = (dt: number) => {
    const step = dt * pace;
    const lift = height / 800;
    for (const flake of flakes) {
      const depth = 0.25 + flake.z;
      flake.y += (16 + flake.z * 52) * lift * step;
      flake.x +=
        (wind * 46 * depth +
          Math.sin(clock * flake.sway + flake.phase) * (5 + flake.z * 12)) *
        step;
      if (flake.y > height + 14) {
        spawn(flake, false);
      } else if (flake.x < -50) {
        flake.x += width + 100;
      } else if (flake.x > width + 50) {
        flake.x -= width + 100;
      }
    }
  };

  const paint = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(scene, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (gilt > 0.01) {
      const moon = moonOf(width, height);
      const flare = ctx.createRadialGradient(
        moon.x,
        moon.y,
        moon.r,
        moon.x,
        moon.y,
        moon.r * 9
      );
      flare.addColorStop(0, `rgb(255 226 160 / ${0.42 * gilt})`);
      flare.addColorStop(1, "rgb(255 210 122 / 0)");
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, width, height);
    }
    for (const flake of flakes) {
      const size = 1.2 + flake.z * flake.z * 7;
      const shine =
        gilt > 0.01 ? 1 + gilt * 0.6 * Math.sin(clock * 5 + flake.glint) : 1;
      ctx.globalAlpha = Math.min(1, (0.28 + flake.z * 0.62) * shine);
      ctx.drawImage(
        gilt > 0.5 ? gold : white,
        flake.x - size,
        flake.y - size,
        size * 2,
        size * 2
      );
    }
    ctx.globalAlpha = 1;
  };

  return {
    draw: (dt: number) => {
      fit();
      if (calm) {
        gilt = giltTo;
        if (dirty) {
          dirty = false;
          paint();
        }
        return;
      }
      blow(dt);
      pace = ease(pace, paceTo, paceTo === 0 ? 7 : 1.4, dt);
      gilt = ease(gilt, giltTo, giltTo > gilt ? 3 : 1.2, dt);
      fall(dt);
      paint();
    },
    gild: (on: boolean) => {
      giltTo = on ? 1 : 0;
      dirty = true;
    },
    still: (on: boolean) => {
      paceTo = on ? 0 : 1;
    },
    wind: () => Math.min(1, Math.abs(wind)) * pace,
  };
};
