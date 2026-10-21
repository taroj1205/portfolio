import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  framesOf,
  isValidGame,
  lastCall,
  scoreOf,
  stateOf,
  tallyOf,
} from "./score";

const perfect = Array.from({ length: 12 }, () => 10);

describe("keshibo scoring", () => {
  test("a perfect game is 300 and twelve strikes in a row", () => {
    assert.equal(scoreOf(perfect), 300);
    assert.ok(isValidGame(perfect));
    assert.equal(tallyOf(perfect).streak, 12);
    assert.deepEqual(framesOf(perfect).at(-1)?.marks, ["X", "X", "X"]);
  });

  test("spares add the next roll, and all spares of five make 150", () => {
    const fives = Array.from({ length: 21 }, () => 5);
    assert.equal(scoreOf(fives), 150);
    assert.ok(isValidGame(fives));
    assert.equal(tallyOf(fives).spares, 10);
    assert.deepEqual(framesOf(fives)[0].marks, ["5", "/"]);
  });

  test("a strike waits for two more rolls before it has a total", () => {
    const frames = framesOf([10, 3]);
    assert.deepEqual(frames[0], { marks: ["", "X"], total: null });
    assert.equal(framesOf([10, 3, 4])[1].total, 24);
  });

  test("open frames, gutters and misses read the way a score sheet does", () => {
    const rolls = [0, 0, 9, 0, 0, 10, ...Array.from({ length: 14 }, () => 0)];
    assert.equal(scoreOf(rolls), 19);
    assert.ok(isValidGame(rolls));
    assert.deepEqual(framesOf(rolls)[2].marks, ["-", "/"]);
    assert.equal(tallyOf(rolls).misses, 18);
  });

  test("the tenth frame gives a bonus roll only after a strike or a spare", () => {
    const open = [...Array.from({ length: 18 }, () => 0), 3, 4];
    assert.ok(isValidGame(open));
    assert.equal(isValidGame([...open, 1]), false);
    const spare = [...Array.from({ length: 18 }, () => 0), 3, 7, 10];
    assert.ok(isValidGame(spare));
    assert.deepEqual(framesOf(spare)[9].marks, ["3", "/", "X"]);
    const strikeThenSplit = [...Array.from({ length: 18 }, () => 0), 10, 6, 4];
    assert.deepEqual(framesOf(strikeThenSplit)[9].marks, ["X", "6", "/"]);
  });

  test("a rack only refills between frames and after the tenth frame clears", () => {
    assert.deepEqual(stateOf([]), { fresh: true, frame: 0, over: false });
    assert.equal(stateOf([7]).fresh, false);
    assert.equal(stateOf([7, 2]).fresh, true);
    const tenth = Array.from({ length: 18 }, () => 0);
    assert.equal(stateOf([...tenth, 10]).fresh, true);
    assert.equal(stateOf([...tenth, 10, 4]).fresh, false);
    assert.equal(stateOf([...tenth, 6, 4]).fresh, true);
    assert.equal(stateOf([...tenth, 6, 3]).over, true);
  });

  test("impossible pinfall is never a valid game", () => {
    assert.equal(
      isValidGame([...Array.from({ length: 19 }, () => 0), 11]),
      false
    );
    assert.equal(
      isValidGame([6, 6, ...Array.from({ length: 18 }, () => 0)]),
      false
    );
    assert.equal(isValidGame(perfect.slice(1)), false);
    assert.deepEqual(framesOf([6, 6]), []);
  });

  test("the call after a roll names strikes in a row, spares and misses", () => {
    assert.deepEqual(lastCall([10, 10, 10]), { kind: "strike", run: 3 });
    assert.deepEqual(lastCall([3, 7]), { kind: "spare", run: 0 });
    assert.deepEqual(lastCall([3, 0]), { kind: "miss", run: 0 });
    assert.equal(lastCall([3, 5]), null);
  });
});
