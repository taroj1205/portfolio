export const fmt = (n: number) => n.toLocaleString("en-NZ");

export const compact = (n: number) =>
  n.toLocaleString("en-NZ", { maximumFractionDigits: 1, notation: "compact" });

export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
  });

export const splitTitle = (title: string) => {
  const match = /^(?<type>\w+)(?:\([^)]*\))?!?:\s*(?<text>.*)$/u.exec(title);
  return {
    text: match?.groups?.text ?? title,
    type: match?.groups?.type ?? "",
  };
};
