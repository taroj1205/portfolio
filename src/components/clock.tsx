"use client";

import { useSyncExternalStore } from "react";

import { intlLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 10_000);
  return () => {
    clearInterval(id);
  };
};

const now = (locale: Locale) =>
  new Date().toLocaleTimeString(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
  });

export const Clock = ({ locale }: { locale: Locale }) =>
  useSyncExternalStore(
    subscribe,
    () => now(locale),
    () => null
  );
