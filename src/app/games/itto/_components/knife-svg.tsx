import type { Point } from "../_lib/geometry";

const steel = {
  bevel: "#c3cad0",
  blade: "#dde3e8",
  collar: "#1d1a18",
  edge: "#f8fafb",
  handle: "#c69b5f",
  grain: "#a77b42",
  shadow: "#3a2410",
  spine: "#8e979e",
} as const;

const BLADE =
  "M0 0C-0.18-0.07-0.42-0.15-0.7-0.17L-1.32-0.17L-1.32 0.1L-0.62 0.1C-0.34 0.09-0.14 0.06 0 0Z";

export const knifeSvg = (tip: Point, toward: Point) => {
  const angle =
    (Math.atan2(toward.y - tip.y, toward.x - tip.x) * 180) / Math.PI + 180;
  return (
    <g
      transform={`translate(${tip.x.toFixed(4)} ${tip.y.toFixed(4)}) rotate(${angle.toFixed(2)})`}
    >
      <g opacity={0.22} transform="translate(0.05 0.09)">
        <path d={BLADE} fill={steel.shadow} />
        <rect
          fill={steel.shadow}
          height={0.22}
          rx={0.05}
          width={0.78}
          x={-2.1}
          y={-0.13}
        />
      </g>
      <path d={BLADE} fill={steel.blade} />
      <path
        d="M-0.05 0.02C-0.3 0.07-0.5 0.08-0.62 0.08L-1.32 0.08L-1.32 0.1L-0.62 0.1C-0.34 0.09-0.14 0.06 0 0Z"
        fill={steel.edge}
      />
      <path
        d="M-0.2-0.03C-0.5-0.06-0.9-0.05-1.32-0.04"
        fill="none"
        opacity={0.6}
        stroke={steel.bevel}
        strokeWidth={0.012}
      />
      <path d="M-0.7-0.17L-1.32-0.17" stroke={steel.spine} strokeWidth={0.02} />
      <rect
        fill={steel.collar}
        height={0.24}
        rx={0.03}
        width={0.12}
        x={-1.44}
        y={-0.14}
      />
      <rect
        fill={steel.handle}
        height={0.22}
        rx={0.05}
        width={0.68}
        x={-2.1}
        y={-0.13}
      />
      <path
        d="M-2.05-0.06H-1.5M-2.02 0.02H-1.52M-1.98 0.06H-1.6"
        opacity={0.45}
        stroke={steel.grain}
        strokeWidth={0.012}
      />
    </g>
  );
};
