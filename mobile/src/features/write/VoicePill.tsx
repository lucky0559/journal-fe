import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Voice } from '@/domain/types';
import { secs } from '@/lib/dates';
import { colors, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon } from '@/ui/Icon';

const BARS = [40, 75, 55, 95, 60, 35, 80, 100, 55, 70, 45, 30];

export function VoicePill({ voice, onRemove }: { voice: Voice; onRemove: () => void }) {
  const player = useAudioPlayer(voice.uri || null);
  const status = useAudioPlayerStatus(player);
  const [fake, setFake] = useState(false); // demo notes have no audio; just toggle the icon
  const playing = voice.uri ? status.playing : fake;
  const toggle = () => {
    if (!voice.uri) return setFake((f) => !f);
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || status.currentTime >= status.duration) player.seekTo(0);
      player.play();
    }
  };
  return (
    <View style={{ height: 52, borderRadius: 999, backgroundColor: ramp.accent[200], flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 7, paddingRight: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
        onPress={toggle}
        hitSlop={3}
        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={playing ? 'pause' : 'play'} size={16} color={colors.bg} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 24, width: 70 }}>
        {BARS.map((h, i) => <View key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, backgroundColor: ramp.accent[600] }} />)}
      </View>
      <Text style={[body(12, 'bold'), { color: ramp.accent[800] }]}>{secs(voice.seconds)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Remove voice note" onPress={onRemove} hitSlop={9} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="x" size={13} color={ramp.accent[800]} />
      </Pressable>
    </View>
  );
}
