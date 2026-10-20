import { createAudio } from "../../_lib/audio";

const SCALE = [0, 2, 4, 7, 9];
const GAP = 0.035;

const note = (step: number) => {
  const octave = Math.floor(step / SCALE.length);
  const degree = SCALE[step - octave * SCALE.length] ?? 0;
  return 293.66 * 2 ** ((degree + 12 * octave) / 12);
};

export const createSound = () => {
  let hiss: { audio: AudioContext; gain: GainNode } | null = null;
  let popped = 0;
  let awake = false;
  const { close, mute, spray, tone, unlock } = createAudio(
    (audio, out, noise) => {
      const night = audio.createBufferSource();
      night.buffer = noise;
      night.loop = true;
      const low = audio.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 280;
      const hush = audio.createGain();
      hush.gain.value = 0.025;
      night.connect(low).connect(hush).connect(out);
      night.start();
      const cricket = audio.createOscillator();
      cricket.frequency.value = 4300;
      const pulse = audio.createGain();
      pulse.gain.value = 0;
      const trill = audio.createOscillator();
      trill.frequency.value = 27;
      trill.connect(pulse.gain);
      const swell = audio.createGain();
      swell.gain.value = 0;
      const breath = audio.createOscillator();
      breath.frequency.value = 0.55;
      const depth = audio.createGain();
      depth.gain.value = 0.0035;
      breath.connect(depth).connect(swell.gain);
      cricket.connect(pulse).connect(swell).connect(out);
      for (const node of [cricket, trill, breath]) {
        node.start();
      }
      const fire = audio.createBufferSource();
      fire.buffer = noise;
      fire.loop = true;
      const band = audio.createBiquadFilter();
      band.type = "highpass";
      band.frequency.value = 2400;
      const gain = audio.createGain();
      gain.gain.value = 0;
      fire.connect(band).connect(gain).connect(out);
      fire.start();
      hiss = { audio, gain };
    }
  );

  const bell = (frequency: number, peak: number, length: number, at = 0) => {
    tone(frequency, { at, bend: 1, length, peak });
    tone(frequency * 2.76, {
      at,
      bend: 1,
      length: length * 0.4,
      peak: peak / 3,
    });
  };

  return {
    close,
    crackle: (count: number, loud: number) => {
      const now = performance.now() / 1000;
      if (!awake || count === 0 || now - popped < GAP) {
        return;
      }
      popped = now;
      spray(
        2600 + Math.random() * 3800,
        loud * Math.min(0.5, 0.12 + count * 0.04),
        0.025 + Math.random() * 0.04
      );
    },
    drop: () => {
      tone(110, { at: 0.18, bend: 1.8, length: 0.22, peak: 0.12 });
      spray(900, 0.7, 0.55);
    },
    ignite: () => {
      spray(3200, 0.45, 0.4);
      tone(196, { bend: 2.2, length: 0.3, peak: 0.05, type: "triangle" });
    },
    level: (level: number) => {
      if (hiss) {
        hiss.gain.gain.setTargetAtTime(
          level * 0.05,
          hiss.audio.currentTime,
          0.12
        );
      }
    },
    mute,
    out: () => {
      for (const [i, step] of [9, 7, 5, 4, 2].entries()) {
        bell(note(step), 0.07, 1.6, 0.1 + i * 0.22);
      }
    },
    passed: () => {
      bell(note(12), 0.08, 0.9);
    },
    phase: (phase: number) => {
      bell(note(4 + phase), 0.035, 1.4);
    },
    record: () => {
      for (const [i, step] of [5, 7, 9, 10, 12, 15].entries()) {
        bell(note(step), 0.1, 0.9, 1.4 + i * 0.09);
      }
    },
    unlock: () => {
      awake = true;
      unlock();
    },
  };
};
