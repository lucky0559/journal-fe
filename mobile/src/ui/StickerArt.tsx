import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { art } from '@/theme/stickerArt';
import { Image } from 'expo-image';
import { fallbackSticker, MOOD_KEYS, type MoodKey } from '@/domain/stickers';
import { STICKER_IMAGES } from './stickerImages';
import { Halo, HEART, line } from './stickerParts';

/** Every sticker is drawn around the origin in a 144 x 144 box, with a white die-cut edge, like a real sticker. */
const BOX = '-72 -80 144 144';

const SPARK = (x: number, y: number, r: number) => `M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r} Z`;

// ---------- Lumi ----------
const BODY = 'M-44,6 C-46,-30 -20,-42 0,-42 C22,-42 46,-30 44,6 C42,32 22,40 0,40 C-22,40 -42,32 -44,6 Z';
const FEET = 'M-26,38 a9,6 0 1,0 18,0 a9,6 0 1,0 -18,0 Z M8,38 a9,6 0 1,0 18,0 a9,6 0 1,0 -18,0 Z';

function LumiBase({ mood }: { mood: MoodKey }) {
  const [body, feet] = art[mood];
  return (
    <>
      <Halo><Path d={BODY} /><Path d={FEET} /></Halo>
      <Path d={FEET} fill={feet} />
      <Path d={BODY} fill={body} />
    </>
  );
}
const Eyes = () => (
  <>
    <Ellipse cx={-15} cy={-2} rx={6} ry={7.5} fill={art.ink} />
    <Ellipse cx={15} cy={-2} rx={6} ry={7.5} fill={art.ink} />
    <Circle cx={-13} cy={-5} r={2.2} fill={art.white} />
    <Circle cx={17} cy={-5} r={2.2} fill={art.white} />
    <Circle cx={-16.5} cy={1.5} r={1} fill={art.white} />
    <Circle cx={13.5} cy={1.5} r={1} fill={art.white} />
  </>
);
const Blush = () => (
  <>
    <Ellipse cx={-27} cy={11} rx={7} ry={4} fill={art.cheek} opacity={0.45} />
    <Ellipse cx={27} cy={11} rx={7} ry={4} fill={art.cheek} opacity={0.45} />
  </>
);
const Smile = () => <Path d="M-5,9 Q0,14 5,9" {...line} strokeWidth={2.5} />;

const LUMI: Record<MoodKey, () => React.ReactElement> = {
  calm: () => (
    <>
      <Halo><Path d="M0,-42 Q-2,-58 12,-62 Q14,-48 0,-42 Z" /></Halo>
      <LumiBase mood="calm" />
      <Path d="M0,-42 Q-2,-58 12,-62 Q14,-48 0,-42 Z" fill={art.leaf} />
      <Path d="M-21,-4 Q-15,3 -9,-4 M9,-4 Q15,3 21,-4" {...line} strokeWidth={3} />
      <Blush />
      <Path d="M-5,11 Q0,15 5,11" {...line} strokeWidth={2.5} />
    </>
  ),
  cozy: () => (
    <>
      <Halo><Path d="M16,28 L20,48 L30,46 L28,26 Z" /></Halo>
      <LumiBase mood="cozy" />
      <Eyes />
      <Blush />
      <Smile />
      <Path d="M-40,17 Q0,30 40,17 L38,28 Q0,41 -38,28 Z" fill={art.scarf} stroke={art.white} strokeWidth={2} />
      <Path d="M16,28 L20,48 L30,46 L28,26 Z" fill={art.scarfTail} stroke={art.white} strokeWidth={2} />
      <Path d="M-30,21 L-30,31 M-18,24 L-18,35 M-6,25 L-6,36 M6,25 L6,36" stroke={art.scarfStitch} strokeWidth={2} />
    </>
  ),
  proud: () => (
    <>
      <Halo>
        <Path d="M-17,-38 L-17,-58 L-8,-48 L0,-62 L8,-48 L17,-58 L17,-38 Z" />
        <Path d={SPARK(50, -24, 6)} />
        <Path d={SPARK(-52, -11, 5)} />
      </Halo>
      <LumiBase mood="proud" />
      <Path d="M-17,-38 L-17,-58 L-8,-48 L0,-62 L8,-48 L17,-58 L17,-38 Z" fill={art.gold} stroke={art.goldDeep} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M-21,-1 Q-15,-9 -9,-1 M9,-1 Q15,-9 21,-1" {...line} strokeWidth={3} />
      <Blush />
      <Path d="M-7,8 Q0,19 7,8 Z" fill={art.ink} />
      <Path d={SPARK(50, -24, 6)} fill={art.gold} />
      <Path d={SPARK(-52, -11, 5)} fill={art.gold} />
    </>
  ),
  tired: () => (
    <>
      <Halo>
        <Path d="M-31,-28 C-22,-62 12,-72 38,-58 C24,-50 24,-40 29,-28 Z" />
        <Circle cx={40} cy={-58} r={7} />
      </Halo>
      <LumiBase mood="tired" />
      <Path d="M-31,-28 C-22,-62 12,-72 38,-58 C24,-50 24,-40 29,-28 Q0,-36 -31,-28 Z" fill={art.nightCap} />
      <Circle cx={40} cy={-58} r={6} fill={art.pom} stroke={art.pomEdge} strokeWidth={1} />
      <Path d="M-21,0 Q-15,4 -9,0 M9,0 Q15,4 21,0" {...line} strokeWidth={3} />
      <Blush />
      <Ellipse cx={0} cy={14} rx={3} ry={3.5} fill={art.ink} />
      <Path d="M-62,-40 h9 l-9 11 h9 M-50,-54 h6 l-6 7 h6" stroke={art.zzz} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  grateful: () => (
    <>
      <Halo>
        <G transform="translate(0,28) scale(1.5)"><Path d={HEART} /></G>
        <Path d={SPARK(44, -30, 6)} />
      </Halo>
      <LumiBase mood="grateful" />
      <Eyes />
      <Blush />
      <Smile />
      <G transform="translate(0,28) scale(1.5)">
        <Path d={HEART} fill={art.heart} stroke={art.white} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={-4} cy={-7} r={1.6} fill={art.white} opacity={0.8} />
      </G>
      <Path d={SPARK(44, -30, 6)} fill={art.sparkle} />
    </>
  ),
  rainy: () => (
    <>
      <Halo><Path d="M-34,-54 Q0,-92 34,-54 Z" /></Halo>
      <LumiBase mood="rainy" />
      <Path d="M0,-55 L0,-43" stroke={art.umbrellaPole} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M-34,-54 Q0,-92 34,-54 Q23,-60 11,-54 Q0,-61 -11,-54 Q-23,-60 -34,-54 Z" fill={art.umbrella} />
      <Eyes />
      <Blush />
      <Path d="M-4,13 Q0,10 4,13" {...line} strokeWidth={2.5} />
      <Path d="M-54,-20 Q-58,-12 -54,-10 Q-50,-12 -54,-20 Z M52,-6 Q48,2 52,4 Q56,2 52,-6 Z M-50,18 Q-54,26 -50,28 Q-46,26 -50,18 Z" fill={art.umbrella} />
    </>
  ),
  brave: () => (
    <>
      <Halo><Path d="M38,-22 L56,-32 L52,-16 Z M38,-19 L58,-12 L50,-4 Z" /></Halo>
      <LumiBase mood="brave" />
      <Path d="M38,-22 L56,-32 L52,-16 Z M38,-19 L58,-12 L50,-4 Z" fill={art.bandTail} stroke={art.white} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M-40,-24 Q0,-34 40,-24 L41,-15 Q0,-24 -41,-15 Z" fill={art.band} />
      <Eyes />
      <Path d="M-23,-12 L-9,-8 M23,-12 L9,-8" {...line} strokeWidth={3} />
      <Blush />
      <Path d="M-6,10 L6,10 Q4,15 0,15 Q-4,15 -6,10 Z" fill={art.ink} />
    </>
  ),
  meh: () => (
    <>
      <Halo><Path d="M33,-26 Q28,-16 33,-13 Q38,-16 33,-26 Z" /></Halo>
      <LumiBase mood="meh" />
      <Circle cx={-15} cy={0} r={3.5} fill={art.ink} />
      <Circle cx={15} cy={0} r={3.5} fill={art.ink} />
      <Path d="M-22,-9 L-8,-9 M8,-9 L22,-9" {...line} strokeWidth={2.5} />
      <Blush />
      <Path d="M-6,13 L6,13" {...line} strokeWidth={2.5} />
      <Path d="M33,-26 Q28,-16 33,-13 Q38,-16 33,-26 Z" fill={art.drop} stroke={art.white} strokeWidth={1.5} />
    </>
  ),
};

// ---------- People ----------
const TORSO = 'M-19,10 Q-24,40 -21,44 L21,44 Q24,40 19,10 Z';
const FRINGE = 'M-36,-14 C-40,-52 -14,-56 0,-56 C18,-56 40,-50 36,-14 C32,-26 24,-32 14,-30 C8,-36 -6,-36 -12,-30 C-22,-32 -32,-26 -36,-14 Z';

const Figure = () => (
  <>
    <Ellipse cx={0} cy={-18} rx={35} ry={32} />
    <Path d={TORSO} />
    <Ellipse cx={-9} cy={46} rx={8} ry={5} />
    <Ellipse cx={9} cy={46} rx={8} ry={5} />
  </>
);
function PersonBase({ skin, shirt }: { skin: string; shirt: string }) {
  return (
    <>
      <Halo><Figure /></Halo>
      <Ellipse cx={-9} cy={46} rx={8} ry={5} fill={art.shoe} />
      <Ellipse cx={9} cy={46} rx={8} ry={5} fill={art.shoe} />
      <Path d={TORSO} fill={shirt} />
      <Ellipse cx={0} cy={-18} rx={35} ry={32} fill={skin} />
    </>
  );
}
const PEyes = () => (
  <>
    <Ellipse cx={-12} cy={-14} rx={4.5} ry={5.5} fill={art.ink} />
    <Ellipse cx={12} cy={-14} rx={4.5} ry={5.5} fill={art.ink} />
    <Circle cx={-10.5} cy={-16.5} r={1.7} fill={art.white} />
    <Circle cx={13.5} cy={-16.5} r={1.7} fill={art.white} />
  </>
);
const PBlush = () => (
  <>
    <Ellipse cx={-21} cy={-4} rx={6} ry={3.5} fill={art.cheek} opacity={0.45} />
    <Ellipse cx={21} cy={-4} rx={6} ry={3.5} fill={art.cheek} opacity={0.45} />
  </>
);
const SoftSmile = () => <Path d="M-4,-4 Q0,0 4,-4" {...line} strokeWidth={2} />;
const SPIKES = 'M-36,-14 L-40,-40 L-28,-36 L-24,-58 L-10,-46 L0,-64 L10,-46 L24,-58 L28,-36 L40,-40 L36,-14 Z';
const LONG = 'M-38,-18 C-40,-58 40,-58 38,-18 L40,26 Q30,32 22,24 L-22,24 Q-30,32 -40,26 Z';
const NOTE = (d: string) => ({ d, stroke: art.zzz, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }) as const;

const PEOPLE: Record<MoodKey, () => React.ReactElement> = {
  calm: () => (
    <>
      <Halo><Circle cx={0} cy={-56} r={12} /></Halo>
      <Circle cx={0} cy={-56} r={12} fill={art.hair[0]} />
      <PersonBase skin={art.skin[0]} shirt={art.shirt[0]} />
      <Path d={FRINGE} fill={art.hair[0]} />
      <Path d="M-17,-14 Q-12,-9 -7,-14 M7,-14 Q12,-9 17,-14" {...line} strokeWidth={2.5} />
      <PBlush />
      <SoftSmile />
      <Rect x={-9} y={15} width={18} height={15} rx={4} fill={art.mug} stroke={art.mugEdge} strokeWidth={1.5} />
      <Path d="M9,19 Q15,20 9,26" stroke={art.mugEdge} strokeWidth={2} fill="none" />
      <Circle cx={-11} cy={23} r={5} fill={art.skin[0]} />
      <Circle cx={11} cy={24} r={5} fill={art.skin[0]} />
      <Path d="M-3,11 Q-6,6 -3,2 M3,11 Q0,6 3,2" stroke={art.steam} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </>
  ),
  cozy: () => (
    <>
      <Halo><Ellipse cx={0} cy={-16} rx={41} ry={38} /></Halo>
      <PersonBase skin={art.skin[1]} shirt={art.shirt[1]} />
      <Ellipse cx={0} cy={-16} rx={41} ry={38} fill={art.hoodie} />
      <Ellipse cx={0} cy={-12} rx={29} ry={25} fill={art.skin[1]} />
      <Path d="M-26,-26 C-20,-36 20,-36 26,-26 C16,-30 -16,-30 -26,-26 Z" fill={art.hair[1]} />
      <PEyes />
      <PBlush />
      <SoftSmile />
      <Path d="M-8,14 L-9,26 M8,14 L9,26" stroke={art.hoodieDeep} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={-9} cy={27} r={2.5} fill={art.hoodieDeep} />
      <Circle cx={9} cy={27} r={2.5} fill={art.hoodieDeep} />
      <Ellipse cx={-20} cy={30} rx={7} ry={6} fill={art.hoodieHand} />
      <Ellipse cx={20} cy={30} rx={7} ry={6} fill={art.hoodieHand} />
    </>
  ),
  proud: () => (
    <>
      <Halo>
        <Path d={SPIKES} />
        <Circle cx={31} cy={4} r={9} />
      </Halo>
      <PersonBase skin={art.skin[2]} shirt={art.shirt[2]} />
      <Path d={`${SPIKES} C30,-30 -30,-30 -36,-14 Z`} fill={art.hair[2]} />
      <Path d="M-17,-12 Q-12,-19 -7,-12 M7,-12 Q12,-19 17,-12" {...line} strokeWidth={2.5} />
      <PBlush />
      <Path d="M-6,-6 Q0,4 6,-6 Z" fill={art.ink} />
      <Path d="M-12,12 L0,24 L12,12" stroke={art.medalRibbon} strokeWidth={4} fill="none" strokeLinejoin="round" />
      <Circle cx={0} cy={28} r={6.5} fill={art.gold} stroke={art.goldDeep} strokeWidth={1.5} />
      <Path d="M18,16 Q26,10 29,6" stroke={art.shirt[2]} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Circle cx={31} cy={4} r={6} fill={art.skin[2]} />
      <Rect x={29} y={-7} width={5} height={9} rx={2.5} fill={art.skin[2]} />
    </>
  ),
  tired: () => (
    <>
      <Halo><Rect x={-23} y={12} width={46} height={28} rx={10} /></Halo>
      <PersonBase skin={art.skin[0]} shirt={art.shirt[3]} />
      <Path d={FRINGE} fill={art.hair[7]} />
      <Path d="M2,-55 Q8,-70 16,-60 M-6,-55 Q-10,-66 -18,-62" stroke={art.hair[7]} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M-17,-12 Q-12,-9 -7,-12 M7,-12 Q12,-9 17,-12" {...line} strokeWidth={2.5} />
      <PBlush />
      <Ellipse cx={0} cy={-3} rx={2.5} ry={3} fill={art.ink} />
      <Rect x={-23} y={12} width={46} height={28} rx={10} fill={art.pillow} stroke={art.pillowEdge} strokeWidth={1.5} />
      <Circle cx={-15} cy={20} r={5} fill={art.skin[0]} />
      <Circle cx={15} cy={20} r={5} fill={art.skin[0]} />
      <Path {...NOTE('M38,-46 h9 l-9 11 h9')} />
      <Path {...NOTE('M48,-60 h6 l-6 7 h6')} />
    </>
  ),
  grateful: () => (
    <>
      <Halo>
        <Path d={LONG} />
        <G transform="translate(0,26) scale(1.2)"><Path d={HEART} /></G>
      </Halo>
      <Path d={LONG} fill={art.hair[3]} />
      <PersonBase skin={art.skin[3]} shirt={art.shirt[4]} />
      <Path d={FRINGE} fill={art.hair[3]} />
      <Circle cx={24} cy={-40} r={5} fill={art.sparkle} />
      <Circle cx={30} cy={-36} r={3.5} fill={art.sparkle} />
      <Path d="M-17,-12 Q-12,-19 -7,-12 M7,-12 Q12,-19 17,-12" {...line} strokeWidth={2.5} />
      <PBlush />
      <Path d="M-4,-5 Q0,-1 4,-5" {...line} strokeWidth={2} />
      <G transform="translate(0,26) scale(1.2)"><Path d={HEART} fill={art.heart} stroke={art.white} strokeWidth={2} strokeLinejoin="round" /></G>
      <Circle cx={-12} cy={20} r={4.5} fill={art.skin[3]} />
      <Circle cx={12} cy={20} r={4.5} fill={art.skin[3]} />
    </>
  ),
  rainy: () => (
    <>
      <Halo>
        <Path d="M-20,-62 Q16,-102 52,-62 Z" />
        <Ellipse cx={0} cy={-16} rx={41} ry={38} />
      </Halo>
      <PersonBase skin={art.skin[4]} shirt={art.raincoat} />
      <Ellipse cx={0} cy={-16} rx={41} ry={38} fill={art.raincoatHood} />
      <Ellipse cx={0} cy={-12} rx={29} ry={25} fill={art.skin[4]} />
      <Path d="M-26,-24 C-20,-38 20,-38 26,-24 C14,-30 -2,-26 -26,-24 Z" fill={art.hair[4]} />
      <PEyes />
      <PBlush />
      <Path d="M-3,-2 Q0,-5 3,-2" {...line} strokeWidth={2} />
      <Path d="M0,16 L0,40" stroke={art.goldDeep} strokeWidth={1.5} />
      <Circle cx={-5} cy={22} r={1.8} fill={art.goldDeep} />
      <Circle cx={-5} cy={32} r={1.8} fill={art.goldDeep} />
      <Path d="M33,-62 L33,14" stroke={art.umbrellaPole} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M-20,-62 Q16,-102 52,-62 Q40,-68 28,-62 Q16,-69 4,-62 Q-8,-68 -20,-62 Z" fill={art.umbrella} />
      <Circle cx={33} cy={12} r={5} fill={art.skin[4]} />
      <Path d="M-56,-30 Q-60,-22 -56,-20 Q-52,-22 -56,-30 Z M-52,4 Q-56,12 -52,14 Q-48,12 -52,4 Z M58,-28 Q54,-20 58,-18 Q62,-20 58,-28 Z" fill={art.umbrella} />
    </>
  ),
  brave: () => (
    <>
      <Halo>
        <Circle cx={32} cy={-12} r={8} />
        <Path d="M34,-34 L52,-44 L48,-28 Z M34,-31 L54,-24 L46,-16 Z" />
      </Halo>
      <PersonBase skin={art.skin[5]} shirt={art.shirt[6]} />
      <Path d={FRINGE} fill={art.hair[5]} />
      <Path d="M34,-34 L52,-44 L48,-28 Z M34,-31 L54,-24 L46,-16 Z" fill={art.headband} stroke={art.headbandEdge} strokeWidth={1} />
      <Path d="M-35,-36 Q0,-46 35,-36 L36,-28 Q0,-38 -36,-28 Z" fill={art.headband} stroke={art.headbandEdge} strokeWidth={1} />
      <Circle cx={0} cy={-37} r={4} fill={art.band} />
      <PEyes />
      <Path d="M-19,-24 L-7,-21 M19,-24 L7,-21" {...line} strokeWidth={2.5} />
      <PBlush />
      <Path d="M-5,-5 L5,-5 Q3,-1 0,-1 Q-3,-1 -5,-5 Z" fill={art.ink} />
      <Path d="M18,16 Q26,4 30,-6" stroke={art.shirt[6]} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Circle cx={32} cy={-12} r={7} fill={art.skin[5]} />
    </>
  ),
  meh: () => (
    <>
      <Halo>
        <Circle cx={-28} cy={-36} r={12} />
        <Circle cx={-14} cy={-48} r={13} />
        <Circle cx={2} cy={-52} r={13} />
        <Circle cx={18} cy={-48} r={13} />
        <Circle cx={30} cy={-36} r={12} />
        <Circle cx={-34} cy={18} r={6} />
        <Circle cx={34} cy={18} r={6} />
        <Path d="M-18,22 L-33,16 M18,22 L33,16" strokeWidth={8} />
      </Halo>
      <Path d="M-18,22 L-33,16 M18,22 L33,16" stroke={art.grey} strokeWidth={8} strokeLinecap="round" />
      <PersonBase skin={art.skin[6]} shirt={art.shirt[7]} />
      <G fill={art.hair[6]}>
        <Circle cx={-28} cy={-36} r={12} />
        <Circle cx={-14} cy={-48} r={13} />
        <Circle cx={2} cy={-52} r={13} />
        <Circle cx={18} cy={-48} r={13} />
        <Circle cx={30} cy={-36} r={12} />
        <Circle cx={-6} cy={-40} r={10} />
        <Circle cx={12} cy={-40} r={10} />
      </G>
      <Circle cx={-12} cy={-14} r={2.8} fill={art.hair[6]} />
      <Circle cx={12} cy={-14} r={2.8} fill={art.hair[6]} />
      <Circle cx={-12} cy={-14} r={8} stroke={art.glasses} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={-14} r={8} stroke={art.glasses} strokeWidth={2} fill="none" />
      <Path d="M-4,-14 L4,-14" stroke={art.glasses} strokeWidth={2} />
      <PBlush />
      <Path d="M-5,-3 L5,-3" stroke={art.hair[6]} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={-34} cy={15} r={5} fill={art.skin[6]} />
      <Circle cx={34} cy={15} r={5} fill={art.skin[6]} />
      <Path d="M38,-28 Q33,-18 38,-15 Q43,-18 38,-28 Z" fill={art.drop} stroke={art.white} strokeWidth={1.5} />
    </>
  ),
};

/**
 * A sticker: no words on it, just the picture. `id` is `s-07` (an illustrated chibi), `l-calm` (Lumi) or `p-calm`
 * (a drawn person). Everything fills the same square, so stickers line up the same way wherever they sit.
 */
export function StickerArt({ id, size = 80 }: { id: string; size?: number }) {
  const picture = STICKER_IMAGES[id];
  if (picture) {
    return <Image source={picture} contentFit="contain" style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
  }
  const [kind, mood] = id.split('-');
  const key = (MOOD_KEYS as readonly string[]).includes(mood) ? (mood as MoodKey) : (fallbackSticker.split('-')[1] as MoodKey);
  const Draw = (kind === 'p' ? PEOPLE : LUMI)[key];
  return (
    <Svg width={size} height={size} viewBox={BOX} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Draw />
    </Svg>
  );
}
