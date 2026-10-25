import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import type { Point } from "../../_lib/svg";
import {
  ROUNDS,
  SIZE,
  canGuess,
  grade,
  isSeed,
  kinds,
  newSeed,
  pointsOf,
  puzzlesOf,
} from "./puzzles";
import type { Kind, Puzzle } from "./puzzles";

const SEEDS = Array.from({ length: 400 }, (_, i) => 1 + i * 5_368_709);

const inside = (point: Point) =>
  point.x >= 0 && point.x <= SIZE && point.y >= 0 && point.y <= SIZE;

const puzzleOf = (seed: number, kind: Kind): Puzzle => {
  const found = puzzlesOf(seed).find((puzzle) => puzzle.kind === kind);
  assert.ok(found);

  return found;
};

const firstAnswer = (puzzle: Puzzle) => {
  const [answer] = puzzle.answers;

  return answer;
};

const pivotOf = (puzzle: Puzzle) => {
  assert.ok(puzzle.pivot);

  return puzzle.pivot;
};

describe("mebunryo puzzles", () => {
  it("builds the same ten kinds in order from a seed, the same way every time", () => {
    const puzzles = puzzlesOf(42);
    assert.equal(puzzles.length, ROUNDS);
    assert.deepEqual(
      puzzles.map((puzzle) => puzzle.kind),
      [...kinds]
    );
    assert.deepEqual(puzzlesOf(42), puzzles);
    assert.notDeepEqual(puzzlesOf(43), puzzles);
  });

  it("keeps every drawn point and at least one answer on the board", () => {
    for (const seed of SEEDS) {
      for (const puzzle of puzzlesOf(seed)) {
        const drawn = [
          ...puzzle.dots,
          ...puzzle.lines.flatMap((line) =>
            line.tone === "guide" ? [] : [line.from, line.to]
          ),
        ];

        for (const point of drawn) {
          assert.ok(
            inside(point),
            `${puzzle.kind} ${seed} ${point.x},${point.y}`
          );
        }

        for (const { centre, radius } of puzzle.circles) {
          assert.ok(centre.x - radius >= 0 && centre.x + radius <= SIZE);
          assert.ok(centre.y - radius >= 0 && centre.y + radius <= SIZE);
        }

        assert.ok(puzzle.answers.some(inside), `${puzzle.kind} ${seed}`);
      }
    }
  });

  it("scores an exact point answer as no error and full points", () => {
    for (const kind of kinds.filter(
      (one) => one !== "right" && one !== "parallel"
    )) {
      const puzzle = puzzleOf(7, kind);
      const graded = grade(puzzle, firstAnswer(puzzle));
      assert.equal(graded.error, 0);
      assert.equal(graded.points, 100);
    }
  });

  it("measures point answers in px and loses a point for every 0.4px", () => {
    const puzzle = puzzleOf(7, "centre");
    const answer = firstAnswer(puzzle);
    const graded = grade(puzzle, { x: answer.x + 6, y: answer.y + 8 });
    assert.equal(puzzle.unit, "px");
    assert.ok(Math.abs(graded.error - 10) < 1e-9);
    assert.equal(graded.points, 75);
  });

  it("accepts a right angle on either side of the line, measured in degrees", () => {
    const puzzle = puzzleOf(11, "right");
    const pivot = pivotOf(puzzle);
    assert.equal(puzzle.unit, "deg");

    for (const answer of puzzle.answers) {
      const far = {
        x: pivot.x + (answer.x - pivot.x) * 0.3,
        y: pivot.y + (answer.y - pivot.y) * 0.3,
      };

      assert.ok(grade(puzzle, far).error < 1e-9);
    }

    const [line] = puzzle.lines;
    assert.ok(Math.abs(grade(puzzle, line.to).error - 90) < 1e-9);
    assert.equal(grade(puzzle, line.to).points, 0);
  });

  it("accepts a parallel line drawn either way from the dot", () => {
    const puzzle = puzzleOf(11, "parallel");
    const pivot = pivotOf(puzzle);

    for (const answer of puzzle.answers) {
      assert.ok(grade(puzzle, answer).error < 1e-9);
    }

    const tilted = (degrees: number) => {
      const answer = firstAnswer(puzzle);

      const angle =
        Math.atan2(answer.y - pivot.y, answer.x - pivot.x) +
        (degrees * Math.PI) / 180;

      return {
        x: pivot.x + Math.cos(angle) * 80,
        y: pivot.y + Math.sin(angle) * 80,
      };
    };

    assert.ok(Math.abs(grade(puzzle, tilted(3)).error - 3) < 1e-9);
    assert.equal(grade(puzzle, tilted(3)).points, 80);
  });

  it("does not take an aim too close to the dot to have a direction", () => {
    const puzzle = puzzleOf(3, "right");
    const pivot = pivotOf(puzzle);
    assert.equal(canGuess(puzzle, { x: pivot.x + 4, y: pivot.y }), false);
    assert.equal(canGuess(puzzle, { x: pivot.x + 40, y: pivot.y }), true);
    assert.equal(canGuess(puzzleOf(3, "centre"), pivot), true);
  });

  it("never scores below zero", () => {
    assert.equal(pointsOf(500, "px"), 0);
    assert.equal(pointsOf(90, "deg"), 0);
  });

  it("makes seeds the challenge link can carry", () => {
    assert.ok(isSeed(newSeed(() => 0)));
    assert.ok(isSeed(newSeed(() => 0.9999999999)));
    assert.equal(isSeed(0), false);
  });
});
