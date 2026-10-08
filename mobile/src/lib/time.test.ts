import { parseTimeLabel, TIMES } from './time';

describe('parseTimeLabel', () => {
  it('converts 12-hour labels to 24-hour', () => {
    expect(parseTimeLabel('9:00 pm')).toEqual({ hour: 21, minute: 0 });
    expect(parseTimeLabel('8:00 pm')).toEqual({ hour: 20, minute: 0 });
    expect(parseTimeLabel('12:00 am')).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeLabel('12:30 pm')).toEqual({ hour: 12, minute: 30 });
    expect(parseTimeLabel('7:05 am')).toEqual({ hour: 7, minute: 5 });
  });
  it('exposes the four onboarding choices', () => {
    expect(TIMES).toEqual(['8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm']);
  });
  it('falls back to 9:00 pm for a corrupt label instead of throwing', () => {
    expect(parseTimeLabel('banana')).toEqual({ hour: 21, minute: 0 });
  });
});
