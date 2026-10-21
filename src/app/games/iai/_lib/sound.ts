import { createAudio } from "../../_lib/audio";
import type { Fake } from "./duel";

export const createSound = () => {
  let air: { audio: AudioContext; gain: GainNode } | null = null;
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const wind = audio.createBufferSource();
      wind.buffer = noise;
      wind.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 420;
      band.Q.value = 0.7;
      const sweep = audio.createOscillator();
      sweep.frequency.value = 0.07;
      const depth = audio.createGain();
      depth.gain.value = 180;
      sweep.connect(depth).connect(band.frequency);
      const gain = audio.createGain();
      gain.gain.value = 0.05;
      wind.connect(band).connect(gain).connect(out);
      wind.start();
      sweep.start();
      air = { audio, gain };
    }
  );

  const hush = (level: number, ease: number) => {
    if (air) {
      air.gain.gain.setTargetAtTime(level, air.audio.currentTime, ease);
    }
  };

  return {
    close,
    cut: () => {
      tone(70, { at: 0.34, bend: 2.4, length: 0.5, peak: 0.24 });
      spray(320, 0.8, 0.5);
    },
    drum: () => {
      tone(88, { bend: 1.9, length: 0.7, peak: 0.26 });
      tone(176, { bend: 1.4, length: 0.25, peak: 0.06, type: "triangle" });
    },
    early: () => {
      tone(150, { bend: 0.7, length: 0.32, peak: 0.12, type: "triangle" });
      tone(112, {
        at: 0.12,
        bend: 0.8,
        length: 0.4,
        peak: 0.1,
        type: "triangle",
      });
    },
    fake: (kind: Fake) => {
      if (kind === "cat") {
        tone(720, { at: 0.9, bend: 0.75, length: 0.32, peak: 0.05 });
        tone(980, { at: 0.98, bend: 0.8, length: 0.22, peak: 0.03 });
      } else if (kind === "crow") {
        tone(520, {
          at: 0.5,
          bend: 1.3,
          length: 0.22,
          peak: 0.07,
          type: "sawtooth",
        });
        tone(470, {
          at: 0.8,
          bend: 1.3,
          length: 0.26,
          peak: 0.06,
          type: "sawtooth",
        });
      } else if (kind === "leaf") {
        spray(3800, 0.12, 0.3);
      } else {
        spray(700, 0.5, 1.2);
      }
    },
    mute,
    silence: () => {
      hush(0.008, 0.6);
    },
    still: () => {
      hush(0.05, 1.2);
    },
    strike: () => {
      spray(5200, 0.5, 0.14);
      tone(2400, { bend: 1.02, length: 0.6, peak: 0.07, type: "triangle" });
      tone(3620, { bend: 1.01, length: 0.42, peak: 0.04 });
      tone(5150, { bend: 1, length: 0.25, peak: 0.025 });
    },
    unlock,
    clear: () => {
      tone(392, { at: 0.9, bend: 1, length: 1.6, peak: 0.07 });
      tone(587, { at: 1.02, bend: 1, length: 1.4, peak: 0.05 });
    },
  };
};
