import { Dialog } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";

import { langNames, langPrompt } from "../_lib/i18n";
import type { Lang } from "../_lib/i18n";
import type { Settings } from "../_lib/settings";
import { font, ink, media } from "./theme.stylex";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(16px) scale(0.98)" },
  "100%": { opacity: 1, transform: "none" },
});

const styles = stylex.create({
  backdrop: {
    backdropFilter: "blur(6px)",
    backgroundColor: "rgb(3 5 10 / 0.55)",
    inset: 0,
    position: "fixed",
  },
  popup: {
    animationDuration: "500ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    backgroundColor: "rgb(13 16 26 / 0.94)",
    backgroundImage:
      "radial-gradient(120% 70% at 50% 0%, rgb(255 210 122 / 0.12), transparent 60%)",
    borderColor: "rgb(255 255 255 / 0.1)",
    borderRadius: 28,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 30px 80px rgb(0 0 0 / 0.55)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    insetInline: "1.25rem",
    marginInline: "auto",
    maxWidth: "22rem",
    outline: "none",
    padding: "1.5rem",
    position: "fixed",
    textAlign: "center",
    top: "50%",
    translate: "0 -50%",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.2rem",
    fontWeight: 700,
    gap: "0.2rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
  },
  sub: {
    color: ink.soft,
    fontSize: "0.85rem",
    letterSpacing: "calc(0.04em * var(--track, 1))",
  },
  choices: {
    display: "grid",
    gap: "0.6rem",
  },
  choice: {
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 16,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: "pointer",
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.4rem",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  first: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
  },
  note: {
    color: ink.soft,
    fontSize: "0.75rem",
    margin: 0,
  },
});

interface LanguagePickerProps {
  lang: Lang;
  settings: Settings | null;
  onSettings: (settings: Settings) => void;
}

export const LanguagePicker = ({
  lang,
  settings,
  onSettings,
}: LanguagePickerProps) => {
  const other: Lang = lang === "ja" ? "en" : "ja";
  const onPick = (choice: Lang) => {
    if (settings !== null) {
      onSettings({ ...settings, lang: choice });
    }
  };
  return (
    <Dialog.Root
      onOpenChange={(next) => {
        if (!next) {
          onPick(lang);
        }
      }}
      open={settings?.lang === null}
    >
      <Dialog.Portal>
        <Dialog.Backdrop {...stylex.props(styles.backdrop)} />
        <Dialog.Popup {...stylex.props(styles.popup)}>
          <Dialog.Title {...stylex.props(styles.title)}>
            <span>{langPrompt[lang].title}</span>
            <span {...stylex.props(styles.sub)}>{langPrompt[other].title}</span>
          </Dialog.Title>
          <div {...stylex.props(styles.choices)}>
            {[lang, other].map((choice) => (
              <button
                key={choice}
                lang={choice}
                onClick={() => {
                  onPick(choice);
                }}
                type="button"
                {...stylex.props(
                  styles.choice,
                  choice === lang && styles.first
                )}
              >
                {langNames[choice]}
              </button>
            ))}
          </div>
          <Dialog.Description {...stylex.props(styles.note)}>
            {langPrompt[lang].note}
          </Dialog.Description>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
