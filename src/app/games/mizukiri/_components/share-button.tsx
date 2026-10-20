import { Popover } from "@base-ui/react/popover";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { postUrl, shareOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { useCopy, useLang } from "./lang";
import { ink } from "./theme.stylex";

const styles = stylex.create({
  popup: {
    backgroundColor: "rgb(13 16 26 / 0.96)",
    borderColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 18px 50px rgb(0 0 0 / 0.5)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: "12rem",
    outline: "none",
    padding: 6,
  },
  item: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgb(255 255 255 / 0.08)",
    },
    borderRadius: 12,
    borderWidth: 0,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 700,
    gap: "0.6rem",
    paddingBlock: "0.7rem",
    paddingInline: "0.8rem",
    textAlign: "start",
    textDecoration: "none",
  },
});

const ShareMark = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
    <path
      d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const XMark = () => (
  <svg aria-hidden="true" height="15" viewBox="0 0 24 24" width="15">
    <path
      d="M17.75 3h3.07l-6.71 7.67L22 21h-6.17l-4.84-6.32L5.45 21H2.37l7.18-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z"
      fill="currentColor"
    />
  </svg>
);

const LinkMark = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
    <path
      d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

const shareNatively = async (data: ShareData) => {
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

interface ShareButtonProps {
  result: Result;
  className?: string;
  style?: Readonly<Record<string, string | number>>;
}

export const ShareButton = ({ result, className, style }: ShareButtonProps) => {
  const lang = useLang();
  const copy = useCopy();
  const [copied, setCopied] = useState(false);
  const share = shareOf(result, window.location.origin, lang);
  const copyLink = async () => {
    setCopied(await copyText(share.url));
  };
  const label = (
    <>
      <ShareMark />
      {copy.result.share}
    </>
  );

  if ("share" in navigator) {
    return (
      <button
        className={className}
        onClick={() => {
          void shareNatively(share);
        }}
        style={style}
        type="button"
      >
        {label}
      </button>
    );
  }

  return (
    <Popover.Root
      onOpenChange={() => {
        setCopied(false);
      }}
    >
      <Popover.Trigger className={className} style={style}>
        {label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={8}>
          <Popover.Popup {...stylex.props(styles.popup)}>
            <a
              href={postUrl(result, window.location.origin, lang)}
              rel="noopener noreferrer"
              target="_blank"
              {...stylex.props(styles.item)}
            >
              <XMark />
              {copy.result.postX}
            </a>
            <button
              onClick={() => {
                void copyLink();
              }}
              type="button"
              {...stylex.props(styles.item)}
            >
              <LinkMark />
              <span aria-live="polite">
                {copied ? copy.result.copied : copy.result.copyLink}
              </span>
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
