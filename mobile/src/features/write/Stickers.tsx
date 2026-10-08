import { Pressable, Text, View } from 'react-native';
import { STICKERS, blobFor, stickerStyle, tiltFor } from '@/domain/stickers';
import { heading } from '@/theme/type';
import { Blob } from '@/ui/Blob';
import { Sheet } from '@/ui/Sheet';

export function StickerBlob({ name, size, rotate = 0, fontSize, label, onPress }: {
  name: string; size: number; rotate?: number; fontSize: number; label: string; onPress: () => void;
}) {
  const st = stickerStyle(name);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={Math.max(0, (44 - size) / 2)}>
      <Blob radii={blobFor(name)} size={size} color={st.bg} rotate={rotate}>
        <Text style={[heading(fontSize, 1), { color: st.ink }]}>{name}</Text>
      </Blob>
    </Pressable>
  );
}

export function StickerSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (name: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a sticker">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
        {STICKERS.map((s) => (
          <View key={s.name} style={{ width: '25%', alignItems: 'center' }}>
            <StickerBlob name={s.name} size={70} fontSize={14} label={`Add ${s.name} sticker`} onPress={() => onPick(s.name)} />
          </View>
        ))}
      </View>
    </Sheet>
  );
}
