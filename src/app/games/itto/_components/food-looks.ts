import type { Art, Kind } from "../_lib/foods";

interface Band {
  to: number;
  colour: string;
}

interface Filling {
  from: number;
  to: number;
  inset: number;
  colour: string;
}

export interface Look {
  depth: number;
  top: string;
  sides: Band[];
  inside: Band[];
  fillings: Filling[];
  rim: string;
  round: boolean;
  gloss: number;
}

export const paint = {
  anko: "#3a1a20",
  back: "#3b4b5f",
  batter: "#e8b75b",
  batterDeep: "#c3862c",
  batterLight: "#f8dc98",
  beak: "#e7bb4c",
  bean: "#2a1621",
  belly: "#dfe4e7",
  cake: "#efc47c",
  calyx: "#55682c",
  cap: "#86562f",
  capDeep: "#4f2e16",
  calyxDry: "#7a5a2a",
  carrot: "#f07b1f",
  carrotCore: "#f9a748",
  carrotDeep: "#d55f10",
  castella: "#f3c24c",
  castellaBase: "#b77a32",
  char: "#2b1a10",
  chestnut: "#e8b84a",
  chestnutEdge: "#b98322",
  chiai: "#8e4b3d",
  chicken: "#f1dfc4",
  chikuwa: "#f2e1bb",
  chikuwaBrown: "#bb722c",
  chikuwaDeep: "#8c4d1a",
  crack: "#cdbfa4",
  crisp: "#e6c58f",
  crust: "#7c3c14",
  crustPore: "#5e2a0c",
  cucumber: "#5f9a3e",
  cucumberCore: "#cfe6a6",
  daidai: "#f08a1c",
  daidaiDeep: "#d8650f",
  dark: "#000000",
  dora: "#9c5528",
  doraDeep: "#6a3412",
  doraRim: "#e3ad64",
  egg: "#f4cf4a",
  eggDeep: "#e3ae2a",
  flesh: "#eddcc6",
  fuji: "#3f6fb8",
  fujiDeep: "#2b4f90",
  fujiLight: "#a6c1ea",
  fibre: "#b08a5e",
  ginger: "#f3dc9a",
  gingerFibre: "#d9b862",
  gold: "#efc03f",
  goldDeep: "#a9741a",
  goldLight: "#fff3b0",
  gyoza: "#f3e3bf",
  gyozaBrown: "#bf7326",
  gyozaSide: "#dcc48f",
  hollow: "#4c321f",
  kaki: "#ef861c",
  kakiCore: "#f8b45c",
  kakiDeep: "#d55e14",
  kakiLight: "#f9a845",
  kanpyo: "#b5803f",
  kuri: "#6e3c1d",
  kuriBottom: "#cfac74",
  kuriDeep: "#4a2510",
  kuriInside: "#f2c95d",
  leaf: "#3f7a2c",
  light: "#ffffff",
  leafVein: "#9cc97e",
  maguro: "#c42b3b",
  maguroSinew: "#f7c6cb",
  matcha: "#3d4c1f",
  matchaInside: "#4b5d26",
  meat: "#b98371",
  mikan: "#f7a12b",
  mikanDeep: "#df7c10",
  mikanInside: "#fbbb52",
  miso: "#c9995c",
  mushroom: "#efe3ca",
  mochi: "#fbf8f2",
  mochiShade: "#e8e1d2",
  nasu: "#3c2152",
  nasuDeep: "#25113a",
  nasuFlesh: "#efe5c3",
  nasuSeed: "#cdb985",
  nasuSheen: "#a58bc8",
  negi: "#4f9a35",
  negiCore: "#d4ecaf",
  negiWhite: "#edf1d6",
  negiWhiteSide: "#ccd59f",
  neko: "#fbf6ee",
  nekoBlack: "#3f3836",
  nekoSide: "#e6ddcd",
  nori: "#1d271c",
  noriSheen: "#3d4a3a",
  oak: "#4e7735",
  oakDeep: "#34531f",
  pink: "#ec6f8b",
  pinkDeep: "#e3475f",
  pith: "#fff4dc",
  pod: "#79a943",
  podBean: "#c9de88",
  podDeep: "#567e2c",
  prawn: "#f7e4d6",
  prawnRed: "#e2553a",
  rice: "#f8f6ee",
  riceEdge: "#ded7c4",
  sakura: "#f4a8b9",
  sakuraSide: "#e2869e",
  salmon: "#f4874f",
  salmonFat: "#ffd8c2",
  scale: "#8f531c",
  sesame: "#1f1a17",
  sheath: "#b98a4c",
  sheathDeep: "#7e592d",
  shio: "#cf8f4a",
  shoot: "#f2e7c5",
  shootComb: "#e1cf9b",
  shoyu: "#3b1c0c",
  soy: "#9a5824",
  soyDeep: "#6c3911",
  stem: "#5a3a1c",
  stick: "#e3c590",
  stickDeep: "#b48f58",
  strawberry: "#df2f3f",
  taiyaki: "#c98b3d",
  taiyakiCrisp: "#e7bb72",
  taiyakiDeep: "#93561f",
  taiyakiInside: "#e8b469",
  tare: "#8d461b",
  tareDeep: "#5c2a0c",
  tofu: "#f7f3ea",
  tofuSide: "#e9e2d2",
  ume: "#b8243a",
  white: "#fffdf8",
  yokan: "#3d1416",
  yokanInside: "#4f1d1f",
  yomogi: "#9db474",
  yomogiInside: "#8fa866",
  yomogiSide: "#86a15c",
  zarame: "#c4893d",
} as const;

const rakuganTints = ["#f4c1cf", "#c6dda9", "#c3d8ee", "#dccdf0"] as const;
const rakuganSides = ["#dc9aad", "#a3c283", "#97b6d8", "#b8a2d8"] as const;
export const nerikiriTints = [
  ["#fff6f8", "#f3aec1", "#e993ab"],
  ["#fff0f3", "#ea6d89", "#d94b6b"],
  ["#f6f1ff", "#a88ad8", "#8d6cc6"],
] as const;
export const netaTints = [
  [paint.maguro, "#9c1f2d"],
  [paint.salmon, "#dd6a37"],
  [paint.egg, paint.eggDeep],
] as const;
export const onigiriFillings = [paint.ume, paint.salmon, paint.nori] as const;
const senbeiTints = [
  [paint.soy, paint.soyDeep],
  [paint.soy, paint.soyDeep],
  [paint.zarame, paint.soyDeep],
  [paint.shio, paint.zarame],
] as const;
export const makiFillings = [
  [paint.maguro, "#e2626f"],
  [paint.cucumber, paint.cucumberCore],
  [paint.kanpyo, "#d7a463"],
] as const;
const dangoTints = [
  [paint.sakura, paint.sakuraSide],
  [paint.mochi, paint.mochiShade],
  [paint.yomogi, paint.yomogiSide],
] as const;

const solid = (colour: string): Band[] => [{ colour, to: 1 }];

const plain = {
  fillings: [],
  gloss: 1,
  inside: [],
  rim: paint.light,
  round: false,
};

const castellaBands: Band[] = [
  { colour: paint.castellaBase, to: 1 },
  { colour: paint.castella, to: 0.88 },
  { colour: paint.crust, to: 0.13 },
];

const anko = (from: number, to: number, inset: number) => ({
  colour: paint.anko,
  from,
  inset,
  to,
});

const unitOf = (art: Art, part: number) => art.units[part]?.variant ?? 0;

const taiyakiLook = (art: Art, gold: boolean): Look => ({
  ...plain,
  depth: 0.11,
  fillings: [anko(0.2, 0.82, 0.12)],
  gloss: gold ? 1.7 : 1,
  inside: solid(gold ? paint.goldLight : paint.taiyakiInside),
  rim: gold || art.variant === 1 ? paint.taiyakiCrisp : paint.taiyakiDeep,
  round: true,
  sides: solid(gold ? paint.goldDeep : paint.taiyakiDeep),
  top: gold ? paint.gold : paint.taiyaki,
});

const nigiriLook = (variant: number): Look => {
  const neta = netaTints[variant] ?? netaTints[0];
  return {
    ...plain,
    depth: 0.17,
    gloss: variant === 2 ? 1 : 1.4,
    inside: [
      { colour: paint.rice, to: 1 },
      { colour: neta[0], to: 0.38 },
    ],
    sides: [
      { colour: paint.riceEdge, to: 1 },
      { colour: neta[1], to: 0.38 },
    ],
    top: paint.rice,
  };
};

export const looks: Record<Kind, (art: Art, part: number) => Look> = {
  castella: () => ({
    ...plain,
    depth: 0.22,
    inside: castellaBands,
    rim: paint.castella,
    sides: castellaBands,
    top: paint.crust,
  }),
  chikuwa: () => ({
    ...plain,
    depth: 0.3,
    fillings: [{ colour: paint.hollow, from: 0.32, inset: 0.32, to: 0.68 }],
    gloss: 1.2,
    inside: [
      { colour: paint.chikuwaBrown, to: 1 },
      { colour: paint.chikuwa, to: 0.9 },
      { colour: paint.chikuwaBrown, to: 0.1 },
    ],
    rim: paint.chikuwa,
    round: true,
    sides: solid(paint.chikuwaDeep),
    top: paint.chikuwa,
  }),
  daifuku: ({ variant }) => ({
    ...plain,
    depth: 0.15,
    fillings: [
      anko(0.12, 0.88, 0.14),
      ...(variant === 1
        ? [{ colour: paint.strawberry, from: 0.22, inset: 0.3, to: 0.78 }]
        : []),
    ],
    inside: solid(variant === 2 ? paint.yomogiInside : paint.mochi),
    round: true,
    sides: solid(variant === 2 ? paint.yomogiInside : paint.mochiShade),
    top: variant === 2 ? paint.yomogi : paint.mochi,
  }),
  dango: (art, part) => {
    const tint = dangoTints[unitOf(art, part)] ?? dangoTints[1];
    return {
      ...plain,
      depth: 0.1,
      gloss: 1.2,
      inside: solid(tint[0]),
      round: true,
      sides: solid(tint[1]),
      top: tint[0],
    };
  },
  dorayaki: () => ({
    ...plain,
    depth: 0.28,
    gloss: 1.3,
    inside: [
      { colour: paint.dora, to: 1 },
      { colour: paint.cake, to: 0.94 },
      { colour: paint.anko, to: 0.62 },
      { colour: paint.cake, to: 0.4 },
      { colour: paint.dora, to: 0.06 },
    ],
    rim: paint.doraRim,
    round: true,
    sides: [
      { colour: paint.doraDeep, to: 1 },
      { colour: paint.doraRim, to: 0.62 },
      { colour: paint.anko, to: 0.56 },
      { colour: paint.doraRim, to: 0.44 },
    ],
    top: paint.dora,
  }),
  ebiten: () => ({
    ...plain,
    depth: 0.2,
    fillings: [{ colour: paint.prawnRed, from: 0.24, inset: 0.2, to: 0.34 }],
    inside: [
      { colour: paint.batterDeep, to: 1 },
      { colour: paint.prawn, to: 0.86 },
      { colour: paint.batter, to: 0.16 },
    ],
    rim: paint.batterLight,
    round: true,
    sides: solid(paint.batterDeep),
    top: paint.batter,
  }),
  edamame: () => ({
    ...plain,
    depth: 0.16,
    gloss: 1.2,
    inside: [
      { colour: paint.podDeep, to: 1 },
      { colour: paint.podBean, to: 0.86 },
      { colour: paint.pod, to: 0.14 },
    ],
    round: true,
    sides: solid(paint.podDeep),
    top: paint.pod,
  }),
  fuji: ({ variant }) => {
    const red = variant === 1;
    return {
      ...plain,
      depth: 0.16,
      fillings: [anko(0.22, 0.8, 0.22)],
      inside: [
        { colour: red ? paint.carrotDeep : paint.fuji, to: 1 },
        { colour: red ? paint.carrotCore : paint.fujiLight, to: 0.2 },
      ],
      round: true,
      sides: solid(red ? paint.ume : paint.fujiDeep),
      top: red ? paint.carrotDeep : paint.fuji,
    };
  },
  gyoza: ({ variant }) => ({
    ...plain,
    depth: 0.16,
    fillings: [{ colour: paint.meat, from: 0.2, inset: 0.12, to: 0.78 }],
    inside: [
      { colour: paint.gyozaBrown, to: 1 },
      { colour: paint.gyoza, to: 0.86 },
    ],
    rim: paint.gyoza,
    round: true,
    sides: [
      { colour: paint.gyozaBrown, to: 1 },
      { colour: paint.gyozaSide, to: variant === 1 ? 0.3 : 0.55 },
    ],
    top: variant === 1 ? paint.batter : paint.gyoza,
  }),
  kagami: () => ({
    ...plain,
    depth: 0.16,
    inside: solid(paint.mochi),
    round: true,
    sides: solid(paint.mochiShade),
    top: paint.mochi,
  }),
  kaki: () => ({
    ...plain,
    depth: 0.16,
    fillings: [{ colour: paint.kakiCore, from: 0.18, inset: 0.3, to: 0.82 }],
    gloss: 1.5,
    inside: solid(paint.kakiLight),
    round: true,
    sides: solid(paint.kakiDeep),
    top: paint.kaki,
  }),
  kamaboko: () => ({
    ...plain,
    depth: 0.1,
    inside: solid(paint.white),
    sides: solid(paint.mochiShade),
    top: paint.white,
  }),
  kashiwa: ({ variant }) => ({
    ...plain,
    depth: 0.17,
    fillings: [
      {
        colour: variant === 1 ? paint.miso : paint.anko,
        from: 0.3,
        inset: 0.16,
        to: 0.74,
      },
    ],
    gloss: 1.3,
    inside: [
      { colour: paint.oakDeep, to: 1 },
      { colour: paint.mochi, to: 0.92 },
      { colour: paint.oak, to: 0.07 },
    ],
    rim: paint.leafVein,
    round: true,
    sides: solid(paint.oakDeep),
    top: paint.oak,
  }),
  kintai: (art) => taiyakiLook(art, true),
  kuri: () => ({
    ...plain,
    depth: 0.2,
    gloss: 1.6,
    inside: [
      { colour: paint.kuriDeep, to: 1 },
      { colour: paint.chestnutEdge, to: 0.93 },
      { colour: paint.kuriInside, to: 0.9 },
      { colour: paint.chestnutEdge, to: 0.1 },
      { colour: paint.kuriDeep, to: 0.06 },
    ],
    round: true,
    sides: solid(paint.kuriDeep),
    top: paint.kuri,
  }),
  maki: ({ variant }) => {
    const filling = makiFillings[variant] ?? makiFillings[0];
    return {
      ...plain,
      depth: 0.22,
      fillings: [{ colour: filling[0], from: 0, inset: 0.38, to: 1 }],
      inside: solid(paint.rice),
      rim: paint.nori,
      sides: solid(paint.nori),
      top: paint.rice,
    };
  },
  matsutake: () => ({
    ...plain,
    depth: 0.18,
    inside: [
      { colour: paint.fibre, to: 1 },
      { colour: paint.flesh, to: 0.92 },
      { colour: paint.mushroom, to: 0.06 },
    ],
    round: true,
    sides: solid(paint.fibre),
    top: paint.mushroom,
  }),
  mikan: () => ({
    ...plain,
    depth: 0.17,
    gloss: 1.5,
    inside: solid(paint.mikanInside),
    rim: paint.pith,
    round: true,
    sides: solid(paint.mikanDeep),
    top: paint.mikan,
  }),
  naruto: () => ({
    ...plain,
    depth: 0.09,
    inside: solid(paint.white),
    sides: solid(paint.mochiShade),
    top: paint.white,
  }),
  nasu: () => ({
    ...plain,
    depth: 0.2,
    fillings: [{ colour: paint.nasuSeed, from: 0.3, inset: 0.22, to: 0.7 }],
    gloss: 1.8,
    inside: [
      { colour: paint.nasuDeep, to: 1 },
      { colour: paint.nasuFlesh, to: 0.94 },
      { colour: paint.nasu, to: 0.05 },
    ],
    rim: paint.nasuSheen,
    round: true,
    sides: solid(paint.nasuDeep),
    top: paint.nasu,
  }),
  neko: ({ variant }) => ({
    ...plain,
    depth: 0.15,
    fillings: [anko(0.2, 0.84, 0.18)],
    inside: solid(variant === 2 ? paint.nekoBlack : paint.neko),
    round: true,
    sides: solid(variant === 2 ? paint.sesame : paint.nekoSide),
    top: variant === 2 ? paint.nekoBlack : paint.neko,
  }),
  nerikiri: ({ variant }) => {
    const tint = nerikiriTints[variant] ?? nerikiriTints[0];
    return {
      ...plain,
      depth: 0.13,
      fillings: [{ colour: paint.mochi, from: 0.2, inset: 0.24, to: 0.85 }],
      inside: solid(tint[1]),
      round: true,
      sides: solid(tint[2]),
      top: tint[1],
    };
  },
  nikan: (art, part) => nigiriLook(unitOf(art, part)),
  ninjin: () => ({
    ...plain,
    depth: 0.2,
    fillings: [{ colour: paint.carrotCore, from: 0.05, inset: 0.32, to: 0.95 }],
    gloss: 1.3,
    inside: solid(paint.carrot),
    round: true,
    sides: solid(paint.carrotDeep),
    top: paint.carrot,
  }),
  onigiri: ({ variant }) => ({
    ...plain,
    depth: 0.16,
    fillings: [
      {
        colour: onigiriFillings[variant] ?? paint.ume,
        from: 0.25,
        inset: 0.34,
        to: 0.75,
      },
    ],
    inside: solid(paint.rice),
    round: true,
    sides: solid(paint.riceEdge),
    top: paint.rice,
  }),
  rakugan: ({ variant }) => {
    const tint = variant % 4;
    return {
      ...plain,
      depth: 0.09,
      inside: solid(rakuganTints[tint] ?? paint.white),
      sides: solid(rakuganSides[tint] ?? paint.mochiShade),
      top: rakuganTints[tint] ?? paint.white,
    };
  },
  sanma: () => ({
    ...plain,
    depth: 0.16,
    fillings: [{ colour: paint.chiai, from: 0.4, inset: 0.42, to: 0.62 }],
    gloss: 1.5,
    inside: [
      { colour: paint.belly, to: 1 },
      { colour: paint.flesh, to: 0.9 },
      { colour: paint.back, to: 0.1 },
    ],
    round: true,
    sides: solid(paint.back),
    top: paint.belly,
  }),
  senbei: (art, part) => {
    const tint = senbeiTints[unitOf(art, part)] ?? senbeiTints[0];
    return {
      ...plain,
      depth: 0.09,
      gloss: unitOf(art, part) === 3 ? 0.9 : 1.4,
      inside: solid(paint.crisp),
      rim: tint[0],
      sides: solid(tint[1]),
      top: tint[0],
    };
  },
  sushi: ({ variant }) => nigiriLook(variant),
  taiyaki: (art) => taiyakiLook(art, false),
  takenoko: () => ({
    ...plain,
    depth: 0.22,
    fillings: [
      { colour: paint.shootComb, from: 0.3, inset: 0.18, to: 0.36 },
      { colour: paint.shootComb, from: 0.6, inset: 0.24, to: 0.66 },
    ],
    inside: [
      { colour: paint.sheathDeep, to: 1 },
      { colour: paint.shoot, to: 0.93 },
      { colour: paint.sheath, to: 0.06 },
    ],
    round: true,
    sides: solid(paint.sheathDeep),
    top: paint.sheath,
  }),
  tofu: () => ({
    ...plain,
    depth: 0.2,
    inside: solid(paint.tofu),
    sides: solid(paint.tofuSide),
    top: paint.tofu,
  }),
  yakitori: (art, part) => {
    if (unitOf(art, part) === 1) {
      return {
        ...plain,
        depth: 0.11,
        fillings: [{ colour: paint.negiCore, from: 0.3, inset: 0.3, to: 0.7 }],
        inside: solid(paint.negiWhite),
        round: true,
        sides: solid(paint.negiWhiteSide),
        top: paint.negiWhite,
      };
    }
    const shio = art.variant === 1;
    return {
      ...plain,
      depth: 0.11,
      gloss: shio ? 1.1 : 1.8,
      inside: [
        { colour: shio ? paint.shio : paint.tare, to: 1 },
        { colour: paint.chicken, to: 0.88 },
        { colour: shio ? paint.shio : paint.tare, to: 0.1 },
      ],
      rim: shio ? paint.batterLight : paint.batter,
      round: true,
      sides: solid(shio ? paint.gyozaBrown : paint.tareDeep),
      top: shio ? paint.shio : paint.tare,
    };
  },
  yokan: ({ variant }) => ({
    ...plain,
    depth: 0.17,
    fillings:
      variant === 1
        ? [
            { colour: paint.chestnut, from: 0.25, inset: 0.2, to: 0.6 },
            { colour: paint.chestnut, from: 0.45, inset: 0.62, to: 0.82 },
          ]
        : [],
    gloss: 1.6,
    inside: solid(variant === 2 ? paint.matchaInside : paint.yokanInside),
    sides: solid(variant === 2 ? paint.matcha : paint.yokan),
    top: variant === 2 ? paint.matcha : paint.yokan,
  }),
};
