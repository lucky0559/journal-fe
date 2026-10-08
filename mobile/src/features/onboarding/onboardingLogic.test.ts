import { ONBOARDING_CTA, canContinue } from './onboardingLogic';

it('has the four CTAs', () => {
  expect(ONBOARDING_CTA).toEqual(['Let’s begin', 'Continue', 'Continue', 'Set a PIN']);
});

it('requires a real name only on the name step', () => {
  expect(canContinue(0, '')).toBe(true);
  expect(canContinue(1, '')).toBe(false);
  expect(canContinue(1, '   ')).toBe(false);
  expect(canContinue(1, ' Maya ')).toBe(true);
  expect(canContinue(2, '')).toBe(true);
  expect(canContinue(3, '')).toBe(true);
});
