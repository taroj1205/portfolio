# Base UI in games

Rules and working examples for building game UI (`src/app/games`) with `@base-ui/react`. Import per component (`@base-ui/react/dialog`) and style the parts with StyleX props.

## Read before writing

Do not write Base UI code from memory. Part names, props, and `data-*` attributes change between versions and may differ from your training data. Before using or editing any primitive:

1. Read this file in full.
2. Read the package page for that primitive, `node_modules/@base-ui/react/docs/react/components/<name>.md` (index at `node_modules/@base-ui/react/docs/index.md`). If the installed version has no page for it, say so instead of guessing the API.
3. Load the `base-ui-integration` skill when wiring close events, portals, focus, or unmount animations.

## Rules

- Use Base UI for anything with state, focus, keyboard, or overlay behaviour: Dialog, Drawer, Popover, Menu, Tooltip, Tabs, Switch, Toggle, ToggleGroup, Slider, RadioGroup, Select, NumberField, Field. Do not recreate these with `<button aria-pressed>`, `role="dialog"`, or manual focus and Escape handling.
- A plain `<button type="button">` is fine for a one-off action with no state of its own.
- The canvas, game loop, and in-game pointer or key input stay custom. Base UI is for the chrome around them.
- Share a wrapper in `src/app/games/_components` when two games need the same primitive, as `share-button.tsx` does for Menu.

## Where each primitive is used

| Need | Primitive | Example |
| --- | --- | --- |
| Modal choice | `Dialog` | `src/app/games/_components/language-picker.tsx` |
| Bottom sheet with swipe | `Drawer` | `src/app/games/mizukiri/_components/workshop.tsx` |
| Anchored hint, hover or tap | `Popover` | `src/app/games/mizukiri/_components/radar.tsx` |
| Action list | `Menu` | `src/app/games/_components/share-button.tsx` |
| Sections | `Tabs` | `src/app/games/mizukiri/_components/stone-tab.tsx`, `workshop.tsx` |
| On/off setting | `Switch` | `src/app/games/mizukiri/_components/workshop.tsx` |
| Pick one of a few | `ToggleGroup` with `Toggle` | `src/app/games/mizukiri/_components/workshop.tsx` |

Everything else Base UI ships (Tooltip, Slider, RadioGroup, Select, NumberField, Field, Toast) has no game example yet. Read its page in `node_modules/@base-ui/react/docs/react/components/` and add the first example to the table.

## Patterns in use

### Overlays are controlled by the parent

`Root` takes `open` and an `onOpenChange` that only forwards the close to the parent. The parent owns the state, so the game can pause or resume around it.

```tsx
<Drawer.Root
  onOpenChange={(next) => {
    if (!next) {
      onClose();
    }
  }}
  open={open}
>
```

Compose `Portal`, `Backdrop`, `Popup` and add `Title` and `Description` so the overlay is labelled. Menus and popovers add a `Positioner` between `Portal` and `Popup`.

### Styling with StyleX

Static parts spread `stylex.props` directly:

```tsx
<Dialog.Popup {...stylex.props(styles.popup)}>
```

Parts that change with state pass `className` as a function and return the StyleX class name:

```tsx
<Switch.Root
  className={(state) =>
    stylex.props(styles.switch, state.checked && styles.switchOn).className
  }
>
```

Exit animations follow `state.transitionStatus` the same way (see the backdrop and popup in `workshop.tsx`), and `state.swiping` drives the drag style on `Drawer.Popup`. Keep a `prefers-reduced-motion` branch on any keyframe, as `language-picker.tsx` does with `media.reduce`.

### Focus returns to the opener

`Drawer.Popup` takes `finalFocus={opener}` so focus lands back on the control that opened it. Pass the opener ref the same way for any overlay the game opens from a HUD button.

### Triggers that are not buttons

When the trigger is not a `<button>`, such as an SVG node, set `nativeButton={false}` and pass the element through `render`:

```tsx
<Popover.Trigger
  nativeButton={false}
  openOnHover
  render={<g {...stylex.props(styles.target)} />}
>
```

### Shared wrappers

A primitive used by more than one game gets a wrapper in `src/app/games/_components`. `share-button.tsx` wraps `Menu` and takes `className` and `style` so each game keeps its own look.
