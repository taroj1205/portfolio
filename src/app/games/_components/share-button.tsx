import { Menu } from "@base-ui/react/menu";
import { useRef, useState } from "react";

import { postUrl } from "../_lib/share";
import type { Share, ShareLabels } from "../_lib/share";
import { XMark } from "./brand-marks";
import { itemClass, popupClass } from "./menu-popup";

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

const ImageMark = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
    <path
      d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm-1 12 4.5-4.5 4 4L15 13l5 5M15.5 9.5h.01"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const SaveMark = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
    <path
      d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
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

const fetchImage = async (url: string, name: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return new File([await response.blob()], name, { type: "image/png" });
  } catch {
    return null;
  }
};

const canShareFiles = (name: string) =>
  "canShare" in navigator &&
  navigator.canShare({
    files: [new File([], name, { type: "image/png" })],
  });

interface ShareButtonProps {
  share: Share;
  labels: ShareLabels;
  fileName: string;
  iconOnly?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: Readonly<Record<string, string | number>>;
}

export const ShareButton = ({
  share,
  labels,
  fileName,
  iconOnly = false,
  onOpenChange,
  className,
  style,
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const image = useRef<{ url: string; file: Promise<File | null> } | null>(
    null
  );

  const native = "share" in navigator;
  const files = native && canShareFiles(fileName);
  const link = { text: share.text, url: share.url };

  const imageFile = async () => {
    if (image.current?.url !== share.image) {
      image.current = {
        file: fetchImage(share.image, fileName),
        url: share.image,
      };
    }

    return await image.current.file;
  };

  const shareImage = async () => {
    const file = await imageFile();
    await shareNatively(
      file === null
        ? link
        : { files: [file], text: `${share.text}\n${share.url}` }
    );
  };

  const copyLink = async () => {
    setCopied(await copyText(share.url));
  };

  return (
    <Menu.Root
      onOpenChange={(open) => {
        setCopied(false);
        onOpenChange?.(open);

        if (open && files) {
          void imageFile();
        }
      }}
    >
      <Menu.Trigger
        aria-label={iconOnly ? labels.share : undefined}
        className={className}
        style={style}
      >
        <ShareMark />
        {iconOnly ? null : labels.share}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" sideOffset={8}>
          <Menu.Popup className={popupClass}>
            {files ? (
              <Menu.Item
                className={itemClass}
                onClick={() => {
                  void shareImage();
                }}
              >
                <ImageMark />
                {labels.shareImage}
              </Menu.Item>
            ) : null}
            <Menu.LinkItem
              className={itemClass}
              closeOnClick
              download={fileName}
              href={share.image}
            >
              <SaveMark />
              {labels.saveImage}
            </Menu.LinkItem>
            {native ? (
              <Menu.Item
                className={itemClass}
                onClick={() => {
                  void shareNatively(link);
                }}
              >
                <LinkMark />
                {labels.shareLink}
              </Menu.Item>
            ) : null}
            <Menu.LinkItem
              className={itemClass}
              closeOnClick
              href={postUrl(share)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <XMark />
              {labels.postX}
            </Menu.LinkItem>
            {native ? null : (
              <Menu.Item
                className={itemClass}
                closeOnClick={false}
                label={labels.copyLink}
                onClick={() => {
                  void copyLink();
                }}
              >
                <LinkMark />
                <span aria-live="polite">
                  {copied ? labels.copied : labels.copyLink}
                </span>
              </Menu.Item>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
