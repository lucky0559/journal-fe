import { Alert } from 'react-native';
import type { ReportCategory } from '@/api/types';
import { social } from '@/social';
import { useToast } from '@/state/toastStore';

export const REPORT_SENT = 'Thanks. We’ll look into it.';
export const REPORT_FAILED = 'Couldn’t send that. Try again.';
export const BLOCK_FAILED = 'Couldn’t block them. Try again.';

// Android shows at most three buttons in an alert; tapping outside it cancels.
const CATEGORIES: { label: string; category: ReportCategory }[] = [
  { label: 'Spam or fake', category: 'spam' },
  { label: 'Harassment or hate', category: 'harassment' },
  { label: 'Something else', category: 'other' },
];

interface Options {
  person: { id: string; name: string };
  /** Set when reporting a particular page; without it the person is reported. */
  postId?: string;
  /** Called after the person has been blocked, so the screen can drop what it was showing. */
  onBlocked?: () => void;
}

/** Report or block someone: a short menu, then what's wrong (for a report) or a confirmation (for a block). */
export function openModerationMenu({ person, postId, onBlocked }: Options): void {
  const toast = (m: string) => useToast.getState().show(m);

  const report = async (category: ReportCategory) => {
    try {
      await (postId ? social.reportPost(postId, category) : social.reportUser(person.id, category));
      toast(REPORT_SENT);
    } catch {
      toast(REPORT_FAILED);
    }
  };

  const block = async () => {
    try {
      await social.block(person.id);
      toast(`${person.name} is blocked`);
      onBlocked?.();
    } catch {
      toast(BLOCK_FAILED);
    }
  };

  const chooseReason = () =>
    Alert.alert(postId ? 'Report this page' : `Report ${person.name}`, 'What’s wrong?', CATEGORIES.map((c) => ({ text: c.label, onPress: () => void report(c.category) })), { cancelable: true });

  const confirmBlock = () =>
    Alert.alert(`Block ${person.name}?`, 'You won’t see each other’s pages, and you’ll stop being friends. You can unblock them in Me.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => void block() },
    ]);

  Alert.alert(person.name, undefined, [
    { text: 'Report', onPress: chooseReason },
    { text: 'Block', style: 'destructive', onPress: confirmBlock },
    { text: 'Cancel', style: 'cancel' },
  ], { cancelable: true });
}
