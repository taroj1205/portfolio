import type { Liquid, Matrix } from "./draw";
import { CREST, basis, box, camera, lamps } from "./scene";

export interface Backing {
  bitmap: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

const VERTEX = `#version 300 es
void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec4 uRegion;
uniform vec3 uScene;
uniform vec3 uEye;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uBack;
uniform vec2 uLens;
uniform vec4 uShape;
uniform vec4 uLevel;
uniform vec3 uSpan;
uniform vec3 uMasu;
uniform vec4 uBox;
uniform vec3 uKey;
uniform vec3 uGlint;
uniform float uWaveSize;
uniform sampler2D uWave;
uniform sampler2D uInside;

out vec4 colour;

const int STEPS = 22;
const float STRETCH = 3.4;
const float CREST = ${CREST.toFixed(2)};
const vec3 SAKE = vec3(0.0009, 0.0019, 0.0062);
const vec3 ROOM = vec3(0.06, 0.036, 0.02);
const vec3 CEILING = vec3(0.016, 0.01, 0.006);
const vec3 LAMP = vec3(1.0, 0.82, 0.58);
const vec3 BAR = vec3(1.0, 0.6, 0.28);
const vec3 WASHI = vec3(1.0, 0.94, 0.84);
const vec3 PANEL = vec3(-0.22, 0.57, -0.79);
const vec4 BOKEH[5] = vec4[5](
  vec4(-0.62, 0.42, 0.07, 1.4),
  vec4(-0.2, 0.55, 0.05, 0.9),
  vec4(0.28, 0.38, 0.08, 1.1),
  vec4(0.55, 0.62, 0.06, 0.8),
  vec4(0.02, 0.3, 0.09, 0.7)
);

float edgeOf(float inset, float reach) {
  return tanh(max(0.0, inset) / max(0.5, reach));
}

float insetOf(vec2 p) {
  return uShape.x > 0.5
    ? uShape.y - length(p)
    : uShape.y - max(abs(p.x), abs(p.y));
}

vec2 cellOf(vec2 p) {
  return (p / uSpan.z * 0.5 + 0.5) * (uWaveSize - 1.0) + 0.5;
}

float rippleAt(vec2 p) {
  return texture(uWave, cellOf(p) / uWaveSize).r;
}

vec4 splineOf(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 c = n * n * n;
  float x = c.x;
  float y = c.y - 4.0 * c.x;
  float z = c.z - 4.0 * c.y + 6.0 * c.x;
  return vec4(x, y, z, 6.0 - x - y - z) / 6.0;
}

float smoothRippleAt(vec2 p) {
  vec2 cell = cellOf(p) - 0.5;
  vec2 f = fract(cell);
  cell -= f;
  vec4 across = splineOf(f.x);
  vec4 along = splineOf(f.y);
  vec4 corner = vec4(cell.x - 0.5, cell.x + 1.5, cell.y - 0.5, cell.y + 1.5);
  vec4 weight = vec4(across.xz + across.yw, along.xz + along.yw);
  vec4 at = (corner + vec4(across.yw, along.yw) / weight) / uWaveSize;
  float a = texture(uWave, at.xz).r;
  float b = texture(uWave, at.yz).r;
  float c = texture(uWave, at.xw).r;
  float d = texture(uWave, at.yw).r;
  float u = weight.x / (weight.x + weight.y);
  float v = weight.z / (weight.z + weight.w);
  return mix(mix(d, c, u), mix(b, a, u), v);
}

float pinOf(vec2 p) {
  return uShape.x > 0.5
    ? edgeOf(uShape.y - length(p), uShape.z)
    : edgeOf(uShape.y - abs(p.x), uShape.z) * edgeOf(uShape.y - abs(p.y), uShape.z);
}

float climbOf(vec2 p) {
  float near = uShape.x > 0.5
    ? exp(-(uShape.y - length(p)) * 0.6)
    : exp(-(uShape.y - abs(p.x)) * 0.6) + exp(-(uShape.y - abs(p.y)) * 0.6);
  return min(1.0, near);
}

float surfaceAt(vec2 p, float ripple) {
  float pin = mix(1.0, pinOf(p), uShape.w);
  return uLevel.x + (uLevel.y + uLevel.z * ripple) * pin + uLevel.w * climbOf(p);
}

float heightAt(vec2 p) {
  return surfaceAt(p, rippleAt(p));
}

float smoothHeightAt(vec2 p) {
  return surfaceAt(p, smoothRippleAt(p));
}

float gapAt(vec3 p) {
  return insetOf(p.xz) < 0.0 ? 1.0 : p.y - heightAt(p.xz);
}

vec2 project(vec3 p) {
  vec3 rel = p - vec3(0.0, uLens.y, 0.0);
  float scale = uLens.x / (uLens.x - dot(rel, uBack));
  return vec2(dot(rel, uRight), -dot(rel, uUp)) * scale;
}

vec3 woodAt(vec3 p) {
  vec2 at = (project(p) - uBox.xy) / uBox.zw;
  vec3 wood = texture(uInside, clamp(at, 0.0, 1.0)).rgb;
  return pow(wood, vec3(1.18)) * 0.84;
}

float exitOf(vec3 o, vec3 d) {
  float t = d.y < 0.0 ? (uMasu.y - o.y) / d.y : 1e4;
  if (abs(d.x) > 1e-4) {
    t = min(t, (sign(d.x) * uMasu.x - o.x) / d.x);
  }
  if (abs(d.z) > 1e-4) {
    t = min(t, (sign(d.z) * uMasu.x - o.z) / d.z);
  }
  return max(t, 0.0);
}

vec3 seenAt(vec3 hit) {
  vec3 p = hit;
  bool right = p.x > uMasu.x - 0.05;
  bool front = p.z > uMasu.x - 0.05;
  p.x = right ? -p.x : p.x;
  p.z = front ? -p.z : p.z;
  p.y = min(p.y, uMasu.z - 0.4);
  return woodAt(p) * (right ? 0.62 : 1.0) * (front ? 0.48 : 1.0);
}

float glow(vec3 r, vec3 at, vec3 lamp, float size) {
  vec3 toward = normalize(lamp - at);
  vec3 side = normalize(cross(toward, vec3(0.0, 1.0, 0.0)));
  vec3 rise = cross(side, toward);
  vec2 off = vec2(dot(r, side), dot(r, rise)) / vec2(size, size * STRETCH);
  float spread = dot(off, off);
  return step(0.0, dot(r, toward)) * (exp(-spread) * 22.0 + exp(-spread * 0.06) * 1.6);
}

float panelAt(vec3 r) {
  vec3 ahead = normalize(PANEL);
  vec3 side = normalize(cross(ahead, vec3(0.0, 1.0, 0.0)));
  vec3 rise = cross(side, ahead);
  float u = dot(r, side);
  float v = dot(r, rise);
  float inside = smoothstep(0.22, 0.18, abs(u)) * smoothstep(0.085, 0.06, abs(v));
  vec2 cell = abs(fract(vec2(u * 12.5, v * 12.5) + 0.5) - 0.5);
  float frame = smoothstep(0.02, 0.06, min(cell.x, cell.y));
  return step(0.0, dot(r, ahead)) * inside * mix(0.72, 1.0, frame);
}

vec3 roomAt(vec3 r, vec3 at) {
  vec3 tone = mix(ROOM, CEILING, smoothstep(0.1, 0.95, r.y));
  float behind = smoothstep(0.2, -0.5, r.z);
  tone += BAR * behind * smoothstep(0.45, 0.0, abs(r.y - 0.5)) * 1.1;
  for (int i = 0; i < 5; i += 1) {
    vec4 blob = BOKEH[i];
    float off = length(vec2(r.x - blob.x, r.y - blob.y));
    tone += BAR * behind * blob.w * smoothstep(blob.z, blob.z * 0.6, off) * 7.0;
  }
  tone += WASHI * panelAt(r) * 12.0;
  tone += LAMP * glow(r, at, uKey, 0.04);
  tone += LAMP * glow(r, at, uGlint, 0.02);
  return tone;
}

vec3 mirrorAt(vec3 at, vec3 r) {
  if (uShape.x < 0.5 && at.y < uMasu.z - 0.2 && r.y > 0.0) {
    float t = exitOf(at, r);
    vec3 wall = at + r * t;
    if (wall.y < uMasu.z) {
      return seenAt(wall) * 0.8;
    }
  }
  return roomAt(r, at);
}

float causticAt(vec3 floorAt, float depth) {
  vec3 light = normalize(uKey - floorAt);
  vec2 from = floorAt.xz + light.xz / max(light.y, 0.2) * depth * 0.75;
  float spacing = uSpan.z * 2.0 / max(1.0, uWaveSize - 1.0);
  float middle = smoothRippleAt(from);
  float bend = smoothRippleAt(from + vec2(spacing, 0.0)) + smoothRippleAt(from - vec2(spacing, 0.0))
    + smoothRippleAt(from + vec2(0.0, spacing)) + smoothRippleAt(from - vec2(0.0, spacing))
    - 4.0 * middle;
  float focus = -bend * uLevel.z * depth * 0.12;
  return clamp(1.0 + max(focus, 0.0) * 1.4 + min(focus, 0.0) * 0.35, 0.82, 2.2);
}

vec3 soft(vec3 c) {
  vec3 over = max(c - 0.78, 0.0);
  return min(c, 0.78) + 0.22 * (1.0 - exp(-over / 0.22));
}

void main() {
  vec2 device = vec2(uRegion.x + gl_FragCoord.x, uRegion.y + uRegion.w - gl_FragCoord.y);
  vec2 screen = (device - uScene.yz) / uScene.x;
  vec3 dir = normalize(screen.x * uRight - screen.y * uUp - uLens.x * uBack);
  float near = (uSpan.y - uEye.y) / dir.y;
  float far = (uSpan.x - uEye.y) / dir.y;
  float before = near;
  float hit = -1.0;
  float closest = 1e4;
  float graze = near;
  int steps = uLevel.y > 0.0 ? STEPS : STEPS / 2;
  for (int i = 1; i <= STEPS; i += 1) {
    if (i > steps) {
      break;
    }
    float t = mix(near, far, float(i) / float(steps));
    float gap = gapAt(uEye + dir * t);
    if (gap < 0.0) {
      hit = t;
      break;
    }
    if (gap < closest && insetOf((uEye + dir * t).xz) >= 0.0) {
      closest = gap;
      graze = t;
    }
    before = t;
  }
  float pixel = graze / (uLens.x * uScene.x);
  float found = hit < 0.0 ? 1.0 - smoothstep(0.0, pixel * 1.5, closest) : 1.0;
  if (hit < 0.0) {
    hit = graze;
    before = graze;
  }
  for (int i = 0; i < 6; i += 1) {
    float middle = (before + hit) * 0.5;
    bool under = gapAt(uEye + dir * middle) < 0.0;
    hit = under ? middle : hit;
    before = under ? before : middle;
  }
  vec3 at = uEye + dir * hit;
  float inset = insetOf(at.xz);
  float cover = found * clamp(inset / max(fwidth(inset), 1e-3) + 0.5, 0.0, 1.0);
  if (cover <= 0.0) {
    discard;
  }
  float nudge = 0.22;
  vec3 normal = normalize(vec3(
    smoothHeightAt(at.xz - vec2(nudge, 0.0)) - smoothHeightAt(at.xz + vec2(nudge, 0.0)),
    2.0 * nudge,
    smoothHeightAt(at.xz - vec2(0.0, nudge)) - smoothHeightAt(at.xz + vec2(0.0, nudge))
  ));
  vec3 eye = -dir;
  float facing = max(dot(normal, eye), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  vec3 bent = refract(dir, normal, 0.7519);
  float t = exitOf(at, bent);
  vec3 under = at + bent * t;
  float depth = max(0.0, at.y - under.y);
  vec3 seen = seenAt(under);
  if (under.y < uMasu.y + 0.05 && uLevel.z > 0.0) {
    seen *= causticAt(under, depth);
  }
  float path = t + depth / max(normalize(uKey - under).y, 0.25);
  seen *= exp(-SAKE * path);
  vec3 mirrored = mirrorAt(at, reflect(dir, normal));
  vec3 lit = seen * (1.0 - fresnel) + mirrored * fresnel;
  float along = (inset / uShape.z - CREST) / 0.2;
  float crest = exp(-along * along) * uShape.w * smoothstep(0.0, 1.2, uLevel.y);
  vec2 lean = normalize(normal.xz + 1e-4);
  float distant = smoothstep(-0.3, 0.7, -dot(lean, normalize(eye.xz)));
  float facingLamp = max(dot(lean, normalize(uKey.xz - at.xz)), 0.0) + max(dot(lean, normalize(uGlint.xz - at.xz)), 0.0);
  lit += LAMP * crest * mix(0.25, 1.4, distant) * (0.5 + 0.9 * min(facingLamp, 1.0));
  lit *= mix(0.62, 1.0, smoothstep(0.0, uShape.z * 0.7, inset));
  colour = vec4(soft(lit) * cover, cover);
}`;

const UNIFORMS = [
  "uRegion",
  "uScene",
  "uEye",
  "uRight",
  "uUp",
  "uBack",
  "uLens",
  "uShape",
  "uLevel",
  "uSpan",
  "uMasu",
  "uBox",
  "uKey",
  "uGlint",
  "uWaveSize",
  "uWave",
  "uInside",
] as const;

type Uniform = (typeof UNIFORMS)[number];

interface State {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  at: (name: Uniform) => WebGLUniformLocation | null;
  wave: WebGLTexture;
  inside: WebGLTexture;
}

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

const link = (gl: WebGL2RenderingContext) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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
  return program;
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
  const program = link(gl);
  if (program === null) {
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
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  return {
    at,
    gl,
    inside: texture(gl, 1),
    program,
    wave: texture(gl, 0),
  };
};

export const createSake = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  let state: State | null = null;
  let broken = false;
  let uploaded: HTMLCanvasElement | null = null;
  let grid = 0;
  let heights = new Float32Array(0);

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

  const draw = (
    target: CanvasRenderingContext2D,
    liquid: Liquid,
    scene: Matrix,
    backing: Backing
  ) => {
    if (state === null || state.gl.isContextLost()) {
      return false;
    }
    const { gl, at } = state;
    const peak = sendWave(state, liquid) * Math.abs(liquid.ripple);
    const low = liquid.base - peak - 0.2;
    const high = liquid.base + liquid.lift + peak + liquid.meniscus + 0.2;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let corner = 0; corner < 8; corner += 1) {
      const wx = corner % 2 === 0 ? -liquid.half : liquid.half;
      const wy = (corner % 4 < 2 ? low : high) - basis.middle;
      const wz = corner < 4 ? -liquid.half : liquid.half;
      const across =
        wx * basis.right.x + wy * basis.right.y + wz * basis.right.z;
      const up = wx * basis.up.x + wy * basis.up.y + wz * basis.up.z;
      const depth = wx * basis.back.x + wy * basis.back.y + wz * basis.back.z;
      const shrink = basis.distance / (basis.distance - depth);
      const sx = across * shrink;
      const sy = -up * shrink;
      const dx = scene.a * sx + scene.e;
      const dy = scene.a * sy + scene.f;
      x0 = Math.min(x0, dx);
      y0 = Math.min(y0, dy);
      x1 = Math.max(x1, dx);
      y1 = Math.max(y1, dy);
    }
    const { width, height } = target.canvas;
    const left = Math.max(0, Math.floor(x0) - 1);
    const top = Math.max(0, Math.floor(y0) - 1);
    const w = Math.min(width, Math.ceil(x1) + 1) - left;
    const h = Math.min(height, Math.ceil(y1) + 1) - top;
    if (w <= 0 || h <= 0) {
      return true;
    }
    if (canvas.width < w || canvas.height < h) {
      canvas.width = Math.max(canvas.width, w);
      canvas.height = Math.max(canvas.height, h);
    }
    sendBacking(state, backing);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(state.program);
    gl.uniform4f(at("uRegion"), left, top, w, h);
    gl.uniform3f(at("uScene"), scene.a, scene.e, scene.f);
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
    gl.uniform4f(at("uBox"), backing.x, backing.y, backing.w, backing.h);
    gl.uniform1f(at("uWaveSize"), liquid.wave.size);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.drawImage(canvas, 0, canvas.height - h, w, h, left, top, w, h);
    target.restore();
    return true;
  };

  return {
    draw: (
      target: CanvasRenderingContext2D,
      liquid: Liquid,
      scene: Matrix,
      backing: Backing | null
    ) => !broken && backing !== null && draw(target, liquid, scene, backing),
    dispose: () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      if (state !== null) {
        const { gl } = state;
        gl.deleteTexture(state.wave);
        gl.deleteTexture(state.inside);
        gl.deleteProgram(state.program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      state = null;
      broken = true;
    },
  };
};

export type Sake = ReturnType<typeof createSake>;
