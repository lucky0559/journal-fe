import { Pressable, Text, View } from 'react-native';
import { VIS, VIS_FOOTNOTE, VIS_ORDER } from '@/domain/visibility';
import type { Visibility } from '@/domain/types';
import { colors, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';

export function VisibilityPill({ value, onPress }: { value: Visibility; onPress: () => void }) {
  const v = VIS[value];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${v.label}. Change who can read this page`}
      onPress={onPress}
      hitSlop={{ top: 2, bottom: 2 }}
      style={{ alignSelf: 'flex-start', height: 40, paddingLeft: 12, paddingRight: 14, borderRadius: radii.pill, borderWidth: 1.5, borderColor: v.border, backgroundColor: v.bg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      <Icon name={v.icon} size={16} color={v.fg} />
      <Text style={[body(13, 'semi'), { color: v.fg }]}>{v.label}</Text>
      <Icon name="chevron-down" size={14} color={v.fg} />
    </Pressable>
  );
}

export function VisibilitySheet({ visible, value, onClose, onPick }: { visible: boolean; value: Visibility; onClose: () => void; onPick: (v: Visibility) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Who can read this page?">
      {VIS_ORDER.map((k) => {
        const v = VIS[k];
        const on = k === value;
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={`${v.label}. ${v.desc}`}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(k)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 26, borderWidth: 2, borderColor: on ? colors.accent : 'transparent', backgroundColor: on ? ramp.accent[100] : ramp.neutral[100] }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: v.iconBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={v.icon} size={20} color={v.iconFg} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={body(16, 'bold')}>{v.label}</Text>
              <Text style={[body(13, 'body', 1.4), { color: ramp.neutral[700] }]}>{v.desc}</Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={[body(12, 'body', 1.45), { color: ramp.neutral[700], paddingHorizontal: 6 }]}>{VIS_FOOTNOTE}</Text>
    </Sheet>
  );
}
