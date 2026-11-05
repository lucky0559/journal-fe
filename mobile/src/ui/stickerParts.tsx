import { G } from 'react-native-svg';
import { art } from '@/theme/stickerArt';

/** A shape drawn twice, fatter, behind itself: the thin tan edge and the white border of a die-cut sticker. */
export function Halo({ children }: { children: React.ReactNode }) {
  return (
    <>
      <G fill={art.edge} stroke={art.edge} strokeWidth={15} strokeLinejoin="round" strokeLinecap="round">{children}</G>
      <G fill={art.white} stroke={art.white} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round">{children}</G>
    </>
  );
}

/** Ink strokes: eyes shut, mouths, brows. */
export const line = { stroke: art.ink, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const HEART = 'M0,6 C-12,-2 -10,-12 -4,-12 C-1,-12 0,-9 0,-8 C0,-9 1,-12 4,-12 C10,-12 12,-2 0,6 Z';
