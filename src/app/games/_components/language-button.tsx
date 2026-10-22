import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

import { langNames } from "../_lib/i18n";
import type { Lang } from "../_lib/i18n";
import { glass } from "./glass";

interface LanguageButtonProps {
  lang: Lang;
  onClick: () => void;
  xstyle?: StyleXStyles;
}

export const LanguageButton = ({
  lang,
  onClick,
  xstyle,
}: LanguageButtonProps) => (
  <button
    aria-label={langNames[lang]}
    lang={lang}
    onClick={onClick}
    type="button"
    {...stylex.props(glass.surface, xstyle)}
  >
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z" />
    </svg>
  </button>
);
