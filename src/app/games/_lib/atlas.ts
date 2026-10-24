import { dataUri, docOf, spriteDoc } from "./svg";
import type { Frame, Sprite } from "./svg";

const rasterize = async (svg: string, width: number, height: number) => {
  try {
    const image = new Image();
    image.src = dataUri(svg);
    await image.decode();
    const bitmap = document.createElement("canvas");
    bitmap.width = Math.max(1, Math.round(width));
    bitmap.height = Math.max(1, Math.round(height));
    bitmap
      .getContext("2d")
      ?.drawImage(image, 0, 0, bitmap.width, bitmap.height);
    return bitmap;
  } catch {
    return null;
  }
};

export interface Layer {
  image: HTMLCanvasElement;
  frame: Frame;
}

type Backdrop = (width: number, height: number, frame: Frame) => string;

export const createAtlas = (sprites: readonly Sprite[], backdrop: Backdrop) => {
  const bitmaps = new Map<Sprite, HTMLCanvasElement>();
  let scale = 0;
  let wanted = "";
  let current: Layer | null = null;

  const bake = async (sprite: Sprite, target: number) => {
    const bitmap = await rasterize(
      spriteDoc(sprite, target),
      sprite.box.w * target,
      sprite.box.h * target
    );
    if (bitmap !== null && scale === target) {
      bitmaps.set(sprite, bitmap);
    }
  };

  const paint = async (
    svg: string,
    width: number,
    height: number,
    key: string,
    frame: Frame
  ) => {
    const image = await rasterize(svg, width, height);
    if (image !== null && wanted === key) {
      current = { frame, image };
    }
  };

  return {
    backdrop: () => current,
    prepare: (nextScale: number) => {
      if (scale > 0 && Math.abs(nextScale / scale - 1) < 0.08) {
        return;
      }
      scale = nextScale;
      for (const sprite of sprites) {
        void bake(sprite, nextScale);
      }
    },
    ready: () => sprites.every((sprite) => bitmaps.has(sprite)),
    scenery: (width: number, height: number, frame: Frame, dpr: number) => {
      const key = [width, height, frame.x, frame.y, frame.size, dpr]
        .map(Math.round)
        .join(":");
      if (key === wanted) {
        return;
      }
      wanted = key;
      void paint(
        docOf(
          { h: height, w: width, x: 0, y: 0 },
          width * dpr,
          height * dpr,
          backdrop(width, height, frame)
        ),
        width * dpr,
        height * dpr,
        key,
        frame
      );
    },
    sprite: (sprite: Sprite) => bitmaps.get(sprite) ?? null,
  };
};
