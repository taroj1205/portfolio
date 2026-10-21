<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

You are the most incredible designer, and this is a place for you to showcase how incredible you are, go all out.

Users should not require interaction for content to be revealed for a perfect UX site.

Do not leave comments in code unless explicitly stated.

## Read on demand

- Before adding or changing interactive UI in `src/app/games` (overlays, sheets, menus, tabs, switches, toggles, other controls), read `docs/base-ui-in-games.md` in full. It names the Base UI package docs to read for the primitive; do not write Base UI code from memory.
- Before adding a game, or changing what a game saves, in `src/app/games`, read `docs/game-saves-and-profiles.md`. Every game keeps the data a future player profile would want, and save changes must not reset existing saves.
- Before naming a game, or changing a game's title, share text or hashtags, in `src/app/games`, read `docs/game-titles-and-hashtags.md`. Every game needs a distinctive title and hashtags, never the bare genre word, and a new title must be checked in the HUD header and the OG image.
- Before drawing art that a game shares between its canvas, its OG image and its games-list card, read `docs/game-art.md`.
- Before running the checks for a game in `src/app/games`, or playing one in a headless browser, read `docs/checking-games.md`.
- When you lose time on something these notes should have told you, such as a wrong guess, a stale instruction, or a failure that took several tries, or when the user corrects you, read `docs/keeping-instructions-current.md` and update the notes in the same change.
