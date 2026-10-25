import { createAudio } from "../../_lib/audio";

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14];
const GRIND = 0.06;

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 300;
      const gain = audio.createGain();
      gain.gain.value = 0.04;
      source.connect(low).connect(gain).connect(out);
      source.start();
    }
  );

  let since = 0;

  const bell = (frequency: number, peak: number, length: number, at = 0) => {
    tone(frequency, { at, bend: 1, length, peak });
    tone(frequency * 2.76, {
      at,
      bend: 1,
      length: length * 0.4,
      peak: peak / 4,
    });
  };

  return {
    close,
    crash: () => {
      tone(90, { bend: 0.6, length: 0.5, peak: 0.3, type: "triangle" });

      for (let i = 0; i < 4; i += 1) {
        spray(600 + i * 500, 0.35, 0.25 + i * 0.08);
      }
    },
    goal: (level: number) => {
      for (let i = 0; i < 3; i += 1) {
        const step = PENTATONIC[Math.min(PENTATONIC.length - 1, level + i)];
        bell(659.25 * 2 ** (step / 12), 0.07, 1, i * 0.08);
      }
    },
    grind: (dt: number) => {
      since += dt;

      if (since >= GRIND) {
        since = 0;
        spray(2600 + Math.random() * 2400, 0.09, 0.07);
      }
    },
    mute,
    serve: () => {
      for (let i = 0; i < 3; i += 1) {
        tone(240 - i * 30, {
          at: i * 0.16,
          bend: 1.5,
          length: 0.14,
          peak: 0.12,
        });
      }

      for (const [i, step] of PENTATONIC.entries()) {
        bell(523.25 * 2 ** (step / 12), 0.06, 1.3, 0.6 + i * 0.07);
      }
    },
    unlock,
    wobble: () => {
      tone(140, { bend: 1.4, length: 0.32, peak: 0.16, type: "triangle" });
      spray(400, 0.12, 0.2);
    },
  };
};
