import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MOODS } from '@/lib/mood';
import { useEntries } from '@/state';
import { refreshEntries } from '@/state/refreshEntries';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Chip } from '@/ui/Chip';
import { EmptyNote } from '@/ui/EmptyNote';
import { EntryCard } from '@/ui/EntryCard';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { filterPages } from './filterPages';

/** Every page you have written, newest first, with a search box and a mood filter. */
export function AllPagesScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const shown = useMemo(() => filterPages(entries, query, mood), [entries, query, mood]);
  const filtering = query.trim() !== '' || mood !== null;

  return (
    <Screen topPad={6} bottomPad={30} gap={16} onRefresh={refreshEntries}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow-left" size={22} />
      </Pressable>
      <View style={{ gap: 2 }}>
        <Text style={heading(32)}>All your pages</Text>
        <Text style={[body(14), { color: ramp.neutral[700] }]}>{`${entries.length} ${entries.length === 1 ? 'page' : 'pages'}`}</Text>
      </View>

      <View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your pages"
          placeholderTextColor={ramp.neutral[500]}
          accessibilityLabel="Search your pages"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ height: 52, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: ramp.neutral[100], paddingLeft: 22, paddingRight: 52, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.text }}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={{ position: 'absolute', right: 4, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MOODS.map(([label], i) => (
          <Chip key={label} label={label} selected={mood === i} onPress={() => setMood(mood === i ? null : i)} />
        ))}
      </View>

      {filtering && entries.length ? (
        <Text accessibilityLiveRegion="polite" style={[body(13, 'semi'), { color: ramp.neutral[700] }]}>{`${shown.length} of ${entries.length} ${entries.length === 1 ? 'page' : 'pages'}`}</Text>
      ) : null}

      <View style={{ gap: 12 }}>
        {shown.map((e) => (
          <EntryCard key={e.id} entry={e} onPress={() => router.push({ pathname: '/page/[id]', params: { id: e.id } })} />
        ))}
      </View>
      {entries.length === 0 ? <EmptyNote text="No pages yet. Your first one is a tap away." /> : null}
      {entries.length > 0 && shown.length === 0 ? <EmptyNote text="No pages match that." /> : null}
    </Screen>
  );
}
