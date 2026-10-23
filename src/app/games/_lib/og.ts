import { ImageResponse } from "next/og";
import sharp from "sharp";

type Scene = ConstructorParameters<typeof ImageResponse>[0];
type Options = ConstructorParameters<typeof ImageResponse>[1];

export const ogImage = async (scene: Scene, options: Options) => {
  const rendered = new ImageResponse(scene, options);
  const body = await sharp(await rendered.arrayBuffer())
    .png({ dither: 0.5, palette: true, quality: 100 })
    .toBuffer();
  const headers = new Headers(rendered.headers);
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "cache-control",
      "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400"
    );
  }
  return new Response(new Uint8Array(body), { headers });
};
