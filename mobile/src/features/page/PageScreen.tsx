import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blobFor, stickerStyle, tiltFor } from '@/domain/stickers';
import type { Entry } from '@/domain/types';
import { VIS } from '@/domain/visibility';
import { fmtParts, fmtShort } from '@/lib/dates';
import { MOODS, moodIndex } from '@/lib/mood';
import { useEntries } from '@/state';
import { colors, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { VoicePill } from '@/features/write/VoicePill';
import { Blob } from '@/ui/Blob';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { MoodBlob } from '@/ui/MoodBlob';
import { pagePosition } from './pageNav';
import { Polaroid } from './Polaroid';
import { RuledText } from './RuledText';

type Turn = 'older' | 'newer';
const PAPER = ramp.neutral[100];

/** A saved page, read the way you'd read a journal. Writing and editing live behind the Edit button. */
export function PageScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { id, dir } = useLocalSearchParams<{ id?: string; dir?: string }>();
  const entries = useEntries((s) => s.entries);
  const where = pagePosition(entries, id);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (!where) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: top + 14, paddingHorizontal: 22, gap: 18 }}>
        <TopBar onBack={close} />
        <Text style={heading(28)}>This page isn’t here any more.</Text>
        <Button label="Back to your pages" onPress={close} />
      </View>
    );
  }

  const { entry, older, newer, position, total } = where;
  const turn = (to: Entry | null, direction: Turn) => {
    if (to) router.setParams({ id: to.id, dir: direction });
  };
  // Like a book: swiping forward (left) moves to the next, newer page; swiping back (right) to an older one.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onEnd((e) => {
      if (e.translationX < -70) turn(newer, 'newer');
      else if (e.translationX > 70) turn(older, 'older');
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: top }}>
      <TopBar
        onBack={close}
        centre={`Page ${position} of ${total}`}
        right={<Button label="Edit" variant="outline" height={44} fontSize={15} onPress={() => router.push({ pathname: '/write', params: { entryId: entry.id } })} />}
      />
      <GestureDetector gesture={swipe}>
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24 }}>
            <PageEnter key={entry.id} dir={dir as Turn | undefined}>
              <Paper entry={entry} />
            </PageEnter>
          </ScrollView>
        </View>
      </GestureDetector>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: bottom + 10, paddingTop: 6 }}>
        <Neighbour side="older" entry={older} onPress={() => turn(older, 'older')} />
        <Neighbour side="newer" entry={newer} onPress={() => turn(newer, 'newer')} />
      </View>
    </View>
  );
}

function TopBar({ onBack, centre, right }: { onBack: () => void; centre?: string; right?: React.ReactNode }) {
  return (
    <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow-left" size={22} />
      </Pressable>
      {centre ? <Text style={[body(13, 'semi'), { color: ramp.neutral[700] }]}>{centre}</Text> : null}
      <View style={{ minWidth: 44 }}>{right}</View>
    </View>
  );
}

function Neighbour({ side, entry, onPress }: { side: Turn; entry: Entry | null; onPress: () => void }) {
  if (!entry) return <View style={{ width: 120 }} />;
  const label = fmtShort(entry.date);
  const older = side === 'older';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${older ? 'Older page' : 'Newer page'}, ${label}`}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ minWidth: 120, height: 48, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: older ? 'flex-start' : 'flex-end', gap: 4, borderRadius: 24, backgroundColor: pressed ? ramp.neutral[300] : 'transparent' })}
    >
      {older ? <Icon name="chevron-left" size={18} color={ramp.neutral[800]} /> : null}
      <View style={{ alignItems: older ? 'flex-start' : 'flex-end' }}>
        <Text style={[body(11, 'bold'), { color: ramp.neutral[700], letterSpacing: 0.8, textTransform: 'uppercase' }]}>{older ? 'Older' : 'Newer'}</Text>
        <Text style={body(13, 'semi')}>{label}</Text>
      </View>
      {older ? null : <Icon name="chevron-right" size={18} color={ramp.neutral[800]} />}
    </Pressable>
  );
}

/** The page slides in from the side you turned it from (or rises gently when first opened). */
function PageEnter({ dir, children }: { dir?: Turn; children: React.ReactNode }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [p]);
  const from = dir === 'newer' ? 40 : dir === 'older' ? -40 : 0;
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateX: (1 - p.value) * from }, { translateY: dir ? 0 : (1 - p.value) * 12 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Paper({ entry }: { entry: Entry }) {
  const date = fmtParts(entry.date);
  const [mood, hint] = MOODS[moodIndex(entry.mood)];
  const vis = VIS[entry.vis];
  const hasAttachments = entry.photos.length > 0 || entry.voices.length > 0 || entry.stickers.length > 0;
  return (
    <View
      style={[
        { backgroundColor: PAPER, borderRadius: 10, paddingTop: 26, paddingBottom: 28, paddingLeft: 54, paddingRight: 22, gap: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider },
        shadows.md,
      ]}
    >
      {/* the margin line of a notebook page */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 38, top: 0, bottom: 0, width: 1.5, backgroundColor: ramp.accent[300], opacity: 0.8 }} />

      <View accessible accessibilityLabel={`${date.weekday} ${date.day} ${date.month} ${date.year}, ${entry.time}`} style={{ gap: 2 }}>
        <Text style={[body(12, 'bold'), { color: ramp.accent[700], letterSpacing: 1.6, textTransform: 'uppercase' }]}>{date.weekday}</Text>
        <Text style={heading(40, 1.05)}>{`${date.day} ${date.month}`}</Text>
        <Text style={[body(13), { color: ramp.neutral[700] }]}>{`${date.year} · ${entry.time}`}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MoodBlob value={entry.mood} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={heading(19, 1.1)}>{mood}</Text>
          <Text style={[body(12), { color: ramp.neutral[700] }]}>{hint}</Text>
        </View>
      </View>

      {entry.feelings.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {entry.feelings.map((f) => (
            <View key={f} style={{ paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: ramp.accent2[200], justifyContent: 'center' }}>
              <Text style={[body(12, 'semi'), { color: ramp.accent2[900] }]}>{f}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {entry.prompt ? (
        <View style={{ gap: 4 }}>
          <Text style={[body(11, 'bold'), { color: ramp.neutral[600], letterSpacing: 1, textTransform: 'uppercase' }]}>Prompt</Text>
          <Text style={[heading(20, 1.25), { color: ramp.accent[800] }]}>{`“${entry.prompt}”`}</Text>
        </View>
      ) : null}

      {entry.text.trim() ? <RuledText text={entry.text} /> : null}

      {hasAttachments ? (
        <View style={{ gap: 18 }}>
          {entry.photos.map((p, i) => <Polaroid key={p.id} uri={p.uri} label={p.label} index={i} />)}
          {entry.voices.length ? (
            <View style={{ gap: 10, alignItems: 'flex-start' }}>
              {entry.voices.map((v) => <VoicePill key={v.id} voice={v} />)}
            </View>
          ) : null}
          {entry.stickers.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {entry.stickers.map((name, i) => {
                const st = stickerStyle(name);
                return (
                  <Blob key={`${name}-${i}`} radii={blobFor(name)} size={66} color={st.bg} rotate={tiltFor(name)}>
                    <Text style={[heading(13, 1), { color: st.ink }]}>{name}</Text>
                  </Blob>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        accessible
        accessibilityLabel={`${vis.label}. ${vis.desc}`}
        style={{ alignSelf: 'flex-start', height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderColor: vis.border, backgroundColor: vis.bg, flexDirection: 'row', alignItems: 'center', gap: 7 }}
      >
        <Icon name={vis.icon} size={14} color={vis.fg} />
        <Text style={[body(12, 'semi'), { color: vis.fg }]}>{vis.label}</Text>
      </View>
    </View>
  );
}
