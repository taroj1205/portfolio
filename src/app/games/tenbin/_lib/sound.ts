import { createAudio } from "../../_lib/audio";
import type { Grade } from "./scale";

const PITCH: Record<Grade, number> = {
  far: 330,
  hit: 660,
  near: 440,
  way: 220,
};

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio();

  const bell = (frequency: number, at = 0) => {
    tone(frequency, { at, bend: 1, length: 1.4, peak: 0.12 });
    tone(frequency * 2.76, { at, bend: 1, length: 0.5, peak: 0.04 });
  };

  return {
    close,
    clunk: () => {
      tone(140, { bend: 1.8, length: 0.22, peak: 0.26, type: "triangle" });
      spray(900, 0.12, 0.08);
    },
    grade: (grade: Grade) => {
      if (grade === "hit") {
        for (const [i, step] of [0, 4, 7, 12].entries()) {
          bell(PITCH.hit * 2 ** (step / 12), 0.12 + i * 0.09);
        }

        return;
      }

      tone(PITCH[grade], {
        at: 0.12,
        bend: 1.1,
        length: 0.3,
        peak: 0.1,
        type: "sine",
      });
    },
    mute,
    unlock,
    verdict: (right: boolean) => {
      if (right) {
        bell(784);
        bell(1046.5, 0.1);

        return;
      }

      tone(196, { bend: 0.8, length: 0.5, peak: 0.14, type: "sawtooth" });
    },
  };
};
