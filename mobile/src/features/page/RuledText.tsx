import { useState } from 'react';
import { Text, View } from 'react-native';
import { colors, ramp } from '@/theme/tokens';
import { ruledLineCount } from './pageNav';

export const LINE_HEIGHT = 32;
/** How far above the bottom of a text line its ruled line sits, so words rest on the line. */
const REST = 7;

/** Your words as they'd look in a notebook: each line of text sits on a faint ruled line. */
export function RuledText({ text }: { text: string }) {
  const [height, setHeight] = useState(0);
  const lines = ruledLineCount(height, LINE_HEIGHT);
  return (
    <View>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        {Array.from({ length: lines }, (_, i) => (
          <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: (i + 1) * LINE_HEIGHT - REST, height: 1, backgroundColor: ramp.accent[300], opacity: 0.55 }} />
        ))}
      </View>
      <Text
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={{ fontFamily: 'Figtree_400Regular', fontSize: 18, lineHeight: LINE_HEIGHT, color: colors.text }}
      >
        {text}
      </Text>
      {/* keeps the spare ruled lines inside the page */}
      <View style={{ height: lines > 0 ? 2 * LINE_HEIGHT : 0 }} />
    </View>
  );
}
