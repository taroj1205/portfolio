import { Drawer } from "@base-ui/react/drawer";
import { Switch } from "@base-ui/react/switch";
import { Tabs } from "@base-ui/react/tabs";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { font, ink } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { axes, traitsOf } from "../_lib/cosmetics";
import type { Part } from "../_lib/cosmetics";
import { pointsLeft, progressOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import { statsOf } from "../_lib/simulate";
import type { Gear } from "../_lib/simulate";
import { useCopy, useLang } from "./lang";
import { Radar } from "./radar";
import { RecordTab } from "./record-tab";
import { StoneTab } from "./stone-tab";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const GOLD = "#ffd27a";

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
    backgroundColor: "rgb(13 16 26 / 0.95)",
    backgroundImage:
      "radial-gradient(120% 60% at 50% 0%, rgb(255 210 122 / 0.08), transparent 60%)",
    borderColor: "rgb(255 255 255 / 0.1)",
    borderStyle: "solid",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: "1px 1px 0",
    boxShadow: "0 -20px 60px rgb(0 0 0 / 0.5)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    height: "min(88dvh, 54rem)",
    maxWidth: "30rem",
    outline: "none",
    overflow: "hidden",
    paddingInline: "1.25rem",
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
    marginBottom: "0.75rem",
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
    flex: 1,
    flexDirection: "column",
    minHeight: 0,
  },
  tabs: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "1rem",
    marginTop: "0.9rem",
    minHeight: 0,
  },
  list: {
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderRadius: 999,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    padding: 4,
    position: "relative",
  },
  tab: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "calc(0.2em * var(--track, 1))",
    minHeight: "2.5rem",
    position: "relative",
    transitionDuration: "200ms",
    transitionProperty: "color",
    zIndex: 1,
  },
  tabActive: {
    color: "#1c1406",
  },
  indicator: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 55%, #d9962a)`,
    borderRadius: 999,
    boxShadow: "0 4px 16px rgb(255 190 80 / 0.35)",
    height: "calc(100% - 8px)",
    left: 0,
    position: "absolute",
    top: 4,
    transitionDuration: "260ms",
    transitionProperty: "translate, width",
    transitionTimingFunction: EASE,
    translate: "var(--active-tab-left) 0",
    width: "var(--active-tab-width)",
  },
  panel: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "1rem",
    marginInline: "-0.25rem",
    minHeight: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
    paddingInline: "0.25rem",
    outline: "none",
  },
  pinned: {
    overflowY: "hidden",
    paddingBottom: 0,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  groupName: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "calc(0.15em * var(--track, 1))",
    margin: 0,
  },
  tabDot: {
    backgroundColor: "#e5533d",
    borderRadius: 999,
    display: "inline-block",
    height: 7,
    marginInlineStart: "0.3rem",
    verticalAlign: "top",
    width: 7,
  },
  level: {
    alignItems: "baseline",
    display: "flex",
    gap: "0.6rem",
    justifyContent: "space-between",
  },
  levelNumber: {
    backgroundClip: "text",
    backgroundImage: `linear-gradient(180deg, #fff4c2, ${GOLD} 45%, #c98a1e)`,
    color: "transparent",
    fontFamily: font.mincho,
    fontSize: "2.2rem",
    fontWeight: 800,
    lineHeight: 1,
    WebkitBackgroundClip: "text",
  },
  points: {
    backgroundColor: "rgb(255 210 122 / 0.15)",
    borderRadius: 999,
    color: GOLD,
    fontSize: "0.75rem",
    fontWeight: 800,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    paddingBlock: "0.3rem",
    paddingInline: "0.7rem",
  },
  bar: {
    backgroundColor: "rgb(255 255 255 / 0.1)",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  barFill: (part: number) => ({
    backgroundImage: `linear-gradient(90deg, ${GOLD}, #fff1b8)`,
    height: "100%",
    width: `${Math.round(part * 100)}%`,
  }),
  row: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.04)",
    borderRadius: 16,
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    paddingBlock: "0.7rem",
    paddingInline: "0.9rem",
  },
  name: {
    fontWeight: 700,
  },
  value: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontWeight: 800,
    marginInlineStart: "0.5rem",
  },
  note: {
    color: ink.soft,
    display: "block",
    fontSize: "0.7rem",
  },
  stepper: {
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    gap: "0.35rem",
  },
  step: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 12,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: "1.2rem",
    fontWeight: 700,
    height: "2.5rem",
    justifyContent: "center",
    opacity: { default: 1, ":disabled": 0.3 },
    padding: 0,
    transform: { default: null, ":active": "scale(0.92)" },
    width: "2.5rem",
  },
  plus: {
    backgroundColor: "rgb(255 210 122 / 0.18)",
    borderColor: "rgb(255 210 122 / 0.5)",
    color: GOLD,
  },
  ghost: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    paddingBlock: "0.55rem",
    paddingInline: "1.2rem",
  },
  switch: {
    backgroundColor: "rgb(255 255 255 / 0.16)",
    borderRadius: 999,
    borderWidth: 0,
    cursor: "pointer",
    flexShrink: 0,
    height: "1.75rem",
    padding: 3,
    transitionDuration: "200ms",
    transitionProperty: "background-color",
    width: "3.1rem",
  },
  switchOn: {
    backgroundColor: GOLD,
  },
  thumb: {
    backgroundColor: "#fffaf3",
    borderRadius: 999,
    boxShadow: "0 2px 6px rgb(0 0 0 / 0.35)",
    display: "block",
    height: "calc(1.75rem - 6px)",
    transitionDuration: "200ms",
    transitionProperty: "translate",
    transitionTimingFunction: EASE,
    width: "calc(1.75rem - 6px)",
  },
  thumbOn: {
    translate: "1.35rem 0",
  },
  segments: {
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderRadius: 999,
    display: "flex",
    flexShrink: 0,
    gap: 2,
    padding: 3,
  },
  segment: {
    backgroundColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.8rem",
    fontWeight: 700,
    paddingBlock: "0.45rem",
    paddingInline: "0.85rem",
    transitionDuration: "160ms",
    transitionProperty: "background-color, color",
  },
  segmentOn: {
    backgroundColor: GOLD,
    color: "#1c1406",
  },
  howto: {
    color: ink.soft,
    display: "grid",
    fontSize: "0.82rem",
    gap: "0.5rem",
    lineHeight: 1.6,
    margin: 0,
    paddingInlineStart: "1.2rem",
  },
});

const TABS = ["stone", "skill", "record", "setting"] as const;

const LANGUAGES: [Lang, string][] = [
  ["ja", "日本語"],
  ["en", "English"],
];

const closing = (status: string | undefined) =>
  status === "starting" || status === "ending";

interface WorkshopProps {
  open: boolean;
  opener: RefObject<HTMLButtonElement | null>;
  save: Save;
  settings: Settings;
  onClose: () => void;
  onTune: (key: keyof Gear, step: 1 | -1) => void;
  onWear: (part: Part, id: string) => void;
  onWearCombo: (id: string) => void;
  onRespec: () => void;
  onSettings: (next: Settings) => void;
}

export const Workshop = ({
  open,
  opener,
  save,
  settings,
  onClose,
  onTune,
  onWear,
  onWearCombo,
  onRespec,
  onSettings,
}: WorkshopProps) => {
  const lang = useLang();
  const copy = useCopy();
  const progress = progressOf(save.xp);
  const left = pointsLeft(save);
  const stats = statsOf(save.gear, traitsOf(save.look));

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
              {copy.workshop.title}
            </Drawer.Title>
            <Drawer.Content {...stylex.props(styles.content)}>
              <Tabs.Root defaultValue="stone" {...stylex.props(styles.tabs)}>
                <Tabs.List {...stylex.props(styles.list)}>
                  {TABS.map((value) => (
                    <Tabs.Tab
                      className={(state) =>
                        stylex.props(
                          styles.tab,
                          state.active && styles.tabActive
                        ).className
                      }
                      key={value}
                      value={value}
                    >
                      {copy.workshop.tabs[value]}
                      {value === "stone" && save.unseen.length > 0 ? (
                        <span
                          aria-hidden="true"
                          {...stylex.props(styles.tabDot)}
                        />
                      ) : null}
                    </Tabs.Tab>
                  ))}
                  <Tabs.Indicator {...stylex.props(styles.indicator)} />
                </Tabs.List>

                <Tabs.Panel
                  value="stone"
                  {...stylex.props(styles.panel, styles.pinned)}
                >
                  <StoneTab
                    onWear={onWear}
                    onWearCombo={onWearCombo}
                    save={save}
                  />
                </Tabs.Panel>

                <Tabs.Panel value="skill" {...stylex.props(styles.panel)}>
                  <div {...stylex.props(styles.level)}>
                    <span {...stylex.props(styles.levelNumber)}>
                      Lv.{progress.level}
                    </span>
                    <span {...stylex.props(styles.points)}>
                      {copy.workshop.points(left)}
                    </span>
                  </div>
                  <div {...stylex.props(styles.bar)}>
                    <div {...stylex.props(styles.barFill(progress.part))} />
                  </div>
                  <Radar preview={null} stats={stats} />
                  {axes.map((axis) => (
                    <div key={axis.key} {...stylex.props(styles.row)}>
                      <span>
                        <span {...stylex.props(styles.name)}>
                          {axis.label[lang]}
                        </span>
                        <span {...stylex.props(styles.value)}>
                          {save.gear[axis.gear]}
                        </span>
                        <span {...stylex.props(styles.note)}>
                          {axis.note[lang]}
                        </span>
                      </span>
                      <span {...stylex.props(styles.stepper)}>
                        <button
                          aria-label={copy.workshop.lower(axis.label[lang])}
                          disabled={save.gear[axis.gear] === 0}
                          onClick={() => {
                            onTune(axis.gear, -1);
                          }}
                          type="button"
                          {...stylex.props(styles.step)}
                        >
                          −
                        </button>
                        <button
                          aria-label={copy.workshop.raise(axis.label[lang])}
                          disabled={left <= 0}
                          onClick={() => {
                            onTune(axis.gear, 1);
                          }}
                          type="button"
                          {...stylex.props(styles.step, styles.plus)}
                        >
                          ＋
                        </button>
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={onRespec}
                    type="button"
                    {...stylex.props(styles.ghost)}
                  >
                    {copy.workshop.respec}
                  </button>
                </Tabs.Panel>

                <Tabs.Panel value="record" {...stylex.props(styles.panel)}>
                  <RecordTab save={save} />
                </Tabs.Panel>

                <Tabs.Panel value="setting" {...stylex.props(styles.panel)}>
                  <div {...stylex.props(styles.row)}>
                    <span>
                      <span {...stylex.props(styles.name)}>
                        {copy.workshop.mute.label}
                      </span>
                      <span {...stylex.props(styles.note)}>
                        {copy.workshop.mute.note}
                      </span>
                    </span>
                    <Switch.Root
                      aria-label={copy.workshop.mute.label}
                      checked={settings.muted}
                      className={(state) =>
                        stylex.props(
                          styles.switch,
                          state.checked && styles.switchOn
                        ).className
                      }
                      onCheckedChange={(checked) => {
                        onSettings({ ...settings, muted: checked });
                      }}
                    >
                      <Switch.Thumb
                        className={(state) =>
                          stylex.props(
                            styles.thumb,
                            state.checked && styles.thumbOn
                          ).className
                        }
                      />
                    </Switch.Root>
                  </div>
                  <div {...stylex.props(styles.row)}>
                    <span {...stylex.props(styles.name)}>
                      {copy.workshop.language}
                    </span>
                    <ToggleGroup
                      aria-label={copy.workshop.language}
                      onValueChange={([next]) => {
                        if (next !== undefined) {
                          onSettings({ ...settings, lang: next });
                        }
                      }}
                      value={[lang]}
                      {...stylex.props(styles.segments)}
                    >
                      {LANGUAGES.map(([value, label]) => (
                        <Toggle
                          className={(state) =>
                            stylex.props(
                              styles.segment,
                              state.pressed && styles.segmentOn
                            ).className
                          }
                          key={value}
                          lang={value}
                          value={value}
                        >
                          {label}
                        </Toggle>
                      ))}
                    </ToggleGroup>
                  </div>
                  <section {...stylex.props(styles.group)}>
                    <h3 {...stylex.props(styles.groupName)}>
                      {copy.workshop.howto}
                    </h3>
                    <ol {...stylex.props(styles.howto)}>
                      {copy.workshop.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </section>
                </Tabs.Panel>
              </Tabs.Root>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
