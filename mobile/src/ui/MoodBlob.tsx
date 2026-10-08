import { moodColor, moodRadii, moodRotation } from '@/lib/mood';
import { Blob } from './Blob';

export function MoodBlob({ value, size }: { value: number; size: number }) {
  return <Blob radii={moodRadii(value)} size={size} color={moodColor(value)} rotate={size >= 80 ? moodRotation(value) : 0} />;
}
