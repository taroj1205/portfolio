import { createBrush } from "./brush";
import type { Sample } from "./brush";
import { simplify } from "./stroke";

const STEPS = 96;
const DWELL = 240;
const DURATION = 1500;
const START = Math.PI * 0.62;
const SWEEP = Math.PI * 2 + 0.3;

export const modelSamples: readonly Sample[] = [
  { t: 0, x: 0.5 + Math.cos(START) * 0.34, y: 0.5 + Math.sin(START) * 0.34 },
  ...Array.from({ length: STEPS + 1 }, (_, i) => {
    const u = i / STEPS;
    const progress = u - (Math.sin(u * Math.PI * 2) / (Math.PI * 2)) * 0.55;
    const angle = START - progress * SWEEP;
    const r = 0.34 * (1 + 0.01 * Math.sin(angle * 3 + 1) - 0.025 * progress);

    return {
      t: DWELL + u * DURATION,
      x: 0.5 + Math.cos(angle) * r,
      y: 0.5 + Math.sin(angle) * r,
    };
  }),
];

const brush = createBrush(11);
const [head, ...rest] = modelSamples;

brush.press(head);

for (const sample of rest) {
  brush.move(sample);
}

brush.lift();

export const modelTrace = simplify(brush.trace());
