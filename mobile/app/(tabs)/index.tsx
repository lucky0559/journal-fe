import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { heading } from '@/theme/type';

export default function TodayScreen() {
  return (
    <Screen>
      <Text style={heading(34)}>Today</Text>
    </Screen>
  );
}
