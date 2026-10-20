import { Drawer } from "@base-ui/react/drawer";
import { Switch } from "@base-ui/react/switch";
import { Tabs } from "@base-ui/react/tabs";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { RefObject } from "react";

import { colorOf, conditionOf, isOpen, keyOf, parts } from "../_lib/cosmetics";
import type { Part } from "../_lib/cosmetics";
import { pointsLeft, progressOf, skills, unlocksOf } from "../_lib/save";
import type { Save, Settings } from "../_lib/save";
import { statsOf } from "../_lib/simulate";
import type { Gear } from "../_lib/simulate";
import { stoneSprite } from "../_lib/sprites";
import { Preview } from "./preview";
import { Radar } from "./radar";
import { font, ink } from "./theme.stylex";

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
    maxHeight: "88dvh",
    maxWidth: "30rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
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
    letterSpacing: "0.3em",
    margin: 0,
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "0.9rem",
  },
  list: {
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderRadius: 999,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
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
    letterSpacing: "0.2em",
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
    flexDirection: "column",
    gap: "1rem",
    outline: "none",
  },
  stage: {
    alignItems: "center",
    backgroundImage:
      "radial-gradient(60% 70% at 50% 60%, rgb(120 170 210 / 0.18), transparent 70%)",
    borderRadius: 22,
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    paddingBlock: "0.75rem 0.9rem",
  },
  stone: {
    display: "block",
    filter: "drop-shadow(0 14px 18px rgb(0 0 0 / 0.5))",
    height: "auto",
    width: "9.5rem",
  },
  caption: {
    color: ink.soft,
    fontSize: "0.78rem",
    letterSpacing: "0.12em",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  groupHead: {
    alignItems: "baseline",
    display: "flex",
    justifyContent: "space-between",
  },
  groupName: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    margin: 0,
  },
  small: {
    color: ink.soft,
    fontSize: "0.72rem",
  },
  grid: {
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "repeat(4, 1fr)",
  },
  tile: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.05)",
    borderColor: "rgb(255 255 255 / 0.1)",
    borderRadius: 16,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "flex",
    flexDirection: "column",
    fontFamily: "inherit",
    gap: "0.35rem",
    minHeight: "5.4rem",
    paddingBlock: "0.6rem 0.5rem",
    paddingInline: "0.25rem",
    position: "relative",
    transform: { default: null, ":active": "scale(0.96)" },
    transitionDuration: "160ms",
    transitionProperty: "transform, border-color, background-color",
  },
  worn: {
    backgroundColor: "rgb(255 210 122 / 0.14)",
    borderColor: GOLD,
    boxShadow: "inset 0 0 0 1px rgb(255 210 122 / 0.35)",
  },
  locked: {
    opacity: 0.4,
  },
  unseen: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 55%, #d9962a)`,
    borderRadius: 999,
    boxShadow: "0 4px 12px rgb(255 190 80 / 0.45)",
    color: "#1c1406",
    fontSize: "0.55rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    lineHeight: 1,
    paddingBlock: "0.2rem",
    paddingInline: "0.4rem",
    position: "absolute",
    right: -4,
    top: -6,
  },
  tabDot: {
    backgroundColor: GOLD,
    borderRadius: 999,
    boxShadow: "0 0 0 2px rgb(13 16 26)",
    display: "inline-block",
    height: 7,
    marginInlineStart: "0.3rem",
    verticalAlign: "top",
    width: 7,
  },
  tileName: {
    fontSize: "0.72rem",
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: "center",
  },
  tileNote: {
    color: GOLD,
    fontSize: "0.6rem",
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: "center",
  },
  lock: {
    color: ink.soft,
    fontSize: "0.6rem",
    fontWeight: 700,
    textAlign: "center",
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
    letterSpacing: "0.08em",
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
    letterSpacing: "0.12em",
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

const TABS = [
  ["stone", "石"],
  ["skill", "腕前"],
  ["setting", "設定"],
] as const;

const SETTINGS = [
  ["muted", "音を消す", "効果音と川の音"],
  ["lite", "軽量モード", "動きがカクつくときに"],
] as const;

const closing = (status: string | undefined) =>
  status === "starting" || status === "ending";

interface WorkshopProps {
  open: boolean;
  opener: RefObject<HTMLButtonElement | null>;
  save: Save;
  onClose: () => void;
  onTune: (key: keyof Gear, step: 1 | -1) => void;
  onWear: (part: Part, id: string) => void;
  onRespec: () => void;
  onSettings: (next: Settings) => void;
}

export const Workshop = ({
  open,
  opener,
  save,
  onClose,
  onTune,
  onWear,
  onRespec,
  onSettings,
}: WorkshopProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { color, form, pattern } = save.look;
  const progress = progressOf(save.xp);
  const left = pointsLeft(save);
  const unlocked = unlocksOf(save);
  const stats = statsOf(save.gear, form);
  const ghost =
    preview === null || preview === form ? null : statsOf(save.gear, preview);
  const names = parts.map(
    ({ part, options }) =>
      options.find((option) => option.id === save.look[part])?.name ?? ""
  );

  const paintStone = (canvas: HTMLCanvasElement | null) => {
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 256, 160);
      ctx.drawImage(stoneSprite(colorOf(color), form, pattern), 0, 0);
    }
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
              石と腕前
            </Drawer.Title>
            <Drawer.Content>
              <Tabs.Root defaultValue="stone" {...stylex.props(styles.tabs)}>
                <Tabs.List {...stylex.props(styles.list)}>
                  {TABS.map(([value, label]) => (
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
                      {label}
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

                <Tabs.Panel value="stone" {...stylex.props(styles.panel)}>
                  <div {...stylex.props(styles.stage)}>
                    <canvas
                      aria-hidden="true"
                      height={160}
                      ref={paintStone}
                      width={256}
                      {...stylex.props(styles.stone)}
                    />
                    <span {...stylex.props(styles.caption)}>
                      {names.join("・")}
                    </span>
                  </div>
                  {parts.map(({ part, name, options }) => (
                    <section key={part} {...stylex.props(styles.group)}>
                      <div {...stylex.props(styles.groupHead)}>
                        <h3 {...stylex.props(styles.groupName)}>{name}</h3>
                        {part === "form" ? (
                          <span {...stylex.props(styles.small)}>
                            形で性能が変わる
                          </span>
                        ) : null}
                      </div>
                      <div {...stylex.props(styles.grid)}>
                        {options.map((option) => {
                          const available = isOpen(option.unlock, unlocked);
                          const worn = save.look[part] === option.id;
                          const isNew = save.unseen.includes(
                            keyOf({ option, part })
                          );
                          const peek =
                            part === "form" && available
                              ? () => {
                                  setPreview(option.id);
                                }
                              : undefined;
                          return (
                            <button
                              aria-pressed={worn}
                              disabled={!available}
                              key={option.id}
                              onBlur={() => {
                                setPreview(null);
                              }}
                              onClick={() => {
                                onWear(part, option.id);
                              }}
                              onFocus={peek}
                              onPointerEnter={peek}
                              onPointerLeave={() => {
                                setPreview(null);
                              }}
                              type="button"
                              {...stylex.props(
                                styles.tile,
                                worn && styles.worn,
                                !available && styles.locked
                              )}
                            >
                              {isNew ? (
                                <span {...stylex.props(styles.unseen)}>
                                  NEW
                                </span>
                              ) : null}
                              <Preview option={option} part={part} />
                              <span {...stylex.props(styles.tileName)}>
                                {option.name}
                              </span>
                              {available ? null : (
                                <span {...stylex.props(styles.lock)}>
                                  {conditionOf(option.unlock)}
                                </span>
                              )}
                              {available && option.note !== undefined ? (
                                <span {...stylex.props(styles.tileNote)}>
                                  {option.note}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                  <Radar preview={ghost} stats={stats} />
                </Tabs.Panel>

                <Tabs.Panel value="skill" {...stylex.props(styles.panel)}>
                  <div {...stylex.props(styles.level)}>
                    <span {...stylex.props(styles.levelNumber)}>
                      Lv.{progress.level}
                    </span>
                    <span {...stylex.props(styles.points)}>
                      振れるポイント {left}
                    </span>
                  </div>
                  <div {...stylex.props(styles.bar)}>
                    <div {...stylex.props(styles.barFill(progress.part))} />
                  </div>
                  <Radar preview={null} stats={stats} />
                  {skills.map((skill) => (
                    <div key={skill.key} {...stylex.props(styles.row)}>
                      <span>
                        <span {...stylex.props(styles.name)}>{skill.name}</span>
                        <span {...stylex.props(styles.value)}>
                          {save.gear[skill.key]}
                        </span>
                        <span {...stylex.props(styles.note)}>{skill.note}</span>
                      </span>
                      <span {...stylex.props(styles.stepper)}>
                        <button
                          aria-label={`${skill.name}を1下げる`}
                          disabled={save.gear[skill.key] === 0}
                          onClick={() => {
                            onTune(skill.key, -1);
                          }}
                          type="button"
                          {...stylex.props(styles.step)}
                        >
                          −
                        </button>
                        <button
                          aria-label={`${skill.name}を1上げる`}
                          disabled={left <= 0}
                          onClick={() => {
                            onTune(skill.key, 1);
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
                    ポイントを全部戻す
                  </button>
                </Tabs.Panel>

                <Tabs.Panel value="setting" {...stylex.props(styles.panel)}>
                  {SETTINGS.map(([key, label, note]) => (
                    <div key={key} {...stylex.props(styles.row)}>
                      <span>
                        <span {...stylex.props(styles.name)}>{label}</span>
                        <span {...stylex.props(styles.note)}>{note}</span>
                      </span>
                      <Switch.Root
                        aria-label={label}
                        checked={save.settings[key]}
                        className={(state) =>
                          stylex.props(
                            styles.switch,
                            state.checked && styles.switchOn
                          ).className
                        }
                        onCheckedChange={(checked) => {
                          onSettings({ ...save.settings, [key]: checked });
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
                  ))}
                  <section {...stylex.props(styles.group)}>
                    <h3 {...stylex.props(styles.groupName)}>遊び方</h3>
                    <ol {...stylex.props(styles.howto)}>
                      <li>
                        押したまま、石の角度を見て上にはじく。角度と速さがぴったりだと神投げ
                      </li>
                      <li>
                        石が着水する瞬間、輪が閉じたところでタップ。金色ならパーフェクト
                      </li>
                      <li>
                        カモ・岩・鯉・蓮の葉に当たると加速。土手に寄りすぎると跳ね返される
                      </li>
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
