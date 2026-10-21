import { createAudio } from "../../_lib/audio";

const CHIME = [659.25, 523.25, 587.33, 392];

export const createSound = () => {
  let slide: GainNode | null = null;
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 700;
      band.Q.value = 0.8;
      slide = audio.createGain();
      slide.gain.value = 0;
      source.connect(band).connect(slide).connect(out);
      const hush = audio.createBiquadFilter();
      hush.type = "lowpass";
      hush.frequency.value = 380;
      const room = audio.createGain();
      room.gain.value = 0.05;
      source.connect(hush).connect(room).connect(out);
      source.start();
    }
  );

  const bell = (frequency: number, at: number, peak: number) => {
    tone(frequency, { at, bend: 1, length: 1.4, peak });
    tone(frequency * 2.01, { at, bend: 1, length: 0.6, peak: peak / 4 });
    tone(frequency * 3.02, { at, bend: 1, length: 0.3, peak: peak / 9 });
  };

  return {
    clack: (strength: number, pitch: number) => {
      const level = Math.min(1, strength / 240);
      if (level < 0.04) {
        return;
      }
      tone(1150 + pitch * 380, {
        bend: 1.12,
        length: 0.05,
        peak: 0.05 + level * 0.18,
        type: "triangle",
      });
      spray(2600 + pitch * 900, 0.12 + level * 0.4, 0.05);
    },
    close,
    flick: (power: number) => {
      spray(3800, 0.35 + power * 0.4, 0.04);
      tone(1800, { bend: 1.5, length: 0.04, peak: 0.12, type: "square" });
    },
    floor: () => {
      tone(110, {
        at: 0.32,
        bend: 1.8,
        length: 0.22,
        peak: 0.22,
        type: "triangle",
      });
      spray(500, 0.4, 0.12);
    },
    gutter: () => {
      tone(392, { bend: 1, length: 0.35, peak: 0.08, type: "triangle" });
      tone(330, {
        at: 0.18,
        bend: 1,
        length: 0.5,
        peak: 0.07,
        type: "triangle",
      });
    },
    mute,
    place: (index: number) => {
      tone(900 + index * 30, {
        bend: 1.1,
        length: 0.04,
        peak: 0.06,
        type: "triangle",
      });
      spray(2200, 0.1, 0.03);
    },
    slide: (speed: number) => {
      slide?.gain.setTargetAtTime(
        Math.min(0.32, speed / 1400),
        slide.context.currentTime,
        0.04
      );
    },
    spare: () => {
      bell(CHIME[1], 0, 0.06);
      bell(CHIME[0], 0.16, 0.07);
    },
    strike: (run: number) => {
      const notes = run >= 3 ? [...CHIME, ...CHIME.toReversed()] : CHIME;
      for (const [i, note] of notes.entries()) {
        bell(note, i * 0.17, 0.065);
      }
    },
    thud: (strength: number) => {
      tone(240, {
        bend: 1.4,
        length: 0.08,
        peak: Math.min(0.16, 0.04 + strength / 900),
        type: "triangle",
      });
    },
    unlock,
  };
};
