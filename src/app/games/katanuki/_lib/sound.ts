import { createAudio } from "../../_lib/audio";

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16];

export const createSound = () => {
  let scrape: GainNode | null = null;

  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 3200;
      band.Q.value = 1.4;
      scrape = audio.createGain();
      scrape.gain.value = 0;
      source.connect(band).connect(scrape).connect(out);
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
    crack: (level: number) => {
      tone(2400 - level * 300, {
        bend: 1.4,
        length: 0.05,
        peak: 0.12,
        type: "square",
      });
      spray(4200, 0.25 + level * 0.12, 0.06);
    },
    clear: () => {
      for (const [i, step] of PENTATONIC.entries()) {
        bell(523.25 * 2 ** (step / 12), 0.07, 1.6, 0.05 + i * 0.07);
      }
    },
    mute,
    scrape: (speed: number) => {
      scrape?.gain.setTargetAtTime(
        Math.min(0.5, speed * 1.4),
        scrape.context.currentTime,
        0.03
      );
    },
    shatter: () => {
      tone(90, { bend: 2.2, length: 0.35, peak: 0.3, type: "triangle" });
      spray(1800, 0.9, 0.25);
      spray(5200, 0.6, 0.12);
      tone(1900, { bend: 1.6, length: 0.06, peak: 0.12, type: "square" });
    },
    unlock,
  };
};
