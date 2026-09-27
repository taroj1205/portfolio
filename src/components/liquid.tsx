import { Fragment, useEffect, useState } from "react";

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

// Ripples only pull pixels in from the page side, never from beyond the
// edge, and the ramp fades them into neutral grey so the inner side of
// the strip lines up with the untouched page.
export const Melt = ({
  depth,
  edge,
  id,
}: {
  depth: number;
  edge: "left" | "right";
  id: string;
}) => {
  const right = edge === "right";
  const height = 800;
  const source = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${depth}" height="${height}"><filter id="n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence baseFrequency="0.006 0.03" numOctaves="2" seed="7" type="fractalNoise"/><feColorMatrix values="0.5 0 0 0 ${right ? 0.5 : 0} 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 1"/></filter><linearGradient id="g" x1="${right ? 1 : 0}" x2="${right ? 0 : 1}"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="m"><rect width="100%" height="100%" fill="url(#g)"/></mask><rect width="100%" height="100%" fill="#808080"/><rect width="100%" height="100%" filter="url(#n)" mask="url(#m)"/></svg>`
  )}`;
  // A baked PNG keeps the noise out of the per-frame filter work.
  const [map, setMap] = useState(source);
  useEffect(() => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = depth;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      setMap(canvas.toDataURL());
    });
    image.src = source;
  }, [source, depth]);
  return (
    <filter colorInterpolationFilters="sRGB" id={id}>
      <feImage
        height={height}
        href={map}
        preserveAspectRatio="none"
        result="map"
        width={depth}
        x="0"
        y="0"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale="75"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
};
