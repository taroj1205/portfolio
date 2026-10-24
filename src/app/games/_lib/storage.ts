import type { z } from "zod";

export const createStore = <T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T
) => ({
  read: (): T => {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) {
        return fallback;
      }

      const parsed = schema.safeParse(JSON.parse(raw));

      return parsed.success ? parsed.data : fallback;
    } catch {
      return fallback;
    }
  },
  write: (value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      return true;
    } catch {
      return false;
    }
  },
});
