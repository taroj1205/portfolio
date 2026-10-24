# Game settings, tips and copy

## Settings

- A per-player switch, or a flag that a tip was shown, is a setting, not game data. It lives in `games.settings.v1` (`src/app/games/_lib/settings.ts`) next to language and sound. Give the field a `.default(...)`, put it in `fresh`, and update the expected objects in `settings.test.ts`. A field without a default makes `createStore` drop every saved setting.
- Name a setting for what it does (`distantRing`, 「輪を遠くに出す」), never for its history ("classic", 「前の輪」). A history name stops making sense the next time the behaviour changes.
- A missing field takes the new default, so changing a default changes it for every player who already saved settings. Say so in the PR.

## When a player asks for the old behaviour

- Add a named switch, then choose the default by who sees the difference. If only a band of players does (mizukiri's ring differs only above 60 m/s, which is 216 km/h), default to the behaviour they already know and tell them about the other one at the moment the difference starts to matter.
- Compare the two behaviours with a side-by-side video at the same timing before deciding. How to record one is in `docs/checking-games.md`.

## One-time tip

- Show it on the result sheet, never mid-run: during a run every tap goes to the canvas. `RingTip` in `src/app/games/mizukiri/_components/result-sheet.tsx` reuses the `unlocks` card styles.
- Decide it in the session when the run ends, with a pure function that has a test (`ringTipDue` in `_lib/simulate.ts`). Save the "seen" flag when the tip is shown, not when its button is pressed, so it comes once even if ignored. Skip it for players who already chose.

## Copy

- Match the game's voice: casual plain Japanese, as in 「コピーした」 and 「つける」/「つけてる」.
- When a switch has a positive name, do not describe the other state with "off" or 「オフ」. 「輪を遠くに出す」 plus 「オフにする」 is a double negative. Name the result instead: 「真下にする」.
- Keep a button and its pressed state the same width (「真下にする」/「真下にした」). A longer pressed label wraps the card and shifts the sheet.
- Write `ja` and `en` together in `copy.ts`, then read the Japanese on a 390px screenshot. A lone character on its own line shows up there.
