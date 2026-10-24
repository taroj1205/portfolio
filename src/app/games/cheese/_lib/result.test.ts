import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import { dishes } from "./dishes";
import {
  lengthText,
  measure,
  queryOf,
  readResult,
  resultOf,
  shareOf,
  titleOf,
  trailOf,
} from "./result";
import type { Result } from "./result";
import { fresh, loadSave, settle } from "./save";
import type { Save } from "./save";
import { MOON, createRun } from "./stretch";

const tower: Result = { dish: "pizza", mm: 345_678 };

const play = (save: Save, result: Result, at = 1000) =>
  settle(save, { at, end: "set", result, seconds: 20, snaps: 2, sweet: 6 });

describe("cheese results", () => {
  it("a shared link round-trips and rejects anything it can't trust", () => {
    const query = Object.fromEntries(new URLSearchParams(queryOf(tower)));
    assert.deepEqual(readResult(query), tower);
    assert.equal(readResult({ d: "sushi", m: "1000" }), null);
    assert.equal(readResult({ d: "pizza", m: "10" }), null);
    assert.equal(readResult({ d: "pizza", m: String(MOON * 10 + 1) }), null);
    assert.equal(readResult({ d: "pizza", m: "12.5" }), null);
    assert.equal(readResult({}), null);
  });

  it("lengths read in the unit a person would say", () => {
    assert.deepEqual(measure(3), { unit: "cm", value: "3.0" });
    assert.deepEqual(measure(1234), { unit: "m", value: "12.3" });
    assert.deepEqual(measure(377_600), { unit: "km", value: "3.78" });
    assert.deepEqual(measure(MOON), { unit: "km", value: "384,400" });
    assert.equal(lengthText(1234, "en"), "12.3 m");
    assert.equal(lengthText(1234, "ja"), "12.3m");
  });

  it("a run reaching the Moon is stored as exactly the Moon", () => {
    const run = createRun(dishes.fondue, 1);
    run.length = MOON;
    assert.deepEqual(resultOf(run), { dish: "fondue", mm: MOON * 10 });
    assert.equal(titleOf(resultOf(run), "ja"), "月まで届いた");
  });

  it("the share text names the length, the height and the tags", () => {
    const share = shareOf(tower, "https://example.com", "ja");
    assert.equal(
      share.text,
      `月までチーズ ピザのチーズが345.7mのびた。東京タワー超え！\n${trailOf(tower)}\n#月までチーズ`
    );
    assert.equal(
      share.url,
      "https://example.com/games/cheese?d=pizza&m=345678&l=ja"
    );
    assert.equal(
      share.image,
      "https://example.com/games/cheese/og?d=pizza&m=345678&l=ja"
    );
    const english = shareOf(tower, "https://example.com", "en");
    assert.ok(english.text.endsWith("#月までチーズ #CheeseToTheMoon"));
    assert.equal(titleOf({ dish: "pizza", mm: 40 }, "en"), "Just a nibble");
  });
});

describe("cheese save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 4000, runs: 3 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 4000, runs: 3 });
  });

  it("keeps the totals a player profile would need", () => {
    const first = play(fresh, { dish: "corndog", mm: 9000 }, 5000);
    assert.equal(first.record, false);
    const second = play(first.save, tower, 9000);
    assert.equal(second.record, false);
    assert.equal(
      play(second.save, { ...tower, mm: tower.mm + 1 }).record,
      true
    );
    assert.equal(play(second.save, { dish: "corndog", mm: 9001 }).record, true);
    assert.deepEqual(second.save, {
      best: tower.mm,
      dishes: { corndog: 9000, fondue: 0, pizza: tower.mm },
      firstPlayed: 5000,
      lastPlayed: 9000,
      moons: 0,
      runs: 2,
      seconds: 40,
      sets: 2,
      snaps: 4,
      stretched: 9000 + tower.mm,
      sweet: 12,
      top: 5,
    });
  });
});
