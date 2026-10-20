import { Tabs } from "@base-ui/react/tabs";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import {
  colorOf,
  comboOf,
  combos,
  conditionOf,
  formOf,
  isOpen,
  keyOf,
  nameOf,
  noteOf,
  parts,
  peaksOf,
  traitsOf,
} from "../_lib/cosmetics";
import type { Option, Part } from "../_lib/cosmetics";
import type { Text } from "../_lib/i18n";
import { foundOf, unlocksOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import { statsOf } from "../_lib/simulate";
import { stoneSprite } from "../_lib/sprites";
import { useCopy, useLang } from "./lang";
import { Preview } from "./preview";
import { Radar } from "./radar";
import { font, ink } from "./theme.stylex";

const GOLD = "#ffd27a";

const styles = stylex.create({
  stage: {
    alignItems: "center",
    backgroundColor: "rgb(13 16 26 / 0.92)",
    backgroundImage:
      "radial-gradient(60% 70% at 30% 55%, rgb(120 170 210 / 0.16), transparent 70%)",
    borderColor: "rgb(255 255 255 / 0.08)",
    borderRadius: 22,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    paddingBlock: "0.5rem 0.7rem",
    paddingInline: "0.5rem",
  },
  stageRow: {
    alignItems: "center",
    display: "grid",
    gap: "0.25rem",
    gridTemplateColumns: "1fr 1fr",
    width: "100%",
  },
  stageRadar: {
    minWidth: 0,
  },
  stone: {
    display: "block",
    filter: "drop-shadow(0 14px 18px rgb(0 0 0 / 0.5))",
    height: "auto",
    justifySelf: "center",
    maxWidth: "9rem",
    width: "100%",
  },
  caption: {
    color: ink.soft,
    fontSize: "0.78rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
  },
  comboLine: {
    color: GOLD,
    fontSize: "0.75rem",
    fontWeight: 800,
    letterSpacing: "calc(0.08em * var(--track, 1))",
  },
  scroller: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "1rem",
    minHeight: 0,
    overflowY: "auto",
    maskImage: "linear-gradient(to bottom, transparent, black 0.75rem)",
    overscrollBehavior: "contain",
    paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
    paddingTop: "0.5rem",
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
    letterSpacing: "calc(0.08em * var(--track, 1))",
    lineHeight: 1,
    paddingBlock: "0.2rem",
    paddingInline: "0.4rem",
    position: "absolute",
    right: -4,
    top: -6,
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
  combos: {
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "repeat(3, 1fr)",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  combo: {
    backgroundColor: "rgb(255 255 255 / 0.04)",
    borderColor: "rgb(255 255 255 / 0.08)",
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.6rem",
    color: ink.text,
    fontFamily: "inherit",
    height: "100%",
    textAlign: "start",
    transitionDuration: "160ms",
    transitionProperty: "transform, border-color, background-color",
    width: "100%",
  },
  comboKnown: {
    backgroundColor: "rgb(255 210 122 / 0.06)",
    borderColor: "rgb(255 210 122 / 0.35)",
    borderStyle: "solid",
    cursor: "pointer",
    transform: { default: null, ":active": "scale(0.96)" },
  },
  name: {
    fontWeight: 700,
  },
  note: {
    color: ink.soft,
    display: "block",
    fontSize: "0.7rem",
  },
  small: {
    color: ink.soft,
    fontSize: "0.72rem",
  },
  sections: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "0.6rem",
    minHeight: 0,
  },
  chips: {
    display: "flex",
    flexShrink: 0,
    gap: "0.35rem",
    overflowX: "auto",
    paddingBlock: 2,
    scrollbarWidth: "none",
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.05)",
    borderColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.soft,
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "0.82rem",
    fontWeight: 700,
    gap: "0.3rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    paddingBlock: "0.4rem",
    paddingInline: "0.85rem",
    transitionDuration: "160ms",
    transitionProperty: "background-color, border-color, color",
  },
  chipActive: {
    backgroundColor: "rgb(255 210 122 / 0.16)",
    borderColor: GOLD,
    color: GOLD,
  },
  dot: {
    backgroundColor: "#e5533d",
    borderRadius: 999,
    height: 7,
    width: 7,
  },
});

type Peek = { part: Part; id: string } | null;

interface TilesProps {
  part: Part;
  options: Option[];
  save: Save;
  onPeek: (peek: Peek) => void;
  onWear: (part: Part, id: string) => void;
}

const Tiles = ({ part, options, save, onPeek, onWear }: TilesProps) => {
  const lang = useLang();
  const copy = useCopy();
  const unlocked = unlocksOf(save);
  const open = options.filter((option) => isOpen(option.unlock, unlocked));
  return (
    <section {...stylex.props(styles.group)}>
      <div {...stylex.props(styles.groupHead)}>
        <span {...stylex.props(styles.small)}>
          {copy.workshop.opened(open.length, options.length)}
        </span>
        {part === "color" || part === "form" ? (
          <span {...stylex.props(styles.small)}>{copy.workshop.shifts}</span>
        ) : null}
      </div>
      <div {...stylex.props(styles.grid)}>
        {options.map((option) => {
          const available = open.includes(option);
          const worn = save.look[part] === option.id;
          const peek =
            option.perks !== undefined && available
              ? () => {
                  onPeek({ id: option.id, part });
                }
              : undefined;
          return (
            <button
              aria-pressed={worn}
              disabled={!available}
              key={option.id}
              onBlur={() => {
                onPeek(null);
              }}
              onClick={() => {
                onWear(part, option.id);
              }}
              onFocus={peek}
              onPointerEnter={peek}
              onPointerLeave={() => {
                onPeek(null);
              }}
              type="button"
              {...stylex.props(
                styles.tile,
                worn && styles.worn,
                !available && styles.locked
              )}
            >
              {save.unseen.includes(keyOf({ option, part })) ? (
                <span {...stylex.props(styles.unseen)}>NEW</span>
              ) : null}
              <Preview option={option} part={part} />
              <span {...stylex.props(styles.tileName)}>
                {option.name[lang]}
              </span>
              {available ? null : (
                <span {...stylex.props(styles.lock)}>
                  {conditionOf(option.unlock, lang)}
                </span>
              )}
              {available && option.perks !== undefined ? (
                <span {...stylex.props(styles.tileNote)}>
                  {noteOf(peaksOf(option.perks), lang)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const Combos = ({
  save,
  onWearCombo,
}: {
  save: Save;
  onWearCombo: (id: string) => void;
}) => {
  const lang = useLang();
  const copy = useCopy();
  const worn = comboOf(save.look);
  const found = foundOf(save);
  return (
    <section {...stylex.props(styles.group)}>
      <div {...stylex.props(styles.groupHead)}>
        <span {...stylex.props(styles.small)}>
          {copy.workshop.found(found.length, combos.length)}
        </span>
        <span {...stylex.props(styles.small)}>{copy.workshop.pairs}</span>
      </div>
      <ul {...stylex.props(styles.combos)}>
        {combos.map((entry) => {
          const known = found.includes(entry);
          const active = worn?.id === entry.id;
          return (
            <li key={entry.id}>
              <button
                aria-pressed={active}
                disabled={!known}
                onClick={() => {
                  onWearCombo(entry.id);
                }}
                type="button"
                {...stylex.props(
                  styles.combo,
                  known && styles.comboKnown,
                  active && styles.worn
                )}
              >
                <span {...stylex.props(styles.name)}>
                  {known ? entry.name[lang] : "？？？"}
                </span>
                <span {...stylex.props(styles.note)}>
                  {colorOf(entry.color).name[lang]} ×{" "}
                  {known ? formOf(entry.form).name[lang] : "？？？"}
                </span>
                {known ? (
                  <span {...stylex.props(styles.tileNote)}>
                    {noteOf(entry.perks, lang)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const SECTIONS: [string, Text][] = [
  ...parts.map(({ part, name }): [string, Text] => [part, name]),
  ["combo", { en: "Combos", ja: "相性" }],
];

export const StoneTab = ({
  save,
  onWear,
  onWearCombo,
}: {
  save: Save;
  onWear: (part: Part, id: string) => void;
  onWearCombo: (id: string) => void;
}) => {
  const lang = useLang();
  const copy = useCopy();
  const [peek, setPeek] = useState<Peek>(null);
  const { color, form, pattern } = save.look;
  const stats = statsOf(save.gear, traitsOf(save.look));
  const ghost =
    peek === null || save.look[peek.part] === peek.id
      ? null
      : statsOf(save.gear, traitsOf({ ...save.look, [peek.part]: peek.id }));
  const combo = comboOf(save.look);
  const fresh = (section: string) =>
    save.unseen.some((key) => key.startsWith(`${section}:`));

  const paintStone = (canvas: HTMLCanvasElement | null) => {
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 256, 160);
      ctx.drawImage(stoneSprite(colorOf(color), form, pattern), 0, 0);
    }
  };

  return (
    <>
      <div {...stylex.props(styles.stage)}>
        <div {...stylex.props(styles.stageRow)}>
          <canvas
            aria-hidden="true"
            height={160}
            ref={paintStone}
            width={256}
            {...stylex.props(styles.stone)}
          />
          <div {...stylex.props(styles.stageRadar)}>
            <Radar preview={ghost} stats={stats} />
          </div>
        </div>
        <span {...stylex.props(styles.caption)}>{nameOf(save.look, lang)}</span>
        {combo === null ? null : (
          <span {...stylex.props(styles.comboLine)}>
            {copy.workshop.bonus(noteOf(combo.perks, lang))}
          </span>
        )}
      </div>
      <Tabs.Root
        defaultValue={SECTIONS.find(([key]) => fresh(key))?.[0] ?? "form"}
        {...stylex.props(styles.sections)}
      >
        <Tabs.List {...stylex.props(styles.chips)}>
          {SECTIONS.map(([key, label]) => (
            <Tabs.Tab
              className={(state) =>
                stylex.props(styles.chip, state.active && styles.chipActive)
                  .className
              }
              key={key}
              value={key}
            >
              {label[lang]}
              {fresh(key) ? (
                <span aria-hidden="true" {...stylex.props(styles.dot)} />
              ) : null}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {parts.map(({ part, options }) => (
          <Tabs.Panel
            key={part}
            value={part}
            {...stylex.props(styles.scroller)}
          >
            <Tiles
              onPeek={setPeek}
              onWear={onWear}
              options={options}
              part={part}
              save={save}
            />
          </Tabs.Panel>
        ))}
        <Tabs.Panel value="combo" {...stylex.props(styles.scroller)}>
          <Combos onWearCombo={onWearCombo} save={save} />
        </Tabs.Panel>
      </Tabs.Root>
    </>
  );
};
