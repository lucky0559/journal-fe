import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COPY, saveToast } from '@/domain/copy';
import { addedUris, draftReducer, hasContent, isDirty, orphanedUris } from '@/domain/draft';
import { deleteMedia } from '@/data/mediaStore';
import { pickPhotos } from '@/services/photoPicker';
import { fmtShort, todayIso } from '@/lib/dates';
import { MOODS, moodIndex } from '@/lib/mood';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { useToast } from '@/state/toastStore';
import { colors, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { MoodBlob } from '@/ui/MoodBlob';
import { MoodSlider } from '@/ui/MoodSlider';
import { ScreenFade } from '@/ui/ScreenFade';
import { AttachmentsRow } from './AttachmentsRow';
import { StickerSheet } from './Stickers';
import { Toolbar } from './Toolbar';
import { PhotoSheet } from './PhotoSheet';
import { RecordingBanner } from './RecordingBanner';
import { VisibilityPill, VisibilitySheet } from './VisibilityPill';
import { useVoiceRecorder } from './useVoiceRecorder';
import { useDiscardGuard } from './useDiscardGuard';
import { useDraft } from './useDraft';

export function WriteScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const params = useLocalSearchParams<{ entryId?: string; prompt?: string; date?: string }>();
  const show = useToast((s) => s.show);
  const { original, initial, draft, dispatch } = useDraft(params);
  const [visOpen, setVisOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const voice = useVoiceRecorder();

  const addPhotos = async (source: 'library' | 'camera') => {
    setPhotoOpen(false);
    const r = await pickPhotos(source);
    if (r.ok) r.photos.forEach((photo) => dispatch({ type: 'addPhoto', photo }));
    else if (r.reason === 'denied') show('Camera permission is off');
  };

  const toggleVoice = async () => {
    if (voice.recording) {
      const v = await voice.stop(true);
      if (v) dispatch({ type: 'addVoice', voice: v });
      return;
    }
    const r = await voice.start();
    if (r === 'denied') show('Microphone permission is off');
    else if (r === 'error') show('Couldn’t start recording');
  };

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const shouldGuard = useCallback(() => voice.recording || isDirty(draftRef.current, initial), [voice.recording, initial]);
  const onDiscard = useCallback(() => {
    voice.stop(false);
    addedUris(original, draftRef.current).forEach(deleteMedia);
  }, [voice, original]);
  const disarm = useDiscardGuard(shouldGuard, onDiscard);

  const save = async () => {
    let d = draftRef.current;
    if (voice.recording) {
      const v = await voice.stop(true);
      if (v) d = draftReducer(d, { type: 'addVoice', voice: v });
    }
    if (!hasContent(d)) return show(COPY.emptySave);
    await useEntries.getState().save(d);
    orphanedUris(original, d).forEach(deleteMedia);
    useTimelineUi.getState().reset(d.date);
    show(saveToast(d, todayIso()));
    disarm();
    // A new page opens to be read, like a finished page in a journal; an edited one goes back to the page you were reading.
    if (original) router.back();
    else router.replace({ pathname: '/page/[id]', params: { id: d.id } });
  };

  return (
    // The window no longer resizes for the keyboard (edge-to-edge), so lift the content, toolbar included, above it.
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade style={{ paddingTop: top }}>
        <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={22} />
          </Pressable>
          <Text style={[body(14, 'semi'), { color: ramp.neutral[700] }]}>{fmtShort(draft.date) + (draft.time ? ` · ${draft.time}` : '')}</Text>
          <Button label="Save" onPress={save} height={44} fontSize={15} />
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 22, paddingBottom: 20, gap: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <MoodBlob value={draft.mood} size={44} />
              <Text style={[heading(20), { width: 70 }]}>{MOODS[moodIndex(draft.mood)][0]}</Text>
              <View style={{ flex: 1 }}>
                <MoodSlider size="compact" value={draft.mood} onChange={(value) => dispatch({ type: 'mood', value })} />
              </View>
            </View>

            <VisibilityPill value={draft.vis} onPress={() => setVisOpen(true)} />

            {draft.prompt ? (
              <View style={{ backgroundColor: ramp.accent[200], borderRadius: 26, paddingVertical: 16, paddingLeft: 18, paddingRight: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={[heading(19, 1.25), { flex: 1, color: ramp.accent[900] }]}>{draft.prompt}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Remove prompt" hitSlop={6} onPress={() => dispatch({ type: 'clearPrompt' })} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={16} color={ramp.accent[800]} />
                </Pressable>
              </View>
            ) : null}

            <TextInput
              value={draft.text}
              onChangeText={(value) => dispatch({ type: 'text', value })}
              placeholder={COPY.writePlaceholder}
              placeholderTextColor={ramp.neutral[500]}
              multiline
              autoFocus={!original}
              textAlignVertical="top"
              style={{ minHeight: 170, padding: 0, fontFamily: 'Figtree_400Regular', fontSize: 18, lineHeight: 28, color: colors.text }}
            />

            <AttachmentsRow draft={draft} dispatch={dispatch} />
            {voice.recording ? <RecordingBanner seconds={voice.seconds} onDone={toggleVoice} /> : null}
          </ScrollView>
        </View>

        <Toolbar onSticker={() => setStickerOpen(true)} onPhoto={() => setPhotoOpen(true)} onVoice={toggleVoice} recording={voice.recording} />
      </ScreenFade>

      <PhotoSheet visible={photoOpen} onClose={() => setPhotoOpen(false)} onPick={addPhotos} />
      <StickerSheet
        visible={stickerOpen}
        onClose={() => setStickerOpen(false)}
        onPick={(name) => { dispatch({ type: 'addSticker', name }); setStickerOpen(false); }}
      />
      <VisibilitySheet
        visible={visOpen}
        value={draft.vis}
        onClose={() => setVisOpen(false)}
        onPick={(v) => {
          dispatch({ type: 'vis', value: v });
          setVisOpen(false);
          if (v === 'public') show(COPY.publicHeadsUp);
        }}
      />
    </KeyboardAvoidingView>
  );
}
