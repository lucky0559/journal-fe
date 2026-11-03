import { Text, View } from 'react-native';
import { ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Lumi } from './Lumi';

/** An empty list: Lumi beside one plain sentence. */
export function EmptyNote({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Lumi size={56} />
      <Text style={[body(15, 'body', 1.45), { color: ramp.neutral[700], flex: 1 }]}>{text}</Text>
    </View>
  );
}
