import { Fragment } from "react";
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
  const ramp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0"/><stop offset="0.45" stop-opacity="0.35"/><stop offset="1" stop-opacity="0"/></linearGradient><rect width="1" height="1" fill="url(#g)"/></svg>`;
  return (
    <filter colorInterpolationFilters="sRGB" id={id}>
      <feTurbulence
        baseFrequency={across ? "0.03 0.006" : "0.006 0.03"}
        numOctaves="2"
        result="noise"
        seed="7"
        type="fractalNoise"
      />
      <feColorMatrix
        in="noise"
        result="flow"
        type="matrix"
        values={
          across
            ? "0 0 0 0 0.5 0 0.5 0 0 0 0 0 0 0 0.5 0 0 0 0 1"
            : `0.5 0 0 0 ${edge === "right" ? 0.5 : 0} 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 1`
        }
      />
      <feImage
        height={across ? depth : 4000}
        href={`data:image/svg+xml,${encodeURIComponent(ramp)}`}
        preserveAspectRatio="none"
        result="ramp"
        width={across ? 4000 : depth}
        x="0"
        y="0"
      />
      <feComposite in="flow" in2="ramp" operator="in" result="edge" />
      <feColorMatrix
        in="noise"
        result="still"
        type="matrix"
        values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 1"
      />
      <feMerge result="map">
        <feMergeNode in="still" />
        <feMergeNode in="edge" />
      </feMerge>
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
