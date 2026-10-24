import { createAudio } from "../../_lib/audio";

const PENTATONIC = [0, 2, 4, 7, 9, 12];

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 420;
      const gain = audio.createGain();
      gain.gain.value = 0.05;
      source.connect(low).connect(gain).connect(out);
      source.start();
    }
  );

  const bell = (frequency: number, peak: number, length: number, at = 0) => {
    tone(frequency, { at, bend: 1, length, peak });
    tone(frequency * 2.71, {
      at,
      bend: 1,
      length: length * 0.5,
      peak: peak / 3,
    });
  };

  return {
    close,
    dip: () => {
      tone(220, { bend: 0.6, length: 0.12, peak: 0.12 });
      spray(900, 0.18, 0.12);
    },
    mute,
    rare: () => {
      for (const [i, step] of PENTATONIC.entries()) {
        bell(659.25 * 2 ** (step / 12), 0.07, 1.4, 0.05 + i * 0.07);
      }
    },
    scoop: (count: number) => {
      spray(1800, 0.3 + count * 0.05, 0.22);
      tone(330, { bend: 1.8, length: 0.16, peak: 0.12 });
      for (let i = 0; i < Math.min(count, 5); i += 1) {
        tone(880 * 2 ** (PENTATONIC[i] / 12), {
          at: 0.48 + i * 0.09,
          bend: 0.7,
          length: 0.14,
          peak: 0.09,
        });
      }
    },
    slip: () => {
      spray(1400, 0.2, 0.12);
      tone(520, { bend: 0.45, length: 0.2, peak: 0.08 });
    },
    tear: () => {
      for (let i = 0; i < 4; i += 1) {
        spray(3200 + i * 600, 0.4, 0.05 + i * 0.03);
      }
      tone(150, { bend: 0.5, length: 0.3, peak: 0.18, type: "triangle" });
    },
    unlock,
  };
};
