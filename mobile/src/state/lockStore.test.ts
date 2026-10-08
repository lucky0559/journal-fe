import { useLock } from './lockStore';

beforeEach(() => useLock.setState({ locked: false, suspended: 0 }));

it('locks and unlocks', () => {
  useLock.getState().lock();
  expect(useLock.getState().locked).toBe(true);
  useLock.getState().unlock();
  expect(useLock.getState().locked).toBe(false);
});

it('withoutRelock marks the app suspended during the call and for a short tail after', async () => {
  const seen: number[] = [];
  const result = await useLock.getState().withoutRelock(async () => {
    seen.push(useLock.getState().suspended);
    return 'ok';
  });
  expect(result).toBe('ok');
  expect(seen).toEqual([1]);
  expect(useLock.getState().suspended).toBe(1);
  jest.advanceTimersByTime(1100);
  expect(useLock.getState().suspended).toBe(0);
});

it('withoutRelock releases even when the call throws', async () => {
  await expect(useLock.getState().withoutRelock(async () => { throw new Error('x'); })).rejects.toThrow('x');
  jest.advanceTimersByTime(1100);
  expect(useLock.getState().suspended).toBe(0);
});
