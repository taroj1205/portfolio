import { CREST, GLASS_TOP, backBar, box, tumbler } from "./scene";

export const RINGS = 10;
export const BEADS = 48;
export const DROPS = 24;
export const BUBBLES = 16;

const decimals = (...values: readonly number[]) =>
  values.map((value) => value.toFixed(3)).join(", ");

const { lantern } = backBar;

export const VERTEX = `#version 300 es
void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;

uniform vec4 uRegion;
uniform vec3 uScene;
uniform vec3 uEye;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uBack;
uniform vec2 uLens;
uniform vec3 uKey;
uniform vec3 uGlint;
uniform float uTime;

out vec4 colour;

const vec3 LAMP = vec3(1.0, 0.82, 0.58);
const vec3 SAKE = vec3(0.0002, 0.0005, 0.0013);
const vec3 TINT = vec3(1.0, 0.97, 0.88);

vec2 deviceAt() {
  return vec2(uRegion.x + gl_FragCoord.x, uRegion.y + uRegion.w - gl_FragCoord.y);
}

vec2 sceneAt() {
  return (deviceAt() - uScene.yz) / uScene.x;
}

vec3 rayOf(vec2 screen) {
  return normalize(screen.x * uRight - screen.y * uUp - uLens.x * uBack);
}

vec2 project(vec3 p) {
  vec3 rel = p - vec3(0.0, uLens.y, 0.0);
  float scale = uLens.x / (uLens.x - dot(rel, uBack));
  return vec2(dot(rel, uRight), -dot(rel, uUp)) * scale;
}

vec3 soft(vec3 c) {
  vec3 over = max(c - 0.78, 0.0);
  return min(c, 0.78) + 0.22 * (1.0 - exp(-over / 0.22));
}

float fresnelOf(float facing, float base) {
  return base + (1.0 - base) * pow(1.0 - clamp(facing, 0.0, 1.0), 5.0);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float sparkle(vec3 n, vec3 view, vec3 at, float sharpness) {
  vec3 key = normalize(normalize(uKey - at) + view);
  vec3 back = normalize(normalize(uGlint - at) + view);
  return pow(max(dot(n, key), 0.0), sharpness) + 0.7 * pow(max(dot(n, back), 0.0), sharpness);
}
`;

const ROOM = `
const float STRETCH = 3.4;
const vec3 ROOM = vec3(0.06, 0.036, 0.02);
const vec3 CEILING = vec3(0.016, 0.01, 0.006);
const vec3 BAR = vec3(1.0, 0.6, 0.28);
const vec3 LANTERN = vec3(1.0, 0.32, 0.12);
const float WALL = ${decimals(backBar.wall)};
const float SHELF = ${decimals(backBar.shelf)};
const vec4 LANTERN_AT = vec4(${decimals(lantern.x, lantern.y, lantern.w, lantern.h)});
const vec4 BOKEH[${backBar.bokeh.length}] = vec4[${backBar.bokeh.length}](${backBar.bokeh.map((blob) => `vec4(${decimals(...blob)})`).join(", ")});
const vec3 BOTTLES[${backBar.bottles.length}] = vec3[${backBar.bottles.length}](${backBar.bottles.map((bottle) => `vec3(${decimals(...bottle)})`).join(", ")});

float glow(vec3 r, vec3 at, vec3 lamp, float size) {
  vec3 toward = normalize(lamp - at);
  vec3 side = normalize(cross(toward, vec3(0.0, 1.0, 0.0)));
  vec3 rise = cross(side, toward);
  vec2 off = vec2(dot(r, side), dot(r, rise)) / vec2(size, size * STRETCH);
  float spread = dot(off, off);
  return step(0.0, dot(r, toward)) * (exp(-spread) * 22.0 + exp(-spread * 0.06) * 1.6);
}

float bottleAt(vec2 p) {
  float cover = 0.0;
  for (int i = 0; i < BOTTLES.length(); i += 1) {
    vec3 bottle = BOTTLES[i];
    float shoulder = bottle.y - 44.0;
    float width = mix(bottle.z, 1.8, smoothstep(shoulder - 8.0, shoulder + 10.0, p.y));
    cover = max(cover, smoothstep(width + 5.0, width - 4.0, abs(p.x - bottle.x)) * smoothstep(bottle.y + 6.0, bottle.y - 6.0, p.y));
  }
  return cover * smoothstep(SHELF - 1.0, SHELF + 1.0, p.y);
}

vec3 barAt(vec2 p) {
  float rise = max(p.y - SHELF - 24.0, 0.0) / 80.0;
  float ledge = (p.y - SHELF) / 2.5;
  float shoji = smoothstep(SHELF - 170.0, SHELF - 20.0, p.y) * step(p.y, SHELF);
  vec3 tone = BAR * ((exp(-rise * rise) * 2.6 + 0.08) * (1.0 - 0.7 * bottleAt(p)) * step(SHELF, p.y) + shoji * 1.4);
  tone += LAMP * exp(-ledge * ledge) * 3.0;
  for (int i = 0; i < BOKEH.length(); i += 1) {
    vec4 blob = BOKEH[i];
    float off = length(p - blob.xy) / blob.z;
    tone += BAR * blob.w * exp(-off * off * 2.2) * 7.0;
  }
  float lantern = length((p - LANTERN_AT.xy) / LANTERN_AT.zw);
  tone += LANTERN * (smoothstep(1.0, 0.7, lantern) * 6.0 + exp(-lantern * lantern * 0.35) * 1.4);
  return tone;
}

vec3 roomAt(vec3 r, vec3 at) {
  vec3 tone = mix(ROOM, CEILING, smoothstep(0.1, 0.95, r.y));
  if (r.z < -0.05) {
    vec3 hit = at + r * ((WALL - at.z) / r.z);
    tone = mix(tone, barAt(hit.xy), smoothstep(-0.05, -0.25, r.z));
  }
  tone += LAMP * glow(r, at, uKey, 0.04);
  tone += LAMP * glow(r, at, uGlint, 0.02);
  return tone;
}
`;

const MASU = `
uniform vec3 uMasu;
uniform vec4 uBox;
uniform sampler2D uInside;

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
  p.y = min(p.y, uMasu.z - 1.5);
  return woodAt(p) * (right ? 0.62 : 1.0) * (front ? 0.48 : 1.0);
}

vec3 mirrorAt(vec3 at, vec3 r) {
  if (at.y < uMasu.z - 0.2 && r.y > 0.0 && max(abs(at.x), abs(at.z)) < uMasu.x) {
    vec3 wall = at + r * exitOf(at, r);
    if (wall.y < uMasu.z) {
      return seenAt(wall) * 0.8;
    }
  }
  return roomAt(r, at);
}
`;

const SURFACE = `
uniform vec4 uShape;
uniform vec4 uLevel;
uniform vec3 uSpan;
uniform float uWaveSize;
uniform sampler2D uWave;
uniform float uChop;
uniform vec4 uRings[${RINGS}];

const float CREST = ${CREST.toFixed(2)};

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

vec3 swell(vec2 p, vec2 dir, float k, float speed, float slope) {
  float phase = dot(p, dir) * k - uTime * speed;
  return vec3(dir * cos(phase), -k * sin(phase)) * slope;
}

vec3 slopeAt(vec2 p) {
  vec3 s = swell(p, vec2(0.83, 0.56), 0.5, 7.0, 0.006);
  s += swell(p, vec2(-0.47, 0.88), 0.8, 9.5, 0.005);
  vec3 chop = swell(p, vec2(0.99, -0.12), 1.1, 11.0, 0.018);
  chop += swell(p, vec2(-0.71, -0.7), 1.7, 14.0, 0.014);
  chop += swell(p, vec2(0.26, -0.97), 2.6, 18.0, 0.01);
  chop += swell(p, vec2(-0.93, 0.36), 3.9, 23.0, 0.007);
  chop += swell(p, vec2(0.6, 0.8), 5.7, 29.0, 0.005);
  vec2 source = vec2(0.0);
  float youngest = 1e3;
  for (int i = 0; i < ${RINGS}; i += 1) {
    vec4 ring = uRings[i];
    if (ring.w <= 0.0) {
      continue;
    }
    if (ring.z < youngest) {
      youngest = ring.z;
      source = ring.xy;
    }
    vec2 off = p - ring.xy;
    float d = length(off) + 1e-3;
    float band = d - (0.9 + ring.z * 42.0);
    float fade = ring.w * exp(-ring.z * 1.6) * exp(-band * band * 0.07) * 0.035;
    s += vec3(off / d * sin(band * 1.6), 1.6 * cos(band * 1.6)) * fade;
  }
  vec2 from = p - source;
  s += chop * uChop * (0.3 + 0.7 * exp(-dot(from, from) / 160.0));
  return s * step(0.0, insetOf(p));
}

vec3 normalAt(vec2 p) {
  float nudge = 0.22;
  vec2 s = slopeAt(p).xy;
  return normalize(vec3(
    smoothHeightAt(p - vec2(nudge, 0.0)) - smoothHeightAt(p + vec2(nudge, 0.0)) - 2.0 * nudge * s.x,
    2.0 * nudge,
    smoothHeightAt(p - vec2(0.0, nudge)) - smoothHeightAt(p + vec2(0.0, nudge)) - 2.0 * nudge * s.y
  ));
}
`;

const GLASS = `
const float GF = ${decimals(box.floor)};
const float GB = ${decimals(box.floor + tumbler.base)};
const float GT = ${decimals(GLASS_TOP)};
const float RB = ${decimals(tumbler.bottom)};
const float RT = ${decimals(tumbler.top)};
const float THICK = ${decimals(tumbler.wall)};
const float TAPER = ${decimals((tumbler.top - tumbler.bottom) / tumbler.height)};

float outerAt(float y) {
  return RB + TAPER * (y - GF);
}

vec2 coneHits(vec3 o, vec3 d, float r0) {
  float c0 = r0 + TAPER * (o.y - GF);
  float a = dot(d.xz, d.xz) - TAPER * TAPER * d.y * d.y;
  float b = dot(o.xz, d.xz) - TAPER * d.y * c0;
  float c = dot(o.xz, o.xz) - c0 * c0;
  float h = b * b - a * c;
  if (h < 0.0 || abs(a) < 1e-6) {
    return vec2(1e5);
  }
  h = sqrt(h);
  vec2 t = vec2(-b - h, -b + h) / a;
  return vec2(min(t.x, t.y), max(t.x, t.y));
}

vec3 coneNormal(vec3 p) {
  vec2 out2 = p.xz / max(length(p.xz), 1e-4);
  return normalize(vec3(out2.x, -TAPER, out2.y));
}
`;

const POOL_MAIN = `
uniform float uStand;

const int STEPS = 22;

float gapAt(vec3 p) {
  return insetOf(p.xz) < 0.0 ? 1.0 : p.y - heightAt(p.xz);
}

vec2 columnOf(vec3 o, vec3 d) {
  if (uShape.x > 0.5) {
    float a = dot(d.xz, d.xz);
    float b = dot(o.xz, d.xz);
    float c = dot(o.xz, o.xz) - uShape.y * uShape.y;
    float root = sqrt(max(b * b - a * c, 0.0));
    return b * b < a * c ? vec2(1.0, -1.0) : vec2(-b - root, -b + root) / a;
  }
  vec2 inverse = 1.0 / mix(vec2(1e-6), d.xz, step(vec2(1e-6), abs(d.xz)));
  vec2 low = (-uShape.y - o.xz) * inverse;
  vec2 high = (uShape.y - o.xz) * inverse;
  vec2 enter = min(low, high);
  vec2 leave = max(low, high);
  return vec2(max(enter.x, enter.y), min(leave.x, leave.y));
}

float causticAt(vec3 floorAt, float depth) {
  vec3 light = normalize(uKey - floorAt);
  vec2 from = floorAt.xz + light.xz / max(light.y, 0.2) * depth * 0.75;
  float spacing = uSpan.z * 2.0 / max(1.0, uWaveSize - 1.0);
  float middle = smoothRippleAt(from);
  float bend = smoothRippleAt(from + vec2(spacing, 0.0)) + smoothRippleAt(from - vec2(spacing, 0.0))
    + smoothRippleAt(from + vec2(0.0, spacing)) + smoothRippleAt(from - vec2(0.0, spacing))
    - 4.0 * middle;
  float focus = -bend * uLevel.z * depth * 0.12 - slopeAt(from).z * depth * 0.18;
  return clamp(1.0 + max(focus, 0.0) * 1.4 + min(focus, 0.0) * 0.35, 0.78, 2.2);
}

vec3 throughGlass(vec3 at, vec3 d, float reach, vec3 seen) {
  vec2 hits = coneHits(at, d, RB);
  float t = hits.x > 1e-3 ? hits.x : hits.y;
  vec3 p = at + d * t;
  if (t <= 1e-3 || t >= reach || p.y < GF || p.y > GT) {
    return seen;
  }
  float edge = 1.0 - abs(dot(coneNormal(p), d));
  return seen * (0.86 - 0.3 * edge * edge) + TINT * 0.35 * pow(edge, 4.0);
}

vec3 mirroredAt(vec3 at, vec3 r) {
  vec3 seen = mirrorAt(at, r);
  if (uStand < 0.5) {
    return seen;
  }
  vec2 hits = coneHits(at, r, RB);
  vec3 p = at + r * hits.x;
  if (hits.x <= 1e-3 || p.y < GF || p.y > GT) {
    return seen;
  }
  float edge = 1.0 - abs(dot(coneNormal(p), r));
  return seen * 0.82 + TINT * 0.55 * pow(edge, 3.0);
}

void main() {
  vec2 screen = sceneAt();
  vec3 dir = rayOf(screen);
  vec2 column = columnOf(uEye, dir);
  float near = max((uSpan.y - uEye.y) / dir.y, column.x);
  float far = min((uSpan.x - uEye.y) / dir.y, column.y);
  if (far <= near) {
    discard;
  }
  float before = near;
  float hit = -1.0;
  float closest = 1e4;
  float graze = near;
  int steps = uLevel.y > 0.0 ? STEPS : STEPS / 2;
  for (int i = 0; i <= STEPS; i += 1) {
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
  vec3 normal = normalAt(at.xz);
  vec3 eye = -dir;
  float facing = max(dot(normal, eye), 0.0);
  float footprint = hit / (uLens.x * uScene.x * max(facing, 0.15));
  float cover = found * clamp(inset / footprint + 0.5, 0.0, 1.0);
  if (cover <= 0.0) {
    discard;
  }
  float fresnel = fresnelOf(facing, 0.02);
  float rim = max(uShape.x * 0.6, 1.0 - smoothstep(0.0, max(uShape.z, 1.6), inset));
  vec3 bent = refract(dir, normalize(mix(normal, vec3(0.0, 1.0, 0.0), rim * 0.85)), 0.7519);
  float t = exitOf(at, bent);
  vec3 under = at + bent * t;
  float depth = max(0.0, at.y - under.y);
  vec3 seen = seenAt(under);
  if (under.y < uMasu.y + 0.05) {
    seen *= causticAt(under, depth);
  }
  if (uStand > 0.5) {
    seen = throughGlass(at, bent, t, seen);
  }
  float path = t + depth / max(normalize(uKey - under).y, 0.25);
  seen *= exp(-SAKE * path);
  vec3 r = reflect(dir, normal);
  vec3 lit = seen * (1.0 - fresnel) + mirroredAt(at, r) * fresnel;
  lit += LAMP * sparkle(normal, eye, at, 1400.0) * 0.9;
  float along = (inset - uShape.z * CREST) / max(uShape.z * 0.12, footprint * 1.2);
  float crest = exp(-along * along) * uShape.w * smoothstep(0.0, 1.2, uLevel.y);
  vec2 lean = normalize(normal.xz + 1e-4);
  float away = smoothstep(-0.55, 0.3, -dot(lean, normalize(eye.xz)));
  float facingLamp = max(dot(lean, normalize(uKey.xz - at.xz)), 0.0) + max(dot(lean, normalize(uGlint.xz - at.xz)), 0.0);
  lit += LAMP * crest * away * (0.35 + 0.75 * min(facingLamp, 1.0));
  float hair = 1.0 - smoothstep(0.0, footprint * 1.6, inset);
  lit *= 1.0 - 0.3 * hair;
  colour = vec4(soft(lit) * cover, cover);
}`;

const BEHIND = `
uniform sampler2D uBehind;
uniform vec4 uGrab;

vec3 behindAt(vec2 screen) {
  vec2 device = screen * uScene.x + uScene.yz;
  vec2 at = (device - uGrab.xy) / uGrab.zw;
  return texture(uBehind, clamp(at, vec2(0.001), vec2(0.999))).rgb;
}
`;

const GLASS_MAIN = `
uniform vec2 uFill;
uniform float uPool;
uniform float uFilm;

const int OUTSIDE = 0;
const int WALLED = 1;
const int AIR = 2;
const int LIQUOR = 3;
const int POOLED = 4;
const vec3 GREEN = vec3(0.010, 0.0035, 0.008);

float liquidAt(vec2 p) {
  return uFill.x > 0.5 ? heightAt(p) : -1e4;
}

int mediumAt(vec3 p) {
  float rho = length(p.xz);
  if (p.y > GF && p.y < GT && rho < outerAt(p.y)) {
    if (p.y > GB && rho < outerAt(p.y) - THICK) {
      return p.y < liquidAt(p.xz) ? LIQUOR : AIR;
    }
    return WALLED;
  }
  if (uFill.x > 0.5 && uFill.y > 0.0 && p.y >= GT && rho < RT && p.y < liquidAt(p.xz)) {
    return LIQUOR;
  }
  return p.y < uPool && max(abs(p.x), abs(p.z)) < uMasu.x ? POOLED : OUTSIDE;
}

float indexOf(int medium) {
  return medium == WALLED ? 1.5 : medium == LIQUOR || medium == POOLED ? 1.333 : 1.0;
}

float liquidHit(vec3 o, vec3 d) {
  if (uFill.x < 0.5 || abs(d.y) < 1e-4) {
    return 1e5;
  }
  float low = uLevel.x - 0.8;
  float high = uLevel.x + uLevel.y + uLevel.w + 0.8;
  float a = (high - o.y) / d.y;
  float b = (low - o.y) / d.y;
  float near = max(min(a, b), 1e-3);
  float far = max(a, b);
  if (far <= near) {
    return 1e5;
  }
  float sign0 = o.y + d.y * near - liquidAt((o + d * near).xz);
  float before = near;
  float hit = -1.0;
  for (int i = 1; i <= 8; i += 1) {
    float t = mix(near, far, float(i) / 8.0);
    vec3 p = o + d * t;
    if ((p.y - liquidAt(p.xz)) * sign0 < 0.0) {
      hit = t;
      break;
    }
    before = t;
  }
  if (hit < 0.0) {
    return 1e5;
  }
  for (int i = 0; i < 5; i += 1) {
    float middle = (before + hit) * 0.5;
    vec3 p = o + d * middle;
    bool crossed = (p.y - liquidAt(p.xz)) * sign0 < 0.0;
    hit = crossed ? middle : hit;
    before = crossed ? before : middle;
  }
  vec3 p = o + d * hit;
  return insetOf(p.xz) >= 0.0 ? hit : 1e5;
}

float planeHit(vec3 o, vec3 d, float y, float reach) {
  float t = (y - o.y) / d.y;
  vec3 p = o + d * t;
  return t > 1e-3 && length(p.xz) < reach ? t : 1e5;
}

float coneHit(vec3 o, vec3 d, float r0, float low) {
  vec2 hits = coneHits(o, d, r0);
  vec3 p = o + d * hits.x;
  if (hits.x > 1e-3 && p.y > low && p.y < GT) {
    return hits.x;
  }
  p = o + d * hits.y;
  return hits.y > 1e-3 && p.y > low && p.y < GT ? hits.y : 1e5;
}

vec3 backdropOf(vec3 o, vec3 d) {
  float t = exitOf(o, d);
  if (uPool > GF + 0.05 && (o.y - uPool) * d.y < 0.0) {
    t = min(t, (uPool - o.y) / d.y);
  }
  vec3 hit = o + d * t;
  if (hit.y <= uMasu.z) {
    return behindAt(project(hit));
  }
  float far = d.y < -0.02 ? -o.y / d.y : 900.0;
  if (d.z < -0.05) {
    far = min(far, (WALL - o.z) / d.z);
  }
  return behindAt(project(o + d * far));
}

vec3 surfaceNormal(int surface, vec3 p) {
  if (surface == 0 || surface == 1) {
    return coneNormal(p);
  }
  if (surface == 2) {
    float across = clamp((length(p.xz) - (RT - THICK)) / THICK, 0.0, 1.0) * 2.0 - 1.0;
    vec2 out2 = p.xz / max(length(p.xz), 1e-4) * across * 1.4;
    return normalize(vec3(out2.x, 1.0, out2.y));
  }
  if (surface == 5) {
    return normalAt(p.xz);
  }
  return vec3(0.0, 1.0, 0.0);
}

void main() {
  vec2 screen = sceneAt();
  vec3 dir = rayOf(screen);
  vec3 o = uEye;
  float first = min(coneHit(uEye, dir, RB, GF), planeHit(uEye, dir, GT, RT));
  float pixel = 1.0 / (uLens.x * uScene.x);
  float closest = -1e4;
  vec3 rim = uEye;
  float nearest = -dot(uEye.xz, dir.xz) / max(dot(dir.xz, dir.xz), 1e-6);
  vec3 axis = uEye + dir * nearest;
  if (axis.y > GF && axis.y < GT) {
    closest = (outerAt(axis.y) - length(axis.xz)) / (nearest * pixel);
    rim = axis;
  }
  float lid = (GT - uEye.y) / dir.y;
  vec3 brim = uEye + dir * lid;
  float top = (RT - length(brim.xz)) / (lid * pixel);
  if (top > closest) {
    closest = top;
    rim = brim;
  }
  float cover = first < 1e4 ? 1.0 : clamp(closest + 0.5, 0.0, 1.0);
  if (cover <= 0.0) {
    discard;
  }
  if (first >= 1e4) {
    vec3 n = coneNormal(rim);
    colour = vec4(soft(mirrorAt(rim, reflect(dir, n)) * 0.9) * cover, cover);
    return;
  }
  if (uPool > GF + 0.05) {
    float wet = (uPool - uEye.y) / dir.y;
    vec3 pool = uEye + dir * wet;
    if (wet < first && max(abs(pool.x), abs(pool.z)) < uMasu.x && length(pool.xz) > outerAt(min(uPool, GT))) {
      discard;
    }
  }
  vec3 sum = vec3(0.0);
  vec3 through = vec3(1.0);
  vec3 d = dir;
  int medium = OUTSIDE;
  bool done = false;
  float glint = 0.0;
  for (int i = 0; i < 10; i += 1) {
    float best = 1e5;
    int surface = -1;
    float t = coneHit(o, d, RB, GF);
    if (t < best) { best = t; surface = 0; }
    t = coneHit(o, d, RB - THICK, GB);
    if (t < best) { best = t; surface = 1; }
    t = planeHit(o, d, GT, RT);
    if (t < best) { best = t; surface = 2; }
    t = planeHit(o, d, GB, outerAt(GB) - THICK);
    if (t < best) { best = t; surface = 3; }
    t = planeHit(o, d, GF, RB);
    if (t < best) { best = t; surface = 4; }
    if (medium == AIR || medium == LIQUOR || (medium == OUTSIDE && uFill.y > 0.0)) {
      t = liquidHit(o, d);
      if (t < best) { best = t; surface = 5; }
    }
    if (surface < 0) {
      sum += through * (medium == OUTSIDE || medium == POOLED ? backdropOf(o, d) : roomAt(d, o) * 0.4);
      done = true;
      break;
    }
    vec3 p = o + d * best;
    if (medium == WALLED) {
      through *= exp(-GREEN * best);
    } else if (medium == LIQUOR || medium == POOLED) {
      sum += through * LAMP * (1.0 - exp(-best * 0.012)) * 0.55;
      through *= exp(-SAKE * best * 4.0);
    }
    int next = mediumAt(p + d * 2e-3);
    if (indexOf(next) == indexOf(medium)) {
      medium = next;
      o = p + d * 2e-3;
      continue;
    }
    vec3 n = surfaceNormal(surface, p);
    if (surface == 0 && uFilm > 0.0) {
      float streak = noise(vec2(atan(p.z, p.x) * 22.0, p.y * 0.05 + uTime * 1.8)) - 0.5;
      n = normalize(n + normalize(vec3(-p.z, 0.0, p.x)) * streak * 0.08 * uFilm);
    }
    n = dot(n, d) > 0.0 ? -n : n;
    float eta = indexOf(medium) / indexOf(next);
    float facing = -dot(n, d);
    float base = pow((indexOf(medium) - indexOf(next)) / (indexOf(medium) + indexOf(next)), 2.0);
    float fresnel = fresnelOf(facing, base);
    vec3 bent = refract(d, n, eta);
    if (dot(bent, bent) < 1e-6) {
      d = reflect(d, n);
      o = p + n * 2e-3;
      continue;
    }
    if (medium == OUTSIDE || medium == AIR || medium == POOLED) {
      vec3 r = reflect(d, n);
      float boost = surface == 2 ? 2.6 : surface == 0 ? 1.0 + 0.6 * uFilm : 1.0;
      sum += through * fresnel * boost * mirrorAt(p, r);
      glint += dot(through, vec3(0.333)) * sparkle(n, -d, p, surface == 2 ? 120.0 : 700.0) * (surface == 2 ? 0.9 : 2.2);
    }
    through *= 1.0 - fresnel;
    d = bent;
    o = p - n * 2e-3;
    medium = next;
  }
  if (!done) {
    sum += through * roomAt(d, o) * 0.5;
  }
  sum += LAMP * glint;
  colour = vec4(soft(sum) * cover, cover);
}`;

const STREAM_MAIN = `
uniform vec4 uBeads[${BEADS}];
uniform int uCount;
uniform vec4 uDrops[${DROPS}];
uniform int uDropCount;
uniform vec4 uBubbles[${BUBBLES}];
uniform int uBubbleCount;
uniform vec4 uImpact;
uniform float uSurface;
uniform float uGlass;

vec3 liquidLook(vec3 n, vec3 d, vec3 at, vec2 screen, vec2 across, float lens, float size) {
  float facing = max(dot(n, -d), 0.0);
  float fresnel = fresnelOf(facing, 0.02);
  vec2 shift = across * lens * size;
  vec3 seen = behindAt(screen + shift) * TINT;
  vec3 lit = seen * (1.0 - fresnel) * (0.9 + 0.1 * facing) + roomAt(reflect(d, n), at) * fresnel * 1.4;
  lit += LAMP * sparkle(n, -d, at, 420.0) * 2.4;
  lit += LAMP * pow(1.0 - facing, 4.0) * 0.22;
  return lit;
}

vec3 planeOf(vec3 o, vec3 d) {
  return o + d * (-o.z / d.z);
}

void main() {
  vec2 screen = sceneAt();
  vec3 d = rayOf(screen);
  vec3 o = uEye;
  vec2 look = screen;
  float carry = 1.0;
  vec3 veil = vec3(0.0);
  if (uGlass > 0.5) {
    vec2 hits = coneHits(o, d, RB);
    vec3 p = o + d * hits.x;
    if (hits.x < 1e4 && p.y > GF && p.y < GT) {
      vec3 n = coneNormal(p);
      float fresnel = fresnelOf(-dot(n, d), 0.04);
      veil = mirrorAt(p, reflect(d, n)) * fresnel;
      vec3 inward = refract(d, n, 1.0 / 1.5);
      vec2 inner = coneHits(p + inward * 1e-3, inward, RB - THICK);
      vec3 q = p + inward * (1e-3 + inner.x);
      if (inner.x < 1e4 && q.y > GB && q.y < GT) {
        vec3 m = coneNormal(q);
        vec3 out3 = refract(inward, m, 1.5);
        if (dot(out3, out3) > 1e-6) {
          o = q;
          d = out3;
          look = project(planeOf(o, d));
          carry = (1.0 - fresnel) * (1.0 - fresnelOf(abs(dot(m, inward)), 0.04)) * exp(-0.01 * length(q - p));
        } else {
          carry = 0.0;
        }
      } else {
        carry = 0.0;
      }
    }
  }
  float px = 1.0 / uScene.x;
  vec4 sum = vec4(0.0);
  float best = 1e9;
  int at = -1;
  float h = 0.0;
  float aside = 0.0;
  for (int i = 0; i + 1 < uCount; i += 1) {
    vec4 a = uBeads[i];
    vec4 b = uBeads[i + 1];
    if (a.z <= 0.0 || b.z <= 0.0) {
      continue;
    }
    vec2 ab = b.xy - a.xy;
    float k = clamp(dot(look - a.xy, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    vec2 off = look - (a.xy + ab * k);
    float r = mix(a.z, b.z, k);
    float gap = length(off) - r;
    if (gap < best) {
      best = gap;
      at = i;
      h = k;
      aside = sign(ab.x * off.y - ab.y * off.x) * length(off);
    }
  }
  if (at >= 0) {
    vec4 a = uBeads[at];
    vec4 b = uBeads[at + 1];
    float along = mix(a.w, b.w, h);
    float r = mix(a.z, b.z, h);
    float spin = along * 0.22 - uTime * 7.0;
    float flow = along * 0.52 - uTime * 80.0;
    float fine = along * 1.3 - uTime * 150.0;
    float twist = 1.0 + 0.07 * cos(2.0 * spin);
    float pulse = 1.0 + 0.045 * sin(flow) + 0.025 * sin(fine + 1.3);
    float edge = r * twist * pulse;
    float cover = clamp((edge - abs(aside)) / px + 0.5, 0.0, 1.0);
    if (cover > 0.0) {
      vec2 tangent = normalize(b.xy - a.xy + 1e-6);
      vec2 across = vec2(-tangent.y, tangent.x);
      float u = clamp(aside / edge, -1.0, 1.0);
      u = clamp(u + 0.12 * sin(2.0 * spin) * (1.0 - u * u), -1.0, 1.0);
      vec3 sideways = normalize(across.x * uRight - across.y * uUp);
      vec3 lengthwise = normalize(tangent.x * uRight - tangent.y * uUp);
      float ripple = cos(flow) * 0.16 + cos(fine + 1.3) * 0.1;
      vec3 n = normalize(sideways * u + (-d) * sqrt(max(1.0 - u * u, 0.0)) + lengthwise * ripple);
      vec3 world = planeOf(o, d);
      vec3 lit = liquidLook(n, d, world, screen, across, -u * 1.6, edge);
      sum = vec4(lit * cover, cover);
    }
  }
  for (int i = 0; i < uDropCount; i += 1) {
    vec4 drop = uDrops[i];
    vec2 off = look - drop.xy;
    float dist = length(off);
    float cover = clamp((drop.z - dist) / px + 0.5, 0.0, 1.0);
    if (cover <= 0.0) {
      continue;
    }
    vec2 u = off / max(drop.z, 1e-4);
    float lift = sqrt(max(1.0 - dot(u, u), 0.0));
    vec3 n = normalize(u.x * uRight - u.y * uUp + (-d) * lift);
    vec3 lit = liquidLook(n, d, planeOf(o, d), screen, normalize(off + 1e-6), -length(u) * 1.8, drop.z);
    sum = vec4(lit * cover, cover) + sum * (1.0 - cover);
  }
  if (uImpact.w > 0.0) {
    vec3 centre = uImpact.xyz;
    float strength = uImpact.w;
    float radius = 1.4 + 1.5 * strength;
    float tall = 0.7 + 2.3 * strength;
    vec2 rel = o.xz - centre.xz;
    float a = dot(d.xz, d.xz);
    float b = dot(rel, d.xz);
    float c = dot(rel, rel) - radius * radius;
    float root = b * b - a * c;
    if (root > 0.0) {
      root = sqrt(root);
      for (int k = 0; k < 2; k += 1) {
        float t = (-b + (k == 0 ? -root : root)) / a;
        vec3 p = o + d * t;
        float angle = atan(p.z - centre.z, p.x - centre.x);
        float crown = tall * (0.45 + 0.55 * pow(abs(sin(angle * 4.5 + uTime * 7.0)), 0.6)) * (0.8 + 0.2 * sin(uTime * 23.0 + angle * 3.0));
        float rise = p.y - centre.y;
        float cover = smoothstep(crown, crown - 0.25, rise) * smoothstep(-0.2, 0.15, rise) * 0.75;
        if (cover > 0.0 && t > 0.0) {
          vec3 n = normalize(vec3(p.x - centre.x, -0.6 * rise, p.z - centre.z)) * (k == 0 ? 1.0 : -1.0);
          vec3 lit = liquidLook(n, d, p, screen, vec2(1.0, 0.0), 0.4, radius);
          lit += LAMP * smoothstep(crown - 0.5, crown, rise) * 0.6;
          sum = vec4(lit * cover, cover) * (1.0 - sum.a) + sum;
        }
      }
    }
  }
  for (int i = 0; i < uBubbleCount; i += 1) {
    vec4 bubble = uBubbles[i];
    vec3 centre = vec3(bubble.x, uSurface, bubble.y);
    float radius = bubble.z;
    vec3 rel = o - centre;
    float b = dot(rel, d);
    float c = dot(rel, rel) - radius * radius;
    float root = b * b - c;
    if (root <= 0.0) {
      continue;
    }
    float t = -b - sqrt(root);
    vec3 p = o + d * t;
    if (p.y < centre.y) {
      continue;
    }
    vec3 n = normalize(p - centre);
    float facing = max(dot(n, -d), 0.0);
    float cover = bubble.w * clamp(radius * uScene.x * 0.8, 0.0, 1.0);
    vec3 film = mix(vec3(1.0, 0.86, 0.6), vec3(0.7, 0.9, 1.0), 0.5 + 0.5 * sin(facing * 9.0 + uTime));
    vec3 lit = film * pow(1.0 - facing, 2.5) * 0.9 + LAMP * sparkle(n, -d, p, 160.0) * 1.8;
    float alpha = cover * (0.2 + 0.8 * pow(1.0 - facing, 2.0));
    sum = vec4(lit * cover, alpha) + sum * (1.0 - alpha);
  }
  if (sum.a <= 0.0) {
    discard;
  }
  sum.rgb = soft(sum.rgb * carry + veil * sum.a);
  colour = sum;
}`;

export const fragments = {
  glass: `${HEAD}${ROOM}${MASU}${SURFACE}${GLASS}${BEHIND}${GLASS_MAIN}`,
  pool: `${HEAD}${ROOM}${MASU}${SURFACE}${GLASS}${POOL_MAIN}`,
  stream: `${HEAD}${ROOM}${MASU}${GLASS}${BEHIND}${STREAM_MAIN}`,
} as const;

export type Program = keyof typeof fragments;
