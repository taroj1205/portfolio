import { createAudio } from "../../_lib/audio";

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16];

export const createSound = () => {
  let wind: {
    audio: AudioContext;
    band: BiquadFilterNode;
    gain: GainNode;
  } | null = null;
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "lowpass";
      band.frequency.value = 420;
      const gain = audio.createGain();
      gain.gain.value = 0;
      source.connect(band).connect(gain).connect(out);
      source.start();
      wind = { audio, band, gain };
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
    tone(frequency * 5.15, {
      at,
      bend: 1,
      length: length * 0.2,
      peak: peak / 7,
    });
  };

  return {
    clack: () => {
      tone(1650, { bend: 1.15, length: 0.07, peak: 0.2, type: "triangle" });
      tone(820, { bend: 1.3, length: 0.1, peak: 0.08, type: "square" });
      spray(2600, 0.5, 0.05);
    },
    close,
    hush: () => {
      spray(1400, 0.06, 0.7);
    },
    mute,
    nudge: () => {
      tone(240, { bend: 1.3, length: 0.1, peak: 0.05, type: "triangle" });
    },
    perfect: () => {
      for (const [i, step] of PENTATONIC.entries()) {
        bell(523.25 * 2 ** (step / 12), 0.08, 1.8, 0.1 + i * 0.08);
      }
      bell(261.63, 0.12, 2.6, 0.1);
    },
    reveal: (level: number) => {
      bell(440 * 2 ** ((PENTATONIC[level] ?? 0) / 12), 0.1, 1.6);
    },
    strike: () => {
      bell(880, 0.14, 2.2);
    },
    unlock,
    wind: (level: number) => {
      if (wind) {
        const { audio, band, gain } = wind;
        gain.gain.setTargetAtTime(0.03 + level * 0.09, audio.currentTime, 0.4);
        band.frequency.setTargetAtTime(
          300 + level * 500,
          audio.currentTime,
          0.4
        );
      }
    },
  };
};
