import { Menu } from "@base-ui/react/menu";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { usePathname } from "next/navigation";

import { ease, media } from "../../../styles/tokens.stylex";
import type { Lang } from "../_lib/i18n";
import { reportLabels, reportUrls } from "../_lib/report";
import { GitHubMark, XMark } from "./brand-marks";
import { glass } from "./glass";
import { itemClass, popupClass } from "./menu-popup";
import { ink } from "./theme.stylex";

const styles = stylex.create({
  trigger: {
    alignItems: "center",
    backgroundColor: {
      default: "rgb(255 255 255 / 0.04)",
      [media.hover]: { default: null, ":hover": "rgb(255 255 255 / 0.1)" },
    },
    borderColor: {
      default: "rgb(255 255 255 / 0.18)",
      [media.hover]: { default: null, ":hover": "rgb(255 255 255 / 0.4)" },
    },
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: {
      default: ink.soft,
      [media.hover]: { default: null, ":hover": ink.text },
    },
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: "0.76rem",
    gap: "0.45rem",
    letterSpacing: "0.04em",
    outlineColor: "#ffd27a",
    outlineOffset: 3,
    paddingBlock: "0.38rem",
    paddingInline: "0.8rem",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "180ms",
    transitionProperty: "background-color, border-color, color, transform",
    transitionTimingFunction: ease.out,
  },
});

const FlagMark = ({ size }: { size: number }) => (
  <svg aria-hidden="true" height={size} viewBox="0 0 24 24" width={size}>
    <path
      d="M6 21V4m0 1h11l-2.5 4L17 13H6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

interface ReportMenuProps {
  lang: Lang;
  iconOnly?: boolean;
  xstyle?: StyleXStyles;
  onOpenChange?: (open: boolean) => void;
}

export const ReportMenu = ({
  lang,
  iconOnly = false,
  xstyle,
  onOpenChange,
}: ReportMenuProps) => {
  const labels = reportLabels[lang];
  const urls = reportUrls(usePathname(), lang);

  return (
    <Menu.Root onOpenChange={onOpenChange}>
      <Menu.Trigger
        aria-label={iconOnly ? labels.report : undefined}
        {...stylex.props(iconOnly ? [glass.surface, xstyle] : styles.trigger)}
      >
        <FlagMark size={iconOnly ? 20 : 14} />
        {iconOnly ? null : labels.report}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align={iconOnly ? "end" : "center"}
          side={iconOnly ? "bottom" : "top"}
          sideOffset={8}
        >
          <Menu.Popup className={popupClass}>
            <Menu.LinkItem
              className={itemClass}
              closeOnClick
              href={urls.x}
              rel="noopener noreferrer"
              target="_blank"
            >
              <XMark />
              {labels.x}
            </Menu.LinkItem>
            <Menu.LinkItem
              className={itemClass}
              closeOnClick
              href={urls.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubMark />
              {labels.github}
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
