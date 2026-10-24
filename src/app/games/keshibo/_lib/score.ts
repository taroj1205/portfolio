const FRAMES = 10;
export const PERFECT = 300;
export const ALL = 10;

interface Roll {
  pins: number;
  frame: number;
  strike: boolean;
  spare: boolean;
}

interface Walk {
  full: boolean;
  rolls: Roll[];
  frame: number;
  standing: number;
}

const walk = (pinfall: readonly number[]): Walk | null => {
  const rolls: Roll[] = [];
  let frame = 0;
  let thrown = 0;
  let clears = 0;
  let standing = ALL;
  let full = true;

  for (const pins of pinfall) {
    if (
      frame >= FRAMES ||
      !Number.isInteger(pins) ||
      pins < 0 ||
      pins > standing
    ) {
      return null;
    }

    rolls.push({
      frame,
      pins,
      spare: !full && pins === standing,
      strike: full && pins === ALL,
    });
    standing -= pins;
    thrown += 1;
    full = standing === 0;

    if (full) {
      clears += 1;
      standing = ALL;
    }

    const done =
      frame === FRAMES - 1
        ? thrown === 3 || (thrown === 2 && clears === 0)
        : clears > 0 || thrown === 2;

    if (done) {
      frame += 1;
      thrown = 0;
      clears = 0;
      standing = ALL;
      full = true;
    }
  }

  return { frame, full, rolls, standing };
};

export interface Frame {
  marks: string[];
  total: number | null;
}

const markOf = (roll: Roll) => {
  if (roll.strike) {
    return "X";
  }

  if (roll.spare) {
    return "/";
  }

  return roll.pins === 0 ? "-" : String(roll.pins);
};

const bonusOf = (rolls: Roll[], index: number) => {
  const roll = rolls[index];

  if (roll.frame === FRAMES - 1 || !(roll.strike || roll.spare)) {
    return 0;
  }

  const extra = rolls.slice(index + 1, index + (roll.strike ? 3 : 2));

  return extra.length === (roll.strike ? 2 : 1)
    ? extra.reduce((total, next) => total + next.pins, 0)
    : null;
};

export const framesOf = (pinfall: readonly number[]): Frame[] => {
  const walked = walk(pinfall);

  if (walked === null) {
    return [];
  }

  const frames: Frame[] = [];
  let running: number | null = 0;

  for (let f = 0; f < FRAMES; f += 1) {
    const inFrame = walked.rolls
      .map((roll, index) => ({ index, roll }))
      .filter(({ roll }) => roll.frame === f);

    if (inFrame.length === 0) {
      break;
    }

    const marks = inFrame.map(({ roll }) => markOf(roll));
    const finished = walked.frame > f;
    let value: number | null = finished ? 0 : null;

    for (const { roll, index } of inFrame) {
      const bonus = bonusOf(walked.rolls, index);
      value =
        value === null || bonus === null ? null : value + roll.pins + bonus;
    }

    running = running === null || value === null ? null : running + value;
    frames.push({
      marks: f < FRAMES - 1 && marks[0] === "X" ? ["", "X"] : marks,
      total: running,
    });
  }

  return frames;
};

export const scoreOf = (pinfall: readonly number[]) =>
  framesOf(pinfall).findLast((frame) => frame.total !== null)?.total ?? 0;

export const isValidGame = (pinfall: readonly number[]) =>
  walk(pinfall)?.frame === FRAMES;

export const stateOf = (pinfall: readonly number[]) => {
  const walked = walk(pinfall);

  return {
    frame: Math.min(FRAMES - 1, walked?.frame ?? 0),
    fresh: walked?.full ?? true,
    over: walked?.frame === FRAMES,
  };
};

export interface Tally {
  strikes: number;
  spares: number;
  pins: number;
  misses: number;
  streak: number;
}

export const tallyOf = (pinfall: readonly number[]): Tally => {
  const rolls = walk(pinfall)?.rolls ?? [];
  let streak = 0;
  let run = 0;

  for (const roll of rolls) {
    run = roll.strike ? run + 1 : 0;
    streak = Math.max(streak, run);
  }

  return {
    misses: rolls.filter((roll) => roll.pins === 0).length,
    pins: rolls.reduce((total, roll) => total + roll.pins, 0),
    spares: rolls.filter((roll) => roll.spare).length,
    streak,
    strikes: rolls.filter((roll) => roll.strike).length,
  };
};

export const lastCall = (pinfall: readonly number[]) => {
  const rolls = walk(pinfall)?.rolls ?? [];
  const last = rolls.at(-1);

  if (last === undefined) {
    return null;
  }

  if (last.strike) {
    let run = 0;

    for (const roll of rolls.toReversed()) {
      if (!roll.strike) {
        break;
      }

      run += 1;
    }

    return { kind: "strike" as const, run };
  }

  if (last.spare) {
    return { kind: "spare" as const, run: 0 };
  }

  return last.pins === 0 ? { kind: "miss" as const, run: 0 } : null;
};

export const frameSlots = Array.from({ length: FRAMES }, (_, index) => ({
  boxes: index === FRAMES - 1 ? [0, 1, 2] : [0, 1],
  index,
  last: index === FRAMES - 1,
}));
