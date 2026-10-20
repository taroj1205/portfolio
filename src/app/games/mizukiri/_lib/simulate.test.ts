import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  comboOf,
  firstLook,
  noteOf,
  peaksOf,
  stoneFrom,
  traitsOf,
} from "./cosmetics";
import { describe as storyOf, postUrl, readResult, resultOf } from "./result";
import {
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
  land,
  launch,
  nextContact,
  propsIn,
  plain,
  qualityOf,
  shoreAt,
  statsOf,
  stoneAt,
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
    for (const splash of flight.splashes.filter((s) => s.grade !== null)) {
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
    const posted = new URL(postUrl(result, "https://x.y", "ja"));
    assert.match(posted.searchParams.get("text") ?? "", /勾玉/u);
    const english = new URL(postUrl(result, "https://x.y", "en"));
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
    found: [],
    gear: bare,
    look: firstLook,
    runs: 0,
    settings: { lang: null, muted: false },
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

  test("wearing a combo pair records the discovery", () => {
    const black = {
      ...empty,
      best: 1e6,
      look: { ...firstLook, color: "slate" },
      xp: 1e9,
    };
    assert.deepEqual(wear(black, "form", "flat")?.found, ["go"]);
  });

  test("a found combo is worn in one step without discovering others", () => {
    const found = {
      ...empty,
      best: 1e6,
      divine: true,
      found: ["go"],
      xp: 1e9,
    };
    const worn = wearCombo(found, "go");
    assert.equal(worn?.look.color, "slate");
    assert.equal(worn?.look.form, "flat");
    assert.deepEqual(worn?.found, ["go"]);
    assert.equal(wearCombo(worn ?? found, "go"), null);
    assert.equal(wearCombo(found, "goldfish"), null);
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
