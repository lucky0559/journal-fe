import { Text, View } from 'react-native';
import type { DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { parseSticker, stickerLabel } from '@/domain/stickers';
import { ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { PhotoTile } from '@/ui/PhotoTile';
import { StickerButton } from './Stickers';
import { VoicePill } from './VoicePill';

export function AttachmentsRow({ draft, dispatch }: { draft: Entry; dispatch: (a: DraftAction) => void }) {
  if (!draft.photos.length && !draft.voices.length && !draft.stickers.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {draft.photos.map((p, i) => (
          <PhotoTile key={p.id} size={104} radius={24} uri={p.uri} label={p.label} rotate={i % 2 ? 2 : -2} onRemove={() => dispatch({ type: 'removePhoto', id: p.id })} />
        ))}
        {draft.voices.map((v) => <VoicePill key={v.id} voice={v} onRemove={() => dispatch({ type: 'removeVoice', id: v.id })} />)}
        {draft.stickers.map((raw, i) => (
          <StickerButton
            key={`${raw}-${i}`} id={parseSticker(raw).id} size={72}
            label={`Remove ${stickerLabel(raw)} sticker`} onPress={() => dispatch({ type: 'removeSticker', index: i })}
          />
        ))}
      </View>
      {draft.stickers.length ? <Text style={[body(12), { color: ramp.neutral[700] }]}>Tap a sticker to remove it. Once the page is saved, hold a sticker to drag it, and pinch it to make it bigger or smaller.</Text> : null}
    </View>
  );
}
