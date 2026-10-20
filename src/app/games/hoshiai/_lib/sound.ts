import { createAudio } from "../../_lib/audio";
import { TOP } from "./bodies";

const SCALE = [0, 2, 4, 7, 9];

const note = (step: number) => {
  const octave = Math.floor(step / SCALE.length);
  const degree = SCALE[step - octave * SCALE.length] ?? 0;
  return 261.63 * 2 ** ((degree + 12 * octave) / 12);
};

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const wind = audio.createBufferSource();
      wind.buffer = noise;
      wind.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 320;
      const hush = audio.createGain();
      hush.gain.value = 0.03;
      wind.connect(low).connect(hush).connect(out);
      wind.start();
      for (const frequency of [65.41, 98, 130.81]) {
        const hum = audio.createOscillator();
        hum.frequency.value = frequency;
        const soft = audio.createGain();
        soft.gain.value = 0.008;
        hum.connect(soft).connect(out);
        hum.start();
      }
    }
  );

  const bell = (frequency: number, peak: number, length: number, at = 0) => {
    tone(frequency, { at, bend: 1, length, peak });
    tone(frequency * 2.76, {
      at,
      bend: 1,
      length: length * 0.4,
      peak: peak / 3,
    });
  };

  const boom = (peak: number) => {
    tone(55, { bend: 2.4, length: 1.4, peak });
    spray(240, peak * 3, 1);
  };

  return {
    close,
    drop: () => {
      tone(1568, { bend: 1.25, length: 0.07, peak: 0.05, type: "triangle" });
    },
    galaxy: () => {
      boom(0.4);
      for (let i = 0; i < 10; i += 1) {
        bell(note(10 + i), 0.1, 1.6, i * 0.07);
      }
    },
    land: (tier: number) => {
      tone(190 - tier * 10, {
        bend: 1.6,
        length: 0.12,
        peak: 0.05 + tier * 0.012,
      });
      spray(700 - tier * 40, 0.25 + tier * 0.04, 0.09);
    },
    merge: (made: number, chain: number) => {
      const step = 14 - made + (chain - 1) * 2;
      bell(note(step), 0.16, 0.7 + made * 0.09);
      if (made >= 5) {
        tone(note(step - 5), {
          bend: 1,
          length: 1.1,
          peak: 0.08,
          type: "triangle",
        });
      }
      if (made >= 8) {
        boom(0.18 + (made - 8) * 0.08);
      }
      if (made === TOP) {
        spray(5200, 0.6, 1.2);
      }
    },
    mute,
    over: () => {
      for (const [i, step] of [9, 7, 5, 2].entries()) {
        tone(note(step), {
          at: i * 0.16,
          bend: 1,
          length: 0.6,
          peak: 0.12,
          type: "triangle",
        });
      }
    },
    record: () => {
      for (const [i, step] of [5, 7, 9, 10, 12, 15].entries()) {
        bell(note(step), 0.12, 0.9, 0.5 + i * 0.09);
      }
    },
    unlock,
    warn: () => {
      tone(392, { bend: 1, length: 0.14, peak: 0.07, type: "square" });
    },
  };
};
