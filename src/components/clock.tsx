"use client";

import { useSyncExternalStore } from "react";

const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 10_000);
  return () => {
    clearInterval(id);
  };
};

const now = () =>
  new Date().toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
  });

// My local time. Client only, so an hour-old ISR render never shows a stale one.
export const Clock = () => useSyncExternalStore(subscribe, now, () => null);
