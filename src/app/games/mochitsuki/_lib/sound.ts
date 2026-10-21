import { createAudio } from "../../_lib/audio";

const PENTATONIC = [0, 2, 4, 7, 9, 12];

export const createSound = () => {
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const fire = audio.createBufferSource();
      fire.buffer = noise;
      fire.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 420;
      const level = audio.createGain();
      level.gain.value = 0.07;
      fire.connect(low).connect(level).connect(out);
      fire.start();
    }
  );

  return {
    close,
    count: (last: boolean, at: number) => {
      tone(last ? 1320 : 990, {
        at,
        bend: 1,
        length: 0.09,
        peak: last ? 0.16 : 0.11,
      });
    },
    hand: () => {
      tone(620, { bend: 1.8, length: 0.22, peak: 0.16, type: "square" });
      tone(240, { bend: 2.4, length: 0.3, peak: 0.3, type: "triangle" });
      spray(3600, 0.6, 0.12);
    },
    miss: () => {
      tone(150, { bend: 0.7, length: 0.2, peak: 0.14, type: "triangle" });
    },
    mute,
    pound: (great: boolean) => {
      tone(64, { bend: 2.6, length: 0.26, peak: 0.5, type: "triangle" });
      tone(132, { bend: 1.8, length: 0.12, peak: great ? 0.22 : 0.12 });
      spray(520, great ? 0.6 : 0.42, 0.09);
    },
    rise: () => {
      for (const [i, step] of PENTATONIC.entries()) {
        tone(659.25 * 2 ** (step / 12), {
          at: i * 0.045,
          bend: 1,
          length: 0.5,
          peak: 0.05,
        });
      }
    },
    tick: (at: number) => {
      tone(1760, { at, bend: 1, length: 0.035, peak: 0.035 });
    },
    turn: (at: number) => {
      tone(380, { at, bend: 1.3, length: 0.06, peak: 0.07, type: "triangle" });
    },
    unlock,
  };
};
