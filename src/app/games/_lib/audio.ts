const VOLUME = 0.8;

interface ToneOptions {
  at?: number;
  bend?: number;
  length?: number;
  peak?: number;
  type?: OscillatorType;
}

type Ambience = (
  audio: AudioContext,
  out: GainNode,
  noise: AudioBuffer
) => void;

const wake = async (audio: AudioContext) => {
  try {
    await audio.resume();

    return true;
  } catch {
    return false;
  }
};

export const createAudio = (ambience?: Ambience) => {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;

  const ready = () => {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(context.destination);
      noise = context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate
      );
      const data = noise.getChannelData(0);
      let last = 0;

      for (let i = 0; i < data.length; i += 1) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
      }

      ambience?.(context, master, noise);
    }

    return context.state === "closed" ? null : context;
  };

  const tone = (
    frequency: number,
    {
      at = 0,
      bend = 1.6,
      length = 0.18,
      peak = 0.22,
      type = "sine",
    }: ToneOptions
  ) => {
    const audio = ready();

    if (!audio || !master) {
      return;
    }

    const start = audio.currentTime + at;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency * bend, start);
    osc.frequency.exponentialRampToValueAtTime(frequency, start + 0.05);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.02);
  };

  const spray = (center: number, peak: number, length: number) => {
    const audio = ready();

    if (!audio || !master || !noise) {
      return;
    }

    const source = audio.createBufferSource();
    source.buffer = noise;
    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = center;
    const gain = audio.createGain();
    const start = audio.currentTime;
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(band).connect(gain).connect(master);
    source.start(start, Math.random());
    source.stop(start + length + 0.02);
  };

  return {
    close: () => {
      void context?.close();
    },
    mute: (next: boolean) => {
      muted = next;

      if (context && master) {
        master.gain.setTargetAtTime(
          next ? 0 : VOLUME,
          context.currentTime,
          0.05
        );
      }
    },
    spray,
    tone,
    unlock: () => {
      const audio = ready();

      if (audio) {
        void wake(audio);
      }
    },
  };
};
