import { createAudio } from "../../_lib/audio";
import type { Bottle } from "./pour";

const glugPitch: Record<Bottle, number> = {
  isshobin: 150,
  katakuchi: 420,
  tokkuri: 290,
};

export const createSound = () => {
  let pour: { audio: AudioContext; gain: GainNode } | null = null;
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const room = audio.createBufferSource();
      room.buffer = noise;
      room.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 320;
      const hush = audio.createGain();
      hush.gain.value = 0.03;
      room.connect(low).connect(hush).connect(out);
      room.start();
      const stream = audio.createBufferSource();
      stream.buffer = noise;
      stream.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1400;
      band.Q.value = 0.8;
      const gain = audio.createGain();
      gain.gain.value = 0;
      stream.connect(band).connect(gain).connect(out);
      stream.start();
      pour = { audio, gain };
    }
  );

  return {
    close,
    flow: (level: number) => {
      if (pour) {
        pour.gain.gain.setTargetAtTime(
          Math.min(1.5, level) * 0.11,
          pour.audio.currentTime,
          0.03
        );
      }
    },
    glug: (bottle: Bottle, depth: number) => {
      const pitch = glugPitch[bottle] * (0.94 + Math.random() * 0.12);
      tone(pitch, { bend: 0.55, length: 0.11, peak: 0.05 + depth * 0.16 });
      spray(900 + Math.random() * 500, 0.05 + depth * 0.1, 0.06);
    },
    mute,
    record: () => {
      for (const [i, step] of [0, 4, 7, 12].entries()) {
        tone(523.25 * 2 ** (step / 12), {
          at: 0.5 + i * 0.09,
          bend: 1,
          length: 0.9,
          peak: 0.07,
        });
      }
    },
    settle: (tenths: number) => {
      tone(620, { bend: 1, length: 0.12, peak: 0.08, type: "triangle" });
      if (tenths >= 900) {
        tone(1046.5, { at: 0.12, bend: 1, length: 1.2, peak: 0.06 });
        tone(1568, { at: 0.2, bend: 1, length: 1, peak: 0.035 });
      }
    },
    spill: () => {
      spray(700, 0.55, 0.7);
      spray(2600, 0.25, 0.35);
      tone(96, { bend: 1.6, length: 0.3, peak: 0.12 });
    },
    unlock,
  };
};
