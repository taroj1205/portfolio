import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

export const appIcon = async (px: number) => {
  const photo = await readFile(
    path.join(process.cwd(), "src/assets/profile.jpg")
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage: `url(data:image/jpeg;base64,${photo.toString("base64")})`,
        backgroundSize: "cover",
        height: "100%",
        width: "100%",
      }}
    />,
    { height: px, width: px }
  );
};
