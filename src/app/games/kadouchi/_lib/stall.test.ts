import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { LID, kinds, prizeIds } from "./prizes";
import type { PrizeId } from "./prizes";
import {
  CORK,
  CORKS,
  FULL,
  cleared,
  createStall,
  faceOf,
  powerOf,
  shoot,
  spotOf,
  step,
  still,
  strike,
  swayOf,
  targetOf,
} from "./stall";
import type { Stall } from "./stall";

interface Aim {
  u: number;
  v: number;
  power: number;
}

const settle = (stall: Stall) => {
  for (let i = 0; i < 240 && !still(stall); i += 1) {
    step(stall, 1 / 60);
  }
};

const fire = (stall: Stall, id: PrizeId, aim: Aim) => {
  const prize = stall.prizes.find((each) => each.id === id);
  assert.ok(prize);
  const spot = spotOf(prize, aim.u, aim.v);
  shoot(stall, spot.x, spot.y, aim.power);
  settle(stall);

  return prize;
};

const corksFor = (id: PrizeId, aim: () => Aim) => {
  const stall = createStall(() => 0.5);

  for (let shot = 1; shot <= CORKS; shot += 1) {
    if (fire(stall, id, aim()).down !== null) {
      return shot;
    }
  }

  return null;
};

const top = { power: 1, u: 0, v: 0.92 };
const corner = () => ({ power: 1, u: 0.9, v: 0.92 });
const small = prizeIds.filter((id) => kinds[id].size === "small");
const big = prizeIds.filter((id) => kinds[id].size === "big");
const rocking = prizeIds.filter((id) => kinds[id].size !== "big");

const reach = (held: number) =>
  Math.max(
    ...Array.from({ length: 200 }, (_, i) => {
      const { x, y } = swayOf(held, i / 20);

      return Math.hypot(x, y);
    })
  );

const swing = (id: PrizeId, aim: Aim) => {
  const stall = createStall(() => 0.5);
  const prize = stall.prizes.find((each) => each.id === id);
  assert.ok(prize);
  strike(prize, aim.u, aim.v, aim.power);
  let peak = 0;

  for (let i = 0; i < 120; i += 1) {
    step(stall, 1 / 120);
    peak = Math.max(peak, prize.pitch);
  }

  return peak;
};

describe("where and how hard the cork lands", () => {
  it("a higher hit rocks a prize further back", () => {
    for (const id of rocking) {
      const low = swing(id, { power: 1, u: 0, v: 0.2 });
      const high = swing(id, { power: 1, u: 0, v: 0.9 });
      assert.ok(high > low, `${id} ${low} ${high}`);
    }
  });

  it("a harder hit rocks a prize further back", () => {
    for (const id of rocking) {
      const soft = swing(id, { power: 0.4, u: 0, v: 0.6 });
      const hard = swing(id, { power: 1, u: 0, v: 0.6 });
      assert.ok(hard > soft, `${id} ${soft} ${hard}`);
    }
  });

  it("a higher or harder hit lands with more force on every prize, even ones too heavy to rock", () => {
    for (const id of prizeIds) {
      const hit = (v: number, power: number) => {
        const prize = createStall(() => 0.5).prizes.find(
          (each) => each.id === id
        );

        assert.ok(prize);

        return strike(prize, 0, v, power).force;
      };

      assert.ok(hit(0.9, 1) > hit(0.2, 1), id);
      assert.ok(hit(0.6, 1) > hit(0.6, 0.4), id);
    }
  });

  it("a full shot near the top tips a small prize at once", () => {
    for (const id of small) {
      assert.equal(
        corksFor(id, () => top),
        1,
        id
      );
    }
  });

  it("a soft shot near the top or a full shot low down leaves a small prize standing", () => {
    for (const id of small) {
      const stall = createStall(() => 0.5);
      assert.equal(fire(stall, id, { ...top, power: 0.3 }).down, null, id);
      assert.equal(fire(stall, id, { power: 1, u: 0, v: 0.2 }).down, null, id);
    }
  });

  it("a rocked prize settles back upright", () => {
    const stall = createStall(() => 0.5);
    const prize = fire(stall, "neko", top);
    assert.equal(prize.down, null);
    assert.equal(prize.pitch, 0);
  });
});

describe("big prizes", () => {
  it("never move from a hit in the middle, however high or hard", () => {
    for (const id of big) {
      for (const v of [0.2, 0.5, 0.92]) {
        const stall = createStall(() => 0.5);

        for (let shot = 0; shot < CORKS; shot += 1) {
          fire(stall, id, { power: 1, u: 0, v });
        }

        const prize = stall.prizes.find((each) => each.id === id);
        assert.equal(prize?.down, null, `${id} ${v}`);
        assert.equal(prize?.z, 0, `${id} ${v}`);
        assert.equal(prize?.yaw, 0, `${id} ${v}`);
      }
    }
  });

  it("twist back and fall after a few full shots on a top corner", () => {
    for (const id of big) {
      const needed = corksFor(id, corner);
      assert.ok(
        needed !== null && needed >= 2 && needed <= 4,
        `${id} ${needed}`
      );
    }
  });

  it("only twist from a corner hit high up, not low down", () => {
    for (const id of big) {
      const stall = createStall(() => 0.5);
      const prize = fire(stall, id, { power: 1, u: 0.9, v: 0.3 });
      assert.equal(prize.yaw, 0, id);
    }
  });

  it("a top corner hit moves the prize back toward the edge of the shelf", () => {
    const stall = createStall(() => 0.5);
    const prize = fire(stall, "game", { power: 1, u: -0.9, v: 0.92 });
    assert.ok(prize.z > 5, String(prize.z));
    assert.ok(prize.yaw < 0, String(prize.yaw));
  });
});

describe("a whole round", () => {
  it("a careful player can clear the stall with corks to spare", () => {
    const stall = createStall(() => 0.5);

    for (const id of prizeIds) {
      const aim = kinds[id].size === "small" ? () => top : corner;

      while (stall.corks > 0) {
        if (fire(stall, id, aim()).down !== null) {
          break;
        }
      }
    }

    assert.ok(cleared(stall));
    assert.ok(stall.corks >= 2, String(stall.corks));
    assert.deepEqual(stall.got, prizeIds);
  });

  it("a player who only aims at the middle never takes a big prize home", () => {
    const stall = createStall(() => 0.5);

    for (let shot = 0; shot < CORKS; shot += 1) {
      const standing = stall.prizes.filter((prize) => prize.down === null);
      const target = standing[shot % standing.length];
      fire(stall, target.id, { power: 1, u: 0, v: 0.6 });
    }

    assert.ok(
      stall.got.every((id) => kinds[id].size !== "big"),
      stall.got.join(",")
    );
  });

  it("a cork that hits nothing is a miss and still used up", () => {
    const stall = createStall(() => 0.5);
    shoot(stall, 500, 40, 1);
    const events = step(stall, 0.5);
    assert.deepEqual(events, [{ type: "miss", x: 500, y: 40 }]);
    assert.equal(stall.corks, CORKS - 1);
    assert.equal(stall.hits, 0);
  });

  it("no cork is fired once they run out", () => {
    const stall = createStall(() => 0.5);

    for (let shot = 0; shot < CORKS; shot += 1) {
      assert.ok(shoot(stall, 500, 40, 1));
    }

    assert.equal(shoot(stall, 500, 40, 1), false);
  });
});

describe("the rifle", () => {
  it("shoots harder the longer it is held, up to full", () => {
    assert.ok(powerOf(0) < powerOf(FULL / 2));
    assert.equal(powerOf(FULL), 1);
    assert.equal(powerOf(FULL * 3), 1);
  });

  it("sways wider once held past full", () => {
    assert.ok(reach(FULL + 1) > reach(FULL) * 3);
  });
});

describe("the cork", () => {
  it("has a width, so a shot just past an edge or the top still clips the prize", () => {
    const stall = createStall(() => 0.5);
    const prize = stall.prizes.find((each) => each.id === "hanabi");
    assert.ok(prize);
    const face = faceOf(prize);
    const edge = targetOf(stall, face.x + face.half + CORK - 1, face.top + 10);
    assert.equal(edge?.prize.id, "hanabi");
    assert.equal(edge?.u, 1);
    const above = targetOf(stall, face.x, face.top - CORK + 1);
    assert.equal(above?.v, 1);
    assert.equal(
      targetOf(stall, face.x + face.half + CORK + 4, face.top + 10),
      null
    );
  });

  it("clips a box on its lid, which is drawn above the front", () => {
    const stall = createStall(() => 0.5);
    const prize = stall.prizes.find((each) => each.id === "hanabi");
    assert.ok(prize);
    const face = faceOf(prize);
    const lid = kinds.hanabi.d * LID;
    assert.equal(targetOf(stall, face.x, face.top - lid)?.v, 1);
    assert.equal(targetOf(stall, face.x, face.top - lid - CORK - 1), null);
  });

  it("misses the empty shelf beside a round prize and clips its drawn edge", () => {
    const stall = createStall(() => 0.5);
    const prize = stall.prizes.find((each) => each.id === "daruma");
    assert.ok(prize);
    const face = faceOf(prize);
    const high = spotOf(prize, -1, 0.86);
    assert.equal(targetOf(stall, face.x - face.half + 6, high.y), null);
    assert.equal(targetOf(stall, high.x - CORK - 1, high.y), null);
    const edge = targetOf(stall, high.x - CORK + 1, high.y);
    assert.equal(edge?.prize.id, "daruma");
    assert.equal(edge?.u, -1);
  });

  it("follows the lucky cat's raised paw on one side only", () => {
    const stall = createStall(() => 0.5);
    const prize = stall.prizes.find((each) => each.id === "neko");
    assert.ok(prize);
    const face = faceOf(prize);
    const paw = spotOf(prize, 1, 0.8);
    const cheek = spotOf(prize, -1, 0.8);
    assert.ok(paw.x - face.x > face.x - cheek.x + 15);
    assert.equal(targetOf(stall, paw.x, paw.y)?.prize.id, "neko");
    assert.equal(targetOf(stall, 2 * face.x - paw.x, paw.y), null);
  });
});
