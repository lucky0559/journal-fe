import { View } from 'react-native';
import type { DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { tiltFor } from '@/domain/stickers';
import { PhotoTile } from '@/ui/PhotoTile';
import { StickerBlob } from './Stickers';
import { VoicePill } from './VoicePill';

export function AttachmentsRow({ draft, dispatch }: { draft: Entry; dispatch: (a: DraftAction) => void }) {
  if (!draft.photos.length && !draft.voices.length && !draft.stickers.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {draft.photos.map((p, i) => (
        <PhotoTile key={p.id} size={104} radius={24} uri={p.uri} label={p.label} rotate={i % 2 ? 2 : -2} onRemove={() => dispatch({ type: 'removePhoto', id: p.id })} />
      ))}
      {draft.voices.map((v) => <VoicePill key={v.id} voice={v} onRemove={() => dispatch({ type: 'removeVoice', id: v.id })} />)}
      {draft.stickers.map((name, i) => (
        <StickerBlob
          key={`${name}-${i}`} name={name} size={72} fontSize={15} rotate={tiltFor(name)}
          label={`Remove ${name} sticker`} onPress={() => dispatch({ type: 'removeSticker', index: i })}
        />
      ))}
    </View>
  );
}
