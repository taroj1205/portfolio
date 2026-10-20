import { Dialog } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { RefObject } from "react";

import { colorOf, conditionOf, isOpen, parts } from "../_lib/cosmetics";
import type { Part } from "../_lib/cosmetics";
import { pointsLeft, progressOf, skills, unlocksOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import { statsOf } from "../_lib/simulate";
import type { Gear } from "../_lib/simulate";
import { stoneSprite } from "../_lib/sprites";
import { glass } from "./glass";
import { Radar } from "./radar";
import { font, ink, media } from "./theme.stylex";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(24px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  backdrop: {
    backdropFilter: "blur(6px)",
    backgroundColor: "rgb(4 6 12 / 0.55)",
    inset: 0,
    position: "fixed",
  },
  dialog: {
    animationDuration: "500ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    backgroundColor: "rgb(14 18 30 / 0.82)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 26,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 30px 80px rgb(0 0 0 / 0.5)",
    color: ink.text,
    maxHeight: "min(88vh, 48rem)",
    maxWidth: "27rem",
    overflowY: "auto",
    overscrollBehavior: "contain",
    left: "50%",
    padding: "1.25rem",
    position: "fixed",
    top: "50%",
    translate: "-50% -50%",
    width: "calc(100% - 2rem)",
  },
  stone: {
    display: "block",
    filter: "drop-shadow(0 12px 18px rgb(0 0 0 / 0.45))",
    height: "auto",
    marginBlock: "0.6rem 0",
    marginInline: "auto",
    width: "9rem",
  },
  head: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    margin: 0,
  },
  close: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontSize: "1.2rem",
    height: "2.6rem",
    justifyContent: "center",
    padding: 0,
    width: "2.6rem",
  },
  section: {
    borderTopColor: "rgb(255 255 255 / 0.12)",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    marginTop: "0.9rem",
    paddingTop: "0.9rem",
  },
  row: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  heading: {
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    margin: 0,
  },
  small: {
    color: ink.soft,
    fontSize: "0.75rem",
  },
  bar: {
    backgroundColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  barFill: (part: number) => ({
    backgroundImage: "linear-gradient(90deg, #ffd27a, #fff1b8)",
    height: "100%",
    width: `${Math.round(part * 100)}%`,
  }),
  name: {
    fontWeight: 700,
  },
  value: {
    color: "#ffd27a",
    fontFamily: font.mincho,
    fontWeight: 700,
    marginInlineStart: "0.45rem",
  },
  note: {
    color: ink.soft,
    display: "block",
    fontSize: "0.72rem",
  },
  stepper: {
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    gap: "0.4rem",
  },
  step: {
    alignItems: "center",
    borderRadius: 12,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: "1.15rem",
    fontWeight: 700,
    height: "2.6rem",
    justifyContent: "center",
    opacity: { default: 1, ":disabled": 0.3 },
    padding: 0,
    transform: { default: null, ":active": "scale(0.94)" },
    width: "2.6rem",
  },
  chips: {
    display: "flex",
    gap: "0.45rem",
    overflowX: "auto",
    paddingBottom: "0.2rem",
    scrollbarWidth: "none",
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 14,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    fontFamily: "inherit",
    fontSize: "0.78rem",
    fontWeight: 700,
    gap: "0.3rem",
    minWidth: "4.6rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.6rem",
    transform: { default: null, ":active": "scale(0.96)" },
  },
  worn: {
    backgroundColor: "rgb(255 210 122 / 0.16)",
    borderColor: "#ffd27a",
  },
  locked: {
    opacity: 0.45,
  },
  swatch: (light: string, mid: string, dark: string) => ({
    backgroundImage: `radial-gradient(circle at 35% 30%, ${light}, ${mid} 50%, ${dark})`,
    borderRadius: 999,
    boxShadow: "inset 0 -3px 6px rgb(0 0 0 / 0.35)",
    height: "1.6rem",
    width: "2.2rem",
  }),
  condition: {
    color: ink.soft,
    fontSize: "0.65rem",
    fontWeight: 600,
  },
  toggle: {
    borderRadius: 12,
    color: ink.text,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 700,
    minHeight: "2.6rem",
    paddingInline: "1rem",
  },
});

interface WorkshopProps {
  open: boolean;
  opener: RefObject<HTMLButtonElement | null>;
  save: Save;
  muted: boolean;
  onClose: () => void;
  onMute: () => void;
  onTune: (key: keyof Gear, step: 1 | -1) => void;
  onWear: (part: Part, id: string) => void;
}

export const Workshop = ({
  open,
  opener,
  save,
  muted,
  onClose,
  onMute,
  onTune,
  onWear,
}: WorkshopProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { color, form, pattern } = save.look;
  const paintStone = (canvas: HTMLCanvasElement | null) => {
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 256, 160);
      ctx.drawImage(stoneSprite(colorOf(color), form, pattern), 0, 0);
    }
  };

  const progress = progressOf(save.xp);
  const left = pointsLeft(save);
  const unlocked = unlocksOf(save);
  const stats = statsOf(save.gear, save.look.form);
  const previewStats =
    preview === null || preview === save.look.form
      ? null
      : statsOf(save.gear, preview);

  return (
    <Dialog.Root
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      open={open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop {...stylex.props(styles.backdrop)} />
        <Dialog.Popup finalFocus={opener} {...stylex.props(styles.dialog)}>
          <div {...stylex.props(styles.head)}>
            <Dialog.Title {...stylex.props(styles.title)}>
              石と腕前
            </Dialog.Title>
            <Dialog.Close
              aria-label="閉じる"
              {...stylex.props(glass.surface, styles.close)}
            >
              ×
            </Dialog.Close>
          </div>

          <canvas
            aria-hidden="true"
            height={160}
            ref={paintStone}
            width={256}
            {...stylex.props(styles.stone)}
          />
          <Radar preview={previewStats} stats={stats} />

          <div {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.row)}>
              <h3 {...stylex.props(styles.heading)}>Lv.{progress.level}</h3>
              <span {...stylex.props(styles.small)}>振れるポイント {left}</span>
            </div>
            <div {...stylex.props(styles.bar)}>
              <div {...stylex.props(styles.barFill(progress.part))} />
            </div>
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
                    {...stylex.props(glass.surface, styles.step)}
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
                    {...stylex.props(glass.surface, styles.step)}
                  >
                    ＋
                  </button>
                </span>
              </div>
            ))}
            <span {...stylex.props(styles.small)}>
              レベルが上がるとポイントが増える。振り直しはいつでも無料
            </span>
          </div>

          <div {...stylex.props(styles.section)}>
            <h3 {...stylex.props(styles.heading)}>石をつくる</h3>
            {parts.map(({ part, name, options }) => (
              <div key={part}>
                <span {...stylex.props(styles.small)}>
                  {name}
                  {part === "form" ? "（性能が変わる）" : ""}
                </span>
                <div {...stylex.props(styles.chips)}>
                  {options.map((option) => {
                    const available = isOpen(option.unlock, unlocked);
                    const worn = save.look[part] === option.id;
                    const [light, mid, dark] = colorOf(option.id).mineral;
                    const peek =
                      part === "form"
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
                          styles.chip,
                          worn && styles.worn,
                          !available && styles.locked
                        )}
                      >
                        {part === "color" ? (
                          <span
                            {...stylex.props(styles.swatch(light, mid, dark))}
                          />
                        ) : null}
                        {option.name}
                        {available ? null : (
                          <span {...stylex.props(styles.condition)}>
                            {conditionOf(option.unlock)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.row)}>
              <h3 {...stylex.props(styles.heading)}>音</h3>
              <button
                aria-pressed={!muted}
                onClick={onMute}
                type="button"
                {...stylex.props(glass.surface, styles.toggle)}
              >
                {muted ? "オフ" : "オン"}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
