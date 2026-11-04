# Home page UI

Notes for changing motion, corners, colour, type and the photo viewer on the home page (`src/app/[lang]`, `src/components`).

Every visual element needs a job a visitor would notice it doing. Do not add decoration that implies a meaning the content lacks; a line joining list items, for example, reads as a sequence.

## Motion

- In `stylex.props(a, b)` a later style that sets `transitionProperty` or `transitionDuration` replaces the earlier one whole. Put `shared.pressable` before a style with its own transitions, or the hover colour snaps.
- `stylex.when.ancestor(":hover")` needs `stylex.defaultMarker()` on the ancestor. Without it the child hover (such as the `Arrow` nudge) never fires.
- Under reduced motion nothing animates and nothing moves on hover or press. `globals.css` zeroes transition durations and delays, keyframe animations (fades included) run only under `media.motion`, and every hover or `:active` transform, `translate`, `scale` or `rotate` sits behind `media.motion`.
- Pace follows ja.mt: interactions run 150–350ms, reveals 550–900ms over at most 1rem, on `ease.out` or `ease.spring`.
- The nav's active chip carries a vermilion hairline that fills as you read through that section, up to the next nav section. It is the only accent in the nav; keep it that way so it reads as progress.

## Smooth corners

- Squircles come from Lisse through `src/components/smooth.tsx`: `<Smooth radius={28}>` around one element, or `useSmooth(ref, 28)` in a client component. Do not use `<SmoothCorners asChild>`: when it draws effects it wraps the element in a `div`, which breaks grid and flex layout.
- Lisse mounts its border and shadow overlay on the element's parent. Put scroll and reveal transforms on that parent, as the postcard's `arrival` wrapper does, or the shadow stays behind while the card moves.
- Lisse reads `box-shadow` once on mount, so keep it off elements whose shadow changes on hover. Never give a Lisse element a CSS `border`: Lisse redraws it and writes the padding inline in px, which then ignores breakpoints. Pass `edged` (or `useSmooth(ref, r, true)`) for the hairline instead.
- Keep Lisse off focusable elements unless the focus ring sits inside (`outlineOffset: -4`, as the gallery windows do).

## Type and colour

- Mona Sans is the only Latin face. Its `tabular-nums` figures are slab-serif monospace digits, so do not set `fontVariantNumeric: "tabular-nums"`.
- The second accent is `color.vermilion`. Cream with orange reads as Claude's brand, so keep orange out.
- Text selection is drawn by `Highlighter` (`src/components/highlighter.tsx`) as a vermilion marker stroke per line. Native `::selection` is hidden only under `[data-highlighter]`, so it comes back if the script fails.
- Add `data-spotlight` to a list of peer choices, such as the contact links or side projects. Hovering one item dims and blurs the rest. Leave it off lists people read.

## Photo viewer and view transitions

- The page has two photo `<dialog>`s, one for the band and one for the gallery. In browser tests target `dialog[open]`.
- Gate view transitions with `canTransition()` from `src/lib/view-transition.ts`. Safari 18.0–18.1 and Firefox 144–146 have `startViewTransition` but no transition types.
- Photo steps use a transition scoped to the dialog's `<figure>` where `element.startViewTransition` exists (Chrome) and a WAAPI slide-in elsewhere. A document-wide transition would block clicks on the arrows while it runs.

## Cross-browser checks

- Do not format dates in client components. Safari's ICU writes `Sep` where Node writes `Sept`, and the mismatch breaks hydration. Format on the server, as `nameMonths` in `src/lib/format.ts` does for the chart.
- Run WebKit and Firefox with Playwright from a scratch directory outside the repo (`bun add playwright`, then `node node_modules/playwright/cli.js install webkit firefox`).
