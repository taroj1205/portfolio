# Checking games

- `bun run spell` checks with `en-GB`, so code and copy use British spellings (`colour`, `vigour`). Add a new game's romanised name to `words` in `cspell.json`.
- In `agent-browser`, `keydown Space` sends an empty `key`, so a game listening for `" "` never sees it. Hold the space bar with `agent-browser keydown " "` and release it with `agent-browser keyup " "`.
