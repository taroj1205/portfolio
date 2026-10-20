import assert from "node:assert/strict";

import { describe, test, vi } from "vite-plus/test";

import { careerOf, careerShare, readCareer } from "./career";
import {
  comboOf,
  combos,
  firstLook,
  noteOf,
  peaksOf,
  stoneFrom,
  traitsOf,
} from "./cosmetics";
import {
  describe as storyOf,
  postUrl,
  readResult,
  resultOf,
  shareOf,
} from "./result";
import {
  foundOf,
  loadSave,
  pointsLeft,
  progressOf,
  seen,
  settle,
  tune,
  wear,
  wearCombo,
} from "./save";
import type { Save } from "./save";
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
  qualityOf,
  reachOf,
  shoreAt,
  statsOf,
  stoneAt,
  windowFor,
  zones,
} from "./simulate";
import type { Flight, Gear } from "./simulate";

const bare: Gear = { focus: 0, impact: 0, lift: 0, power: 0, stone: 0 };
const flat = { aim: 0, speed: 14, tilt: 20 };

const qualityAt = (tilt: number) => qualityOf({ aim: 0, speed: 16, tilt });

const play = (flight: Flight, lead: number | null) => {
  for (
    let contact = nextContact(flight);
    contact !== null;
    contact = nextContact(flight)
  ) {
    land(flight, lead === null ? null : contact - lead);
  }
  return flight;
};

const strike = (seed: number, lead: number | null) => {
  const flight = launch(createRiver(seed), flat, bare);
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

describe("flight", () => {
  test("the same river, throw and taps always play out the same way", () => {
    const river = createRiver(7);
    assert.deepEqual(
      play(launch(river, flat, bare), 0.03),
      play(launch(river, flat, bare), 0.03)
    );
  });

  test("tapping right before each touch goes much farther than not tapping", () => {
    const river = createRiver(11);
    const idle = play(launch(river, flat, bare), null);
    const timed = play(launch(river, flat, bare), 0.03);
    assert.ok(timed.distance > idle.distance * 2);
    assert.ok(timed.bestCombo > 5);
  });

  test("tapping too early counts as early and breaks the combo", () => {
    const flight = launch(createRiver(3), flat, bare);
    const contact = nextContact(flight);
    assert.ok(contact !== null);
    land(flight, contact - 0.5);
    assert.equal(flight.splashes.at(-1)?.grade, "early");
    assert.equal(flight.combo, 0);
  });

  test("a tap just after a touch is late for it, not early for the next", () => {
    const flight = launch(createRiver(3), flat, bare);
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

  test("a bounce does not count as a skip", () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, bare), 0.01);
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
      play(launch(river, flat, bare), null).skips >
        play(launch(river, { ...flat, tilt: 45 }, bare), null).skips
    );
  });

  test("a limp throw sinks without skipping", () => {
    const flight = play(
      launch(createRiver(3), { ...flat, speed: 2 }, bare),
      null
    );
    assert.equal(flight.ending, "plop");
    assert.equal(flight.skips, 0);
  });

  test("ducks and rocks launch the stone instead of stopping it", () => {
    let bumped = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, bare), 0.03);
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
      const flight = play(launch(createRiver(seed), flat, bare), 0.03);
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
        assert.ok(
          Math.hypot(after.velocity.x, after.velocity.z) >
            Math.hypot(before.velocity.x, before.velocity.z)
        );
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
    const bouncy: Gear = { focus: 3, impact: 3, lift: 8, power: 6, stone: 4 };
    let caught = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const flight = play(launch(createRiver(seed), flat, bouncy), 0.03);
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
        { ...bare, focus: 5, power: 8, stone: 5 }
      ),
      0.03
    );
    assert.ok(flight.bumps.some((bump) => bump.kind === "wall"));
    for (const hop of flight.hops) {
      for (let k = 0; k < 10; k += 1) {
        const at = stoneAt(
          flight,
          hop.start + ((hop.end - hop.start) * k) / 10
        );
        assert.ok(at);
        assert.ok(Math.abs(at.x) <= river.shore);
      }
    }
  });

  test("the stone touches the water at every skip and never jumps", () => {
    const flight = play(launch(createRiver(13), flat, bare), 0.03);
    for (const splash of flight.splashes.filter(
      (s) => s.grade !== null && !isBounce(s.event)
    )) {
      const before = stoneAt(flight, splash.time - 1e-6);
      assert.ok(before);
      assert.ok(Math.abs(before.y) < 1e-3);
      assert.ok(Math.abs(before.z - splash.z) < 1e-3);
    }
  });

  test("upgrades make the same throw go farther", () => {
    const river = createRiver(17);
    const strong = { focus: 5, impact: 5, lift: 5, power: 5, stone: 5 };
    assert.ok(
      play(launch(river, flat, strong), null).distance >
        play(launch(river, flat, bare), null).distance
    );
  });

  test("the river keeps generating things to hit far downstream", () => {
    const river = createRiver(21);
    assert.ok(propsIn(river, 50_000, 50_300).length > 0);
    assert.deepEqual(propsIn(river, 900, 960), propsIn(river, 900, 960));
  });
});

describe("throw quality", () => {
  test("a flat full-power throw is a 神投げ and flies far", () => {
    const river = createRiver(23);
    const divine = launch(river, { aim: 0, speed: 16, tilt: 20 }, bare);
    const sloppy = launch(river, { aim: 0, speed: 16, tilt: 26 }, bare);
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

const statsFor = (color: string, form: string) =>
  statsOf(bare, traitsOf({ color, form }));

const keepOf = (color: string, form: string) => traitsOf({ color, form }).keep;

const statsAt = (points: number) =>
  statsOf(
    { focus: points, impact: points, lift: points, power: points, stone: 0 },
    plain
  );

describe("areas and skills", () => {
  test("open water areas widen the river and banks return between them", () => {
    const river = createRiver(4);
    assert.equal(shoreAt(river, zones[areaOf("cloud")]?.from ?? 0), 40);
    assert.equal(shoreAt(river, zones[areaOf("snow")]?.from ?? 0), river.shore);
  });

  test("training lift and impact raises those stats", () => {
    const base = statsOf(bare, plain);
    const trained = statsOf({ ...bare, impact: 6, lift: 6 }, plain);
    assert.ok(trained.lift > base.lift && trained.impact > base.impact);
    assert.equal(trained.speed, base.speed);
  });

  test("every extra point keeps raising the stats instead of topping out", () => {
    for (const key of ["focus", "impact", "lift", "speed"] as const) {
      assert.ok(statsAt(100)[key] > statsAt(50)[key], key);
      assert.ok(statsAt(400)[key] > statsAt(200)[key], key);
    }
    assert.ok(statsAt(40).speed > 1);
  });

  test("the radar draws a stat past the ring a little further for every point", () => {
    assert.equal(reachOf(0.6), 0.6);
    assert.equal(reachOf(1), 1);
    const drawn = [1.1, 1.45, 2.2, 4, 40].map(reachOf);
    for (const [i, reach] of drawn.entries()) {
      assert.ok(reach > (drawn[i - 1] ?? 1));
      assert.ok(reach < 1.15);
    }
  });
});

describe("stones", () => {
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
      play(launch(river, flat, bare, traitsOf({ color: "river", form })), null)
        .skips;
    assert.ok(skipsOf("flat") > skipsOf("round"));
  });

  test("a matching pair adds its combo bonus on top", () => {
    assert.equal(comboOf({ color: "slate", form: "flat" })?.name.ja, "碁石");
    const flatGain = keepOf("river", "flat") - keepOf("river", "oval");
    const goGain = keepOf("slate", "flat") - keepOf("slate", "oval");
    assert.ok(goGain > flatGain);
    assert.equal(noteOf({ keep: 2, lift: -1 }, "ja"), "粘り↑↑ 跳ね↓");
    assert.equal(noteOf({ keep: 2, lift: -1 }, "en"), "Grit↑↑ Bounce↓");
    assert.equal(noteOf({}, "ja"), "クセなし");
    assert.equal(noteOf({}, "en"), "Balanced");
    assert.deepEqual(peaksOf({ focus: 3, keep: 1, lift: -1, speed: -2 }), {
      focus: 3,
      speed: -2,
    });
  });

  test("a posted run carries its stone into the shared link", () => {
    const flight = play(launch(createRiver(5), flat, bare), null);
    const result = resultOf(flight, { color: "jade", form: "bean" });
    const posted = new URL(postUrl(shareOf(result, "https://x.y", "ja")));
    assert.match(posted.searchParams.get("text") ?? "", /勾玉/u);
    assert.match(posted.searchParams.get("text") ?? "", /#天の川水切り/u);
    const english = new URL(postUrl(shareOf(result, "https://x.y", "en")));
    assert.match(
      english.searchParams.get("text") ?? "",
      /Magatama \(Jade Bean\)/u
    );
    assert.match(english.searchParams.get("text") ?? "", /Skipped/u);
    assert.equal(
      new URL(english.searchParams.get("url") ?? "").searchParams.get("l"),
      "en"
    );
    const shared = new URL(posted.searchParams.get("url") ?? "");
    const image = new URL(shareOf(result, "https://x.y", "ja").image);
    assert.equal(image.pathname, "/games/mizukiri/og");
    assert.equal(image.search, shared.search);
    assert.deepEqual(
      readResult(Object.fromEntries(shared.searchParams))?.stone,
      { color: "jade", form: "bean" }
    );
  });

  test("a single skip reads as once in the sink and leaf lines", () => {
    const base = {
      distance: 12,
      highlight: null,
      quality: 50,
      sky: "dusk",
      skips: 1,
      stone: null,
      times: 0,
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

  test("a shared build survives the link round trip", () => {
    assert.deepEqual(stoneFrom("jade.bean"), { color: "jade", form: "bean" });
    assert.equal(stoneFrom("jade.nope"), null);
    assert.equal(stoneFrom("nope"), null);
  });
});

describe("save", () => {
  const empty: Save = {
    best: 0,
    combo: 0,
    divine: false,
    gear: bare,
    look: firstLook,
    runs: 0,
    settings: { lang: null, muted: false },
    tally: {
      airtime: 0,
      bestAirtime: 0,
      bestSkips: 0,
      distance: 0,
      divineThrows: 0,
      endings: {},
      events: {},
      grades: {},
      quality: 0,
      skips: 0,
    },
    unseen: [],
    xp: 0,
  };

  test("a run earns experience and records the best distance", () => {
    const flight = play(launch(createRiver(9), flat, bare), 0.03);
    const settled = settle(empty, flight);
    assert.ok(settled.gained > 0);
    assert.equal(settled.record, true);
    assert.equal(settled.save.best, flight.distance);
    assert.equal(settled.save.runs, 1);
  });

  test("every finished throw adds to the lifetime tally", () => {
    const flight = play(launch(createRiver(9), flat, bare), 0.03);
    const { tally } = settle(settle(empty, flight).save, flight).save;
    const graded = flight.splashes.filter(({ grade }) => grade !== null);
    assert.ok(flight.duration > 0 && graded.length > 0);
    assert.equal(tally.distance, flight.distance * 2);
    assert.equal(tally.airtime, flight.duration * 2);
    assert.equal(tally.bestAirtime, flight.duration);
    assert.equal(tally.skips, flight.skips * 2);
    assert.equal(tally.bestSkips, flight.skips);
    assert.equal(tally.quality, flight.quality * 2);
    assert.equal(tally.endings[flight.ending ?? "sink"], 2);
    assert.equal(
      Object.values(tally.grades).reduce((sum, n) => sum + n, 0),
      graded.length * 2
    );
  });

  test("an older save loads with an empty tally that counts its best", () => {
    const { tally: _, ...older } = { ...empty, best: 42.5, runs: 3 };
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify(older),
    });
    try {
      const loaded = loadSave();
      assert.equal(loaded.runs, 3);
      assert.equal(loaded.tally.distance, 42.5);
      assert.equal(loaded.tally.airtime, 0);
      assert.deepEqual(loaded.tally.grades, {});
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test("a shared record survives the link round trip", () => {
    const career = {
      ...careerOf({ ...empty, best: 1234.5, combo: 7, runs: 42, xp: 9000 }),
      airtime: 3725.4,
      perfect: true,
      total: 56_789,
    };
    const english = careerShare(career, "https://x.y", "en");
    assert.match(
      english.text,
      /best 1\.23km, 56\.79km across 42 throws and 1h 2m in flight/u
    );
    assert.match(english.text, /^My Skip to the Milky Way record:/u);
    assert.match(
      english.text,
      /reached Cherry lane \(Lv\.9\)\n#天の川水切り #SkipToTheMilkyWay$/u
    );
    const url = new URL(english.url);
    assert.equal(url.searchParams.get("l"), "en");
    const image = new URL(english.image);
    assert.equal(image.pathname, "/games/mizukiri/og");
    assert.equal(image.search, url.search);
    assert.deepEqual(readCareer(Object.fromEntries(url.searchParams)), career);
    assert.match(
      careerShare(career, "https://x.y", "ja").text,
      /^天の川水切りの戦績：自己ベスト1\.23km、42投・飛行時間1時間2分/u
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

  test("skill points come from levels and can be moved freely", () => {
    assert.equal(tune(empty, "power", 1), null);
    const climbed = { ...empty, xp: 10_000 };
    const points = progressOf(climbed.xp).level;
    assert.ok(points > 1);
    const raised = tune(climbed, "power", 1);
    assert.ok(raised);
    assert.equal(pointsLeft(raised), points - 1);
    const lowered = tune(raised, "power", -1);
    assert.ok(lowered);
    assert.equal(pointsLeft(lowered), points);
    assert.equal(tune(lowered, "power", -1), null);
  });

  test("a combo is found once both of its parts are unlocked", () => {
    const maxed = { ...empty, best: 1e6, combo: 99, divine: true, xp: 1e9 };
    assert.deepEqual(
      foundOf(maxed).map(({ id }) => id),
      combos.map(({ id }) => id)
    );
    assert.ok(foundOf(empty).length < combos.length);
    assert.ok(!foundOf(empty).some(({ id }) => id === "go"));
  });

  test("a found combo is worn in one step, and a locked one is not", () => {
    const maxed = { ...empty, best: 1e6, combo: 99, divine: true, xp: 1e9 };
    const worn = wearCombo(maxed, "go");
    assert.equal(worn?.look.color, "slate");
    assert.equal(worn?.look.form, "flat");
    assert.equal(wearCombo(worn ?? maxed, "go"), null);
    assert.equal(wearCombo(maxed, "nope"), null);
    assert.equal(wearCombo(empty, "go"), null);
  });

  test("a look can only be worn once it is unlocked", () => {
    assert.equal(wear(empty, "color", "gold"), null);
    const divine = { ...empty, divine: true };
    assert.equal(wear(divine, "color", "gold")?.look.color, "gold");
  });

  test("finishing a 神投げ unlocks the gold stone", () => {
    const flight = launch(
      createRiver(23),
      { aim: 0, speed: 16, tilt: 20 },
      bare
    );
    const settled = settle(empty, play(flight, null));
    assert.ok(
      settled.unlocked.some(
        ({ part, option }) => part === "color" && option.id === "gold"
      )
    );
    assert.ok(settled.save.unseen.includes("color:gold"));
    assert.deepEqual(seen(settled.save)?.unseen, []);
  });

  test("a trail unlocks even when a color shares its id", () => {
    const flight = play(launch(createRiver(23), flat, bare), null);
    const settled = settle(
      { ...empty, divine: true },
      { ...flight, bestCombo: 15 }
    );
    assert.ok(settled.save.unseen.includes("trail:gold"));
    assert.ok(!settled.save.unseen.includes("color:gold"));
  });
});
