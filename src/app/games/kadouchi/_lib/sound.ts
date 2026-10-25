import { createAudio } from "../../_lib/audio";

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14];

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 500;
      const gain = audio.createGain();
      gain.gain.value = 0.025;
      source.connect(band).connect(gain).connect(out);
      source.start();
    }
  );

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
    fall: (big: boolean) => {
      tone(big ? 110 : 180, {
        bend: 0.7,
        length: 0.3,
        peak: 0.25,
        type: "triangle",
      });
      spray(900, 0.2, 0.25);

      for (let i = 0; i < 3; i += 1) {
        bell(
          784 * 2 ** (PENTATONIC[i + (big ? 2 : 0)] / 12),
          0.07,
          0.9,
          0.12 + i * 0.07
        );
      }
    },
    fire: (power: number) => {
      spray(1800 + power * 1200, 0.18 + power * 0.14, 0.08);
      tone(320 + power * 120, { bend: 2.2, length: 0.07, peak: 0.16 });
    },
    hit: (budged: boolean) => {
      tone(budged ? 260 : 150, {
        bend: 1.3,
        length: 0.12,
        peak: 0.22,
        type: "triangle",
      });
      spray(budged ? 1400 : 700, 0.12, 0.06);
    },
    miss: () => {
      spray(500, 0.1, 0.12);
    },
    mute,
    over: (level: number) => {
      for (const [i, step] of PENTATONIC.slice(0, 3 + level).entries()) {
        bell(523.25 * 2 ** (step / 12), 0.06, 1.2, i * 0.08);
      }
    },
    unlock,
  };
};
