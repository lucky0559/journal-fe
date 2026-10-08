import { useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '@/features/friends/ProfileScreen';

export default function ProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreen personId={String(id)} />;
}
