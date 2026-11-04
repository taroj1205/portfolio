"use client";

import { Slot, useSmoothCorners } from "@lisse/react";
import { useRef } from "react";
import type { ReactElement, RefObject } from "react";

const hairline = { innerBorder: { color: "#e4dcd1", opacity: 1, width: 1 } };

export const useSmooth = (
  ref: RefObject<HTMLElement | null>,
  radius: number,
  edged = false
) => {
  useSmoothCorners(
    ref,
    { radius, smoothing: 0.6 },
    { effects: edged ? hairline : undefined }
  );
};

export const Smooth = ({
  radius,
  edged = false,
  children,
}: {
  radius: number;
  edged?: boolean;
  children: ReactElement;
}) => {
  const ref = useRef<HTMLElement>(null);
  useSmooth(ref, radius, edged);

  return <Slot ref={ref}>{children}</Slot>;
};
