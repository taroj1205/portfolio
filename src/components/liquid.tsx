import { Fragment, useEffect, useState } from "react";
import type { RefObject } from "react";

const channels = [
  ["1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0", -26],
  ["0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0", -24.5],
  ["0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0", -23],
] as const;

export const split = (map: string, y: "B" | "G", amount: number) => (
  <>
    <feGaussianBlur in="SourceGraphic" result="soft" stdDeviation="1.2" />
    {channels.map(([matrix, scale], i) => (
      <Fragment key={matrix}>
        <feDisplacementMap
          in="soft"
          in2={map}
          result={`shift${i}`}
          scale={scale * amount}
          xChannelSelector="R"
          yChannelSelector={y}
        />
        <feColorMatrix
          in={`shift${i}`}
          result={`channel${i}`}
          type="matrix"
          values={matrix}
        />
      </Fragment>
    ))}
    <feBlend in="channel0" in2="channel1" mode="screen" result="rg" />
    <feBlend in="rg" in2="channel2" mode="screen" />
  </>
);

export const meltScale = 25;

const edges = {
  left: ["0", "0", "1", "0"],
  right: ["1", "0", "0", "0"],
  top: ["0", "0", "0", "1"],
} as const;

// Ripples only pull pixels in from the page side, never from beyond the
// edge, and the ramp fades them into neutral grey so the inner side of
// the strip lines up with the untouched page.
export const Melt = ({
  amount,
  depth,
  edge,
  id,
  wave,
}: {
  amount: number;
  depth: number;
  edge: keyof typeof edges;
  id: string;
  wave?: RefObject<SVGFEDisplacementMapElement | null>;
}) => {
  const [x1, y1, x2, y2] = edges[edge];
  const across = edge === "top";
  const width = across ? 2000 : depth;
  const height = across ? depth : 800;
  const flow = across
    ? "0 0 0 0 0.5 0 0.5 0 0 0 0 0 0 0 0.5 0 0 0 0 1"
    : `0.5 0 0 0 ${edge === "right" ? 0.5 : 0} 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 1`;
  const source = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence baseFrequency="${across ? "0.06 0.006" : "0.006 0.03"}" numOctaves="2" seed="7" type="fractalNoise"/><feColorMatrix values="${flow}"/></filter><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="m"><rect width="100%" height="100%" fill="url(#g)"/></mask><rect width="100%" height="100%" fill="#808080"/><rect width="100%" height="100%" filter="url(#n)" mask="url(#m)"/></svg>`
  )}`;
  // A baked PNG keeps the noise out of the per-frame filter work.
  const [map, setMap] = useState(source);
  useEffect(() => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      setMap(canvas.toDataURL());
    });
    image.src = source;
  }, [source, width, height]);
  return (
    <filter colorInterpolationFilters="sRGB" id={id}>
      <feImage
        height={height}
        href={map}
        preserveAspectRatio="none"
        result="map"
        width={across ? 4000 : width}
        x="0"
        y="0"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        ref={wave}
        scale={meltScale * amount}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
};
