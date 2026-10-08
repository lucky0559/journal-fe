import { Pressable, Text, View } from 'react-native';
import { colors, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon, type IconName } from '@/ui/Icon';

function Pill({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: active ? ramp.accent[300] : pressed ? ramp.accent[100] : ramp.neutral[100] })}
    >
      <Icon name={icon} size={18} />
      <Text style={body(14, 'semi')}>{label}</Text>
    </Pressable>
  );
}

export function Toolbar({ onSticker, onPhoto, onVoice, recording }: { onSticker: () => void; onPhoto?: () => void; onVoice?: () => void; recording?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.surface }}>
      {onPhoto ? <Pill icon="image" label="Photo" onPress={onPhoto} /> : null}
      {onVoice ? <Pill icon="mic" label="Voice" onPress={onVoice} active={recording} /> : null}
      <Pill icon="smile" label="Sticker" onPress={onSticker} />
    </View>
  );
}
