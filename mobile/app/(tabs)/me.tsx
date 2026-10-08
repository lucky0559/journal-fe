import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { heading } from '@/theme/type';

export default function MeScreen() {
  return (
    <Screen>
      <Text style={heading(34)}>Me</Text>
    </Screen>
  );
}
