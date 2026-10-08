import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { heading } from '@/theme/type';

export default function TimelineScreen() {
  return (
    <Screen>
      <Text style={heading(34)}>Your pages</Text>
    </Screen>
  );
}
