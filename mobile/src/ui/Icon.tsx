import {
  House, Calendar, Users, User, Plus, X, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Image, Mic, Smile,
  Lock, Globe, Pencil, Delete, Play, Pause,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';

const icons = {
  house: House, calendar: Calendar, users: Users, user: User, plus: Plus, x: X, 'arrow-left': ArrowLeft,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'chevron-down': ChevronDown, image: Image, mic: Mic,
  smile: Smile, lock: Lock, globe: Globe, pencil: Pencil, delete: Delete, play: Play, pause: Pause,
} as const;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  const Cmp = icons[name];
  return <Cmp size={size} color={color} strokeWidth={2.75} />;
}
