import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { dailyTarget } from "./daily";
import { STANDARD } from "./judge";
import {
  gapOf,
  planOf,
  queryOf,
  readResult,
  shareOf,
  targetOf,
} from "./result";
import type { Result } from "./result";

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("share links", () => {
  test("round-trip the time and which target it was", () => {
    const standard = { day: null, time: 998 };
    const daily = { day: 12, time: 742 };
    assert.deepEqual(roundTrip(standard), standard);
    assert.deepEqual(roundTrip(daily), daily);
    assert.equal(queryOf(standard), "t=998");
    assert.equal(queryOf(daily), "t=742&n=12");
  });

  test("carry only the time and the day, so the target can't be faked", () => {
    assert.equal(targetOf(null), STANDARD);
    assert.equal(targetOf(12), dailyTarget(12));
    assert.deepEqual(readResult({ g: "742", t: "742" }), {
      day: null,
      time: 742,
    });
    assert.equal(gapOf({ day: 3, time: dailyTarget(3) }), 0);
  });

  test("reject broken, oversized and tampered links", () => {
    const bad = [
      {},
      { n: "3" },
      { t: "" },
      { t: "0" },
      { t: "-998" },
      { t: "998.5" },
      { t: "9.98" },
      { t: "0998" },
      { t: "1e3" },
      { t: "0x3e6" },
      { t: " 998" },
      { t: "299" },
      { t: "6001" },
      { t: "9".repeat(5000) },
      { t: ["998", "999"] },
      { n: "0", t: "998" },
      { n: "-1", t: "998" },
      { n: "1.5", t: "998" },
      { n: "100000", t: "998" },
      { n: "", t: "998" },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
    assert.deepEqual(readResult({ t: "300" }), { day: null, time: 300 });
    assert.deepEqual(readResult({ n: "99999", t: "6000" }), {
      day: 99_999,
      time: 6000,
    });
  });
});

describe("plans", () => {
  test("the standard target is always 10.00", () => {
    assert.deepEqual(planOf("standard", null, 5), {
      day: null,
      target: STANDARD,
      today: false,
    });
  });

  test("the daily follows the day the run starts", () => {
    assert.deepEqual(planOf("daily", null, 5), {
      day: 5,
      target: dailyTarget(5),
      today: true,
    });
  });

  test("a challenge sets the target, and only today's daily counts as the daily", () => {
    assert.deepEqual(planOf("daily", { day: null, time: 990 }, 5), {
      day: null,
      target: STANDARD,
      today: false,
    });
    assert.equal(planOf("standard", { day: 5, time: 990 }, 5).today, true);
    assert.deepEqual(planOf("daily", { day: 4, time: 990 }, 5), {
      day: 4,
      target: dailyTarget(4),
      today: false,
    });
  });
});

describe("share text", () => {
  test("a 10.00 run names the time, the gap and the rank", () => {
    const share = shareOf({ day: null, time: 998 }, "https://x.y", "ja");
    assert.equal(
      share.text,
      "無音の十秒 10.00秒チャレンジ\n9.98秒（−0.02）· 体内時計\n🌕🌕🌕🌕🌕\nタイマーが消えても、10.00秒ぴったりで止められる？\n#無音の十秒"
    );
    assert.equal(share.url, "https://x.y/games/ma?t=998&l=ja");
    assert.equal(share.image, "https://x.y/games/ma/og?t=998&l=ja");
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  test("the daily shows how close it was but never the target or the time", () => {
    const day = 12;
    const time = dailyTarget(day) + 9;
    for (const lang of ["ja", "en"] as const) {
      const { text } = shareOf({ day, time }, "https://x.y", lang);
      assert.ok(text.includes("#12"));
      assert.ok(text.includes("+0.09"));
      assert.ok(!text.includes((time / 100).toFixed(2)));
      assert.ok(!text.includes((dailyTarget(day) / 100).toFixed(2)));
    }
    assert.equal(
      shareOf({ day, time }, "https://x.y", "en").text,
      "Ten Silent Seconds daily #12\n+0.09s · Master\n🌕🌕🌕🌕🌑\n#無音の十秒 #TenSilentSeconds"
    );
  });
});
