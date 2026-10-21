import type { Fill, Layer, Part, Place } from "./art";

export const createPainter = (ctx: CanvasRenderingContext2D) => {
  const paths = new WeakMap<Layer, Path2D>();
  const gradients = new WeakMap<Fill, CanvasGradient>();

  const pathOf = (layer: Layer) => {
    const known = paths.get(layer);
    if (known) {
      return known;
    }
    const path = new Path2D(layer.d);
    paths.set(layer, path);
    return path;
  };

  const styleOf = (fill: Fill) => {
    if ("solid" in fill) {
      return fill.solid;
    }
    const known = gradients.get(fill);
    if (known) {
      return known;
    }
    let gradient: CanvasGradient;
    if ("linear" in fill) {
      gradient = ctx.createLinearGradient(...fill.linear);
    } else {
      const [cx, cy, r] = fill.radial;
      const [fx, fy] = fill.focus ?? [cx, cy];
      gradient = ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
    }
    for (const [offset, color] of fill.stops) {
      gradient.addColorStop(offset, color);
    }
    gradients.set(fill, gradient);
    return gradient;
  };

  return (part: Part, place?: Place, alpha = 1) => {
    if (alpha <= 0) {
      return;
    }
    ctx.save();
    if (place) {
      ctx.translate(place.x, place.y);
      ctx.rotate(place.angle);
      ctx.scale(place.sx, place.sy);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const layer of part) {
      ctx.globalAlpha = alpha * (layer.alpha ?? 1);
      const path = pathOf(layer);
      if (layer.fill !== undefined) {
        ctx.fillStyle = styleOf(layer.fill);
        ctx.fill(path);
      }
      if (layer.stroke !== undefined) {
        ctx.strokeStyle = styleOf(layer.stroke);
        ctx.lineWidth = layer.width ?? 0.002;
        ctx.stroke(path);
      }
    }
    ctx.restore();
  };
};
