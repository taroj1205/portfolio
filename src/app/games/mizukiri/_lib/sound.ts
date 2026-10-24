import { createAudio } from "../../_lib/audio";
import type { Event, Grade } from "./simulate";

const YO = [0, 2, 5, 7, 9];

const pitch = (step: number) => {
  const capped = Math.min(step, 14);
  const degree = YO[capped % YO.length] ?? 0;

  return 587.33 * 2 ** ((degree + 12 * Math.floor(capped / YO.length)) / 12);
};

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const river = audio.createBufferSource();
      river.buffer = noise;
      river.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 520;
      const hush = audio.createGain();
      hush.gain.value = 0.05;
      river.connect(low).connect(hush).connect(out);
      river.start();
    }
  );

  const plunge = () => {
    tone(260, { bend: 2.2, length: 0.35, peak: 0.3 });
    spray(900, 1.4, 0.4);
  };

  const events: Record<Event, () => void> = {
    dragonfly: () => {
      tone(700, { bend: 0.5, length: 0.2, peak: 0.16, type: "triangle" });
      tone(1400, { at: 0.06, bend: 0.6, length: 0.16, peak: 0.08 });
      spray(4200, 0.5, 0.12);
    },
    duck: () => {
      for (const at of [0, 0.14]) {
        tone(330, {
          at,
          bend: 1.3,
          length: 0.12,
          peak: 0.16,
          type: "sawtooth",
        });
      }
    },
    fish: () => {
      spray(1400, 1.2, 0.3);
      tone(520, { bend: 0.6, length: 0.2, peak: 0.22, type: "triangle" });
    },
    lotus: () => {
      tone(420, { bend: 1.8, length: 0.16, peak: 0.3 });
      tone(840, { at: 0.05, bend: 1.2, length: 0.12, peak: 0.12 });
    },
    rock: () => {
      tone(1320, { bend: 1, length: 0.5, peak: 0.18, type: "triangle" });
      tone(1980, { bend: 1, length: 0.3, peak: 0.08 });
    },
    wall: () => {
      tone(620, { bend: 1.4, length: 0.08, peak: 0.2, type: "square" });
      spray(3200, 0.4, 0.05);
    },
  };

  return {
    close,
    event: (kind: Event) => {
      events[kind]();
    },
    fanfare: () => {
      for (const [i, step] of [0, 2, 4, 7, 9, 12].entries()) {
        tone(pitch(step + 2), {
          at: i * 0.09,
          bend: 1,
          length: 0.5,
          peak: 0.14,
          type: "triangle",
        });
      }
    },
    reward: () => {
      tone(1760, { bend: 1, length: 0.12, peak: 0.12, type: "triangle" });
      tone(2637, {
        at: 0.07,
        bend: 1,
        length: 0.2,
        peak: 0.1,
        type: "triangle",
      });
    },
    leaf: () => {
      tone(880, { bend: 1.1, length: 0.5, peak: 0.12, type: "triangle" });
    },
    mute,
    splash: (step: number, grade: Grade | null) => {
      if (grade === null) {
        plunge();

        return;
      }

      tone(pitch(step), {});
      spray(2600, 0.5, 0.08);

      if (grade === "perfect") {
        tone(pitch(step + 7), {
          at: 0.04,
          bend: 1,
          length: 0.3,
          peak: 0.12,
          type: "triangle",
        });
      }
    },
    unlock,
  };
};
