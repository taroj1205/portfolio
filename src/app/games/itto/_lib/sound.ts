import { createAudio } from "../../_lib/audio";
import { errorOf } from "./cut";

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const room = audio.createBufferSource();
      room.buffer = noise;
      room.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 260;
      const gain = audio.createGain();
      gain.gain.value = 0.02;
      room.connect(low).connect(gain).connect(out);
      room.start();
    }
  );

  return {
    close,
    cut: (small: number) => {
      spray(5200, 0.3, 0.09);
      spray(2400, 0.22, 0.16);
      tone(150, {
        at: 0.05,
        bend: 2.2,
        length: 0.16,
        peak: 0.32,
        type: "triangle",
      });
      tone(92, { at: 0.05, bend: 1.5, length: 0.22, peak: 0.18 });
      const error = errorOf(small);

      if (error === 0) {
        tone(1047, { at: 0.32, bend: 1, length: 1.6, peak: 0.08 });
        tone(1568, { at: 0.44, bend: 1, length: 1.4, peak: 0.06 });
        tone(2093, { at: 0.56, bend: 1, length: 1.2, peak: 0.04 });
      } else if (error <= 10) {
        tone(784, { at: 0.32, bend: 1, length: 1.1, peak: 0.07 });
        tone(1175, { at: 0.42, bend: 1, length: 0.9, peak: 0.04 });
      } else if (error > 80) {
        tone(196, {
          at: 0.3,
          bend: 1.25,
          length: 0.32,
          peak: 0.08,
          type: "triangle",
        });
        tone(147, {
          at: 0.48,
          bend: 1.25,
          length: 0.45,
          peak: 0.08,
          type: "triangle",
        });
      }
    },
    fumble: () => {
      spray(1800, 0.12, 0.18);
      tone(220, { bend: 1.4, length: 0.12, peak: 0.05, type: "triangle" });
    },
    mute,
    nick: () => {
      spray(4200, 0.18, 0.08);
      tone(320, {
        at: 0.03,
        bend: 1.6,
        length: 0.1,
        peak: 0.08,
        type: "triangle",
      });
    },
    unlock,
  };
};
