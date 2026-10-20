# Base UI in games

Reference for building game UI with `@base-ui/react`. The rules live in `AGENTS.md`; this is where to look for working examples. These examples do not replace the package docs: read `node_modules/@base-ui/react/docs/react/components/<name>.md` for the primitive before using or changing it.

## Where each primitive is used

| Need | Primitive | Example |
| --- | --- | --- |
| Modal choice | `Dialog` | `src/app/games/mizukiri/_components/language-picker.tsx` |
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
