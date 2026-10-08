export const PROMPTS = [
  'What made you smile today, even a little?',
  'Describe one sound you heard today.',
  'What would you tell this morning’s version of you?',
  'Who did you feel close to today?',
  'What’s taking up the most room in your head right now?',
  'Name something small you’re looking forward to.',
];

/** n = absolute card index in the deck; the order is offset by the mood bucket. */
export const promptFor = (n: number, moodIdx: number): string => PROMPTS[(n + moodIdx) % PROMPTS.length];
