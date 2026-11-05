import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { STICKER_IDS, stickerLabel } from '@/domain/stickers';
import { Sheet } from '@/ui/Sheet';
import { StickerArt } from '@/ui/StickerArt';

/** One sticker you can tap: a picture, no words. */
export function StickerButton({ id, size, label, onPress }: { id: string; size: number; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={Math.max(0, (44 - size) / 2)}>
      <StickerArt id={id} size={size} />
    </Pressable>
  );
}

export function StickerSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const { height } = useWindowDimensions();
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a sticker">
      <ScrollView style={{ maxHeight: height * 0.6 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
        {STICKER_IDS.map((id) => (
          <View key={id} style={{ width: '25%', alignItems: 'center' }}>
            <StickerButton id={id} size={76} label={`Add ${stickerLabel(id)} sticker`} onPress={() => onPick(id)} />
          </View>
        ))}
      </View>
      </ScrollView>
    </Sheet>
  );
}
