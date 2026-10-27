import { addDays } from '@/lib/dates';
import type { Entry } from './types';

type Seed = Omit<Entry, 'id' | 'createdAt' | 'date' | 'feelings' | 'prompt' | 'vis' | 'photos' | 'voices' | 'stickers'> &
  Partial<Pick<Entry, 'prompt' | 'vis' | 'photos' | 'voices' | 'stickers'>> & { daysAgo: number };

const SEEDS: Seed[] = [
  { daysAgo: 1, time: '10:02 pm', mood: 72, vis: 'friends', text: 'Made pasta with Jun. Burned the garlic, ate it anyway. Laughed more than I have in weeks.', prompt: 'Who did you feel close to today?', photos: [{ id: 'demo-p1', uri: '', label: 'photo · dinner' }], stickers: ['cozy'] },
  { daysAgo: 2, time: '9:15 pm', mood: 28, text: 'Presentation went fine but I felt shaky all afternoon. Walking home helped.', voices: [{ id: 'demo-v1', uri: '', seconds: 38 }] },
  { daysAgo: 3, time: '8:40 pm', mood: 55, text: 'Slow Sunday. Laundry, a library book, nothing else.', stickers: ['calm'] },
  { daysAgo: 5, time: '6:12 pm', mood: 84, vis: 'public', text: 'Found a bench by the river and just stayed for an hour. Didn’t check my phone once.', photos: [{ id: 'demo-p2', uri: '', label: 'photo · river' }, { id: 'demo-p3', uri: '', label: 'photo · bench' }] },
  { daysAgo: 7, time: '9:30 pm', mood: 46, text: 'New month. Trying to write a little every night, even if it’s one line.' },
  { daysAgo: 10, time: '1:04 am', mood: 18, text: 'Couldn’t sleep. Writing this so it stops looping in my head.', prompt: 'What’s taking up the most room in your head right now?', stickers: ['tired'] },
  { daysAgo: 14, time: '5:20 pm', mood: 66, text: 'Sunlight on the kitchen floor at 5pm. That’s it, that’s the entry.', photos: [{ id: 'demo-p4', uri: '', label: 'photo · kitchen' }] },
  { daysAgo: 18, time: '3:45 pm', mood: 92, text: 'Got the apartment!!', stickers: ['proud'] },
];

export function demoEntries(today: string): Entry[] {
  return SEEDS.map(({ daysAgo, ...s }, i) => {
    const date = addDays(today, -daysAgo);
    return {
      id: `demo-${i + 1}`, createdAt: Date.parse(`${date}T12:00:00`) + (SEEDS.length - i), date, feelings: [],
      // publishedAt: 1 marks demo pages as already synced so sample content never uploads to a real account
      prompt: '', vis: 'private', photos: [], voices: [], stickers: [], publishedAt: 1, ...s,
    };
  });
}
