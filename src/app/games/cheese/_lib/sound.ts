import { createAudio } from "../../_lib/audio";

const SCALE = [0, 2, 4, 7, 9];

const note = (step: number) => {
  const octave = Math.floor(step / SCALE.length);
  const degree = SCALE[step - octave * SCALE.length] ?? 0;

  return 261.63 * 2 ** ((degree + 12 * octave) / 12);
};

interface Voices {
  audio: AudioContext;
  creak: OscillatorNode;
  band: BiquadFilterNode;
  stretch: GainNode;
  pad: GainNode;
}

export const createSound = () => {
  let voices: Voices | null = null;

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
      const creak = audio.createOscillator();
      creak.type = "sawtooth";
      creak.frequency.value = 90;
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 7;
      band.frequency.value = 500;
      const stretch = audio.createGain();
      stretch.gain.value = 0;
      creak.connect(band).connect(stretch).connect(out);
      creak.start();
      const pad = audio.createGain();
      pad.gain.value = 0;

      for (const frequency of [note(5), note(7), note(9)]) {
        const voice = audio.createOscillator();
        voice.frequency.value = frequency;
        voice.connect(pad);
        voice.start();
      }

      pad.connect(out);
      voices = { audio, band, creak, pad, stretch };
    }
  );

  const bell = (frequency: number, peak: number, length: number, at = 0) => {
    tone(frequency, { at, bend: 1, length, peak });
    tone(frequency * 2, { at, bend: 1, length: length * 0.5, peak: peak / 4 });
  };

  return {
    close,
    grab: () => {
      tone(150, { bend: 0.6, length: 0.16, peak: 0.08, type: "triangle" });
    },
    height: (index: number) => {
      bell(note(5 + index), 0.09, 1.1);
      bell(note(7 + index), 0.05, 1.1, 0.08);
    },
    moon: () => {
      for (const [i, step] of [5, 7, 9, 10, 12, 14, 15, 17].entries()) {
        bell(note(step), 0.1, 1.4, i * 0.11);
      }
    },
    mute,
    passed: () => {
      bell(note(15), 0.09, 0.9);
    },
    pull: (load: number, strain: number, sweet: boolean, moving: boolean) => {
      if (voices === null) {
        return;
      }

      const now = voices.audio.currentTime;
      const tense = Math.min(1.6, load);
      voices.creak.frequency.setTargetAtTime(
        70 + tense * 90 + strain * 160,
        now,
        0.05
      );
      voices.band.frequency.setTargetAtTime(
        380 + tense * 520 + strain * 1400,
        now,
        0.05
      );
      voices.stretch.gain.setTargetAtTime(
        moving ? 0.02 + Math.min(1, load) * 0.035 + strain * 0.05 : 0,
        now,
        0.06
      );
      voices.pad.gain.setTargetAtTime(sweet && moving ? 0.022 : 0, now, 0.25);
    },
    record: () => {
      for (const [i, step] of [7, 9, 10, 12, 14].entries()) {
        bell(note(step), 0.09, 0.9, 1.2 + i * 0.09);
      }
    },
    set: () => {
      tone(180, { bend: 1.4, length: 0.3, peak: 0.1, type: "triangle" });
      bell(note(2), 0.05, 1.2, 0.15);
      bell(note(0), 0.05, 1.4, 0.4);
    },
    snap: (left: number) => {
      spray(1600, 0.5, 0.09);
      tone(220 + left * 30, {
        bend: 2.4,
        length: 0.22,
        peak: 0.13,
        type: "triangle",
      });
      tone(90, { at: 0.05, bend: 1.8, length: 0.25, peak: 0.1 });
    },
    unlock,
  };
};
