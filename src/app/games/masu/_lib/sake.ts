import type { Liquid, Matrix, Pouring, Tumbler } from "./draw";
import type { Bead } from "./liquid";
import {
  GLASS_TOP,
  basis,
  box,
  camera,
  lamps,
  scaleAt,
  tumbler,
} from "./scene";
import { BEADS, BUBBLES, DROPS, RINGS, VERTEX, fragments } from "./shaders";
import type { Program } from "./shaders";

export interface Backing {
  bitmap: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

const UNIFORMS = [
  "uRegion",
  "uScene",
  "uEye",
  "uRight",
  "uUp",
  "uBack",
  "uLens",
  "uKey",
  "uGlint",
  "uTime",
  "uMasu",
  "uBox",
  "uInside",
  "uShape",
  "uLevel",
  "uSpan",
  "uWaveSize",
  "uWave",
  "uChop",
  "uRings",
  "uStand",
  "uBehind",
  "uGrab",
  "uFill",
  "uPool",
  "uFilm",
  "uBeads",
  "uCount",
  "uDrops",
  "uDropCount",
  "uBubbles",
  "uBubbleCount",
  "uImpact",
  "uSurface",
  "uGlass",
] as const;

type Uniform = (typeof UNIFORMS)[number];

interface Linked {
  program: WebGLProgram;
  at: (name: Uniform) => WebGLUniformLocation | null;
}

interface State {
  gl: WebGL2RenderingContext;
  programs: Record<Program, Linked>;
  wave: WebGLTexture;
  inside: WebGLTexture;
  behind: WebGLTexture;
}

const GRAB = 0.6;
const SPREAD = 1.9;
const SILHOUETTE = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);
const SIGNS = [-1, 1] as const;
const TAPER = 0.55;
const NONE: readonly Bead[] = [];
const LOOP = 1000;

const sceneX = (x: number, y: number, z: number, shrink: number) =>
  (x * basis.right.x + (y - basis.middle) * basis.right.y + z * basis.right.z) *
  shrink;

const sceneY = (x: number, y: number, z: number, shrink: number) =>
  -(x * basis.up.x + (y - basis.middle) * basis.up.y + z * basis.up.z) * shrink;

const compile = (gl: WebGL2RenderingContext, kind: number, source: string) => {
  const shader = gl.createShader(kind);
  if (shader === null) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const link = (gl: WebGL2RenderingContext, source: string): Linked | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = gl.createProgram();
  if (vertex === null || fragment === null || program === null) {
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    gl.deleteProgram(program);
    return null;
  }
  const found = new Map(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])
  );
  const at = (name: Uniform) => found.get(name) ?? null;
  gl.useProgram(program);
  gl.uniform3f(at("uEye"), camera.x, camera.y, camera.z);
  gl.uniform3f(at("uRight"), basis.right.x, basis.right.y, basis.right.z);
  gl.uniform3f(at("uUp"), basis.up.x, basis.up.y, basis.up.z);
  gl.uniform3f(at("uBack"), basis.back.x, basis.back.y, basis.back.z);
  gl.uniform2f(at("uLens"), basis.distance, basis.middle);
  gl.uniform3f(at("uMasu"), box.inner, box.floor, box.height);
  gl.uniform3f(at("uKey"), lamps.key.x, lamps.key.y, lamps.key.z);
  gl.uniform3f(at("uGlint"), lamps.back.x, lamps.back.y, lamps.back.z);
  gl.uniform1i(at("uWave"), 0);
  gl.uniform1i(at("uInside"), 1);
  gl.uniform1i(at("uBehind"), 2);
  return { at, program };
};

const texture = (gl: WebGL2RenderingContext, unit: number) => {
  const made = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, made);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return made;
};

const prepare = (gl: WebGL2RenderingContext): State | null => {
  const glass = link(gl, fragments.glass);
  const pool = link(gl, fragments.pool);
  const stream = link(gl, fragments.stream);
  if (glass === null || pool === null || stream === null) {
    for (const linked of [glass, pool, stream]) {
      if (linked !== null) {
        gl.deleteProgram(linked.program);
      }
    }
    return null;
  }
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  return {
    behind: texture(gl, 2),
    gl,
    inside: texture(gl, 1),
    programs: { glass, pool, stream },
    wave: texture(gl, 0),
  };
};

export const createSake = (calm: boolean) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const grab = document.createElement("canvas");
  grab.width = 1;
  grab.height = 1;
  const copy = grab.getContext("2d");
  let state: State | null = null;
  let broken = false;
  let uploaded: HTMLCanvasElement | null = null;
  let grid = 0;
  let heights = new Float32Array(0);
  const rings = new Float32Array(RINGS * 4);
  const beads = new Float32Array(BEADS * 4);
  const drops = new Float32Array(DROPS * 4);
  const bubbles = new Float32Array(BUBBLES * 4);
  let x0 = 0;
  let y0 = 0;
  let x1 = 0;
  let y1 = 0;
  const area = { h: 0, left: 0, top: 0, w: 0 };

  const start = () => {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      stencil: false,
    });
    state = gl === null || gl.isContextLost() ? null : prepare(gl);
    broken = state === null;
    uploaded = null;
    grid = 0;
  };

  const lost = (event: Event) => {
    event.preventDefault();
    state = null;
  };

  const restored = () => {
    start();
  };

  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  start();

  const empty = () => {
    x0 = Infinity;
    y0 = Infinity;
    x1 = -Infinity;
    y1 = -Infinity;
  };

  const reach = (scene: Matrix, x: number, y: number, z: number, pad = 0) => {
    const shrink = scaleAt(x, y, z);
    const dx = scene.a * sceneX(x, y, z, shrink) + scene.e;
    const dy = scene.a * sceneY(x, y, z, shrink) + scene.f;
    const spread = pad * scene.a * shrink;
    x0 = Math.min(x0, dx - spread);
    y0 = Math.min(y0, dy - spread);
    x1 = Math.max(x1, dx + spread);
    y1 = Math.max(y1, dy + spread);
  };

  const sendWave = ({ gl }: State, liquid: Liquid) => {
    const { size, height } = liquid.wave;
    if (heights.length !== size * size) {
      heights = new Float32Array(size * size);
    }
    let peak = 0;
    for (let k = 0; k < heights.length; k += 1) {
      const value = height[k] ?? 0;
      heights[k] = value;
      peak = Math.max(peak, Math.abs(value));
    }
    gl.activeTexture(gl.TEXTURE0);
    if (grid === size) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        size,
        size,
        gl.RED,
        gl.FLOAT,
        heights
      );
    } else {
      grid = size;
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R16F,
        size,
        size,
        0,
        gl.RED,
        gl.FLOAT,
        heights
      );
    }
    return peak;
  };

  const sendBacking = ({ gl }: State, backing: Backing) => {
    gl.activeTexture(gl.TEXTURE1);
    if (uploaded !== backing.bitmap) {
      uploaded = backing.bitmap;
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        backing.bitmap
      );
    }
  };

  const sendLiquid = (
    { gl }: State,
    { at }: Linked,
    liquid: Liquid,
    low: number,
    high: number
  ) => {
    gl.uniform4f(
      at("uShape"),
      liquid.round ? 1 : 0,
      liquid.half,
      liquid.reach,
      liquid.pinned ? 1 : 0
    );
    gl.uniform4f(
      at("uLevel"),
      liquid.base,
      liquid.lift,
      liquid.ripple,
      liquid.meniscus
    );
    gl.uniform3f(at("uSpan"), low, high, liquid.span);
    gl.uniform1f(at("uWaveSize"), liquid.wave.size);
    gl.uniform1f(at("uChop"), calm ? 0 : liquid.chop);
    rings.fill(0);
    if (!calm) {
      for (let i = 0; i < Math.min(RINGS, liquid.rings.length); i += 1) {
        const ring = liquid.rings[i];
        if (ring !== undefined) {
          rings[i * 4] = ring.x;
          rings[i * 4 + 1] = ring.z;
          rings[i * 4 + 2] = ring.age;
          rings[i * 4 + 3] = ring.strength;
        }
      }
    }
    gl.uniform4fv(at("uRings"), rings);
  };

  const snapshot = (
    { gl }: State,
    { at }: Linked,
    target: CanvasRenderingContext2D
  ) => {
    const { width, height } = target.canvas;
    const w = x1 - x0;
    const h = y1 - y0;
    const left = Math.max(0, Math.floor(x0 - w * GRAB));
    const top = Math.max(0, Math.floor(y0 - h * GRAB));
    const right = Math.min(width, Math.ceil(x1 + w * GRAB));
    const bottom = Math.min(height, Math.ceil(y1 + h * GRAB));
    if (copy === null || right <= left || bottom <= top) {
      return;
    }
    if (grab.width < right - left || grab.height < bottom - top) {
      grab.width = Math.max(grab.width, right - left);
      grab.height = Math.max(grab.height, bottom - top);
    }
    copy.clearRect(0, 0, right - left, bottom - top);
    copy.drawImage(
      target.canvas,
      left,
      top,
      right - left,
      bottom - top,
      0,
      0,
      right - left,
      bottom - top
    );
    gl.activeTexture(gl.TEXTURE2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, grab);
    gl.uniform4f(at("uGrab"), left, top, grab.width, grab.height);
  };

  const begin = (
    { gl }: State,
    linked: Linked,
    target: CanvasRenderingContext2D,
    scene: Matrix,
    clock: number
  ) => {
    const { width, height } = target.canvas;
    area.left = Math.max(0, Math.floor(x0) - 1);
    area.top = Math.max(0, Math.floor(y0) - 1);
    area.w = Math.min(width, Math.ceil(x1) + 1) - area.left;
    area.h = Math.min(height, Math.ceil(y1) + 1) - area.top;
    if (area.w <= 0 || area.h <= 0) {
      return false;
    }
    if (canvas.width < area.w || canvas.height < area.h) {
      canvas.width = Math.max(canvas.width, area.w);
      canvas.height = Math.max(canvas.height, area.h);
    }
    gl.useProgram(linked.program);
    gl.viewport(0, 0, area.w, area.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4f(linked.at("uRegion"), area.left, area.top, area.w, area.h);
    gl.uniform3f(linked.at("uScene"), scene.a, scene.e, scene.f);
    gl.uniform1f(linked.at("uTime"), calm ? 0 : clock % LOOP);
    return true;
  };

  const finish = ({ gl }: State, target: CanvasRenderingContext2D) => {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.drawImage(
      canvas,
      0,
      canvas.height - area.h,
      area.w,
      area.h,
      area.left,
      area.top,
      area.w,
      area.h
    );
    target.restore();
  };

  const pool = (
    current: State,
    target: CanvasRenderingContext2D,
    liquid: Liquid,
    scene: Matrix,
    backing: Backing
  ) => {
    const linked = current.programs.pool;
    const peak = sendWave(current, liquid) * Math.abs(liquid.ripple);
    const low = liquid.base - peak - 0.2;
    const high = liquid.base + liquid.lift + peak + liquid.meniscus + 0.2;
    empty();
    for (const sx of SIGNS) {
      for (const sz of SIGNS) {
        reach(scene, sx * liquid.half, low, sz * liquid.half);
        reach(scene, sx * liquid.half, high, sz * liquid.half);
      }
    }
    sendBacking(current, backing);
    if (!begin(current, linked, target, scene, liquid.clock)) {
      return;
    }
    const { gl } = current;
    sendLiquid(current, linked, liquid, low, high);
    gl.uniform1f(linked.at("uStand"), liquid.stand ? 1 : 0);
    gl.uniform4f(linked.at("uBox"), backing.x, backing.y, backing.w, backing.h);
    finish(current, target);
  };

  const glass = (
    current: State,
    target: CanvasRenderingContext2D,
    look: Tumbler,
    scene: Matrix,
    backing: Backing
  ) => {
    const linked = current.programs.glass;
    const { liquid } = look;
    empty();
    const crest = GLASS_TOP + (liquid?.lift ?? 0) + 1;
    for (const angle of SILHOUETTE) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      reach(scene, c * tumbler.bottom, box.floor, s * tumbler.bottom, 0.6);
      reach(scene, c * tumbler.top, crest, s * tumbler.top, 0.6);
    }
    const peak = liquid === null ? 0 : sendWave(current, liquid);
    sendBacking(current, backing);
    if (!begin(current, linked, target, scene, look.clock)) {
      return;
    }
    const { gl } = current;
    snapshot(current, linked, target);
    if (liquid !== null) {
      sendLiquid(
        current,
        linked,
        liquid,
        liquid.base - peak,
        liquid.base + liquid.lift + peak
      );
    }
    gl.uniform2f(
      linked.at("uFill"),
      liquid === null ? 0 : 1,
      liquid?.lift ?? 0
    );
    gl.uniform1f(linked.at("uPool"), look.pool);
    gl.uniform1f(linked.at("uFilm"), look.film);
    gl.uniform4f(linked.at("uBox"), backing.x, backing.y, backing.w, backing.h);
    finish(current, target);
  };

  const sendBeads = (pouring: Pouring, scene: Matrix) => {
    beads.fill(0);
    let count = 0;
    const { stream } = pouring;
    if (stream === null) {
      return count;
    }
    let along = 0;
    let x = stream.threads[0]?.[0]?.x ?? 0;
    let y = stream.threads[0]?.[0]?.y ?? 0;
    for (const thread of stream.threads) {
      for (const bead of thread) {
        along += Math.hypot(bead.x - x, bead.y - y);
        ({ x, y } = bead);
        if (count < BEADS) {
          const shrink = scaleAt(x, -y, 0);
          beads[count * 4] = sceneX(x, -y, 0, shrink);
          beads[count * 4 + 1] = sceneY(x, -y, 0, shrink);
          beads[count * 4 + 2] =
            bead.r *
            shrink *
            (TAPER + (1 - TAPER) * Math.min(1, along / (bead.r * 2.5)));
          beads[count * 4 + 3] = along;
          reach(scene, x, -y, 0, bead.r * SPREAD);
          count += 1;
        }
      }
      count = Math.min(BEADS, count + 1);
    }
    return count;
  };

  const putDrop = (
    scene: Matrix,
    count: number,
    x: number,
    y: number,
    z: number,
    r: number
  ) => {
    if (count >= DROPS) {
      return count;
    }
    const shrink = scaleAt(x, y, z);
    drops[count * 4] = sceneX(x, y, z, shrink);
    drops[count * 4 + 1] = sceneY(x, y, z, shrink);
    drops[count * 4 + 2] = r * shrink;
    reach(scene, x, y, z, r * SPREAD);
    return count + 1;
  };

  const sendDrops = (pouring: Pouring, scene: Matrix) => {
    drops.fill(0);
    let count = 0;
    for (const bead of pouring.stream === null ? NONE : pouring.stream.beads) {
      count = putDrop(scene, count, bead.x, -bead.y, 0, bead.r);
    }
    for (const drop of pouring.drops) {
      if (!drop.counter) {
        count = putDrop(scene, count, drop.x, drop.y, drop.z, drop.r);
      }
    }
    return count;
  };

  const sendBubbles = (pouring: Pouring, scene: Matrix) => {
    bubbles.fill(0);
    let count = 0;
    for (const bubble of pouring.bubbles) {
      if (count >= BUBBLES) {
        break;
      }
      bubbles[count * 4] = bubble.x;
      bubbles[count * 4 + 1] = bubble.z;
      bubbles[count * 4 + 2] = bubble.r;
      bubbles[count * 4 + 3] = bubble.fade;
      reach(scene, bubble.x, pouring.surface, bubble.z, bubble.r * 2);
      count += 1;
    }
    return count;
  };

  const stream = (
    current: State,
    target: CanvasRenderingContext2D,
    pouring: Pouring,
    scene: Matrix,
    backing: Backing
  ) => {
    const linked = current.programs.stream;
    empty();
    const count = sendBeads(pouring, scene);
    const dropCount = sendDrops(pouring, scene);
    const bubbleCount = sendBubbles(pouring, scene);
    const impact = pouring.stream?.impact ?? null;
    const strength = impact === null || calm ? 0 : Math.min(1.3, pouring.rate);
    if (impact !== null && strength > 0) {
      reach(scene, impact.x, -impact.y, 0, 6);
      reach(scene, impact.x, -impact.y + 4, 0, 6);
    }
    if (x1 <= x0) {
      return;
    }
    sendBacking(current, backing);
    if (!begin(current, linked, target, scene, pouring.clock)) {
      return;
    }
    const { gl } = current;
    const { at } = linked;
    snapshot(current, linked, target);
    gl.uniform4fv(at("uBeads"), beads);
    gl.uniform1i(at("uCount"), count);
    gl.uniform4fv(at("uDrops"), drops);
    gl.uniform1i(at("uDropCount"), dropCount);
    gl.uniform4fv(at("uBubbles"), bubbles);
    gl.uniform1i(at("uBubbleCount"), bubbleCount);
    gl.uniform4f(at("uImpact"), impact?.x ?? 0, -(impact?.y ?? 0), 0, strength);
    gl.uniform1f(at("uSurface"), pouring.surface);
    gl.uniform1f(at("uGlass"), pouring.glass ? 1 : 0);
    gl.uniform4f(at("uBox"), backing.x, backing.y, backing.w, backing.h);
    finish(current, target);
  };

  const live = (backing: Backing | null): backing is Backing =>
    !broken && backing !== null && state !== null && !state.gl.isContextLost();

  return {
    dispose: () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      if (state !== null) {
        const { gl, programs } = state;
        gl.deleteTexture(state.wave);
        gl.deleteTexture(state.inside);
        gl.deleteTexture(state.behind);
        for (const linked of Object.values(programs)) {
          gl.deleteProgram(linked.program);
        }
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      state = null;
      broken = true;
      grab.width = 1;
      grab.height = 1;
    },
    glass: (
      target: CanvasRenderingContext2D,
      look: Tumbler,
      scene: Matrix,
      backing: Backing | null
    ) => {
      if (!live(backing) || state === null) {
        return false;
      }
      glass(state, target, look, scene, backing);
      return true;
    },
    pool: (
      target: CanvasRenderingContext2D,
      liquid: Liquid,
      scene: Matrix,
      backing: Backing | null
    ) => {
      if (!live(backing) || state === null) {
        return false;
      }
      pool(state, target, liquid, scene, backing);
      return true;
    },
    stream: (
      target: CanvasRenderingContext2D,
      pouring: Pouring,
      scene: Matrix,
      backing: Backing | null
    ) => {
      if (!live(backing) || state === null) {
        return false;
      }
      stream(state, target, pouring, scene, backing);
      return true;
    },
  };
};

export type Sake = ReturnType<typeof createSake>;
