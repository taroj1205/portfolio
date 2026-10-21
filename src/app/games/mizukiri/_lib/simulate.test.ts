import assert from "node:assert/strict";

import { describe, test, vi } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { careerOf, careerShare, describeCareer, readCareer } from "./career";
import { combos, comboOf, stoneFrom } from "./cosmetics";
import {
  earn,
  foundOf,
  noGear,
  peaksOf,
  perksNote,
  pointsLeft as pointsToTrain,
  progressOf,
  spend,
  statsOf,
  traitsOf as journeyTraits,
} from "./journey";
import {
  describe as storyOf,
  journeyTag,
  queryOf,
  readResult,
  resultOf,
  shareOf,
} from "./result";
import {
  loadProfiles,
  seen,
  settle,
  viewOf,
  wear,
  wearCombo,
  withView,
} from "./save";
import type { DuelSave, JourneySave } from "./save";
import {
  areaOf,
  createRiver,
  isBounce,
  isLate,
  land,
  launch,
  nextContact,
  propsIn,
  plain,
  randomFrom,
  qualityOf,
  shoreAt,
  speedAt,
  stoneAt,
  surgeTier,
  surges,
  topSpeed,
  windowFor,
  zoneIndex,
  zones,
} from "./simulate";
import type { Flight } from "./simulate";
import {
  LIMIT,
  axes,
  flatTuning,
  noteOf,
  pointsLeft,
  scoreOf,
  traitsOf,
  tune,
  tuningCode,
  tuningFrom,
} from "./tuning";
import type { Axis, Tuning } from "./tuning";

const riverStone = { color: "river", form: "oval" };
const fast = journeyTraits(
  { focus: 0, impact: 0, lift: 6, power: 40, stone: 10 },
  riverStone
);
const bouncy = journeyTraits(
  { focus: 3, impact: 3, lift: 8, power: 6, stone: 4 },
  riverStone
);
const flat = { aim: 0, speed: 14, tilt: 20 };
const full = { aim: 0, speed: 16, tilt: 20 };

const qualityAt = (tilt: number) => qualityOf({ aim: 0, speed: 16, tilt });

const play = (flight: Flight, lead: number | null, throws = 400) => {
  for (
    let contact = nextContact(flight), n = 0;
    contact !== null && n < throws;
    contact = nextContact(flight), n += 1
  ) {
    land(flight, lead === null ? null : contact - lead);
  }
  return flight;
};

const steadyHands = (seed: number, spread: number, throws: number) => {
  const flight = launch(createRiver(seed), full);
  const random = randomFrom(seed);
  for (
    let contact = nextContact(flight), n = 0;
    contact !== null && n < throws;
    contact = nextContact(flight), n += 1
  ) {
    const lead =
      0.01 +
      spread *
        Math.sqrt(-2 * Math.log(1 - random())) *
        Math.cos(2 * Math.PI * random());
    land(flight, lead > 0 ? contact - lead : null);
  }
  return flight;
};

const farthest = (flight: Flight) =>
  Math.max(flight.distance, flight.hops.at(-1)?.from.z ?? 0);

const streakAfter = (lead: number | null) => {
  const flight = launch(createRiver(3), full);
  const contact = nextContact(flight);
  assert.ok(contact !== null);
  flight.streak = 10;
  land(flight, lead === null ? null : contact - lead);
  assert.equal(flight.pending, null);
  return flight.streak;
};

const paceAfter = (streak: number) => {
  const flight = launch(createRiver(3), full);
  const contact = nextContact(flight);
  assert.ok(contact !== null);
  flight.streak = streak;
  land(flight, contact - 0.01);
  const hop = flight.hops.at(-1);
  return Math.hypot(hop?.velocity.x ?? 0, hop?.velocity.z ?? 0);
};

const reachOf = (spread: number) =>
  [1, 2, 3].map((seed) => farthest(steadyHands(seed, spread, 450)));

const totalOf = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

const strike = (seed: number, lead: number | null) => {
  const flight = launch(createRiver(seed), flat);
  const contact = nextContact(flight);
  if (flight.pending === null || contact === null) {
    return null;
  }
  land(flight, lead === null ? null : contact - lead);
  const speed = Math.hypot(
    flight.hops[1]?.velocity.x ?? 0,
    flight.hops[1]?.velocity.z ?? 0
  );
  return { grade: flight.splashes.at(-1)?.grade, speed };
};

const perfectAt = (focus: number) =>
  windowFor(launch(createRiver(3), flat, traitsOf({ ...flatTuning, focus })))
    .perfect;

const distanceWith = (speed: number, keep: number) => {
  const traits = traitsOf({ ...flatTuning, keep, speed });
  let total = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    total += play(launch(createRiver(seed), flat, traits), null).distance;
  }
  return total;
};

const averageDistance = (entry: Tuning, jitter: number) => {
  const traits = traitsOf(entry);
  let total = 0;
  for (let seed = 1; seed <= 8; seed += 1) {
    const flight = launch(createRiver(seed), flat, traits);
    for (
      let contact = nextContact(flight), n = 1;
      contact !== null && n <= 250;
      contact = nextContact(flight), n += 1
    ) {
      const wobble = jitter * Math.sin(seed * 12.9898 + n * 78.233);
      land(flight, contact - (0.03 + wobble));
    }
    total += farthest(flight);
  }
  return total / 8;
};

const repeat = (entry: Tuning, key: Axis, by: 1 | -1, times: number) => {
  let next: Tuning | null = entry;
  for (let i = 0; i < times && next !== null; i += 1) {
    next = tune(next, key, by);
  }
  return next;
};

describe("flight", () => {
  test("the same river, throw and taps always play out the same way", () => {
    const river = createRiver(7);
    assert.deepEqual(
      play(launch(river, flat), 0.03),
      play(launch(river, flat), 0.03)
    );
  });

  test("tapping right before each touch goes much farther than not tapping", () => {
    const river = createRiver(11);
    const idle = play(launch(river, flat), null);
    const timed = play(launch(river, flat), 0.03);
    assert.ok(timed.distance > idle.distance * 2);
    assert.ok(timed.bestCombo > 5);
  });

  test("tapping too early counts as early and breaks the combo", () => {
    const flight = launch(createRiver(3), flat);
    const contact = nextContact(flight);
    assert.ok(contact !== null);
    land(flight, contact - 0.5);
    assert.equal(flight.splashes.at(-1)?.grade, "early");
    assert.equal(flight.combo, 0);
  });

  test("missing a bounce keeps the combo while a good tap still adds to it", () => {
    let checked = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      for (const lead of [null, 0.5, 0.01]) {
        const flight = launch(createRiver(seed), flat);
        const contact = nextContact(flight);
        if (flight.pending !== null && contact !== null) {
          flight.combo = 4;
          land(flight, lead === null ? null : contact - lead);
          const grade = flight.splashes.at(-1)?.grade;
          const hit = grade === "perfect" || grade === "good";
          assert.equal(flight.combo, hit ? 5 : 4);
          checked += 1;
        }
      }
    }
    assert.ok(checked > 0);
  });

  test("a tap just after a touch is late for it, not early for the next", () => {
    const flight = launch(createRiver(3), flat);
    const landedAt = nextContact(flight);
    assert.ok(landedAt !== null);
    land(flight, null);
    const next = nextContact(flight);
    assert.ok(next !== null);
    const grace = windowFor(flight).good;
    assert.equal(isLate(flight, landedAt, landedAt + grace / 2), true);
    assert.equal(isLate(flight, landedAt, landedAt + grace * 2), false);
    assert.equal(isLate(flight, landedAt, next - 0.01), false);
  });

  test("every focus step widens the tap window", () => {
    assert.ok(perfectAt(0) >= 0.09);
    for (let focus = -LIMIT + 1; focus <= LIMIT; focus += 1) {
      assert.ok(perfectAt(focus) > perfectAt(focus - 1));
    }
  });

  test("a tap before a duck or rock is graded like a touch, and bends the bounce", () => {
    let struck = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      const perfect = strike(seed, 0.01);
      if (perfect === null) {
        continue;
      }
      struck += 1;
      const early = strike(seed, 0.5);
      const idle = strike(seed, null);
      assert.equal(perfect.grade, "perfect");
      assert.equal(early?.grade, "early");
      assert.equal(idle?.grade, "miss");
      assert.ok(perfect.speed > (early?.speed ?? Number.POSITIVE_INFINITY));
    }
    assert.ok(struck > 0);
  });

  test("a well-timed run keeps getting faster and hopping higher with no ceiling", () => {
    let pastOldCap = false;
    let highest = 0;
    let longest = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const flight = play(launch(createRiver(seed), flat), 0.03);
      for (const hop of flight.hops) {
        const speed = Math.hypot(hop.velocity.x, hop.velocity.z);
        pastOldCap ||= speed > flight.top * 1.6;
        highest = Math.max(highest, hop.velocity.y);
        longest = Math.max(longest, hop.end - hop.start);
      }
    }
    assert.ok(pastOldCap);
    assert.ok(highest > 15);
    assert.ok(longest > 1.5);
  });

  test("a skim on the water stays low at any speed", () => {
    let checked = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, fast), 0.03);
      for (const splash of flight.splashes) {
        const hop = flight.hops.find((h) => h.start === splash.time);
        if (splash.grade !== null && splash.event === null && hop) {
          assert.ok(hop.velocity.y <= 4.5 * 1.11);
          checked += 1;
        }
      }
    }
    assert.ok(checked > 100);
  });

  test("hitting something kicks the stone up harder the faster it was going", () => {
    let kicked = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, fast), 0.03);
      for (const bump of flight.bumps) {
        const before = flight.hops.find((h) => h.end === bump.time);
        const after = flight.hops.find((h) => h.start === bump.time);
        if (!isBounce(bump.kind) || !before || !after) {
          continue;
        }
        const speed = Math.hypot(before.velocity.x, before.velocity.z);
        assert.ok(
          after.velocity.y >=
            2.5 * Math.max(1, Math.sqrt(speed / flight.top)) - 1e-9
        );
        if (speed > 1.5 * flight.top) {
          kicked += 1;
        }
      }
    }
    assert.ok(kicked > 0);
  });

  test("bounces and perfect taps cannot run the speed past twice the top surge", () => {
    let fastest = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, bouncy), 0.03, 80);
      for (const hop of flight.hops) {
        fastest = Math.max(fastest, Math.hypot(hop.velocity.x, hop.velocity.z));
      }
    }
    assert.ok(fastest > 1000);
    assert.ok(fastest < (surges.at(-1)?.ceiling ?? 0) * 2);
  });

  test("a bounce does not count as a skip", () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const flight = play(launch(createRiver(seed), flat), 0.03);
      const bounces = flight.bumps.filter((bump) => isBounce(bump.kind)).length;
      assert.equal(
        flight.splashes.filter((splash) => splash.grade !== null).length,
        flight.skips + bounces
      );
    }
  });

  test("a steep throw sinks sooner than a flat one", () => {
    const river = createRiver(5);
    assert.ok(
      play(launch(river, flat), null).skips >
        play(launch(river, { ...flat, tilt: 45 }), null).skips
    );
  });

  test("a limp throw sinks without skipping", () => {
    const flight = play(launch(createRiver(3), { ...flat, speed: 2 }), null);
    assert.equal(flight.ending, "plop");
    assert.equal(flight.skips, 0);
  });

  test("ducks and rocks launch the stone instead of stopping it", () => {
    let bumped = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const flight = play(launch(createRiver(seed), flat), 0.03);
      for (const bump of flight.bumps) {
        if (bump.kind === "duck" || bump.kind === "rock") {
          bumped += 1;
          const after = flight.hops.find(
            (hop) => hop.start === bump.time && hop.end > hop.start
          );
          assert.ok(after);
          assert.ok(after.velocity.y > 3);
        }
      }
      assert.ok(flight.ending === "sink" || flight.ending === "leaf");
    }
    assert.ok(bumped > 0);
  });

  test("dragonflies push the stone faster in mid-air without touching the water", () => {
    let caught = 0;
    for (let seed = 1; seed <= 120; seed += 1) {
      const flight = play(launch(createRiver(seed), flat), 0.03);
      for (const bump of flight.bumps) {
        if (bump.kind !== "dragonfly" || bump.prop === null) {
          continue;
        }
        caught += 1;
        assert.ok(bump.at.y > 0);
        assert.ok(Math.abs(bump.at.y - bump.prop.y) < 0.3);
        const before = flight.hops.find((hop) => hop.end === bump.time);
        const after = flight.hops.find((hop) => hop.start === bump.time);
        assert.ok(before && after);
        const speedBefore = Math.hypot(before.velocity.x, before.velocity.z);
        if (speedBefore < flight.top) {
          assert.ok(
            Math.hypot(after.velocity.x, after.velocity.z) > speedBefore
          );
        }
        const splash = flight.splashes.find(
          (s) => s.event === "dragonfly" && s.time === bump.time
        );
        assert.equal(splash?.y, bump.prop.y);
        assert.notEqual(splash?.grade ?? null, null);
      }
    }
    assert.ok(caught > 0);
  });

  test("dragonflies fly low and high, and bouncy stones often catch high ones", () => {
    const heights = propsIn(createRiver(4), 0, 3000)
      .filter((prop) => prop.kind === "dragonfly")
      .map((prop) => prop.y);
    assert.ok(heights.some((y) => y < 0.5));
    assert.ok(heights.some((y) => y >= 0.7));
    let caught = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, bouncy), 0.03, 40);
      caught += flight.bumps.filter(
        (bump) => bump.kind === "dragonfly" && (bump.prop?.y ?? 0) >= 0.7
      ).length;
    }
    assert.ok(caught >= 40);
  });

  test("a throw aimed at the bank bounces off it and stays in the river", () => {
    const river = createRiver(19);
    const flight = play(
      launch(
        river,
        { ...flat, aim: 0.1 },
        {
          ...plain,
          focus: 1.2,
          keep: 0.03,
          speed: 2.2,
        }
      ),
      0.03,
      60
    );
    assert.ok(flight.bumps.some((bump) => bump.kind === "wall"));
    for (const hop of flight.hops) {
      for (let k = 0; k < 10; k += 1) {
        const at = stoneAt(
          flight,
          hop.start + ((hop.end - hop.start) * k) / 10
        );
        assert.ok(at);
        assert.ok(Math.abs(at.x) <= shoreAt(river, at.z));
      }
    }
  });

  test("the stone touches the water at every skip and never jumps", () => {
    const flight = play(launch(createRiver(13), flat), 0.03);
    for (const splash of flight.splashes.filter(
      (s) => s.grade !== null && !isBounce(s.event)
    )) {
      const before = stoneAt(flight, splash.time - 1e-6);
      assert.ok(before);
      assert.ok(Math.abs(before.y) < 1e-3);
      assert.ok(Math.abs(before.z - splash.z) < 1e-3);
    }
  });

  test("a faster, grittier tuning goes farther than a slower, looser one", () => {
    assert.ok(distanceWith(LIMIT, LIMIT) > distanceWith(0, 0));
    assert.ok(distanceWith(0, 0) > distanceWith(-LIMIT, -LIMIT));
  });

  test("the river keeps generating things to hit far downstream", () => {
    const river = createRiver(21);
    assert.ok(propsIn(river, 50_000, 50_300).length > 0);
    assert.deepEqual(propsIn(river, 900, 960), propsIn(river, 900, 960));
  });

  test("the tap window stops narrowing so a long run stays playable", () => {
    const flight = steadyHands(5, 0.005, 150);
    assert.ok(flight.skips > 60);
    assert.ok(Math.abs(windowFor(flight).perfect - 0.09 / 3.6) < 1e-9);
    assert.ok(Math.abs(windowFor(flight).good - 0.22 / 3.6) < 1e-9);
  });

  test("a perfect tap adds to the streak, a good one halves it and anything else ends it", () => {
    assert.equal(streakAfter(0.01), 11);
    assert.equal(streakAfter(0.15), 5);
    assert.equal(streakAfter(0.5), 0);
    assert.equal(streakAfter(null), 0);
  });

  test("missing a duck or rock keeps the streak", () => {
    let checked = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const flight = launch(createRiver(seed), full);
      if (flight.pending !== null) {
        flight.streak = 7;
        land(flight, null);
        assert.equal(flight.streak, 7);
        checked += 1;
      }
    }
    assert.ok(checked > 0);
  });

  test("a streak makes each perfect tap speed the stone up more", () => {
    assert.ok(surgeTier(4) === 0 && surgeTier(5) === 1);
    assert.ok(paceAfter(4) > paceAfter(0) * 1.04);
    assert.ok(paceAfter(11) > paceAfter(4) * 1.03);
    assert.ok(paceAfter(23) > paceAfter(11) * 1.03);
  });

  test("steadier hands go farther, and only the steadiest reach the Milky Way", () => {
    const milky = zones.find((zone) => zone.coast === "stars")?.from ?? 0;
    const steady = reachOf(0.005);
    const middling = reachOf(0.012);
    const loose = reachOf(0.025);
    assert.ok(steady.every((meters) => meters >= milky));
    assert.ok(loose.every((meters) => meters < milky));
    assert.ok(totalOf(steady) > totalOf(middling));
    assert.ok(totalOf(middling) > totalOf(loose));
  });
});

describe("throw quality", () => {
  test("a flat full-power throw is a 神投げ and flies far", () => {
    const river = createRiver(23);
    const divine = launch(river, { aim: 0, speed: 16, tilt: 20 });
    const sloppy = launch(river, { aim: 0, speed: 16, tilt: 26 });
    assert.equal(divine.quality, 100);
    assert.ok(sloppy.quality < 90);
    assert.ok(play(divine, null).distance > play(sloppy, null).distance * 3);
  });

  test("quality rises smoothly toward the sweet spot", () => {
    assert.ok(
      qualityAt(20) > qualityAt(22) &&
        qualityAt(22) > qualityAt(25) &&
        qualityAt(25) > qualityAt(30)
    );
  });
});

describe("areas", () => {
  test("open water areas widen the river and banks return between them", () => {
    const river = createRiver(4);
    assert.equal(shoreAt(river, zones[areaOf("cloud")]?.from ?? 0), 40);
    assert.equal(shoreAt(river, zones[areaOf("snow")]?.from ?? 0), river.shore);
  });
});

describe("tuning", () => {
  test("a flat tuning is the plain stone", () => {
    assert.deepEqual(traitsOf(flatTuning), plain);
    assert.equal(pointsLeft(flatTuning), 0);
  });

  test("lowering one stat frees a point for another, within the limits", () => {
    assert.equal(tune(flatTuning, "speed", 1), null);
    const lowered = tune(flatTuning, "focus", -1);
    assert.ok(lowered);
    assert.equal(pointsLeft(lowered), 1);
    const raised = tune(lowered, "speed", 1);
    assert.ok(raised);
    assert.equal(pointsLeft(raised), 0);
    assert.equal(tune(raised, "lift", 1), null);
    assert.deepEqual(tune(raised, "speed", -1), lowered);
    assert.equal(repeat(flatTuning, "keep", -1, LIMIT)?.keep, -LIMIT);
    assert.equal(repeat(flatTuning, "keep", -1, LIMIT + 1), null);
    const spare = { ...flatTuning, focus: -LIMIT, keep: -LIMIT };
    assert.equal(repeat(spare, "speed", 1, LIMIT)?.speed, LIMIT);
    assert.equal(repeat(spare, "speed", 1, LIMIT + 1), null);
  });

  test("raising a stat helps, and lowering it hurts, on every axis", () => {
    const base = traitsOf(flatTuning);
    for (const { key } of axes) {
      assert.ok(
        traitsOf({ ...flatTuning, [key]: 1 })[key] > base[key],
        `${key} up`
      );
      assert.ok(
        traitsOf({ ...flatTuning, [key]: -1 })[key] < base[key],
        `${key} down`
      );
    }
  });

  test("no tuning wins for every player and the plain stone is never more than two areas behind", () => {
    const steps = [-LIMIT, -1, 0, 1, LIMIT];
    const pool: Tuning[] = [];
    for (const speed of steps) {
      for (const keep of steps) {
        for (const lift of steps) {
          for (const focus of steps) {
            for (const impact of steps) {
              const entry = { focus, impact, keep, lift, speed };
              if (pointsLeft(entry) === 0) {
                pool.push(entry);
              }
            }
          }
        }
      }
    }
    const bestFor = (jitter: number) => {
      const base = averageDistance(flatTuning, jitter);
      let best = flatTuning;
      let top = base;
      for (const entry of pool) {
        const reached = averageDistance(entry, jitter);
        if (reached > top) {
          best = entry;
          top = reached;
        }
      }
      return { best, gain: zoneIndex(top) - zoneIndex(base) };
    };
    const steady = bestFor(0);
    const loose = bestFor(0.15);
    assert.ok(steady.gain <= 2 && loose.gain <= 2);
    assert.notEqual(tuningCode(steady.best), tuningCode(loose.best));
  }, 120_000);

  test("a tuning keeps its words and survives the link round trip", () => {
    const entry = { ...flatTuning, focus: -2, speed: 3, keep: -1 };
    assert.equal(tuningCode(entry), "3.-1.0.-2.0");
    assert.deepEqual(tuningFrom("3.-1.0.-2.0"), entry);
    assert.equal(tuningFrom("1.1.0.0.0"), null);
    assert.equal(tuningFrom("0.0.0.0"), null);
    assert.equal(tuningFrom("4.-4.0.0.0"), null);
    assert.equal(tuningFrom("a.b.c.d.e"), null);
    assert.equal(tuningFrom("0.0.0.0."), null);
    assert.equal(scoreOf(0), "5");
    assert.equal(scoreOf(2), "7");
    assert.equal(scoreOf(-LIMIT), "2");
    assert.ok(Number(scoreOf(-LIMIT)) > 0);
    assert.equal(noteOf(entry, "ja"), "速さ↑↑↑ 粘り↓ 集中↓↓");
    assert.equal(noteOf(entry, "en"), "Speed↑↑↑ Grit↓ Focus↓↓");
    assert.equal(noteOf(flatTuning, "ja"), "クセなし");
    assert.equal(noteOf(flatTuning, "en"), "Balanced");
  });
});

const withStorage = <T>(items: Record<string, string>, run: () => T): T => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items[key] ?? null,
  });
  try {
    return run();
  } finally {
    vi.unstubAllGlobals();
  }
};

const fresh = withStorage({}, loadProfiles);

const duel: DuelSave = { ...fresh.duel, mode: "duel" };

const journey: JourneySave = { ...fresh.journey, mode: "journey" };

const statsFor = (color: string, form: string) =>
  statsOf(journeyTraits(noGear, { color, form }));

const statsAt = (points: number) =>
  statsOf(
    journeyTraits(
      {
        focus: points,
        impact: points,
        lift: points,
        power: points,
        stone: points,
      },
      riverStone
    )
  );

const trainedPerfectAt = (points: number, scale = 1) =>
  windowFor(
    launch(createRiver(3), flat, {
      ...journeyTraits({ ...noGear, focus: points }, riverStone),
      focus: scale,
    })
  ).perfect;

const keepGain = (look: { color: string; form: string }) =>
  journeyTraits({ ...noGear, stone: 20 }, look).keep -
  journeyTraits(noGear, look).keep;

const windowGain = (look: { color: string; form: string }) =>
  journeyTraits({ ...noGear, focus: 20 }, look).good -
  journeyTraits(noGear, look).good;

const load = (tuning: Tuning) =>
  withStorage(
    {
      "mizukiri.v4": JSON.stringify({
        ...fresh,
        duel: { ...fresh.duel, best: 5, tuning },
      }),
    },
    loadProfiles
  );

describe("journey", () => {
  test("a fresh stone with no points is the plain stone", () => {
    assert.deepEqual(journeyTraits(noGear, riverStone), plain);
  });

  test("training lift and impact raises those stats", () => {
    const base = statsOf(journeyTraits(noGear, riverStone));
    const trained = statsOf(
      journeyTraits({ ...noGear, impact: 6, lift: 6 }, riverStone)
    );
    assert.ok(trained.lift > base.lift && trained.impact > base.impact);
    assert.equal(trained.speed, base.speed);
  });

  test("every extra point keeps raising the stats instead of topping out", () => {
    for (const key of ["focus", "impact", "keep", "lift", "speed"] as const) {
      assert.ok(statsAt(100)[key] > statsAt(50)[key], key);
      assert.ok(statsAt(400)[key] > statsAt(200)[key], key);
    }
    assert.ok(statsAt(40).speed > 1);
  });

  test("every focus point and focus perk widens the tap window", () => {
    assert.ok(trainedPerfectAt(1) >= trainedPerfectAt(0) * 1.1);
    assert.ok(trainedPerfectAt(0) >= 0.09);
    for (let points = 1; points <= 10; points += 1) {
      assert.ok(trainedPerfectAt(points) > trainedPerfectAt(points - 1));
    }
    assert.ok(trainedPerfectAt(0, 1.09) >= trainedPerfectAt(0) * 1.09);
  });

  test("upgrades make the same throw go farther", () => {
    const river = createRiver(17);
    const strong = { focus: 5, impact: 5, lift: 5, power: 5, stone: 5 };
    assert.ok(
      play(launch(river, flat, journeyTraits(strong, riverStone)), null)
        .distance > play(launch(river, flat), null).distance
    );
  });

  test("each form trades strengths in its stats", () => {
    const oval = statsFor("river", "oval");
    const flatForm = statsFor("river", "flat");
    const heart = statsFor("river", "heart");
    assert.ok(flatForm.keep > oval.keep && flatForm.lift < oval.lift);
    assert.ok(heart.impact > oval.impact && heart.speed < oval.speed);
  });

  test("a flat stone keeps going longer without taps than a round one", () => {
    const river = createRiver(29);
    const skipsOf = (form: string) =>
      play(
        launch(river, flat, journeyTraits(noGear, { color: "river", form })),
        null
      ).skips;
    assert.ok(skipsOf("flat") > skipsOf("round"));
  });

  test("a matching pair makes each point in its stat count for more", () => {
    assert.equal(comboOf({ color: "slate", form: "flat" })?.name.ja, "碁石");
    assert.ok(
      keepGain({ color: "slate", form: "flat" }) > keepGain(riverStone)
    );
    assert.ok(
      Math.abs(
        keepGain({ color: "slate", form: "oval" }) - keepGain(riverStone)
      ) < 1e-12
    );
    assert.ok(
      windowGain({ color: "jade", form: "bean" }) > windowGain(riverStone)
    );
  });

  test("perk notes read in both languages", () => {
    assert.equal(perksNote({ keep: 2, lift: -1 }, "ja"), "粘り↑↑ 跳ね↓");
    assert.equal(perksNote({ keep: 2, lift: -1 }, "en"), "Grit↑↑ Bounce↓");
    assert.equal(perksNote({}, "ja"), "クセなし");
    assert.equal(perksNote({}, "en"), "Balanced");
    assert.deepEqual(peaksOf({ focus: 3, keep: 1, lift: -1, speed: -2 }), {
      focus: 3,
      speed: -2,
    });
  });

  test("skill points come from levels and can be moved freely", () => {
    assert.equal(spend(journey, "power", 1), null);
    const climbed = { ...journey, xp: 10_000 };
    const points = progressOf(climbed.xp).level;
    assert.ok(points > 1);
    const raised = spend(climbed, "power", 1);
    assert.ok(raised);
    assert.equal(pointsToTrain({ ...climbed, gear: raised }), points - 1);
    const lowered = spend({ ...climbed, gear: raised }, "power", -1);
    assert.deepEqual(lowered, noGear);
    assert.equal(spend(climbed, "power", -1), null);
  });

  test("a run earns experience", () => {
    const flight = play(launch(createRiver(9), flat), 0.03);
    const settled = settle(journey, flight);
    const earned = earn(journey, settled.save, flight);
    assert.ok(earned.gained > 0);
    assert.equal(earned.save.xp, earned.gained);
    assert.equal(earned.save.best, flight.distance);
  });

  test("a combo is found once both of its parts are unlocked", () => {
    const maxed = { ...journey, best: 1e6, combo: 99, divine: true, xp: 1e9 };
    assert.deepEqual(
      foundOf(maxed).map(({ id }) => id),
      combos.map(({ id }) => id)
    );
    assert.ok(foundOf(journey).length < combos.length);
    assert.ok(!foundOf(journey).some(({ id }) => id === "go"));
  });

  test("a found combo is worn in one step, and a locked one is not", () => {
    const maxed = { ...journey, best: 1e6, combo: 99, divine: true, xp: 1e9 };
    const worn = wearCombo(maxed, "go");
    assert.equal(worn?.look.color, "slate");
    assert.equal(worn?.look.form, "flat");
    assert.equal(wearCombo(worn ?? maxed, "go"), null);
    assert.equal(wearCombo(maxed, "nope"), null);
    assert.equal(wearCombo(journey, "go"), null);
  });

  test("a look can only be worn once it is unlocked", () => {
    assert.equal(wear(journey, "color", "gold"), null);
    const divine = { ...journey, divine: true };
    assert.equal(wear(divine, "color", "gold")?.look.color, "gold");
  });

  test("finishing a 神投げ unlocks the gold stone", () => {
    const flight = play(
      launch(createRiver(23), { aim: 0, speed: 16, tilt: 20 }),
      null
    );
    const earned = earn(journey, settle(journey, flight).save, flight);
    assert.ok(
      earned.unlocked.some(
        ({ part, option }) => part === "color" && option.id === "gold"
      )
    );
    assert.ok(earned.save.unseen.includes("color:gold"));
    assert.deepEqual(seen(earned.save)?.unseen, []);
    assert.equal(seen({ ...earned.save, unseen: [] }), null);
  });

  test("a trail unlocks even when a color shares its id", () => {
    const flight = play(launch(createRiver(23), flat), null);
    const before = { ...journey, divine: true };
    const settled = settle(before, { ...flight, bestCombo: 15 });
    const earned = earn(before, settled.save, flight);
    assert.ok(earned.save.unseen.includes("trail:gold"));
    assert.ok(!earned.save.unseen.includes("color:gold"));
  });
});

describe("results", () => {
  test("a posted run carries its stone and tuning into the shared link", () => {
    const flight = play(launch(createRiver(5), flat), null);
    const entry = { ...flatTuning, focus: -2, speed: 2 };
    const result = resultOf(flight, {
      ...duel,
      look: { ...duel.look, color: "jade", form: "bean" },
      tuning: entry,
    });
    const posted = new URL(postUrl(shareOf(result, "https://x.y", "ja")));
    assert.match(posted.searchParams.get("text") ?? "", /勾玉/u);
    assert.match(posted.searchParams.get("text") ?? "", /#天の川水切り/u);
    assert.match(posted.searchParams.get("text") ?? "", /配分：速さ↑↑ 集中↓↓/u);
    const english = new URL(postUrl(shareOf(result, "https://x.y", "en")));
    assert.match(
      english.searchParams.get("text") ?? "",
      /Magatama \(Jade Bean\)/u
    );
    assert.match(english.searchParams.get("text") ?? "", /Skipped/u);
    assert.match(
      english.searchParams.get("text") ?? "",
      /Tuning: Speed↑↑ Focus↓↓/u
    );
    assert.equal(
      new URL(english.searchParams.get("url") ?? "").searchParams.get("l"),
      "en"
    );
    const shared = new URL(posted.searchParams.get("url") ?? "");
    const image = new URL(shareOf(result, "https://x.y", "ja").image);
    assert.equal(image.pathname, "/games/mizukiri/og");
    assert.equal(image.search, shared.search);
    const read = readResult(Object.fromEntries(shared.searchParams));
    assert.deepEqual(read?.stone, { color: "jade", form: "bean" });
    assert.deepEqual(read?.tuning, entry);
    assert.equal(read?.journey, false);
    const { t: _t, ...older } = Object.fromEntries(shared.searchParams);
    assert.equal(readResult(older)?.tuning, null);
    assert.equal(readResult({ ...older, t: "9.9.9.9.9" })?.tuning, null);
  });

  test("a journey run is shared as one, with its level, and is not a challenge", () => {
    const flight = play(launch(createRiver(5), flat), null);
    const climbed = { ...journey, xp: 9000 };
    const result = resultOf(flight, climbed);
    assert.equal(result.tuning, null);
    assert.equal(result.journey, true);
    assert.equal(result.level, 9);
    const query = new URLSearchParams(queryOf(result));
    assert.equal(query.get("j"), "1");
    assert.equal(query.get("lv"), "9");
    assert.equal(query.has("t"), false);
    const read = readResult(Object.fromEntries(query));
    assert.equal(read?.journey, true);
    assert.equal(read?.level, 9);
    assert.equal(read?.tuning, null);
    const english = new URL(postUrl(shareOf(result, "https://x.y", "en")));
    assert.match(
      english.searchParams.get("text") ?? "",
      /^\[Journey Lv\.9\] Skipped/u
    );
    assert.doesNotMatch(english.searchParams.get("text") ?? "", /Tuning/u);
    const ja = new URL(postUrl(shareOf(result, "https://x.y", "ja")));
    assert.match(ja.searchParams.get("text") ?? "", /^【育成 Lv\.9】/u);
    assert.equal(journeyTag(null, "en"), "Journey");
    assert.equal(journeyTag(3, "ja"), "育成 Lv.3");
    const { lv: _lv, ...withoutLevel } = Object.fromEntries(query);
    assert.equal(readResult(withoutLevel)?.level, null);
    const duelResult = resultOf(flight, duel);
    assert.equal(duelResult.level, null);
    assert.equal(new URLSearchParams(queryOf(duelResult)).has("lv"), false);
    const duelText = new URL(postUrl(shareOf(duelResult, "https://x.y", "en")));
    assert.doesNotMatch(duelText.searchParams.get("text") ?? "", /Journey/u);
  });

  test("a single skip reads as once in the sink and leaf lines", () => {
    const base = {
      distance: 12,
      highlight: null,
      journey: false,
      level: null,
      quality: 50,
      sky: "dusk",
      skips: 1,
      stone: null,
      times: 0,
      tuning: null,
    } as const;
    assert.match(
      storyOf({ ...base, ending: "sink" }, "en").line,
      /Skipped a stone once/u
    );
    assert.match(
      storyOf({ ...base, ending: "leaf" }, "en").line,
      /Skipped once/u
    );
    assert.match(
      storyOf({ ...base, ending: "leaf", skips: 3 }, "en").line,
      /Skipped 3 times/u
    );
  });

  test("a shared stone survives the link round trip", () => {
    assert.deepEqual(stoneFrom("jade.bean"), { color: "jade", form: "bean" });
    assert.equal(stoneFrom("jade.nope"), null);
    assert.equal(stoneFrom("nope"), null);
  });
});

describe("save", () => {
  test("a run records the best distance", () => {
    const flight = play(launch(createRiver(9), flat), 0.03);
    const settled = settle(duel, flight);
    assert.equal(settled.record, true);
    assert.equal(settled.save.best, flight.distance);
    assert.equal(settled.save.runs, 1);
    assert.equal(settle(settled.save, flight).record, false);
  });

  test("the top speed of a throw is its fastest hop", () => {
    const flight = play(launch(createRiver(9), flat), 0.03);
    const fastest = Math.max(
      ...flight.hops.map((hop) => Math.hypot(hop.velocity.x, hop.velocity.z))
    );
    assert.equal(topSpeed(flight), fastest);
    assert.ok(topSpeed(flight) >= speedAt(flight, 0));
  });

  test("every finished throw adds to the lifetime tally", () => {
    const flight = play(launch(createRiver(9), flat), 0.03);
    const { tally } = settle(settle(duel, flight).save, flight).save;
    const graded = flight.splashes.filter(({ grade }) => grade !== null);
    assert.ok(flight.duration > 0 && graded.length > 0);
    assert.equal(tally.distance, flight.distance * 2);
    assert.equal(tally.airtime, flight.duration * 2);
    assert.equal(tally.bestAirtime, flight.duration);
    assert.equal(tally.skips, flight.skips * 2);
    assert.equal(tally.bestSkips, flight.skips);
    assert.equal(tally.bestSpeed, topSpeed(flight));
    assert.ok(tally.bestSpeed > 0);
    assert.equal(tally.quality, flight.quality * 2);
    assert.equal(tally.endings[flight.ending ?? "sink"], 2);
    assert.equal(
      Object.values(tally.grades).reduce((sum, n) => sum + n, 0),
      graded.length * 2
    );
  });

  test("a fresh player starts in a duel with nothing earned", () => {
    assert.equal(fresh.mode, "duel");
    assert.deepEqual(fresh.duel.tuning, flatTuning);
    assert.equal(fresh.journey.xp, 0);
    assert.equal(viewOf(fresh).mode, "duel");
  });

  test("each mode keeps its own record and look", () => {
    const flight = play(launch(createRiver(9), flat), 0.03);
    const run = settle(duel, flight).save;
    const played = withView(fresh, run);
    assert.equal(played.duel.runs, 1);
    assert.equal(played.journey.runs, 0);
    const worn = wear(run, "color", "gold");
    assert.ok(worn);
    const kept = withView(played, worn);
    assert.equal(kept.duel.look.color, "gold");
    assert.equal(kept.journey.look.color, "river");
    const switched = viewOf({ ...kept, mode: "journey" });
    assert.equal(switched.mode, "journey");
    assert.equal(switched.runs, 0);
    assert.equal(viewOf(kept).runs, 1);
  });

  test("a player from before the modes carries their progress into the journey", () => {
    const before = JSON.stringify({
      best: 42.5,
      combo: 7,
      divine: true,
      gear: { focus: 3, impact: 1, lift: 0, power: 9, stone: 2 },
      look: { color: "slate", form: "flat", pattern: "stripe", trail: "gold" },
      runs: 12,
      unseen: ["color:gold"],
      xp: 5000,
    });
    const loaded = withStorage({ "mizukiri.v3": before }, loadProfiles);
    assert.equal(loaded.mode, "journey");
    assert.equal(loaded.journey.best, 42.5);
    assert.equal(loaded.journey.combo, 7);
    assert.equal(loaded.journey.divine, true);
    assert.equal(loaded.journey.runs, 12);
    assert.equal(loaded.journey.xp, 5000);
    assert.deepEqual(loaded.journey.gear, {
      focus: 3,
      impact: 1,
      lift: 0,
      power: 9,
      stone: 2,
    });
    assert.deepEqual(loaded.journey.unseen, ["color:gold"]);
    assert.equal(loaded.journey.look.pattern, "stripe");
    assert.equal(loaded.journey.tally.distance, 42.5);
    assert.equal(loaded.duel.best, 0);
    assert.equal(loaded.duel.runs, 0);
    assert.deepEqual(loaded.duel.tuning, flatTuning);
    assert.equal(loaded.duel.look.color, "slate");
    assert.equal(viewOf(loaded).mode, "journey");
  });

  test("an old save without gear points or a tally still carries over", () => {
    const sparse = JSON.stringify({
      best: 10,
      combo: 0,
      divine: false,
      gear: { focus: 0, power: 0, stone: 0 },
      look: duel.look,
      runs: 1,
      xp: 3,
    });
    const loaded = withStorage({ "mizukiri.v3": sparse }, loadProfiles);
    assert.equal(loaded.journey.runs, 1);
    assert.equal(loaded.journey.gear.impact, 0);
    assert.equal(loaded.journey.tally.distance, 10);
  });

  test("a new save wins over the old one", () => {
    const loaded = withStorage(
      {
        "mizukiri.v3": JSON.stringify({
          best: 99,
          combo: 0,
          divine: false,
          gear: { focus: 0, impact: 0, lift: 0, power: 0, stone: 0 },
          look: duel.look,
          runs: 9,
          xp: 99,
        }),
        "mizukiri.v4": JSON.stringify(fresh),
      },
      loadProfiles
    );
    assert.equal(loaded.mode, "duel");
    assert.equal(loaded.journey.xp, 0);
    assert.equal(loaded.journey.runs, 0);
  });

  test("a broken save falls back to a fresh one", () => {
    assert.deepEqual(withStorage({ "mizukiri.v4": "{" }, loadProfiles), fresh);
    assert.deepEqual(
      withStorage({ "mizukiri.v4": "null" }, loadProfiles),
      fresh
    );
  });

  test("a tuning is kept, and one over its budget falls back to flat", () => {
    const entry = { ...flatTuning, focus: -3, lift: 2, speed: 1 };
    assert.deepEqual(load(entry).duel.tuning, entry);
    const over = load({ ...flatTuning, speed: 3 });
    assert.deepEqual(over.duel.tuning, flatTuning);
    assert.equal(over.duel.best, 5);
    assert.deepEqual(
      load({ ...flatTuning, speed: -4 }).duel.tuning,
      flatTuning
    );
  });

  test("every look can be worn in a duel, and only one that changes", () => {
    assert.equal(wear(duel, "color", "gold")?.look.color, "gold");
    assert.equal(wear(duel, "trail", "comet")?.look.trail, "comet");
    assert.equal(wear(duel, "color", "river"), null);
    assert.equal(wear(duel, "color", "nope"), null);
  });

  test("a shared record survives the link round trip", () => {
    const career = {
      ...careerOf({
        ...journey,
        best: 1234.5,
        combo: 7,
        runs: 42,
        xp: 9000,
      }),
      airtime: 3725.4,
      perfect: true,
      speed: 18.5,
      total: 56_789,
    };
    assert.equal(career.level, 9);
    const english = careerShare(career, "https://x.y", "en");
    assert.match(
      english.text,
      /best 1\.23km, 56\.79km across 42 throws and 1h 2m in flight/u
    );
    assert.match(english.text, /^My Skip to the Milky Way record:/u);
    assert.match(
      english.text,
      /reached Cherry lane \(Journey Lv\.9\)\n#天の川水切り #SkipToTheMilkyWay$/u
    );
    const url = new URL(english.url);
    assert.equal(url.searchParams.get("l"), "en");
    const image = new URL(english.image);
    assert.equal(image.pathname, "/games/mizukiri/og");
    assert.equal(image.search, url.search);
    assert.deepEqual(readCareer(Object.fromEntries(url.searchParams)), career);
    assert.equal(describeCareer(career, "en").title, "Master · Lv.9");
    assert.deepEqual(describeCareer(career, "en").facts.at(-1), {
      label: "Top speed",
      value: "67 km/h",
    });
    const { top: _top, ...older } = Object.fromEntries(url.searchParams);
    assert.equal(readCareer(older)?.speed, 0);
    assert.match(
      careerShare(career, "https://x.y", "ja").text,
      /^天の川水切りの戦績：自己ベスト1\.23km、42投・飛行時間1時間2分/u
    );
    assert.match(
      careerShare(career, "https://x.y", "ja").text,
      /桜並木まで到達（育成 Lv\.9）\n#天の川水切り$/u
    );
    assert.match(
      careerShare({ ...career, airtime: 125.9 }, "https://x.y", "en").text,
      /and 2m 6s in flight/u
    );
    assert.match(
      careerShare({ ...career, airtime: 0 }, "https://x.y", "ja").text,
      /飛行時間0秒/u
    );
    assert.equal(
      readCareer({
        air: "1",
        best: "10",
        combo: "0",
        lv: "0",
        runs: "0",
        total: "10",
      }),
      null
    );
    assert.equal(readResult(Object.fromEntries(url.searchParams)), null);
  });

  test("a duel record has no level", () => {
    const career = careerOf({ ...duel, best: 1234.5, combo: 7, runs: 42 });
    assert.equal(career.level, null);
    const english = careerShare(career, "https://x.y", "en");
    assert.doesNotMatch(english.text, /Lv\./u);
    assert.equal(new URL(english.url).searchParams.has("lv"), false);
    assert.equal(describeCareer(career, "en").title, "Master");
    assert.equal(
      readCareer(Object.fromEntries(new URL(english.url).searchParams))?.level,
      null
    );
  });

  test("a perfect throw is remembered", () => {
    const flight = launch(createRiver(23), { aim: 0, speed: 16, tilt: 20 });
    assert.equal(settle(duel, play(flight, null)).save.divine, true);
    assert.equal(
      settle(duel, play(launch(createRiver(23), flat), null)).save.divine,
      false
    );
  });
});
