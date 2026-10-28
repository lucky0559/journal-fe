import { colors, ramp } from '@/theme/tokens';
import type { Visibility } from './types';

export const VIS = {
  private: {
    label: 'Only me', desc: 'Only you can read it. Saved to your account, so it follows you to any phone.', icon: 'lock',
    bg: ramp.neutral[100], fg: ramp.neutral[800], border: colors.divider, iconBg: ramp.neutral[200], iconFg: ramp.neutral[800],
  },
  friends: {
    label: 'Friends', desc: 'People you’ve added can read it in their feed.', icon: 'users',
    bg: ramp.accent2[100], fg: ramp.accent2[800], border: ramp.accent2[400], iconBg: ramp.accent2[200], iconFg: ramp.accent2[800],
  },
  public: {
    label: 'Public', desc: 'Anyone with your profile link can read it, photos and voice notes included.', icon: 'globe',
    bg: ramp.accent[100], fg: ramp.accent[800], border: ramp.accent[400], iconBg: ramp.accent[200], iconFg: ramp.accent[800],
  },
} as const satisfies Record<Visibility, {
  label: string; desc: string; icon: 'lock' | 'users' | 'globe';
  bg: string; fg: string; border: string; iconBg: string; iconFg: string;
}>;

export const VIS_ORDER: Visibility[] = ['private', 'friends', 'public'];
export const VIS_FOOTNOTE = 'Mood and feelings are only ever visible to you, whoever reads the page. You can change this anytime.';
