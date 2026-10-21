import { Drawer } from "@base-ui/react/drawer";
import { Meter } from "@base-ui/react/meter";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { font, ink } from "../../_components/theme.stylex";
import type { Lang, Text } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import {
  coreIds,
  cores,
  patternIds,
  patterns,
  rubberIds,
  rubbers,
  formIds,
  forms,
  sleeveIds,
  sleeves,
  statKeys,
  statsOf,
} from "../_lib/eraser";
import type { Design } from "../_lib/eraser";
import { EraserPicture } from "./eraser-picture";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const GOLD = "#ffd27a";
const paint = { shine: "#ffffff" };

const styles = stylex.create({
  backdrop: {
    backgroundColor: "rgb(3 5 10)",
    inset: 0,
    position: "fixed",
    transitionDuration: "450ms",
    transitionProperty: "opacity",
    transitionTimingFunction: EASE,
  },
  backdropShown: {
    opacity: "calc(0.6 * (1 - var(--drawer-swipe-progress, 0)))",
  },
  backdropHidden: {
    opacity: 0,
  },
  viewport: {
    alignItems: "flex-end",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "fixed",
  },
  popup: {
    backgroundColor: "rgb(22 16 12 / 0.96)",
    backgroundImage:
      "radial-gradient(120% 60% at 50% 0%, rgb(255 190 110 / 0.1), transparent 60%)",
    borderColor: "rgb(255 255 255 / 0.1)",
    borderStyle: "solid",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: "1px 1px 0",
    boxShadow: "0 -20px 60px rgb(0 0 0 / 0.5)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    maxHeight: "min(90dvh, 52rem)",
    maxWidth: "30rem",
    outline: "none",
    overflow: "hidden",
    paddingTop: "0.75rem",
    transform: "translateY(var(--drawer-swipe-movement-y, 0))",
    transitionDuration: "450ms",
    transitionProperty: "transform",
    transitionTimingFunction: EASE,
    width: "100%",
  },
  popupHidden: {
    transform: "translateY(100%)",
  },
  popupSwiping: {
    transitionDuration: "0ms",
    userSelect: "none",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "rgb(255 255 255 / 0.25)",
    borderRadius: 999,
    flexShrink: 0,
    height: 4,
    marginBottom: "0.6rem",
    width: "2.75rem",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.2rem",
    fontWeight: 700,
    letterSpacing: "calc(0.3em * var(--track, 1))",
    margin: 0,
    textAlign: "center",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    minHeight: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
    paddingInline: "1.25rem",
    paddingTop: "0.8rem",
  },
  stage: {
    alignItems: "center",
    flexShrink: 0,
    marginInline: "1.25rem",
    marginTop: "0.8rem",
    backgroundImage:
      "radial-gradient(70% 90% at 50% 40%, rgb(255 226 170 / 0.22), transparent 70%), linear-gradient(180deg, #c99a66, #a8774a)",
    borderRadius: 20,
    boxShadow:
      "inset 0 1px 0 rgb(255 255 255 / 0.25), inset 0 -20px 40px rgb(60 30 10 / 0.25)",
    display: "grid",
    gap: "0.9rem",
    gridTemplateColumns: "1.1fr 1fr",
    padding: "1rem",
  },
  picture: {
    aspectRatio: "4 / 3",
    filter: "drop-shadow(0 10px 10px rgb(50 24 8 / 0.45))",
    width: "100%",
  },
  stats: {
    alignContent: "center",
    display: "grid",
    gap: "0.5rem",
  },
  stat: {
    alignItems: "center",
    color: "#2a1608",
    display: "grid",
    gap: "0.15rem 0.5rem",
    gridTemplateColumns: "1fr auto",
  },
  statLabel: {
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "calc(0.08em * var(--track, 1))",
  },
  statValue: {
    fontFamily: font.mincho,
    fontSize: "0.8rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  track: {
    backgroundColor: "rgb(60 30 10 / 0.22)",
    borderRadius: 999,
    gridColumn: "1 / -1",
    height: 6,
    overflow: "hidden",
  },
  indicator: {
    backgroundImage: "linear-gradient(90deg, #5a2c10, #2a1608)",
    borderRadius: 999,
    display: "block",
    height: "100%",
    transitionDuration: "320ms",
    transitionProperty: "width",
    transitionTimingFunction: EASE,
  },
  note: {
    color: ink.soft,
    fontSize: "0.8rem",
    lineHeight: 1.6,
    margin: 0,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  groupName: {
    color: ink.soft,
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "calc(0.16em * var(--track, 1))",
    margin: 0,
  },
  segments: {
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderRadius: 16,
    display: "grid",
    gap: 3,
    gridAutoColumns: "1fr",
    gridAutoFlow: "column",
    padding: 3,
  },
  segment: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 13,
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    fontFamily: "inherit",
    fontSize: "0.78rem",
    fontWeight: 700,
    gap: "0.2rem",
    justifyContent: "center",
    minHeight: "2.6rem",
    outlineColor: GOLD,
    outlineOffset: 2,
    paddingBlock: "0.35rem",
    paddingInline: "0.3rem",
    transitionDuration: "160ms",
    transitionProperty: "background-color, color",
    whiteSpace: "nowrap",
  },
  segmentOn: {
    backgroundColor: "rgb(255 240 214 / 0.95)",
    color: "#2a1608",
  },
  formThumb: {
    display: "block",
    height: "1.6rem",
    width: "2.4rem",
  },
  swatches: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.55rem",
  },
  swatch: {
    backgroundColor: "transparent",
    overflow: "hidden",
    borderColor: "rgb(255 255 255 / 0.25)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "inset 0 -3px 6px rgb(0 0 0 / 0.2), inset 0 2px 3px rgb(255 255 255 / 0.3)",
    cursor: "pointer",
    height: "2.5rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    padding: 0,
    transform: { default: null, ":active": "scale(0.9)" },
    transitionDuration: "160ms",
    transitionProperty: "transform, box-shadow",
    width: "2.5rem",
  },
  swatchOn: {
    boxShadow: `0 0 0 3px rgb(22 16 12), 0 0 0 5px ${GOLD}`,
  },
  disc: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  done: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.25)",
    color: "#1c1406",
    cursor: "pointer",
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.1rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
});

const closing = (status: string | undefined) =>
  status === "starting" || status === "ending";

const segmentClass = (state: { pressed: boolean }) =>
  stylex.props(styles.segment, state.pressed && styles.segmentOn).className;

interface PickProps<Id extends string> {
  label: string;
  ids: readonly Id[];
  value: Id;
  lang: Lang;
  names: Record<Id, { name: Text }>;
  onPick: (id: Id) => void;
}

const Segments = <Id extends string>({
  label,
  ids,
  value,
  lang,
  names,
  onPick,
  preview,
}: PickProps<Id> & { preview?: (id: Id) => Design }) => (
  <section {...stylex.props(styles.group)}>
    <h3 {...stylex.props(styles.groupName)}>{label}</h3>
    <ToggleGroup
      aria-label={label}
      onValueChange={([next]) => {
        const id = ids.find((each) => each === next);
        if (id !== undefined) {
          onPick(id);
        }
      }}
      value={[value]}
      {...stylex.props(styles.segments)}
    >
      {ids.map((id) => (
        <Toggle className={segmentClass} key={id} value={id}>
          {preview === undefined ? null : (
            <span {...stylex.props(styles.formThumb)}>
              <EraserPicture design={preview(id)} />
            </span>
          )}
          {names[id].name[lang]}
        </Toggle>
      ))}
    </ToggleGroup>
  </section>
);

const Swatches = <Id extends string>({
  label,
  ids,
  value,
  lang,
  names,
  onPick,
  colors,
}: PickProps<Id> & { colors: Record<Id, { color: string }> }) => (
  <section {...stylex.props(styles.group)}>
    <h3 {...stylex.props(styles.groupName)}>{label}</h3>
    <ToggleGroup
      aria-label={label}
      onValueChange={([next]) => {
        const id = ids.find((each) => each === next);
        if (id !== undefined) {
          onPick(id);
        }
      }}
      value={[value]}
      {...stylex.props(styles.swatches)}
    >
      {ids.map((id) => (
        <Toggle
          aria-label={names[id].name[lang]}
          className={(state) =>
            stylex.props(styles.swatch, state.pressed && styles.swatchOn)
              .className
          }
          key={id}
          value={id}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            {...stylex.props(styles.disc)}
          >
            <circle cx={10} cy={10} fill={colors[id].color} r={10} />
            <ellipse
              cx={8}
              cy={6}
              fill={paint.shine}
              opacity={0.35}
              rx={5}
              ry={3}
            />
          </svg>
        </Toggle>
      ))}
    </ToggleGroup>
  </section>
);

interface WorkshopProps {
  lang: Lang;
  open: boolean;
  opener: RefObject<HTMLButtonElement | null>;
  design: Design;
  onDesign: (design: Design) => void;
  onClose: () => void;
}

export const Workshop = ({
  lang,
  open,
  opener,
  design,
  onDesign,
  onClose,
}: WorkshopProps) => {
  const words = copy[lang].workshop;
  const stats = statsOf(design);
  const pick =
    <Key extends keyof Design>(key: Key) =>
    (id: Design[Key]) => {
      onDesign({ ...design, [key]: id });
    };
  return (
    <Drawer.Root
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      open={open}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={(state) =>
            stylex.props(
              styles.backdrop,
              closing(state.transitionStatus)
                ? styles.backdropHidden
                : styles.backdropShown
            ).className
          }
        />
        <Drawer.Viewport {...stylex.props(styles.viewport)}>
          <Drawer.Popup
            className={(state) =>
              stylex.props(
                styles.popup,
                closing(state.transitionStatus) && styles.popupHidden,
                state.swiping && styles.popupSwiping
              ).className
            }
            finalFocus={opener}
          >
            <span aria-hidden="true" {...stylex.props(styles.handle)} />
            <Drawer.Title {...stylex.props(styles.title)}>
              {words.title}
            </Drawer.Title>
            <div {...stylex.props(styles.stage)}>
              <span {...stylex.props(styles.picture)}>
                <EraserPicture design={design} />
              </span>
              <div {...stylex.props(styles.stats)}>
                {statKeys.map((key) => (
                  <Meter.Root
                    key={key}
                    value={stats[key]}
                    {...stylex.props(styles.stat)}
                  >
                    <Meter.Label {...stylex.props(styles.statLabel)}>
                      {words.stats[key]}
                    </Meter.Label>
                    <Meter.Value {...stylex.props(styles.statValue)} />
                    <Meter.Track {...stylex.props(styles.track)}>
                      <Meter.Indicator {...stylex.props(styles.indicator)} />
                    </Meter.Track>
                  </Meter.Root>
                ))}
              </div>
            </div>
            <Drawer.Content {...stylex.props(styles.content)}>
              <Drawer.Description {...stylex.props(styles.note)}>
                {words.note}
              </Drawer.Description>
              <Segments
                ids={formIds}
                label={words.groups.form}
                lang={lang}
                names={forms}
                onPick={pick("form")}
                preview={(form) => ({ ...design, form })}
                value={design.form}
              />
              <Segments
                ids={coreIds}
                label={words.groups.core}
                lang={lang}
                names={cores}
                onPick={pick("core")}
                value={design.core}
              />
              <Swatches
                colors={sleeves}
                ids={sleeveIds}
                label={words.groups.sleeve}
                lang={lang}
                names={sleeves}
                onPick={pick("sleeve")}
                value={design.sleeve}
              />
              <Segments
                ids={patternIds}
                label={words.groups.pattern}
                lang={lang}
                names={patterns}
                onPick={pick("pattern")}
                value={design.pattern}
              />
              <Swatches
                colors={rubbers}
                ids={rubberIds}
                label={words.groups.rubber}
                lang={lang}
                names={rubbers}
                onPick={pick("rubber")}
                value={design.rubber}
              />
              <Drawer.Close {...stylex.props(styles.done)}>
                {words.done}
              </Drawer.Close>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
