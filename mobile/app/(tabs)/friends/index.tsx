import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { heading } from '@/theme/type';

export default function FeedScreen() {
  return (
    <Screen>
      <Text style={heading(34)}>Others’ pages</Text>
    </Screen>
  );
}
