import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { firstLook } from "./cosmetics";
import { pointsLeft, progressOf, settle, tune, wear } from "./save";
import type { Save } from "./save";
import {
  createRiver,
  land,
  launch,
  nextContact,
  propsIn,
  qualityOf,
  statsOf,
  stoneAt,
} from "./simulate";
import type { Flight, Gear } from "./simulate";

const bare: Gear = { focus: 0, power: 0, stone: 0 };
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
      launch(river, { ...flat, aim: 0.1 }, { focus: 5, power: 8, stone: 5 }),
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
    const strong = { focus: 5, power: 5, stone: 5 };
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

describe("forms", () => {
  test("each form trades strengths in its stats", () => {
    const oval = statsOf(bare, "oval");
    const flatForm = statsOf(bare, "flat");
    const heart = statsOf(bare, "heart");
    assert.ok(flatForm.keep > oval.keep && flatForm.lift < oval.lift);
    assert.ok(heart.impact > oval.impact && heart.speed < oval.speed);
  });

  test("a flat stone keeps going longer without taps than a round one", () => {
    const river = createRiver(29);
    assert.ok(
      play(launch(river, flat, bare, "flat"), null).skips >
        play(launch(river, flat, bare, "round"), null).skips
    );
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
    assert.ok(settled.unlocked.some((option) => option.id === "gold"));
  });
});
