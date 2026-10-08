export type PinMode = 'unlock' | 'set' | 'confirm';

export interface PinState {
  mode: PinMode;
  buf: string;
  tmp: string;
  err: string;
  done: null | { kind: 'unlocked' } | { kind: 'set'; pin: string };
}

export type PinAction =
  | { type: 'press'; digit: string }
  | { type: 'del' }
  | { type: 'advance' }
  | { type: 'unlockResult'; ok: boolean; pin: string };

export const PIN_ERR_WRONG = 'That’s not it. Try again.';
export const PIN_ERR_MISMATCH = 'Those didn’t match. Start again.';

export const initialPin = (mode: 'unlock' | 'set'): PinState => ({ mode, buf: '', tmp: '', err: '', done: null });

export function pinReducer(s: PinState, a: PinAction): PinState {
  if (s.done) return s;
  switch (a.type) {
    case 'press':
      return s.buf.length >= 4 ? s : { ...s, buf: s.buf + a.digit, err: '' };
    case 'del':
      return s.buf.length === 0 ? s : { ...s, buf: s.buf.slice(0, -1), err: '' };
    case 'advance':
      if (s.buf.length !== 4) return s;
      if (s.mode === 'set') return { ...s, mode: 'confirm', tmp: s.buf, buf: '', err: '' };
      if (s.mode === 'confirm') {
        return s.buf === s.tmp
          ? { ...s, done: { kind: 'set', pin: s.buf }, buf: '' }
          : { ...s, mode: 'set', tmp: '', buf: '', err: PIN_ERR_MISMATCH };
      }
      return s;
    case 'unlockResult':
      if (s.mode !== 'unlock' || s.buf !== a.pin) return s;
      return a.ok ? { ...s, done: { kind: 'unlocked' }, buf: '' } : { ...s, buf: '', err: PIN_ERR_WRONG };
  }
}

export function pinCopy(s: PinState, name: string): { title: string; sub: string; isError: boolean } {
  const title = s.mode === 'unlock' ? `Welcome back, ${name || 'friend'}.` : s.mode === 'set' ? 'Choose a PIN' : 'Once more';
  const sub = s.err || (s.mode === 'unlock' ? 'Enter your PIN' : s.mode === 'set' ? 'Four digits you’ll remember.' : 'Type the same four digits.');
  return { title, sub, isError: !!s.err };
}
