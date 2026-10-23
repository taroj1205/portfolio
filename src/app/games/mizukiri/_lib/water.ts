const MAX_RIPPLES = 24;

const VERTEX = `
attribute vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uHorizon;
uniform float uFocal;
uniform vec3 uCam;
uniform float uDrift;
uniform float uRoll;
uniform float uZoom;
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSunColor;
uniform vec2 uSun;
uniform vec3 uMist;
uniform float uMistAlpha;
uniform float uShore;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform sampler2D uSky;
uniform sampler2D uNext;
uniform float uBlend;
uniform float uDetail;
uniform float uSkyShift;

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

vec2 wave(vec2 p, vec2 dir, float freq, float speed, float amp) {
  return dir * cos(dot(p, dir) * freq + uTime * speed) * amp;
}

vec2 slope(vec2 p, float reach) {
  vec2 s = vec2(0.0);
  s += wave(p, vec2(0.30, 0.95), 1.3, 1.1, 0.026);
  s += wave(p, vec2(-0.80, 0.60), 2.3, 1.6, 0.020);
  s += wave(p, vec2(0.95, -0.30), 4.1, 2.3, 0.016 * reach);
  s += wave(p, vec2(0.10, 1.00), 6.7, 3.0, 0.013 * reach);
  if (uDetail < 0.5) {
    return s;
  }
  s += wave(p, vec2(-0.55, -0.83), 10.9, 3.9, 0.010 * reach);
  s += wave(p, vec2(0.71, 0.70), 17.3, 5.1, 0.007 * reach * reach);
  vec2 q = p * 5.3 + vec2(uTime * 0.45, uTime * 0.8);
  float e = 0.05;
  float n = noise(q);
  s += vec2(noise(q + vec2(e, 0.0)) - n, noise(q + vec2(0.0, e)) - n) / e * 0.018 * reach * reach;
  return s;
}

vec3 sky(vec2 pixel) {
  vec2 shifted = pixel - vec2(0.0, uSkyShift);
  vec2 uv = clamp(shifted / uRes, vec2(0.0), vec2(1.0, (uHorizon - uSkyShift) / uRes.y - 0.002));
  return mix(texture2D(uSky, uv).rgb, texture2D(uNext, uv).rgb, uBlend);
}

void main() {
  vec2 center = uRes * 0.5;
  vec2 pixel = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - center;
  float c = cos(-uRoll);
  float s = sin(-uRoll);
  pixel = vec2(pixel.x * c - pixel.y * s, pixel.x * s + pixel.y * c) / uZoom + center;

  if (pixel.y <= uHorizon) {
    gl_FragColor = vec4(sky(pixel), 1.0);
    return;
  }

  float rise = max(pixel.y - uHorizon, 1.0) / uFocal;
  float depth = uCam.y / rise;
  vec2 ground = vec2((pixel.x - center.x) / uFocal * depth, depth);
  vec2 world = ground + vec2(uCam.x, uDrift);
  float reach = clamp(1.0 - depth / 45.0, 0.0, 1.0);

  vec2 tilt = slope(world, reach) * (0.35 + 0.65 * clamp(1.0 - depth / 120.0, 0.0, 1.0)) * min(1.0, 400.0 / depth);
  float crest = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) {
      continue;
    }
    vec2 toward = ground + vec2(uCam.x, 0.0) - r.xy;
    float dist = length(toward);
    float age = r.z;
    float front = 0.12 + age * (0.9 + 0.5 * r.w);
    float band = dist - front;
    float envelope = exp(-band * band * 9.0) * pow(max(0.0, 1.0 - age / 4.5), 2.0) * r.w;
    float trail = exp(-max(0.0, -band) * 1.6) * step(band, 0.0);
    float wave = cos(band * 14.0) * envelope + cos(band * 9.0) * trail * envelope * 0.5;
    tilt += normalize(toward + 0.0001) * wave * 0.35;
    crest += max(0.0, sin(band * 14.0)) * envelope * max(0.0, 1.0 - age * 1.2);
  }

  vec3 normal = normalize(vec3(-tilt.x, 1.0, -tilt.y));
  vec3 view = normalize(vec3(ground.x, -uCam.y, depth));
  vec3 bounce = reflect(view, normal);
  bounce.y = max(bounce.y, 0.002);
  vec2 mirror = vec2(
    center.x + bounce.x / bounce.z * uFocal,
    uHorizon - bounce.y / max(bounce.z, 0.05) * uFocal
  );
  vec3 reflected = sky(mirror);

  float facing = max(dot(-view, normal), 0.0);
  float fresnel = 0.12 + 0.88 * pow(1.0 - facing, 4.0);
  vec3 body = mix(uShallow, uDeep, clamp(1.0 - depth / 70.0, 0.0, 1.0) * 0.7);
  vec3 color = mix(body, reflected, clamp(fresnel * 1.15, 0.0, 1.0));

  vec3 sunDir = normalize(vec3((uSun.x - center.x) / uFocal, (uHorizon - uSun.y) / uFocal, 1.0));
  float glint = max(dot(bounce, sunDir), 0.0);
  color += uSunColor * (pow(glint, 1400.0) * 7.0 + pow(glint, 160.0) * 0.35);

  color += vec3(1.0) * crest * 0.55;

  float edge = smoothstep(uShore - 0.6, uShore, abs(world.x));
  color = mix(color, color * 0.55, edge);

  float haze = smoothstep(18.0, 150.0, depth) * uMistAlpha * 1.6;
  color = mix(color, uMist, clamp(haze, 0.0, 0.85));

  gl_FragColor = vec4(color, 1.0);
}
`;

export interface WaterFrame {
  width: number;
  height: number;
  dpr: number;
  horizon: number;
  focal: number;
  camera: { x: number; y: number; z: number };
  roll: number;
  zoom: number;
  blend: number;
  detail: number;
  shift: number;
  time: number;
  deep: string;
  shallow: string;
  sunColor: string;
  sun: { x: number; y: number };
  mist: string;
  mistAlpha: number;
  shore: number;
  ripples: { x: number; z: number; age: number; strength: number }[];
}

const rgb = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16) / 255,
  Number.parseInt(hex.slice(3, 5), 16) / 255,
  Number.parseInt(hex.slice(5, 7), 16) / 255,
];

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true
    ? shader
    : null;
};

export const createWater = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) {
    return null;
  }
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment) {
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    return null;
  }
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

  const textures = [0, 1].map((unit) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  });

  const at = (name: string) => gl.getUniformLocation(program, name);
  const slots = {
    cam: at("uCam"),
    deep: at("uDeep"),
    drift: at("uDrift"),
    focal: at("uFocal"),
    horizon: at("uHorizon"),
    mist: at("uMist"),
    mistAlpha: at("uMistAlpha"),
    res: at("uRes"),
    ripples: at("uRipples"),
    roll: at("uRoll"),
    shallow: at("uShallow"),
    shore: at("uShore"),
    blend: at("uBlend"),
    detail: at("uDetail"),
    shift: at("uSkyShift"),
    next: at("uNext"),
    sky: at("uSky"),
    sun: at("uSun"),
    sunColor: at("uSunColor"),
    time: at("uTime"),
    zoom: at("uZoom"),
  };
  const ripples = new Float32Array(MAX_RIPPLES * 4);

  return {
    skies: (current: HTMLCanvasElement, next: HTMLCanvasElement) => {
      for (const [unit, source] of [current, next].entries()) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, textures[unit] ?? null);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGB,
          gl.RGB,
          gl.UNSIGNED_BYTE,
          source
        );
      }
    },
    draw: (frame: WaterFrame) => {
      const width = Math.round(frame.width * frame.dpr);
      const height = Math.round(frame.height * frame.dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      const scale = frame.dpr;
      gl.uniform2f(slots.res, width, height);
      gl.uniform1f(slots.horizon, frame.horizon * scale);
      gl.uniform1f(slots.focal, frame.focal * scale);
      gl.uniform3f(slots.cam, frame.camera.x, frame.camera.y, 0);
      gl.uniform1f(slots.drift, frame.camera.z % 20_000);
      gl.uniform1f(slots.roll, frame.roll);
      gl.uniform1f(slots.zoom, frame.zoom);
      gl.uniform1f(slots.time, frame.time % 10_000);
      gl.uniform3f(slots.deep, ...rgb(frame.deep));
      gl.uniform3f(slots.shallow, ...rgb(frame.shallow));
      gl.uniform3f(slots.sunColor, ...rgb(frame.sunColor));
      gl.uniform2f(slots.sun, frame.sun.x * scale, frame.sun.y * scale);
      gl.uniform3f(slots.mist, ...rgb(frame.mist));
      gl.uniform1f(slots.mistAlpha, frame.mistAlpha);
      gl.uniform1f(slots.shore, frame.shore);
      ripples.fill(0);
      for (const [i, ripple] of frame.ripples.slice(0, MAX_RIPPLES).entries()) {
        ripples.set(
          [ripple.x, ripple.z - frame.camera.z, ripple.age, ripple.strength],
          i * 4
        );
      }
      gl.uniform4fv(slots.ripples, ripples);
      gl.uniform1i(slots.sky, 0);
      gl.uniform1i(slots.next, 1);
      gl.uniform1f(slots.blend, frame.blend);
      gl.uniform1f(slots.detail, frame.detail);
      gl.uniform1f(slots.shift, frame.shift * scale);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
};
