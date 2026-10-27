import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { parseProfileLink } from '@/social/postView';
import { colors, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';

export function AddFriendSheet({ visible, onClose, onFound }: { visible: boolean; onClose: () => void; onFound: (userId: string) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    const id = parseProfileLink(text);
    if (!id) return setError('That doesn’t look like a profile link.');
    setError('');
    setText('');
    onClose();
    onFound(id);
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a friend">
      <Text style={[body(14, 'body', 1.45), { color: ramp.neutral[700] }]}>Ask them to use “Share my profile link” in Me, then paste what they send you.</Text>
      <TextInput
        value={text}
        onChangeText={(t) => { setText(t); setError(''); }}
        placeholder="Paste a profile link"
        placeholderTextColor={ramp.neutral[500]}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ height: 56, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: ramp.neutral[100], paddingHorizontal: 22, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.text }}
      />
      {error ? <Text accessibilityLiveRegion="polite" style={[body(14), { color: ramp.accent[700] }]}>{error}</Text> : null}
      <Button label="Find" onPress={submit} />
    </Sheet>
  );
}
