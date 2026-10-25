import {
  blur,
  dataUri,
  linear,
  n,
  radial,
  seeded,
  shade,
} from "../../_lib/svg";
import type { Stop } from "../../_lib/svg";

export const ART = 120;

export const BASE = 111;

type Draw = (p: string) => string;

const shadowOf = (p: string, rx: number, cy = BASE) =>
  `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${n(rx * 0.14)}" fill="#000" opacity="0.4" filter="url(#${p}-s)"/>`;

const soft = (p: string) => blur(`${p}-s`, 2.2);

const dots = (
  seed: number,
  count: number,
  [x, y, w, h]: readonly [number, number, number, number],
  radius: readonly [number, number],
  fill: string,
  opacity: number
) => {
  const roll = seeded(seed);

  return Array.from(
    { length: count },
    () =>
      `<circle cx="${n(x + roll() * w)}" cy="${n(y + roll() * h)}" r="${n(radius[0] + roll() * (radius[1] - radius[0]))}" fill="${fill}" opacity="${n(opacity * (0.5 + roll() / 2))}"/>`
  ).join("");
};

const sheen = (d: string, opacity: number) =>
  `<path d="${d}" fill="#fff" opacity="${opacity}"/>`;

const silver: readonly Stop[] = [
  [0, "#ffffff"],
  [0.5, "#dfe4ea"],
  [1, "#97a1ad"],
];

const gold: readonly Stop[] = [
  [0, "#fff6cf"],
  [0.45, "#f0c552"],
  [1, "#9a6a12"],
];

const coinSheen = "M36 58C38 46 46 38 56 36C48 42 42 50 40 62Z";

const coin = (p: string, face: readonly Stop[], edge: string, inside: string) =>
  `<defs>${soft(p)}${radial(`${p}-f`, [46, 54, 50], face)}</defs>${shadowOf(p, 30)}<ellipse cx="64" cy="72" rx="33" ry="38" fill="${edge}"/><rect x="58" y="34" width="6" height="76" fill="${edge}"/><ellipse cx="58" cy="72" rx="33" ry="38" fill="url(#${p}-f)"/><ellipse cx="58" cy="72" rx="29" ry="34" fill="none" stroke="${edge}" stroke-opacity="0.55" stroke-width="1.4"/><ellipse cx="58" cy="72" rx="31" ry="36" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>${inside}`;

const oneYen: Draw = (p) =>
  coin(
    p,
    silver,
    "#8a939e",
    `<g fill="#a9b3be" stroke="#ffffff" stroke-opacity="0.7" stroke-width="0.6"><path d="M57 96V64" stroke="#a9b3be" stroke-width="2.6" stroke-linecap="round"/><path d="M57 74C47 72 41 63 42 56C51 56 57 64 57 74Z"/><path d="M57 68C64 59 73 56 77 58C75 66 66 70 57 68Z"/><path d="M57 64C54 57 55 50 58 46C62 51 61 58 57 64Z"/><path d="M57 84C50 83 46 79 46 75C52 75 56 79 57 84Z"/></g>${sheen(coinSheen, 0.7)}`
  );

const fiveHundredYen: Draw = (p) =>
  coin(
    p,
    gold,
    "#7d5a12",
    `<defs>${radial(`${p}-m`, [52, 62, 30], silver)}</defs><ellipse cx="58" cy="72" rx="23" ry="27" fill="url(#${p}-m)"/><ellipse cx="58" cy="72" rx="16" ry="19" fill="url(#${p}-f)"/><ellipse cx="58" cy="72" rx="31" ry="36" fill="none" stroke="#7d5a12" stroke-dasharray="1.2 2.2" stroke-width="2"/><g fill="#b88a26" stroke="#fff3c4" stroke-opacity="0.6" stroke-width="0.5"><path d="M58 86C52 86 47 82 48 77C53 77 57 80 58 86Z"/><path d="M58 86C64 86 69 82 68 77C63 77 59 80 58 86Z"/><path d="M58 85C55 80 55 76 58 73C61 76 61 80 58 85Z"/><circle cx="52" cy="62" r="1.6"/><circle cx="52" cy="66" r="1.6"/><circle cx="52" cy="70" r="1.6"/><circle cx="58" cy="58" r="1.8"/><circle cx="58" cy="62.5" r="1.8"/><circle cx="58" cy="67" r="1.8"/><circle cx="64" cy="62" r="1.6"/><circle cx="64" cy="66" r="1.6"/><circle cx="64" cy="70" r="1.6"/></g>${sheen(coinSheen, 0.6)}`
  );

const egg: Draw = (p) =>
  `<defs>${soft(p)}${radial(
    `${p}-b`,
    [48, 56, 62],
    [
      [0, "#fffaf2"],
      [0.5, "#f3dcbc"],
      [1, "#b98a5a"],
    ]
  )}</defs>${shadowOf(p, 24)}<path d="M60 32C80 32 90 68 89 86C88 102 76 110 60 110C44 110 32 102 31 86C30 68 40 32 60 32Z" fill="url(#${p}-b)"/>${dots(7, 14, [40, 50, 44, 52], [0.5, 1.1], "#a87a4c", 0.35)}<ellipse cx="48" cy="56" rx="6" ry="11" fill="#fff" opacity="0.75" transform="rotate(-18 48 56)"/><path d="M84 74C88 88 84 102 70 107C80 99 84 88 84 74Z" fill="#fff" opacity="0.25"/>`;

const stitches = (d: string) =>
  `<path d="${d}" stroke="#d63a3f" stroke-width="2.4" stroke-dasharray="1.5 3"/>`;

const baseball: Draw = (p) =>
  `<defs>${soft(p)}${radial(
    `${p}-b`,
    [48, 60, 50],
    [
      [0, "#ffffff"],
      [0.55, "#f2eee4"],
      [1, "#a39b8b"],
    ]
  )}<clipPath id="${p}-c"><circle cx="60" cy="76" r="34"/></clipPath></defs>${shadowOf(p, 26)}<circle cx="60" cy="76" r="34" fill="url(#${p}-b)"/><g clip-path="url(#${p}-c)" fill="none" stroke-linecap="round"><path d="M34 48C50 62 50 90 34 104" stroke="#d9d0bf" stroke-width="2"/><path d="M86 48C70 62 70 90 86 104" stroke="#d9d0bf" stroke-width="2"/>${stitches("M31 51C47 64 47 88 31 101")}${stitches("M38 47C53 62 53 90 38 105")}${stitches("M89 51C73 64 73 88 89 101")}${stitches("M82 47C67 62 67 90 82 105")}</g><ellipse cx="50" cy="58" rx="9" ry="6" fill="#fff" opacity="0.8" transform="rotate(-30 50 58)"/>`;

const medal: Draw = (p) => {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;

    return `M${n(60 + Math.cos(angle) * 14)} ${n(80 + Math.sin(angle) * 14)}L${n(60 + Math.cos(angle) * 24)} ${n(80 + Math.sin(angle) * 24)}`;
  }).join("");

  const hexagon = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;

    return `${n(60 + Math.cos(angle) * 12)},${n(80 + Math.sin(angle) * 12)}`;
  }).join(" ");

  return `<defs>${soft(p)}${radial(`${p}-g`, [50, 70, 36], gold)}${shade(
    `${p}-r`,
    [
      [0, "#2b3f86"],
      [1, "#141c45"],
    ]
  )}${radial(
    `${p}-i`,
    [56, 76, 14],
    [
      [0, "#8b8f98"],
      [1, "#3a3e46"],
    ]
  )}</defs>${shadowOf(p, 26)}<path d="M30 4H48L66 56L56 60Z" fill="url(#${p}-r)"/><path d="M90 4H72L54 56L64 60Z" fill="url(#${p}-r)"/><path d="M37 4L60 58M83 4L60 58" stroke="#ffd27a" stroke-width="1.4" opacity="0.8"/><rect x="54" y="50" width="12" height="7" rx="2" fill="#c99a2e"/><circle cx="60" cy="80" r="29" fill="url(#${p}-g)"/><circle cx="60" cy="80" r="25.5" fill="none" stroke="#8a5f10" stroke-width="1.4" opacity="0.7"/><path d="${rays}" stroke="#a87414" stroke-width="1.2" opacity="0.8"/><polygon points="${hexagon}" fill="url(#${p}-i)" stroke="#fff3c4" stroke-width="1"/><path d="M60 71L55.5 89M60 71L64.5 89M57 83H63M58 77H62" stroke="#d6d9de" stroke-width="0.9" fill="none"/>${sheen("M38 70C42 60 50 54 58 53C50 58 44 64 42 74Z", 0.65)}`;
};

const newborn: Draw = (p) =>
  `<defs>${soft(p)}${radial(
    `${p}-b`,
    [50, 60, 60],
    [
      [0, "#fff2f5"],
      [0.6, "#f9bfcf"],
      [1, "#d4819a"],
    ]
  )}${radial(
    `${p}-f`,
    [52, 52, 22],
    [
      [0, "#fff1e4"],
      [0.7, "#ffd2b4"],
      [1, "#e9a582"],
    ]
  )}</defs>${shadowOf(p, 34)}<path d="M28 104C20 84 24 58 42 46C62 34 92 46 96 72C99 92 90 108 60 109C44 110 32 109 28 104Z" fill="url(#${p}-b)"/><path d="M34 86C50 80 70 82 90 92M40 100C56 92 74 94 88 102" fill="none" stroke="#c97088" stroke-width="1.4" opacity="0.5"/><path d="M60 72C70 80 78 88 82 100" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.6"/><circle cx="58" cy="58" r="17" fill="url(#${p}-f)"/><path d="M38 62C36 40 56 30 72 38C82 44 82 56 76 62C76 48 66 42 58 42C46 42 40 52 38 62Z" fill="url(#${p}-b)"/><path d="M57 42C55 38 59 36 61 38" fill="none" stroke="#8a5a3c" stroke-width="1.4" stroke-linecap="round"/><g fill="none" stroke="#7a4f3a" stroke-width="1.6" stroke-linecap="round"><path d="M48 59Q51 62 54 59"/><path d="M62 59Q65 62 68 59"/><path d="M56 68Q58 69.5 60 68"/></g><circle cx="47" cy="65" r="3.4" fill="#ff8fa3" opacity="0.45"/><circle cx="69" cy="65" r="3.4" fill="#ff8fa3" opacity="0.45"/><ellipse cx="51" cy="51" rx="4" ry="2.4" fill="#fff" opacity="0.6"/>`;

const emperorsCup: Draw = (p) =>
  `<defs>${soft(p)}${linear(
    `${p}-m`,
    [28, 0, 92, 0],
    [
      [0, "#6b737e"],
      [0.32, "#ffffff"],
      [0.55, "#c9d0d8"],
      [1, "#5d656f"],
    ]
  )}${shade(`${p}-w`, [
    [0, "#6a4630"],
    [1, "#2e1d12"],
  ])}</defs>${shadowOf(p, 32)}<rect x="36" y="98" width="48" height="12" rx="2" fill="url(#${p}-w)"/><path d="M36 99H84" stroke="#a87a52" stroke-width="1"/><path d="M44 98L48 90H72L76 98Z" fill="url(#${p}-m)"/><path d="M55 90L57 74H63L65 90Z" fill="url(#${p}-m)"/><g fill="none" stroke="url(#${p}-m)" stroke-width="4.5" stroke-linecap="round"><path d="M31 40C14 40 14 64 37 64"/><path d="M89 40C106 40 106 64 83 64"/></g><path d="M30 36H90C90 60 78 76 60 76C42 76 30 60 30 36Z" fill="url(#${p}-m)"/><path d="M32 46H88" stroke="#8a929c" stroke-width="1.2"/><circle cx="60" cy="58" r="7" fill="#e7b84a" stroke="#fff3c4" stroke-width="0.8"/><path d="M60 51V65M53 58H67M55 53L65 63M65 53L55 63" stroke="#a87414" stroke-width="0.8"/><circle cx="60" cy="58" r="2.2" fill="#fff3c4"/><path d="M32 36C34 22 86 22 88 36Z" fill="url(#${p}-m)"/><ellipse cx="60" cy="36" rx="30" ry="3.5" fill="#eef2f6"/><circle cx="60" cy="19" r="4.5" fill="url(#${p}-m)"/><path d="M42 40C40 52 44 64 52 70" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.7" stroke-linecap="round"/>`;

const okuYen: Draw = (p) => {
  const front = Array.from({ length: 5 }, (_, i) => 60 + i * 10)
    .flatMap((y) =>
      [22, 61].map(
        (x) =>
          `<rect x="${x}" y="${y}" width="37" height="10" fill="url(#${p}-e)"/><path d="M${x} ${y + 3}h37M${x} ${y + 5.5}h37M${x} ${y + 8}h37" stroke="#b9a983" stroke-width="0.5"/><rect x="${x + 15}" y="${y}" width="7" height="10" fill="#f8f5ec"/><path d="M${x + 16.5} ${y + 3}h4M${x + 16.5} ${y + 5}h4" stroke="#b03a2e" stroke-width="0.6"/><path d="M${x} ${y}h37" stroke="#8c7c58" stroke-width="0.6"/>`
      )
    )
    .join("");

  return `<defs>${soft(p)}${shade(`${p}-e`, [
    [0, "#efe5c9"],
    [1, "#cdbb8f"],
  ])}${linear(
    `${p}-t`,
    [32, 46, 98, 60],
    [
      [0, "#f6eed6"],
      [1, "#d9c9a0"],
    ]
  )}</defs>${shadowOf(p, 46)}<path d="M98 60L108 46V96L98 110Z" fill="#a8956a" stroke="#7f6e4a" stroke-width="0.6"/>${front}<path d="M22 60L32 46H108L98 60Z" fill="url(#${p}-t)" stroke="#8c7c58" stroke-width="0.6"/><path d="M59.5 60L69.5 46" stroke="#8c7c58" stroke-width="0.8"/><path d="M37 60L47 46H54L44 60ZM76 60L86 46H93L83 60Z" fill="#f8f5ec"/><ellipse cx="33" cy="53" rx="4" ry="3" fill="#a07a58" opacity="0.55"/><ellipse cx="72" cy="53" rx="4" ry="3" fill="#a07a58" opacity="0.55"/><circle cx="56" cy="53" r="2.4" fill="#b98f6a" opacity="0.5"/><circle cx="95" cy="53" r="2.4" fill="#b98f6a" opacity="0.5"/><path d="M24 62V108" stroke="#fff" stroke-width="1.4" opacity="0.4"/>`;
};

const panda: Draw = (p) =>
  `<defs>${soft(p)}${radial(
    `${p}-w`,
    [50, 60, 52],
    [
      [0, "#ffffff"],
      [0.7, "#ecebe4"],
      [1, "#b7b4aa"],
    ]
  )}${radial(
    `${p}-k`,
    [50, 70, 60],
    [
      [0, "#4a4d55"],
      [1, "#121318"],
    ]
  )}${shade(
    `${p}-g`,
    [
      [0, "#9be36a"],
      [1, "#3f8a2a"],
    ],
    false
  )}</defs>${shadowOf(p, 40)}<ellipse cx="60" cy="86" rx="31" ry="25" fill="url(#${p}-w)"/><ellipse cx="38" cy="102" rx="14" ry="9" fill="url(#${p}-k)"/><ellipse cx="82" cy="102" rx="14" ry="9" fill="url(#${p}-k)"/><g fill="#d9c6b6"><ellipse cx="36" cy="103" rx="5" ry="4"/><ellipse cx="84" cy="103" rx="5" ry="4"/></g><path d="M94 104L106 38" stroke="url(#${p}-g)" stroke-width="5" stroke-linecap="round"/><path d="M96.5 90l5 1M99 76l5 1M101.5 62l5 1M104 48l5 1" stroke="#2f6a1f" stroke-width="1.4"/><path d="M106 40C112 32 118 30 120 30C116 38 112 42 106 42ZM104 52C96 48 92 42 92 38C98 40 102 46 104 52Z" fill="#5fbf3c"/><path d="M30 70C34 60 46 62 50 72C50 82 42 90 36 88C30 86 28 78 30 70Z" fill="url(#${p}-k)"/><path d="M90 70C86 60 74 62 70 72C70 82 92 88 98 82C102 76 96 68 90 70Z" fill="url(#${p}-k)"/><circle cx="41" cy="29" r="9" fill="url(#${p}-k)"/><circle cx="79" cy="29" r="9" fill="url(#${p}-k)"/><circle cx="60" cy="48" r="23" fill="url(#${p}-w)"/><ellipse cx="50" cy="48" rx="6" ry="8.5" fill="#1b1c22" transform="rotate(28 50 48)"/><ellipse cx="70" cy="48" rx="6" ry="8.5" fill="#1b1c22" transform="rotate(-28 70 48)"/><circle cx="51" cy="47" r="2.2" fill="#fff"/><circle cx="69" cy="47" r="2.2" fill="#fff"/><ellipse cx="60" cy="57" rx="4" ry="2.8" fill="#1b1c22"/><path d="M56 61Q60 64 64 61" fill="none" stroke="#1b1c22" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="50" cy="36" rx="7" ry="3.6" fill="#fff" opacity="0.8"/>`;

const grandPiano: Draw = (p) =>
  `<defs>${soft(p)}${shade(`${p}-k`, [
    [0, "#4b4f5a"],
    [0.35, "#16181d"],
    [1, "#050608"],
  ])}${linear(
    `${p}-l`,
    [20, 60, 90, 30],
    [
      [0, "#0c0d10"],
      [0.6, "#2c2f37"],
      [1, "#5a5f6b"],
    ]
  )}</defs>${shadowOf(p, 50)}<path d="M18 66L100 64L66 24Z" fill="url(#${p}-l)"/><path d="M24 64L66 27" stroke="#fff" stroke-width="1" opacity="0.35"/><path d="M80 64L71 38" stroke="#b49456" stroke-width="2"/><path d="M14 64H92C108 64 110 80 98 82H14Z" fill="url(#${p}-k)"/><path d="M16 67H92C102 67 104 74 98 76" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.35"/><rect x="2" y="68" width="14" height="6" rx="1" fill="#f7f3ea"/><path d="M5 68v3M8 68v3M11 68v3M14 68v3" stroke="#121318" stroke-width="1.6"/><g fill="url(#${p}-k)"><path d="M18 82H26L25 104H19Z"/><path d="M56 82H64L63 104H57Z"/><path d="M90 82H98L97 104H91Z"/></g><g fill="#d4b06a"><rect x="18" y="104" width="8" height="3" rx="1"/><rect x="56" y="104" width="8" height="3" rx="1"/><rect x="90" y="104" width="8" height="3" rx="1"/></g><path d="M36 82V100H42V82" fill="none" stroke="#1b1d22" stroke-width="2.4"/><path d="M36 100h6" stroke="#d4b06a" stroke-width="2"/>`;

const prius: Draw = (p) =>
  `<defs>${soft(p)}${shade(`${p}-b`, [
    [0, "#ff8a7a"],
    [0.45, "#d22d22"],
    [1, "#6a0d09"],
  ])}${shade(`${p}-w`, [
    [0, "#9fb6cf"],
    [1, "#1b2635"],
  ])}${radial(
    `${p}-r`,
    [0, 0, 8],
    [
      [0, "#f4f6f8"],
      [1, "#8c949e"],
    ]
  )}</defs>${shadowOf(p, 52, 110)}<path d="M6 92C6 84 12 80 22 78L42 72C54 61 68 56 82 58C96 60 106 70 112 80C115 84 115 92 113 96C112 98 110 99 106 99H12C8 99 6 97 6 92Z" fill="url(#${p}-b)"/><path d="M44 74C56 64 68 61 81 62C92 63 100 70 105 78H48Z" fill="url(#${p}-w)"/><path d="M76 62L72 78" stroke="#6a0d09" stroke-width="2"/><path d="M14 84C40 80 80 80 110 84" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.5"/><path d="M48 80V96M74 79V96" stroke="#6a0d09" stroke-width="0.9" opacity="0.7"/><path d="M8 86L20 83" stroke="#fff6d8" stroke-width="2.6" stroke-linecap="round"/><path d="M108 84L113 86" stroke="#ff3b30" stroke-width="3" stroke-linecap="round"/>${[
    30, 92,
  ]
    .map(
      (x) =>
        `<g transform="translate(${x} 98)"><circle r="11.5" fill="#15171c"/><circle r="7.5" fill="url(#${p}-r)"/><path d="M0 -7V7M-7 0H7M-5 -5L5 5M5 -5L-5 5" stroke="#6b737e" stroke-width="1.2"/><circle r="2" fill="#3a3f47"/></g>`
    )
    .join("")}`;

const elephant: Draw = (p) =>
  `<defs>${soft(p)}${radial(
    `${p}-b`,
    [54, 54, 64],
    [
      [0, "#c8c2bb"],
      [0.6, "#8f8882"],
      [1, "#4f4944"],
    ]
  )}${radial(
    `${p}-e`,
    [44, 56, 30],
    [
      [0, "#b7aaa5"],
      [1, "#6e6560"],
    ]
  )}</defs>${shadowOf(p, 48)}<g fill="#6a635d"><rect x="72" y="84" width="12" height="25" rx="4"/><rect x="92" y="82" width="12" height="27" rx="4"/></g><path d="M104 62C110 66 112 74 110 80" fill="none" stroke="#6a635d" stroke-width="2" stroke-linecap="round"/><ellipse cx="72" cy="70" rx="36" ry="25" fill="url(#${p}-b)"/><g fill="url(#${p}-b)"><rect x="40" y="82" width="13" height="27" rx="4"/><rect x="58" y="84" width="13" height="25" rx="4"/></g><g fill="#e6ded2">${[
    42.5, 46.5, 50.5, 60.5, 64.5, 68.5,
  ]
    .map((x) => `<ellipse cx="${x}" cy="107.6" rx="1.7" ry="1.3"/>`)
    .join(
      ""
    )}</g><path d="M38 58C30 60 22 70 20 82C18 92 16 100 20 106C24 106 26 102 24 96C24 86 28 76 34 72Z" fill="url(#${p}-b)"/><path d="M21 90h4M20 96h4M22 84h4" stroke="#5f5853" stroke-width="0.9"/><path d="M40 40C60 30 74 46 71 64C68 82 56 88 46 80C38 74 36 56 40 40Z" fill="url(#${p}-e)" stroke="#4f4944" stroke-width="1.2"/><path d="M48 46C60 42 66 54 63 66C61 74 55 76 50 72" fill="none" stroke="#5f5853" stroke-width="1" opacity="0.6"/><circle cx="36" cy="58" r="16" fill="url(#${p}-b)"/><path d="M26 48C30 44 38 43 44 46" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.4" stroke-linecap="round"/><path d="M28 74C22 80 16 82 10 80" fill="none" stroke="#fffaf0" stroke-width="3.4" stroke-linecap="round"/><circle cx="30" cy="56" r="2" fill="#1b1916"/><path d="M72 54C82 52 90 54 96 58" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.35"/>`;

const cloud: Draw = (p) =>
  `<defs>${soft(p)}${blur(`${p}-h`, 4)}${linear(
    `${p}-c`,
    [0, 36, 0, 108],
    [
      [0, "#ffffff"],
      [0.55, "#e7eef8"],
      [1, "#9bb0c9"],
    ]
  )}</defs>${shadowOf(p, 44)}<g fill="url(#${p}-c)"><circle cx="34" cy="84" r="20"/><circle cx="54" cy="64" r="26"/><circle cx="68" cy="52" r="16"/><circle cx="80" cy="68" r="22"/><circle cx="98" cy="86" r="15"/><rect x="18" y="82" width="90" height="26" rx="13"/></g><g fill="#fff" opacity="0.9" filter="url(#${p}-h)"><circle cx="50" cy="58" r="14"/><circle cx="76" cy="62" r="10"/><circle cx="32" cy="80" r="9"/><circle cx="64" cy="48" r="7"/></g><path d="M22 100C44 106 84 106 104 98" fill="none" stroke="#7f95b2" stroke-width="2" opacity="0.4"/>`;

const takoishi: Draw = (p) =>
  `<defs>${soft(p)}${linear(
    `${p}-g`,
    [10, 30, 110, 110],
    [
      [0, "#e4ded3"],
      [0.5, "#aaa297"],
      [1, "#6a6359"],
    ]
  )}</defs>${shadowOf(p, 54)}<path d="M8 109L12 40L22 32L96 28L108 36L112 109Z" fill="url(#${p}-g)"/>${dots(11, 70, [12, 34, 96, 72], [0.4, 1.2], "#4a443c", 0.45)}${dots(23, 40, [12, 34, 96, 72], [0.4, 1], "#ffffff", 0.5)}<path d="M18 104C18 92 24 86 32 86C40 86 44 92 42 100M24 104C22 98 26 94 28 98M30 104C30 98 34 96 34 100M36 104C38 98 42 98 40 104" fill="none" stroke="#3d362e" stroke-width="2.4" opacity="0.4" stroke-linecap="round"/><ellipse cx="31" cy="90" rx="8" ry="6" fill="#3d362e" opacity="0.3"/><path d="M12 40L22 32L96 28L108 36" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.5"/><path d="M108 36L112 109" stroke="#3d362e" stroke-width="1.4" opacity="0.4"/><g transform="translate(98 95)"><circle cy="-8" r="2.4" fill="#1d2433"/><path d="M-3 -5H3L4 6H1L0 1L-1 6H-4Z" fill="#1d2433"/></g>`;

const whaleBody =
  "M4 82C6 70 20 64 42 64C66 64 84 70 96 72C102 72 106 66 108 58C104 54 100 50 97 45C104 47 109 51 112 54C114 50 116 46 120 43C119 50 117 56 113 62C110 72 106 82 96 88C80 96 62 98 42 98C20 98 4 92 4 82Z";

const blueWhale: Draw = (p) =>
  `<defs>${soft(p)}${shade(`${p}-b`, [
    [0, "#8db7de"],
    [0.5, "#3f72a6"],
    [1, "#1c3b63"],
  ])}<clipPath id="${p}-c"><path d="${whaleBody}"/></clipPath></defs>${shadowOf(p, 50)}<path d="${whaleBody}" fill="url(#${p}-b)"/><g clip-path="url(#${p}-c)">${dots(5, 26, [34, 66, 66, 18], [0.8, 2], "#cfe4f6", 0.35)}<path d="M4 86C20 92 40 95 64 95M6 90C22 95 42 98 62 98" fill="none" stroke="#b9d6ee" stroke-width="1" opacity="0.6"/></g><path d="M80 68L88 61L90 70Z" fill="#2a5585"/><path d="M6 83C16 85 28 85 38 82" fill="none" stroke="#14294a" stroke-width="1.4" stroke-linecap="round"/><circle cx="28" cy="78" r="1.8" fill="#0c1a30"/><path d="M40 88C46 94 54 94 58 90" fill="#2c5a8c"/><path d="M18 68C34 64 58 64 80 68" fill="none" stroke="#fff" stroke-width="1.8" opacity="0.4" stroke-linecap="round"/><g fill="#d8eeff" opacity="0.9"><path d="M30 63C28 54 22 47 16 44C24 45 30 51 32 61Z"/><path d="M31 63C32 53 38 46 44 43C39 50 35 56 33 63Z"/><circle cx="16" cy="39" r="1.8"/><circle cx="45" cy="38" r="1.8"/><circle cx="30" cy="42" r="1.5"/><circle cx="23" cy="36" r="1.2"/><circle cx="38" cy="35" r="1.2"/></g>`;

const a380: Draw = (p) =>
  `<defs>${soft(p)}${shade(`${p}-f`, [
    [0, "#ffffff"],
    [0.6, "#e1e8f0"],
    [1, "#94a3b4"],
  ])}${shade(`${p}-t`, [
    [0, "#3a7bd5"],
    [1, "#0f2f6b"],
  ])}${shade(`${p}-e`, [
    [0, "#d7dee6"],
    [1, "#6b7785"],
  ])}</defs>${shadowOf(p, 52)}<path d="M34 80V104M74 84V104" stroke="#4a525c" stroke-width="2"/><g fill="#1b1d22"><circle cx="32" cy="105" r="3.4"/><circle cx="38" cy="105" r="3.4"/><circle cx="72" cy="105" r="3.4"/><circle cx="78" cy="105" r="3.4"/></g><path d="M44 74L80 74L100 94L88 94Z" fill="#aeb9c6"/><path d="M98 52L110 24H118L114 56Z" fill="url(#${p}-t)"/><path d="M4 68C4 56 14 50 28 50H100L114 58C114 70 110 78 102 78H18C10 78 4 74 4 68Z" fill="url(#${p}-f)"/><path d="M4 70C20 74 70 76 112 70" fill="none" stroke="#2b5ba8" stroke-width="2.4"/><g stroke="#2b3a52" stroke-width="2.2" stroke-dasharray="2 2.6"><path d="M22 58H96"/><path d="M18 66H98"/></g><path d="M7 60C9 56 13 54 16 54L17 60Z" fill="#1b2635"/><rect x="56" y="82" width="20" height="8" rx="4" fill="url(#${p}-e)"/><rect x="74" y="90" width="18" height="7" rx="3.5" fill="url(#${p}-e)"/><path d="M14 52C40 50 80 50 100 52" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.8"/>`;

const iss: Draw = (p) => {
  const panel = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="17" height="25" fill="url(#${p}-a)" stroke="#5a3a10" stroke-width="0.6"/><path d="M${x + 8.5} ${y}v25M${x} ${y + 6}h17M${x} ${y + 12.5}h17M${x} ${y + 19}h17" stroke="#5a3a10" stroke-width="0.4" opacity="0.7"/>`;

  const panels = [6, 26, 77, 97]
    .flatMap((x) => [panel(x, 38), panel(x, 69)])
    .join("");

  return `<defs>${soft(p)}${linear(
    `${p}-a`,
    [0, 30, 0, 100],
    [
      [0, "#f7c35c"],
      [0.5, "#c47a1a"],
      [1, "#7a430c"],
    ]
  )}${shade(
    `${p}-m`,
    [
      [0, "#9aa3ad"],
      [0.4, "#ffffff"],
      [1, "#8e98a4"],
    ],
    false
  )}</defs>${shadowOf(p, 40)}<path d="M4 66H116" stroke="#b9c1cb" stroke-width="3.4"/><path d="M4 66H116" stroke="#6b7480" stroke-width="1" stroke-dasharray="2 2"/>${panels}<rect x="52" y="44" width="16" height="56" rx="4" fill="url(#${p}-m)"/><rect x="40" y="58" width="40" height="14" rx="5" fill="url(#${p}-m)"/><path d="M52 52h16M52 82h16M52 92h16" stroke="#7d8793" stroke-width="0.8"/><rect x="56" y="100" width="8" height="10" rx="2" fill="url(#${p}-m)"/><path d="M44 50L36 42M76 50L84 42" stroke="#e8edf2" stroke-width="3"/>`;
};

const shuttle: Draw = (p) =>
  `<defs>${soft(p)}${shade(`${p}-w`, [
    [0, "#ffffff"],
    [0.6, "#e3e8ee"],
    [1, "#9ca6b2"],
  ])}</defs>${shadowOf(p, 52)}<path d="M42 84L98 84L108 100L58 100Z" fill="url(#${p}-w)"/><path d="M42 84L58 100" stroke="#1d2026" stroke-width="3"/><path d="M58 100H108" stroke="#1d2026" stroke-width="2.4"/><path d="M96 66L108 30H116L114 66Z" fill="url(#${p}-w)"/><path d="M108 30H116" stroke="#1d2026" stroke-width="3"/><path d="M96 66L108 30" stroke="#1d2026" stroke-width="1.6"/><g fill="#5d6570"><path d="M112 66L120 62V72L112 70Z"/><path d="M112 74L120 72V82L112 80Z"/></g><path d="M6 80C8 70 18 64 30 64H108L112 86L30 88C16 88 6 86 6 80Z" fill="url(#${p}-w)"/><path d="M6 80C8 84 16 88 30 88H112L111 82H32C20 82 12 82 6 80Z" fill="#23262d"/><path d="M6 80C6 76 8 72 11 70L14 80Z" fill="#23262d"/><path d="M16 68L22 66L24 70L17 72ZM25 65.5L31 65L32 69L26 69.5Z" fill="#1b2635"/><path d="M36 64V82M36 73H104" stroke="#9ca6b2" stroke-width="0.8"/><path d="M30 66H104" stroke="#fff" stroke-width="1.6" opacity="0.8"/><rect x="74" y="70" width="10" height="5" fill="#bf2a2a"/><rect x="74" y="70" width="4" height="2.6" fill="#24408e"/>`;

const saturnV: Draw = (p) =>
  `<defs>${soft(p)}${linear(
    `${p}-w`,
    [44, 0, 76, 0],
    [
      [0, "#9aa1aa"],
      [0.4, "#ffffff"],
      [0.7, "#d6dbe1"],
      [1, "#7f8690"],
    ]
  )}</defs>${shadowOf(p, 26)}<path d="M60 2V14M57 8H63" stroke="#c9ccd2" stroke-width="1.2"/><path d="M55 22L60 12L65 22Z" fill="url(#${p}-w)"/><rect x="54" y="22" width="12" height="8" fill="url(#${p}-w)"/><rect x="52" y="30" width="16" height="18" fill="url(#${p}-w)"/><path d="M52 48L48 54H72L68 48Z" fill="url(#${p}-w)"/><rect x="48" y="54" width="24" height="22" fill="url(#${p}-w)"/><path d="M48 76L46 80H74L72 76Z" fill="url(#${p}-w)"/><rect x="46" y="80" width="28" height="24" fill="url(#${p}-w)"/><g fill="#1b1d22"><rect x="52" y="38" width="16" height="3"/><rect x="48" y="54" width="24" height="3"/><rect x="60" y="62" width="12" height="8"/><rect x="46" y="80" width="28" height="4"/><rect x="46" y="94" width="14" height="10"/><rect x="60" y="88" width="14" height="6"/></g><path d="M46 96L36 108H46ZM74 96L84 108H74Z" fill="#2a2d33"/><g fill="#3a3e46"><path d="M50 104h7l1 6h-9Z"/><path d="M57 104h6l1 6h-8Z"/><path d="M63 104h7l1 6h-9Z"/></g><path d="M55 24V104" stroke="#fff" stroke-width="1.6" opacity="0.6"/>`;

const latticeOf = (p: string) => {
  const lines = [];

  for (let y = 4; y < 110; y += 7) {
    lines.push(`M0 ${y}L120 ${y + 7}M120 ${y}L0 ${y + 7}`);
  }

  return `<path d="${lines.join("")}" stroke="#1b0d06" stroke-width="0.7" opacity="0.35" clip-path="url(#${p}-c)"/>`;
};

const tokyoTower: Draw = (p) => {
  const outline =
    "M28 110L50 66L55 34L59 4H61L65 34L70 66L92 110H80L60 82L40 110Z";

  const bands = Array.from({ length: 8 }, (_, i): Stop[] => {
    const color = i % 2 === 0 ? "#f0542f" : "#fbf4ec";

    return [
      [i / 8, color],
      [(i + 1) / 8, color],
    ];
  }).flat();

  return `<defs>${soft(p)}${linear(`${p}-b`, [0, 4, 0, 110], bands)}<clipPath id="${p}-c"><path d="${outline}"/></clipPath></defs>${shadowOf(p, 34)}<path d="${outline}" fill="url(#${p}-b)"/>${latticeOf(p)}<path d="M60 4V110" stroke="#fff" stroke-width="0.8" opacity="0.4" clip-path="url(#${p}-c)"/><rect x="45" y="62" width="30" height="7" rx="1" fill="#e8edf2" stroke="#7a2a16" stroke-width="0.8"/><path d="M46 65h28" stroke="#3a4a5c" stroke-width="2" stroke-dasharray="2 1.4"/><rect x="53" y="32" width="14" height="4" rx="1" fill="#e8edf2" stroke="#7a2a16" stroke-width="0.6"/><circle cx="60" cy="4" r="1.4" fill="#ff4d3a"/>`;
};

const eiffel: Draw = (p) => {
  const outline =
    "M22 110C34 96 40 82 46 68L52 48L57 20L59 4H61L63 20L68 48L74 68C80 82 86 96 98 110H84C78 98 70 92 60 92C50 92 42 98 36 110Z";

  return `<defs>${soft(p)}${linear(
    `${p}-b`,
    [40, 0, 80, 0],
    [
      [0, "#5e3f22"],
      [0.45, "#b88a58"],
      [1, "#4a3018"],
    ]
  )}<clipPath id="${p}-c"><path d="${outline}"/></clipPath></defs>${shadowOf(p, 40)}<path d="${outline}" fill="url(#${p}-b)"/>${latticeOf(p)}<rect x="40" y="66" width="40" height="5" rx="1" fill="#6b4a2c" stroke="#d9b07a" stroke-width="0.6"/><rect x="50" y="46" width="20" height="4" rx="1" fill="#6b4a2c" stroke="#d9b07a" stroke-width="0.6"/><rect x="56" y="18" width="8" height="3" fill="#6b4a2c"/><path d="M60 4V110" stroke="#ffe0a8" stroke-width="0.8" opacity="0.35" clip-path="url(#${p}-c)"/>`;
};

const liberty: Draw = (p) => {
  const spikes = Array.from({ length: 7 }, (_, i) => {
    const angle = Math.PI * (1.05 + (i / 6) * 0.9);
    const [x, y] = [56 + Math.cos(angle) * 7, 40 + Math.sin(angle) * 7];
    const [tipX, tipY] = [56 + Math.cos(angle) * 14, 40 + Math.sin(angle) * 14];

    return `M${n(x - 1.4)} ${n(y)}L${n(tipX)} ${n(tipY)}L${n(x + 1.4)} ${n(y)}Z`;
  }).join("");

  return `<defs>${soft(p)}${linear(
    `${p}-g`,
    [40, 0, 80, 0],
    [
      [0, "#2f6b5c"],
      [0.4, "#9fdcc6"],
      [1, "#2a5e51"],
    ]
  )}${radial(
    `${p}-f`,
    [84, 10, 10],
    [
      [0, "#fff6c8"],
      [0.5, "#ffc34a"],
      [1, "#e07a12"],
    ]
  )}${radial(
    `${p}-h`,
    [84, 10, 18],
    [
      [0, "#ffd27a", 0.7],
      [1, "#ffd27a", 0],
    ]
  )}</defs>${shadowOf(p, 22)}<circle cx="84" cy="10" r="18" fill="url(#${p}-h)"/><path d="M66 54L78 20L85 22L74 58Z" fill="url(#${p}-g)"/><path d="M78 20H88L86 24H80Z" fill="#c99a2e"/><path d="M79 18C78 10 84 4 85 2C86 8 90 10 89 18Z" fill="url(#${p}-f)"/><path d="M42 110L46 68C46 54 50 48 56 47H62C68 48 72 56 72 68L78 110Z" fill="url(#${p}-g)"/><path d="M50 62C52 80 50 96 48 110M58 54C60 74 60 94 60 110M66 60C68 80 70 96 72 110" fill="none" stroke="#1f4d41" stroke-width="1.2" opacity="0.6"/><path d="M47 64L37 72L42 86L52 78Z" fill="#7cc0aa" stroke="#1f4d41" stroke-width="0.8"/><path d="${spikes}" fill="#7cc0aa"/><circle cx="56" cy="40" r="7.5" fill="url(#${p}-g)"/><path d="M48 39H64" stroke="#2a5e51" stroke-width="2"/><path d="M52 56C54 70 54 90 52 108" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.4"/>`;
};

const turret = (x: number, y: number, flip: boolean) =>
  `<g transform="translate(${x} ${y})${flip ? " scale(-1 1)" : ""}"><path d="M-6 0L-5 -5H5L7 0Z" fill="#7d8792"/><path d="M-5 -3.6H-18M-5 -2H-18M-5 -0.4H-18" stroke="#3a4048" stroke-width="1.1"/></g>`;

const yamato: Draw = (p) =>
  `<defs>${soft(p)}${shade(`${p}-h`, [
    [0, "#b7c0ca"],
    [1, "#545e69"],
  ])}${shade(`${p}-x`, [
    [0, "#6ab8e6"],
    [1, "#1d5d8f"],
  ])}</defs>${shadowOf(p, 54)}<path d="M2 76L116 82L108 100L18 100C10 94 4 86 2 76Z" fill="url(#${p}-h)"/><path d="M8 92L112 92L108 100L18 100Z" fill="#8e2d24"/><path d="M4 79L114 84" stroke="#e8edf2" stroke-width="1" opacity="0.6"/><path d="M52 80L55 50L60 42H66L68 50L72 80Z" fill="url(#${p}-h)"/><path d="M53 60H71M54 52H69M55 70H72" stroke="#3a4048" stroke-width="1.2"/><path d="M62 42V30M58 34H66" stroke="#3a4048" stroke-width="1.2"/><path d="M74 80L77 60H84L86 80Z" fill="#6b7580"/><ellipse cx="80.5" cy="60" rx="3.6" ry="1.2" fill="#2a2f36"/>${turret(28, 80, false)}${turret(40, 76, false)}${turret(98, 82, true)}<path d="M0 104C8 98 14 104 22 100C30 96 36 104 44 100C52 96 58 104 66 100C74 96 80 104 88 100C96 96 102 104 110 100C114 98 118 100 120 102V112H0Z" fill="url(#${p}-x)"/><path d="M2 102C8 98 14 102 20 100M44 100C50 97 56 102 62 100M88 100C94 97 100 102 106 100" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.8"/>`;

const hooverDam: Draw = (p) =>
  `<defs>${soft(p)}${linear(
    `${p}-r`,
    [0, 30, 0, 110],
    [
      [0, "#e9a36f"],
      [1, "#7b3b20"],
    ]
  )}${linear(
    `${p}-d`,
    [26, 0, 94, 0],
    [
      [0, "#8f897f"],
      [0.5, "#f3efe7"],
      [1, "#8f897f"],
    ]
  )}${shade(`${p}-w`, [
    [0, "#7ad0f0"],
    [1, "#1f6fa6"],
  ])}</defs>${shadowOf(p, 54)}<path d="M18 36C40 44 80 44 102 36L94 50C74 58 46 58 26 50Z" fill="url(#${p}-w)"/><path d="M30 42C44 46 76 46 90 42" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/><path d="M26 50C46 58 74 58 94 50L98 110H22Z" fill="url(#${p}-d)"/><path d="M26 50C46 58 74 58 94 50" fill="none" stroke="#fff" stroke-width="2"/><path d="M36 60L32 110M48 62L46 110M60 63V110M72 62L74 110M84 60L88 110" stroke="#7a756c" stroke-width="0.6" opacity="0.5"/><g fill="#f6f2ea" stroke="#8f897f" stroke-width="0.6"><rect x="32" y="40" width="5" height="10"/><rect x="83" y="40" width="5" height="10"/></g><path d="M0 110V40L14 34L20 44L26 52L22 110Z" fill="url(#${p}-r)"/><path d="M120 110V40L106 34L100 44L94 52L98 110Z" fill="url(#${p}-r)"/><path d="M4 56L12 52M6 74L16 70M104 60L114 56M102 80L112 76" stroke="#5a2a14" stroke-width="1.2" opacity="0.5"/><path d="M40 106C52 102 68 102 80 106L82 110H38Z" fill="url(#${p}-w)"/>`;

const tokyoDome: Draw = (p) => {
  const bubbles = [
    [34, 76, 2.2],
    [40, 70, 1.4],
    [44, 78, 1.6],
    [88, 72, 1.4],
  ]
    .map(
      ([x = 0, y = 0, r = 1]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#e9f8ff" stroke-width="0.8"/>`
    )
    .join("");

  const gates = [20, 34, 48, 62, 76, 90]
    .map((x) => `<rect x="${x}" y="92" width="8" height="12" rx="1"/>`)
    .join("");

  return `<defs>${soft(p)}${linear(
    `${p}-w`,
    [0, 56, 0, 104],
    [
      [0, "#c8ecff"],
      [0.3, "#5fb6ea"],
      [1, "#14528f"],
    ]
  )}${shade(`${p}-b`, [
    [0, "#f4f6f8"],
    [1, "#a9b3be"],
  ])}<clipPath id="${p}-c"><path d="M12 86C12 52 108 52 108 86Z"/></clipPath></defs>${shadowOf(p, 52)}<rect x="12" y="84" width="96" height="24" rx="3" fill="url(#${p}-b)"/><g fill="#4a5664">${gates}</g><path d="M12 86C12 52 108 52 108 86Z" fill="url(#${p}-w)"/><g clip-path="url(#${p}-c)"><path d="M12 66Q24 61 36 66T60 66T84 66T108 66" fill="none" stroke="#e9f8ff" stroke-width="1.8"/><path d="M12 64H108V54H12Z" fill="#e9f8ff" opacity="0.5"/><path d="M14 56L60 86L106 56M14 86L60 56L106 86M36 56L60 86M84 56L60 86" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.35"/><g transform="translate(70 76)"><path d="M0 0C4 -4 10 -4 13 0C10 4 4 4 0 0Z" fill="#ff8a3d"/><path d="M13 0L18 -4V4Z" fill="#ff6a2a"/><circle cx="3.6" cy="-0.6" r="1" fill="#1b1d22"/></g>${bubbles}</g><path d="M12 86C12 52 108 52 108 86" fill="none" stroke="#f4f6f8" stroke-width="2.4"/><path d="M26 66C34 60 46 58 54 58" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.8" stroke-linecap="round"/>`;
};

const mikan: Draw = (p) => {
  const fruit = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="13.5" fill="url(#${p}-o)"/>${dots(x * 7 + y, 9, [x - 9, y - 8, 18, 16], [0.4, 0.8], "#b04a05", 0.4)}<ellipse cx="${x - 5}" cy="${y - 6}" rx="4" ry="2.4" fill="#fff" opacity="0.6"/>`;

  const pile = [
    [34, 96],
    [60, 96],
    [86, 96],
    [47, 73],
    [73, 73],
    [60, 50],
  ]
    .map(([x = 0, y = 0]) => fruit(x, y))
    .join("");

  return `<defs>${soft(p)}<radialGradient id="${p}-o" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#ffe08a"/><stop offset="0.45" stop-color="#ff9a1f"/><stop offset="1" stop-color="#c2520a"/></radialGradient></defs>${shadowOf(p, 50)}${pile}<path d="M60 38V34" stroke="#4a6a1e" stroke-width="2.4" stroke-linecap="round"/><path d="M60 35C66 28 76 28 80 30C74 38 66 38 60 35Z" fill="#4fa83a"/><path d="M62 34C68 32 74 31 78 31" stroke="#2f7a24" stroke-width="0.8" fill="none"/>`;
};

const rice: Draw = (p) => {
  const bale = (x: number, y: number) =>
    `<g transform="translate(${x} ${y})"><rect x="-24" y="-14" width="48" height="28" rx="12" fill="url(#${p}-t)"/><path d="M-20 -8H20M-22 -3H22M-22 2H22M-21 7H21" stroke="#9c7432" stroke-width="0.6" opacity="0.6"/><path d="M-12 -14C-14 -4 -14 4 -12 14M0 -14V14M12 -14C14 -4 14 4 12 14" stroke="#7a521c" stroke-width="2.6"/><ellipse cx="-22" cy="0" rx="5" ry="13" fill="url(#${p}-e)"/><path d="M-22 -11V11M-26 -6L-18 6M-26 6L-18 -6" stroke="#9c7432" stroke-width="0.6"/></g>`;

  const grains = [
    [56, 108, 20],
    [62, 109, -30],
    [67, 107, 60],
    [52, 109, -60],
  ]
    .map(
      ([x = 0, y = 0, a = 0]) =>
        `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1.1" transform="rotate(${a} ${x} ${y})"/>`
    )
    .join("");

  return `<defs>${soft(p)}${shade(`${p}-t`, [
    [0, "#fbe7a8"],
    [0.5, "#dcb25c"],
    [1, "#94692a"],
  ])}${radial(
    `${p}-e`,
    [0, 0, 12],
    [
      [0, "#f6dc90"],
      [1, "#b98a3c"],
    ]
  )}</defs>${shadowOf(p, 54)}${bale(34, 94)}${bale(86, 94)}${bale(60, 66)}<g fill="#fffdf4" stroke="#d9cfb3" stroke-width="0.3">${grains}</g>`;
};

const foodLoss: Draw = (p) =>
  `<defs>${soft(p)}${radial(
    `${p}-r`,
    [40, 74, 30],
    [
      [0, "#ffffff"],
      [1, "#d7d2c6"],
    ]
  )}${shade(`${p}-b`, [
    [0, "#f2b05a"],
    [0.6, "#c87425"],
    [1, "#7f4211"],
  ])}${radial(
    `${p}-a`,
    [80, 84, 16],
    [
      [0, "#ff8a7a"],
      [0.6, "#d6202a"],
      [1, "#7a0d12"],
    ]
  )}</defs>${shadowOf(p, 54)}<ellipse cx="60" cy="102" rx="52" ry="10" fill="#e9eef3"/><ellipse cx="60" cy="100" rx="44" ry="7" fill="#fbfdff" stroke="#c4ccd6" stroke-width="0.8"/><path d="M44 96C42 74 58 62 72 64C86 66 92 78 90 96Z" fill="url(#${p}-b)"/><path d="M54 74C58 70 62 70 64 72M64 70C68 66 72 66 74 68M74 70C78 68 82 70 84 74" fill="none" stroke="#7f4211" stroke-width="1.2" opacity="0.6"/><path d="M52 70C58 66 66 64 74 66" fill="none" stroke="#fff3d6" stroke-width="1.6" opacity="0.6"/><path d="M26 98C22 98 20 94 22 90L34 64C36 60 42 60 44 64L56 90C58 94 56 98 52 98Z" fill="url(#${p}-r)"/>${dots(31, 14, [26, 66, 26, 28], [0.4, 0.8], "#bdb6a6", 0.6)}<path d="M28 84H50L54 92C55 96 53 98 50 98H28C25 98 23 96 24 92Z" fill="#1e3a26"/><path d="M28 86H50" stroke="#3a6a44" stroke-width="0.8"/><path d="M92 76C96 72 100 72 102 76C100 80 102 84 100 88C102 92 98 96 94 96C90 100 82 100 76 98C68 96 66 88 68 80C70 72 80 70 86 74C88 72 90 74 92 76Z" fill="url(#${p}-a)"/><path d="M92 76C88 80 88 92 94 96C98 92 100 84 98 78Z" fill="#fff5d8"/><path d="M85 74C84 68 86 64 88 62" stroke="#5a3a1a" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M86 66C82 60 76 60 74 62C78 66 82 66 86 66Z" fill="#4fa83a"/><ellipse cx="74" cy="80" rx="3" ry="4" fill="#fff" opacity="0.5"/>`;

const rubbish: Draw = (p) => {
  const bag = (x: number, y: number, scale: number) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-22 26C-36 26 -38 4 -30 -10C-24 -20 -14 -24 -8 -28L-12 -38L-3 -33L2 -40L4 -28C12 -22 22 -14 22 4C22 20 12 26 -22 26Z" fill="url(#${p}-b)" stroke="#9aa6b3" stroke-width="0.8"/><g fill="#3a4250" opacity="0.12" filter="url(#${p}-s)"><circle cx="-14" cy="6" r="8"/><rect x="0" y="-4" width="12" height="14" rx="2"/><circle cx="-4" cy="16" r="6"/></g><path d="M-26 0C-22 4 -18 10 -18 18M10 -10C14 -4 16 4 14 12M-8 -24C-6 -16 -2 -10 4 -6" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.7"/></g>`;

  return `<defs>${soft(p)}${linear(
    `${p}-b`,
    [-30, -30, 20, 26],
    [
      [0, "#ffffff", 0.95],
      [0.6, "#e6ebf0", 0.92],
      [1, "#a7b2bf", 0.95],
    ]
  )}</defs>${shadowOf(p, 52)}${bag(86, 82, 0.9)}${bag(40, 82, 1)}${bag(66, 62, 0.8)}<g transform="translate(62 30) scale(1.45)"><path d="M14 2L24 -2L22 4Z" fill="#1b1d24"/><ellipse cx="2" cy="4" rx="12" ry="7" fill="#1b1d24"/><circle cx="-10" cy="-2" r="5.4" fill="#1b1d24"/><path d="M-15 -3L-22 -1L-15 0Z" fill="#2b2e36"/><circle cx="-11" cy="-3" r="1" fill="#e8edf2"/><path d="M0 10L-2 16M4 10L4 16" stroke="#1b1d24" stroke-width="1.4"/><path d="M-4 0C2 -2 8 0 12 4" fill="none" stroke="#5a6fb0" stroke-width="1.2" opacity="0.7"/></g>`;
};

const bean = (x: number, y: number, angle: number, fill: string) =>
  `<g transform="translate(${n(x)} ${n(y)}) rotate(${angle})"><ellipse rx="3.6" ry="2.6" fill="${fill}"/><path d="M-3 0.4C-1 -0.6 1 0.6 3 -0.4" stroke="#1c0d04" stroke-width="0.7" fill="none"/></g>`;

const coffee: Draw = (p) => {
  const roll = seeded(41);

  const pile = Array.from({ length: 22 }, (_, i) => {
    const x = 36 + roll() * 48;
    const y = 42 - Math.sin(((x - 36) / 48) * Math.PI) * 9 + roll() * 6;

    return bean(
      x,
      y,
      Math.round(roll() * 180),
      i % 3 === 0 ? "#5a3216" : "#3d200d"
    );
  }).join("");

  const spilled = [
    bean(30, 108, 20, "#4a2a12"),
    bean(40, 110, -40, "#4a2a12"),
    bean(84, 109, 70, "#4a2a12"),
    bean(92, 107, 10, "#4a2a12"),
  ].join("");

  const weave = [
    ...Array.from({ length: 22 }, (_, i) => `M${16 + i * 4} 40V108`),
    ...Array.from({ length: 18 }, (_, i) => `M16 ${42 + i * 4}H104`),
  ].join("");

  const sack =
    "M28 106C18 106 16 96 18 82C20 66 24 54 30 46C40 42 80 42 90 46C96 54 100 66 102 82C104 96 102 106 92 106Z";

  return `<defs>${soft(p)}${linear(
    `${p}-j`,
    [18, 40, 102, 106],
    [
      [0, "#e6c897"],
      [0.5, "#b48a52"],
      [1, "#6e4f2c"],
    ]
  )}<clipPath id="${p}-c"><path d="${sack}"/></clipPath></defs>${shadowOf(p, 50)}<path d="${sack}" fill="url(#${p}-j)"/><path d="${weave}" stroke="#5a3e1f" stroke-width="0.5" opacity="0.35" clip-path="url(#${p}-c)"/><circle cx="60" cy="80" r="12" fill="none" stroke="#5a3e1f" stroke-width="1.6" opacity="0.5"/><path d="M52 80H68M60 72V88" stroke="#5a3e1f" stroke-width="1.6" opacity="0.5"/><ellipse cx="60" cy="46" rx="31" ry="7" fill="#2a1608"/>${pile}<path d="M29 46C40 52 80 52 91 46" fill="none" stroke="#f0d8ac" stroke-width="3" stroke-linecap="round"/><path d="M24 60C22 74 22 90 26 100" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.35"/>${spilled}`;
};

const drawings = new Map<string, Draw>([
  ["a380", a380],
  ["baseball", baseball],
  ["blue-whale", blueWhale],
  ["cloud", cloud],
  ["coffee", coffee],
  ["egg", egg],
  ["eiffel", eiffel],
  ["elephant", elephant],
  ["emperors-cup", emperorsCup],
  ["five-hundred-yen", fiveHundredYen],
  ["food-loss", foodLoss],
  ["gold-medal", medal],
  ["grand-piano", grandPiano],
  ["hoover-dam", hooverDam],
  ["iss", iss],
  ["liberty", liberty],
  ["mikan", mikan],
  ["newborn", newborn],
  ["oku-yen", okuYen],
  ["one-yen", oneYen],
  ["panda", panda],
  ["prius", prius],
  ["rice", rice],
  ["rubbish", rubbish],
  ["saturn-v", saturnV],
  ["shuttle", shuttle],
  ["takoishi", takoishi],
  ["tokyo-dome", tokyoDome],
  ["tokyo-tower", tokyoTower],
  ["yamato", yamato],
]);

const artBody = (id: string) => drawings.get(id)?.(`a-${id}`) ?? "";

export const artDoc = (id: string, size = ART) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART} ${ART}" width="${size}" height="${size}">${artBody(id)}</svg>`;

const uris = new Map<string, string>();

export const artUri = (id: string) => {
  const known = uris.get(id);

  if (known !== undefined) {
    return known;
  }

  const uri = dataUri(artDoc(id));
  uris.set(id, uri);

  return uri;
};
