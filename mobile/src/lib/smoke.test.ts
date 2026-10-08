import { colors } from '@/theme/tokens';

test('jest-expo toolchain and the @ alias resolve', () => {
  expect(colors.bg).toBe('#f5ead8');
});
