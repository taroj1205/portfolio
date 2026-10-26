import { createAudio } from "../../_lib/audio";
import type { Verdict } from "./copy";

const PITCH: Record<Verdict, number> = {
  eagle: 880,
  fair: 392,
  off: 220,
  sharp: 587,
};

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio();

  const bell = (frequency: number, at = 0) => {
    tone(frequency, { at, bend: 1, length: 1.1, peak: 0.12 });
    tone(frequency * 2.76, { at, bend: 1, length: 0.4, peak: 0.04 });
  };

  return {
    close,
    lock: () => {
      tone(1400, { bend: 1, length: 0.05, peak: 0.08, type: "triangle" });
      spray(3200, 0.05, 0.04);
    },
    mute,
    reveal: (verdict: Verdict) => {
      if (verdict === "eagle") {
        for (const [i, step] of [0, 4, 7, 12].entries()) {
          bell(PITCH.eagle * 2 ** (step / 12), 0.08 + i * 0.07);
        }

        return;
      }

      tone(PITCH[verdict], {
        at: 0.08,
        bend: verdict === "off" ? 0.8 : 1.1,
        length: 0.32,
        peak: 0.12,
        type: verdict === "off" ? "sawtooth" : "sine",
      });
    },
    unlock,
  };
};
