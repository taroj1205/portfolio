import { Slider } from "@base-ui/react/slider";
import * as stylex from "@stylexjs/stylex";

import { glass } from "../../_components/glass";
import { ink } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { DECADES, STEPS, gramsAt, weightText } from "../_lib/scale";
import type { Bounds } from "../_lib/scale";

const GOLD = "#ffd27a";

const percent = (step: number) => `${((step / STEPS) * 100).toFixed(3)}%`;

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    width: "100%",
  },
  row: {
    alignItems: "center",
    display: "flex",
    gap: "0.5rem",
  },
  nudge: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    fontSize: "1.4rem",
    fontWeight: 700,
    height: "2.75rem",
    justifyContent: "center",
    lineHeight: 1,
    outlineColor: GOLD,
    outlineOffset: 3,
    padding: 0,
    transform: { default: null, ":active": "scale(0.9)" },
    transitionDuration: "140ms",
    transitionProperty: "transform",
    width: "2.75rem",
  },
  slider: {
    flexGrow: 1,
  },
  control: {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    flexGrow: 1,
    paddingBlock: "1rem",
    touchAction: "none",
    userSelect: "none",
  },
  track: {
    backgroundImage:
      "linear-gradient(90deg, #5fd6c4, #8fe3a0 25%, #ffd27a 55%, #ff9a5a 80%, #ff5d6c)",
    borderRadius: 999,
    boxShadow: "inset 0 1px 3px rgb(0 0 0 / 0.5)",
    height: 12,
    position: "relative",
    width: "100%",
  },
  shut: (left: string, width: string) => ({
    left,
    width,
  }),
  shade: {
    backgroundColor: "rgb(6 10 18 / 0.78)",
    backgroundImage:
      "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.08) 0 4px, transparent 4px 9px)",
    borderRadius: 999,
    bottom: -1,
    position: "absolute",
    top: -1,
    transitionDuration: "600ms",
    transitionProperty: "left, width",
    transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
  },
  thumb: {
    backgroundImage:
      "radial-gradient(circle at 35% 30%, #fff4cf, #e0aa4c 55%, #7a4f17)",
    borderColor: "#fff4cf",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 6px 18px rgb(0 0 0 / 0.5), 0 0 0 6px rgb(255 210 122 / 0.18)",
    height: "2.25rem",
    outlineColor: GOLD,
    outlineOffset: 4,
    outlineStyle: {
      default: "none",
      ":has(:focus-visible)": "solid",
    },
    outlineWidth: 2,
    transform: {
      default: null,
      ":is([data-dragging])": "scale(1.15)",
    },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "2.25rem",
  },
  marks: {
    color: ink.soft,
    fontSize: "0.68rem",
    fontVariantNumeric: "tabular-nums",
    height: "1rem",
    marginInline: "3.25rem",
    position: "relative",
  },
  mark: (left: string) => ({ left }),
  markText: {
    position: "absolute",
    top: 0,
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
  },
});

interface WeightSliderProps {
  lang: Lang;
  step: number;
  bounds: Bounds;
  onStep: (step: number) => void;
}

export const WeightSlider = ({
  lang,
  step,
  bounds,
  onStep,
}: WeightSliderProps) => {
  const words = copy[lang].daily;

  const move = (next: number) => {
    onStep(Math.max(0, Math.min(STEPS, next)));
  };

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.row)}>
        <button
          aria-label={words.lighter}
          disabled={step <= 0}
          onClick={() => {
            move(step - 1);
          }}
          type="button"
          {...stylex.props(glass.surface, styles.nudge)}
        >
          −
        </button>
        <Slider.Root
          largeStep={10}
          max={STEPS}
          min={0}
          onValueChange={(value) => {
            move(value);
          }}
          step={1}
          value={step}
          {...stylex.props(styles.slider)}
        >
          <Slider.Control {...stylex.props(styles.control)}>
            <Slider.Track {...stylex.props(styles.track)}>
              {bounds.low > 0 ? (
                <span
                  aria-hidden="true"
                  {...stylex.props(
                    styles.shade,
                    styles.shut("0%", percent(bounds.low - 0.5))
                  )}
                />
              ) : null}
              {bounds.high < STEPS ? (
                <span
                  aria-hidden="true"
                  {...stylex.props(
                    styles.shade,
                    styles.shut(
                      percent(bounds.high + 0.5),
                      percent(STEPS - bounds.high - 0.5)
                    )
                  )}
                />
              ) : null}
              <Slider.Thumb
                aria-label={words.weight}
                getAriaValueText={(_, value) =>
                  weightText(gramsAt(value), lang)
                }
                {...stylex.props(styles.thumb)}
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <button
          aria-label={words.heavier}
          disabled={step >= STEPS}
          onClick={() => {
            move(step + 1);
          }}
          type="button"
          {...stylex.props(glass.surface, styles.nudge)}
        >
          +
        </button>
      </div>
      <div aria-hidden="true" {...stylex.props(styles.marks)}>
        {DECADES.map((mark) => (
          <span
            key={mark.step}
            {...stylex.props(styles.markText, styles.mark(percent(mark.step)))}
          >
            {mark.text[lang]}
          </span>
        ))}
      </div>
    </div>
  );
};
