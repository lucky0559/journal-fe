export const ONBOARDING_CTA = ['Let’s begin', 'Continue', 'Continue', 'Set a PIN'];

export const canContinue = (step: number, name: string): boolean => step !== 1 || name.trim().length > 0;
