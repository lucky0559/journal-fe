import { initialPin, pinReducer, pinCopy, PIN_ERR_WRONG, PIN_ERR_MISMATCH, type PinState, type PinAction } from './pinMachine';

const run = (s: PinState, ...actions: PinAction[]) => actions.reduce(pinReducer, s);
const digits = (d: string): PinAction[] => [...d].map((digit) => ({ type: 'press', digit }));

describe('set flow', () => {
  it('goes set -> confirm -> done when both entries match', () => {
    let s = run(initialPin('set'), ...digits('1234'), { type: 'advance' });
    expect(s).toMatchObject({ mode: 'confirm', buf: '', tmp: '1234', err: '' });
    s = run(s, ...digits('1234'), { type: 'advance' });
    expect(s.done).toEqual({ kind: 'set', pin: '1234' });
  });

  it('returns to set with a message when the confirmation differs', () => {
    const s = run(initialPin('set'), ...digits('1234'), { type: 'advance' }, ...digits('1235'), { type: 'advance' });
    expect(s).toMatchObject({ mode: 'set', buf: '', tmp: '', err: PIN_ERR_MISMATCH, done: null });
    expect(PIN_ERR_MISMATCH).toBe('Those didn’t match. Start again.');
  });
});

describe('input edge cases', () => {
  it('ignores taps after four digits', () => {
    expect(run(initialPin('set'), ...digits('123456')).buf).toBe('1234');
  });
  it('backspace on an empty buffer is a no-op', () => {
    const s = initialPin('set');
    expect(pinReducer(s, { type: 'del' })).toEqual(s);
  });
  it('backspace removes the last digit and clears an error', () => {
    const s = run({ ...initialPin('set'), err: PIN_ERR_MISMATCH }, ...digits('12'), { type: 'del' });
    expect(s).toMatchObject({ buf: '1', err: '' });
  });
  it('typing clears a previous error', () => {
    expect(run({ ...initialPin('set'), err: PIN_ERR_MISMATCH }, ...digits('1')).err).toBe('');
  });
  it('advance does nothing until four digits are in', () => {
    const s = run(initialPin('set'), ...digits('12'));
    expect(pinReducer(s, { type: 'advance' })).toEqual(s);
  });
  it('ignores input once finished', () => {
    const done = run(initialPin('set'), ...digits('1234'), { type: 'advance' }, ...digits('1234'), { type: 'advance' });
    expect(run(done, ...digits('9'), { type: 'del' })).toEqual(done);
  });
});

describe('unlock flow', () => {
  it('finishes on a correct PIN', () => {
    const s = run(initialPin('unlock'), ...digits('1234'), { type: 'unlockResult', ok: true, pin: '1234' });
    expect(s.done).toEqual({ kind: 'unlocked' });
  });
  it('clears the dots and shows an error on a wrong PIN', () => {
    const s = run(initialPin('unlock'), ...digits('9999'), { type: 'unlockResult', ok: false, pin: '9999' });
    expect(s).toMatchObject({ buf: '', err: PIN_ERR_WRONG, done: null });
    expect(PIN_ERR_WRONG).toBe('That’s not it. Try again.');
  });
  it('ignores a stale result for digits the user already deleted', () => {
    const s = run(initialPin('unlock'), ...digits('1234'), { type: 'del' }, { type: 'unlockResult', ok: true, pin: '1234' });
    expect(s).toMatchObject({ buf: '123', done: null });
  });
  it('advance never completes an unlock by itself', () => {
    const s = run(initialPin('unlock'), ...digits('1234'), { type: 'advance' });
    expect(s.done).toBeNull();
  });
});

describe('pinCopy', () => {
  it('has the exact titles and subtitles', () => {
    expect(pinCopy(initialPin('unlock'), 'Maya')).toEqual({ title: 'Welcome back, Maya.', sub: 'Enter your PIN', isError: false });
    expect(pinCopy(initialPin('unlock'), '').title).toBe('Welcome back, friend.');
    expect(pinCopy(initialPin('set'), '')).toEqual({ title: 'Choose a PIN', sub: 'Four digits you’ll remember.', isError: false });
    expect(pinCopy({ ...initialPin('set'), mode: 'confirm' }, '')).toEqual({ title: 'Once more', sub: 'Type the same four digits.', isError: false });
    expect(pinCopy({ ...initialPin('set'), err: PIN_ERR_MISMATCH }, '')).toMatchObject({ sub: PIN_ERR_MISMATCH, isError: true });
  });
});
