export const loadMincho = async (text: string) => {
  const sheet = await fetch(
    `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&text=${encodeURIComponent(text)}`
  );

  const css = await sheet.text();

  const source =
    /src: url\((?<source>.+?)\) format\('(?:opentype|truetype)'\)/u.exec(css)
      ?.groups?.source;

  if (source === undefined) {
    throw new Error("Shippori Mincho is unavailable");
  }

  const font = await fetch(source);

  return await font.arrayBuffer();
};
