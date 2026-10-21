# Checking games

- `bun run spell` checks with `en-GB`, so code and copy use British spellings (`colour`, `vigour`). Add a new game's romanised name to `words` in `cspell.json`.
- To check a timed game to the hundredth, send touches over CDP with `Input.dispatchTouchEvent` and a `timestamp` in epoch seconds. The page's `event.timeStamp` follows it, so a stop at exactly 10.00s after the start can be replayed instead of hoped for.
- In `agent-browser`, `keydown Space` sends an empty `key`, so a game listening for `" "` never sees it. Hold the space bar with `agent-browser keydown " "` and release it with `agent-browser keyup " "`.
