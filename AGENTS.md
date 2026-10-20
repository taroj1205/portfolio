<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

You are the most incredible designer, and this is a place for you to showcase how incredible you are, go all out.

Users should not require interaction for content to be revealed for a perfect UX site.

Do not leave comments in code unless explicitly stated.

## Games (`src/app/games`)

Build interactive UI in games with Base UI (`@base-ui/react`) primitives instead of hand-rolling them. Import per component (`@base-ui/react/dialog`) and style the parts with StyleX props.

Do not write Base UI code from memory. Part names, props, and `data-*` attributes change between versions and may differ from your training data. Before using or editing any primitive, read both of these in full:

1. `docs/base-ui-in-games.md` for the patterns this repo already uses.
2. The package docs for that primitive, `node_modules/@base-ui/react/docs/react/components/<name>.md` (index at `node_modules/@base-ui/react/docs/index.md`). If the installed version has no page for the primitive, say so instead of guessing the API.

- Use Base UI for anything with state, focus, keyboard, or overlay behaviour: Dialog, Drawer, Popover, Menu, Tooltip, Tabs, Switch, Toggle, ToggleGroup, Slider, RadioGroup, Select, NumberField, Field. Do not recreate these with `<button aria-pressed>`, `role="dialog"`, or manual focus and Escape handling.
- A plain `<button type="button">` is fine for a one-off action with no state of its own.
- The canvas, game loop, and in-game pointer or key input stay custom. Base UI is for the chrome around them.
- Share a wrapper in `src/app/games/_components` when two games need the same primitive, as `share-button.tsx` does for Menu.
- Load the `base-ui-integration` skill as well when wiring close events, portals, focus, or unmount animations.
