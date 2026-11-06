export const MOOD_KEYS = ['calm', 'cozy', 'proud', 'tired', 'grateful', 'rainy', 'brave', 'meh'] as const;
export type MoodKey = (typeof MOOD_KEYS)[number];

/**
 * The illustrated chibi stickers (`s-01` to `s-36`, pictures in assets/stickers), and what a screen reader calls each.
 * Ids are permanent: pages store them, so add new ones at the end and never renumber.
 */
export const IMAGE_STICKERS: Readonly<Record<string, string>> = {
  's-01': 'boy with glasses and a bunny',
  's-02': 'boy in a green hoodie waving',
  's-03': 'girl with curly blue hair and a teddy bear',
  's-04': 'laughing kid in a panda onesie',
  's-05': 'boy in a beanie with a skateboard',
  's-06': 'girl with a flower crown and a plant',
  's-07': 'kid in a panda onesie eating bamboo',
  's-08': 'astronaut girl floating',
  's-09': 'boy playing a video game',
  's-10': 'girl with a big cupcake',
  's-11': 'sleeping cat',
  's-12': 'astronaut riding a rocket',
  's-13': 'boy holding a skateboard',
  's-14': 'girl with a star wand',
  's-15': 'girl with pink pigtails and a cupcake',
  's-16': 'kid in a fluffy panda onesie',
  's-17': 'girl with orange pigtails holding a star',
  's-18': 'boy with green hair waving',
  's-19': 'kid in a bunny onesie with a carrot',
  's-20': 'astronaut boy floating',
  's-21': 'boy eating pizza',
  's-22': 'girl with daisies',
  's-23': 'kid in a panda onesie waving',
  's-24': 'boy with a camera',
  's-25': 'boy in a green hoodie with a skateboard',
  's-26': 'girl with a cookie',
  's-27': 'cat in a blue hoodie waving',
  's-28': 'robot',
  's-29': 'girl making a peace sign',
  's-30': 'boy holding a baby dragon',
  's-31': 'girl with a bouquet',
  's-32': 'kid in a dinosaur onesie',
  's-33': 'girl in a cat hoodie with bubble tea',
  's-34': 'boy playing with a toy robot',
  's-35': 'boy in overalls with a skateboard',
  's-36': 'sleepy kid in a bear onesie',
};

/** The sticker ids, in picker order: the illustrated chibis, then Lumi (`l-`), then the drawn people (`p-`). */
export const STICKER_IDS: readonly string[] = [
  ...Object.keys(IMAGE_STICKERS),
  ...MOOD_KEYS.map((m) => `l-${m}`),
  ...MOOD_KEYS.map((m) => `p-${m}`),
];
export const fallbackSticker = 'l-calm';

/**
 * Where a sticker sits on a page and how big it is: the middle of the sticker as thousandths of the page's width and
 * height, and its size as a percentage of the usual one (100).
 */
export interface Placed { id: string; x: number; y: number; s: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const MIN_X = 0;
export const MAX_X = 1000;
export const MIN_Y = 0;
export const MAX_Y = 1000;
export const MIN_SIZE = 50;
export const MAX_SIZE = 300;
export const DEFAULT_SIZE = 100;

/**
 * A page keeps each sticker as one short string, `l-calm~420~810~100` (name, place, size), so it travels through the server unchanged and older
 * copies of the app still read it. A bare name from before there were pictures (`calm`) is Lumi, with no position yet.
 */
export function parseSticker(raw: string): { id: string; x: number | null; y: number | null; s: number } {
  const [name, x, y, size] = raw.split('~');
  const id = STICKER_IDS.includes(name) ? name : MOOD_KEYS.includes(name as MoodKey) ? `l-${name}` : fallbackSticker;
  const nx = Number(x);
  const ny = Number(y);
  const ns = size === undefined ? DEFAULT_SIZE : clamp(Number(size) || DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
  return x !== undefined && y !== undefined && Number.isFinite(nx) && Number.isFinite(ny) ? { id, x: nx, y: ny, s: ns } : { id, x: null, y: null, s: ns };
}

export const encodeSticker = (p: Placed): string =>
  `${p.id}~${Math.round(clamp(p.x, MIN_X, MAX_X))}~${Math.round(clamp(p.y, MIN_Y, MAX_Y))}~${Math.round(clamp(p.s, MIN_SIZE, MAX_SIZE))}`;

/** Every sticker with a place: the ones nobody has moved yet sit in a row along the bottom of the page. */
export function placeAll(raw: string[]): Placed[] {
  return raw.map((r, i) => {
    const p = parseSticker(r);
    return { id: p.id, x: p.x ?? 170 + (i % 4) * 220, y: p.y ?? 820 - Math.floor(i / 4) * 170, s: p.s };
  });
}

export const stickerLabel = (id: string): string => {
  const p = parseSticker(id);
  if (IMAGE_STICKERS[p.id]) return IMAGE_STICKERS[p.id];
  const [kind, mood] = p.id.split('-');
  return `${mood} ${kind === 'p' ? 'person' : 'Lumi'}`;
};

/** A page's stickers, said in words for the list and the summaries: "calm Lumi, proud person". */
export const describeStickers = (raw: string[]): string => raw.map(stickerLabel).join(', ');
