import * as stylex from "@stylexjs/stylex";

import { ART, BASE, artUri } from "../_lib/art";

const styles = stylex.create({
  picture: {
    display: "block",
    flexShrink: 0,
    overflow: "visible",
  },
  size: (size: string) => ({ height: size, width: size }),
});

export const ArtImage = ({ id, size }: { id: string; size: number }) => (
  <image
    height={size}
    href={artUri(id)}
    width={size}
    x={-size / 2}
    y={(-size * BASE) / ART}
  />
);

export const ItemPicture = ({ id, size }: { id: string; size: string }) => (
  <svg
    aria-hidden="true"
    viewBox={`0 0 ${ART} ${ART}`}
    {...stylex.props(styles.picture, styles.size(size))}
  >
    <image height={ART} href={artUri(id)} width={ART} />
  </svg>
);
