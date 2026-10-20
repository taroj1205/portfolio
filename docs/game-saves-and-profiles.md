# Game saves and profiles

There are no accounts. Each game keeps its progress in `localStorage`, and a profile page may read those saves later. Don't build the profile now. Do keep the data it would need, because totals can't be rebuilt after the fact.

## Rules for every game

- One versioned key per game, `<game>.vN`, read and written through `createStore` in `src/app/games/_lib/storage.ts` with a zod schema. Language and sound are not game data. They live in `games.settings.v1` (`src/app/games/_lib/settings.ts`).
- `createStore` returns its fallback when the schema fails, and the next write replaces the old save. A new required field therefore wipes everyone's progress. Add every new field with `.default(...)` or `.prefault({})`, as `tally` does in `src/app/games/mizukiri/_lib/save.ts`. Bump the key only for an incompatible change, and copy the old save across once, as `loadProfiles` does for mizukiri and `inherited` does for settings.
- Keep the save to plain data: counts, bests, flags and ids. No UI state, no text, nothing the code can recompute.
- Keep identity out of saves and share links. No names or emails. Links carry only the totals.

## What a game keeps from its first release

- `runs`, counted when a run is settled, as `settle` does in `src/app/games/hoshiai/_lib/save.ts`.
- The best of the main score, and the best of each secondary measure (best chain, longest flight).
- Lifetime totals of what the game is about (merges, distance, skips). Add to them, never overwrite.
- The highest milestone and collection progress, such as 星合's `top` or mizukiri's `endings` and `grades` counts.
- Rare achievements as a count or a flag (Milky Ways, perfect throws).
- When and how long someone played: `firstPlayed` and `lastPlayed` (epoch ms) and total seconds played. Neither existing game records these yet, and they can't be filled in later.

## Stats card

A game with a shareable stats card follows the `career` pieces in 星合 and mizukiri:

- `_lib/career.ts` with `readCareer`, `careerQuery` and `careerShare`.
- A dialog or tab that shows it with `ShareButton`.
- A stats branch in `og/route.tsx` and in the page's `generateMetadata`.

Test that the link round-trips and that a result link and a stats link are not read as each other. Their query keys must stay apart (a result needs `p`, 星合 stats need `b` and `r`).
