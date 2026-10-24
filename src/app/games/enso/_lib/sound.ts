import { createAudio } from "../../_lib/audio";

export const createSound = () => {
  let swish: GainNode | null = null;

  const { close, mute, tone, unlock } = createAudio((audio, out, noise) => {
    const source = audio.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1400;
    band.Q.value = 0.6;
    swish = audio.createGain();
    swish.gain.value = 0;
    source.connect(band).connect(swish).connect(out);
    source.start();
  });

  const bell = (frequency: number, peak: number, at: number) => {
    tone(frequency, { at, bend: 1, length: 2.6, peak });
    tone(frequency * 2.76, { at, bend: 1, length: 1.2, peak: peak / 3 });
    tone(frequency * 5.4, { at, bend: 1, length: 0.5, peak: peak / 6 });
  };

  return {
    brush: (speed: number) => {
      swish?.gain.setTargetAtTime(
        Math.min(0.9, speed * 0.25),
        swish.context.currentTime,
        0.05
      );
    },
    close,
    mute,
    ring: (score: number, record: boolean) => {
      bell(392 + score * 1.6, 0.16, 0);

      if (record) {
        bell(784 + score * 3.2, 0.1, 0.32);
      }
    },
    tap: () => {
      tone(220, { bend: 1.4, length: 0.12, peak: 0.05, type: "triangle" });
    },
    unlock,
  };
};
