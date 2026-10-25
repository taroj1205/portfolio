import type { Text } from "../../_lib/i18n";

export interface Item {
  id: string;
  emoji: string;
  name: Text;
  grams: number;
  detail: Text;
  source: { name: string; url: string };
}

const KG = 1e3;
const TONNE = 1e6;
const POUND = 453.59237;
const SHORT_TON = 2000 * POUND;

export const items: readonly [Item, Item, ...Item[]] = [
  {
    detail: {
      en: "The water droplets in a 1 km³ cumulus cloud, about 0.5 g per m³",
      ja: "1km³のもくもく雲（積雲）にある水の粒。1m³あたり約0.5g",
    },
    emoji: "☁️",
    grams: 500 * TONNE,
    id: "cloud",
    name: { en: "A cumulus cloud", ja: "もくもく雲" },
    source: {
      name: "USGS Water Science School",
      url: "https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh",
    },
  },
  {
    detail: {
      en: "Size L in Japan's egg grading: 64 g up to 70 g",
      ja: "鶏卵の規格でLは64g以上70g未満",
    },
    emoji: "🥚",
    grams: 67,
    id: "egg",
    name: { en: "A size L egg", ja: "Lサイズの卵" },
    source: {
      name: "農林水産省「鶏卵の規格」",
      url: "https://www.maff.go.jp/j/kokuji_tuti/kokuji/k0000481.html",
    },
  },
  {
    detail: {
      en: "The tower's own figure for its weight",
      ja: "東京タワー公式の学習シートの答え",
    },
    emoji: "🗼",
    grams: 4000 * TONNE,
    id: "tokyo-tower",
    name: { en: "Tokyo Tower", ja: "東京タワー" },
    source: {
      name: "東京タワー 学習ワークシート",
      url: "https://www.tokyotower.co.jp/fee/agency/file/%E6%96%B0%E3%83%AF%E3%83%BC%E3%82%AF%E3%82%B7%E3%83%BC%E3%83%88.pdf",
    },
  },
  {
    detail: {
      en: "An adult male in the wild, at most 250 lb (113 kg)",
      ja: "野生のおとなのオスで最大250ポンド（113kg）",
    },
    emoji: "🐼",
    grams: 113 * KG,
    id: "panda",
    name: { en: "A giant panda", ja: "ジャイアントパンダ" },
    source: {
      name: "Smithsonian's National Zoo",
      url: "https://nationalzoo.si.edu/animals/giant-panda",
    },
  },
  {
    detail: {
      en: "World green coffee crop for 2025/26: 178.8 million 60 kg bags",
      ja: "2025/26年度の世界の生産量。60kg袋で1億7880万袋",
    },
    emoji: "☕",
    grams: 178.8e6 * 60 * KG,
    id: "coffee",
    name: {
      en: "A year of the world's coffee beans",
      ja: "世界の1年分のコーヒー豆",
    },
    source: {
      name: "USDA FAS, Coffee: World Markets and Trade",
      url: "https://apps.fas.usda.gov/psdonline/circulars/coffee.pdf",
    },
  },
  {
    detail: {
      en: "A Paris 2024 Olympic gold medal",
      ja: "パリ2024オリンピックの金メダル",
    },
    emoji: "🥇",
    grams: 529,
    id: "gold-medal",
    name: { en: "An Olympic gold medal", ja: "オリンピックの金メダル" },
    source: {
      name: "Olympics.com",
      url: "https://www.olympics.com/en/news/paris-2024-olympic-paralympic-medals-reveal-eiffel-tower",
    },
  },
  {
    detail: {
      en: "The largest adults, up to 330,000 lb",
      ja: "大きいおとなで最大33万ポンド",
    },
    emoji: "🐋",
    grams: 330_000 * POUND,
    id: "blue-whale",
    name: { en: "A blue whale", ja: "シロナガスクジラ" },
    source: {
      name: "NOAA Fisheries",
      url: "https://www.fisheries.noaa.gov/species/blue-whale",
    },
  },
  {
    detail: {
      en: "10,000 notes of ¥10,000 at about 1 g each",
      ja: "1万円札1万枚。お札は1枚約1g",
    },
    emoji: "💴",
    grams: 10 * KG,
    id: "oku-yen",
    name: { en: "¥100 million in notes", ja: "1億円の札束" },
    source: {
      name: "国立印刷局「お札に関するよくあるご質問」",
      url: "https://www.npb.go.jp/product_service/intro/faq.html",
    },
  },
  {
    detail: {
      en: "The whole tower. The iron frame alone is 7,300 tonnes",
      ja: "塔全体。鉄の骨組みだけなら7300トン",
    },
    emoji: "🇫🇷",
    grams: 10_100 * TONNE,
    id: "eiffel",
    name: { en: "The Eiffel Tower", ja: "エッフェル塔" },
    source: {
      name: "La tour Eiffel, key figures",
      url: "https://www.toureiffel.paris/en/the-monument/key-figures",
    },
  },
  {
    detail: {
      en: "NPB's rule for the ball: 141.7 g to 148.8 g",
      ja: "プロ野球の試合球は141.7g〜148.8g",
    },
    emoji: "⚾",
    grams: 145.2,
    id: "baseball",
    name: { en: "A baseball", ja: "硬式野球のボール" },
    source: {
      name: "日本野球機構（NPB）",
      url: "https://npb.jp/npb/20150203release.html",
    },
  },
  {
    detail: {
      en: "Fully fuelled for lift-off",
      ja: "燃料を満タンにした打ち上げ時",
    },
    emoji: "🚀",
    grams: 2.8e6 * KG,
    id: "saturn-v",
    name: { en: "A Saturn V moon rocket", ja: "月ロケット サターンV" },
    source: {
      name: "NASA",
      url: "https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/",
    },
  },
  {
    detail: {
      en: "The 1.8 L hybrid U grade, two-wheel drive",
      ja: "1.8Lハイブリッドの U（2WD）",
    },
    emoji: "🚗",
    grams: 1360 * KG,
    id: "prius",
    name: { en: "A Toyota Prius", ja: "トヨタ プリウス" },
    source: {
      name: "トヨタ プリウス 主要諸元表（2025年7月）",
      url: "https://toyota.jp/pages/contents/prius/005_p_001/pdf/prius_spec_202507.pdf",
    },
  },
  {
    detail: {
      en: "Japan's 2024 mandarin harvest: 559,600 tonnes",
      ja: "2024年産のみかんの収穫量。55万9600トン",
    },
    emoji: "🍊",
    grams: 559_600 * TONNE,
    id: "mikan",
    name: { en: "A year of Japan's mandarins", ja: "日本の1年分のみかん" },
    source: {
      name: "農林水産省「令和6年産みかんの収穫量」",
      url: "https://www.maff.go.jp/j/tokei/kekka_gaiyou/sakumotu/sakkyou_kajyu/mikan/r6/index.html",
    },
  },
  {
    detail: {
      en: "The Emperor's Cup for the sumo champion, solid silver",
      ja: "大相撲の優勝力士がもらう銀の賜杯",
    },
    emoji: "🏆",
    grams: 29 * KG,
    id: "emperors-cup",
    name: { en: "Sumo's Emperor's Cup", ja: "天皇賜杯" },
    source: {
      name: "日本相撲協会「大相撲クイズ」",
      url: "https://www.sumo.or.jp/Entertainment/quiz/20",
    },
  },
  {
    detail: {
      en: "The statue alone, estimated at 560,000 lb",
      ja: "台座を除いた像だけで、推定56万ポンド",
    },
    emoji: "🗽",
    grams: 254_000 * KG,
    id: "liberty",
    name: { en: "The Statue of Liberty", ja: "自由の女神" },
    source: {
      name: "National Park Service",
      url: "https://www.nps.gov/stli/learn/statue-of-liberty-facts.htm",
    },
  },
  {
    detail: {
      en: "The aluminium ¥1 coin",
      ja: "アルミニウムの1円玉",
    },
    emoji: "🪙",
    grams: 1,
    id: "one-yen",
    name: { en: "A ¥1 coin", ja: "1円玉" },
    source: {
      name: "造幣局「現在製造している貨幣」",
      url: "https://www.mint.go.jp/operations/production/operations_coin_presently-minted.html",
    },
  },
  {
    detail: {
      en: "Food thrown away while still edible in Japan: 4.61 million tonnes, 2024 estimate",
      ja: "まだ食べられるのに捨てられた食品。2024年度の推計で461万トン",
    },
    emoji: "🍱",
    grams: 461e4 * TONNE,
    id: "food-loss",
    name: { en: "A year of Japan's food waste", ja: "日本の1年分の食品ロス" },
    source: {
      name: "農林水産省（2026年6月30日公表）",
      url: "https://www.maff.go.jp/j/press/shokuhin/recycle/260630.html",
    },
  },
  {
    detail: {
      en: "Yamaha's CFX concert grand",
      ja: "ヤマハのコンサートグランド CFX",
    },
    emoji: "🎹",
    grams: 485 * KG,
    id: "grand-piano",
    name: { en: "A concert grand piano", ja: "コンサートグランドピアノ" },
    source: {
      name: "Yamaha CFX specs",
      url: "https://usa.yamaha.com/products/musical_instruments/pianos/grand_pianos/cfx_02/specs.html",
    },
  },
  {
    detail: {
      en: "Standard displacement, the measure the museum gives",
      ja: "大和ミュージアムが示す基準排水量",
    },
    emoji: "⚓",
    grams: 65_000 * TONNE,
    id: "yamato",
    name: { en: "The battleship Yamato", ja: "戦艦大和" },
    source: {
      name: "大和ミュージアム「数字で見る戦艦『大和』」",
      url: "https://yamato-museum.com/yamato-data/",
    },
  },
  {
    detail: {
      en: "An adult male, up to 15,000 lb (6,800 kg)",
      ja: "おとなのオスで最大1万5000ポンド（6800kg）",
    },
    emoji: "🐘",
    grams: 6800 * KG,
    id: "elephant",
    name: { en: "An African elephant", ja: "アフリカゾウ" },
    source: {
      name: "San Diego Zoo Wildlife Alliance",
      url: "https://animals.sandiegozoo.org/animals/elephant",
    },
  },
  {
    detail: {
      en: "Maximum take-off weight, full of fuel and passengers",
      ja: "燃料も人も載せた最大離陸重量",
    },
    emoji: "✈️",
    grams: 575 * TONNE,
    id: "a380",
    name: { en: "An Airbus A380", ja: "エアバスA380" },
    source: {
      name: "Airbus A380 Facts and Figures",
      url: "https://www.airbus.com/sites/g/files/jlcbta136/files/2022-02/Airbus-A380-Facts-and-Figures-February-2022.pdf",
    },
  },
  {
    detail: {
      en: "The two-colour coin issued since 2021",
      ja: "2021年からの新しい500円玉",
    },
    emoji: "🪙",
    grams: 7.1,
    id: "five-hundred-yen",
    name: { en: "A ¥500 coin", ja: "500円玉" },
    source: {
      name: "造幣局「現在製造している貨幣」",
      url: "https://www.mint.go.jp/operations/production/operations_coin_presently-minted.html",
    },
  },
  {
    detail: {
      en: "Japan's 2024 paddy rice harvest: 7,345,000 tonnes",
      ja: "2024年産の水稲の収穫量。734万5000トン",
    },
    emoji: "🌾",
    grams: 7_345_000 * TONNE,
    id: "rice",
    name: { en: "A year of Japan's rice", ja: "日本の1年分のお米" },
    source: {
      name: "農林水産省「令和6年産水陸稲の収穫量」",
      url: "https://www.maff.go.jp/j/tokei/kekka_gaiyou/sakumotu/sakkyou_kome/suiriku/r6/syukaku/index.html",
    },
  },
  {
    detail: {
      en: "Osaka Castle's largest stone, estimated",
      ja: "大阪城でいちばん大きい石。推定重量",
    },
    emoji: "🪨",
    grams: 108 * TONNE,
    id: "takoishi",
    name: { en: "Takoishi, Osaka Castle's giant stone", ja: "大阪城の蛸石" },
    source: {
      name: "大阪市「特別史跡大坂城跡の現状と課題」",
      url: "https://www.city.osaka.lg.jp/keizaisenryaku/cmsfiles/contents/0000626/626612/4syou-1.pdf",
    },
  },
  {
    detail: {
      en: "NASA's figure for the whole station: 925,335 lb",
      ja: "NASAの公表値で、ステーション全体92万5335ポンド",
    },
    emoji: "🛰️",
    grams: 419_725 * KG,
    id: "iss",
    name: { en: "The International Space Station", ja: "国際宇宙ステーション" },
    source: {
      name: "NASA, Space Station Facts and Figures",
      url: "https://www.nasa.gov/international-space-station/space-station-facts-and-figures/",
    },
  },
  {
    detail: {
      en: "Average in Japan for 2024: boys 3.04 kg, girls 2.95 kg",
      ja: "2024年の平均。男の子3.04kg、女の子2.95kg",
    },
    emoji: "👶",
    grams: 3 * KG,
    id: "newborn",
    name: { en: "A newborn baby", ja: "生まれたての赤ちゃん" },
    source: {
      name: "厚生労働省「令和6年 人口動態統計」",
      url: "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/houkoku24/dl/all.pdf",
    },
  },
  {
    detail: {
      en: "Its 1.24 million m³ of space, filled with water",
      ja: "容積124万m³を水でいっぱいにしたら",
    },
    emoji: "🏟️",
    grams: 1.24e6 * TONNE,
    id: "tokyo-dome",
    name: { en: "Tokyo Dome full of water", ja: "水でいっぱいの東京ドーム" },
    source: {
      name: "東京ドーム「東京ドームについて」",
      url: "https://www.tokyo-dome.co.jp/dome/about/",
    },
  },
  {
    detail: {
      en: "Discovery at rollout, 151,419 lb without main engines",
      ja: "ディスカバリー号の完成時。メインエンジンなしで15万1419ポンド",
    },
    emoji: "🧑‍🚀",
    grams: 151_419 * POUND,
    id: "shuttle",
    name: { en: "A space shuttle orbiter", ja: "スペースシャトルの機体" },
    source: {
      name: "NASA, Space Transportation System (HAER TX-116)",
      url: "https://www.nasa.gov/wp-content/uploads/2015/12/2.pdf",
    },
  },
  {
    detail: {
      en: "Household and business rubbish in Japan, 2023: 38.97 million tonnes",
      ja: "2023年度のごみ総排出量。3897万トン",
    },
    emoji: "🗑️",
    grams: 3897e4 * TONNE,
    id: "rubbish",
    name: { en: "A year of Japan's rubbish", ja: "日本の1年分のごみ" },
    source: {
      name: "環境省「一般廃棄物の排出及び処理状況等（令和5年度）」",
      url: "https://www.env.go.jp/press/press_04470.html",
    },
  },
  {
    detail: {
      en: "The Bureau's figure: more than 6,600,000 short tons",
      ja: "米国開拓局の公表値で660万ショートトン（米トン）以上",
    },
    emoji: "🧱",
    grams: 6.6e6 * SHORT_TON,
    id: "hoover-dam",
    name: { en: "The Hoover Dam", ja: "フーバーダム" },
    source: {
      name: "U.S. Bureau of Reclamation",
      url: "https://www.usbr.gov/lc/hooverdam/faqs/damfaqs.html",
    },
  },
];

export const itemById = (id: string) => items.find((item) => item.id === id);
