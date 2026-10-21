# Game art

Art that a game draws on canvas and also shows in its OG image and games-list card is described once and drawn by two small interpreters, as 餅つき does: shape data in `src/app/games/mochitsuki/_lib/art.ts`, canvas drawing in `_lib/paint.ts`, SVG drawing in `_components/art.tsx`.

- `next/og` (satori) ignores `x` and `y` on a nested `<svg>` and draws it at the origin. Place a group with `<g transform="translate(x y) scale(s)">` in OG routes.
- In the browser, CSS `transform-origin` on an SVG group inside a scaled `<g>` resolves against the outer viewBox. When a card animates parts of shared art, wrap the art in a nested `<svg viewBox="0 0 1 1">` so origins like `1.007px 0.342px` stay in the art's own units.
- Write fills as `{ solid }`, `{ linear }` or `{ radial }` objects and branch with `in`. The lint rejects `typeof` checks.
