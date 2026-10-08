import { Pressable, Text, View } from 'react-native';
import { colors, radii } from '@/theme/tokens';
import { body } from '@/theme/type';

export function Segmented<K extends string>({
  options, value, onChange,
}: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.pill, padding: 4 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={{ height: 36, paddingHorizontal: 16, borderRadius: radii.pill, justifyContent: 'center', backgroundColor: on ? colors.accent : 'transparent' }}
          >
            <Text style={[body(14, 'semi'), { color: on ? colors.bg : colors.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
