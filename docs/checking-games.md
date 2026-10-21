# Checking games

- `bun run spell` checks with `en-GB`, so code and copy use British spellings (`colour`, `vigour`). Add a new game's romanised name to `words` in `cspell.json`.
- To check a timed game to the hundredth, send touches over CDP with `Input.dispatchTouchEvent` and a `timestamp` in epoch seconds. The page's `event.timeStamp` follows it, so a stop at exactly 10.00s after the start can be replayed instead of hoped for.
- `bunx vp check` stops at the first formatting problem and prints no lint or type errors. Run `bunx vp check --fix` to format, then read the lint output it prints. The lint rejects nested ternaries, functions with complexity over 20, and colour literals in JSX attributes (`fill="#fff"`); keep colours in a `const` object and pass `fill={paint.moon}`.
- In `agent-browser`, `keydown Space` sends an empty `key`, so a game listening for `" "` never sees it. Hold the space bar with `agent-browser keydown " "` and release it with `agent-browser keyup " "`.
- `agent-browser` has no touch tap for Chrome pages. For 390×844 touch play, drive Chrome over CDP: `Emulation.setTouchEmulationEnabled`, then `Input.dispatchTouchEvent` with `touchStart` and `touchEnd`.
