import { View } from 'react-native';
import type { DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { tiltFor } from '@/domain/stickers';
import { StickerBlob } from './Stickers';

export function AttachmentsRow({ draft, dispatch }: { draft: Entry; dispatch: (a: DraftAction) => void }) {
  if (!draft.stickers.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {draft.stickers.map((name, i) => (
        <StickerBlob
          key={`${name}-${i}`} name={name} size={72} fontSize={15} rotate={tiltFor(name)}
          label={`Remove ${name} sticker`} onPress={() => dispatch({ type: 'removeSticker', index: i })}
        />
      ))}
    </View>
  );
}
