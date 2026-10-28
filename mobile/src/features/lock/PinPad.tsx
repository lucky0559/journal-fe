import { useEffect, useReducer, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialPin, pinCopy, pinReducer } from '@/lib/pinMachine';
import { colors, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';

interface Props {
  mode: 'unlock' | 'set';
  name: string;
  verify?: (pin: string) => Promise<boolean>;
  onUnlocked?: () => void;
  onSetComplete?: (pin: string) => void;
  onCancel?: () => void;
  biometric?: () => Promise<boolean>;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ mode, name, verify, onUnlocked, onSetComplete, onCancel, biometric }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [s, dispatch] = useReducer(pinReducer, mode, initialPin);
  const copy = pinCopy(s, name);

  // Four digits in: wait a beat so the last dot is visible, then advance or verify.
  useEffect(() => {
    if (s.done || s.buf.length !== 4) return;
    const pin = s.buf;
    const t = setTimeout(async () => {
      if (s.mode === 'unlock') {
        const ok = verify ? await verify(pin).catch(() => false) : false;
        dispatch({ type: 'unlockResult', ok, pin });
      } else {
        dispatch({ type: 'advance' });
      }
    }, 180);
    return () => clearTimeout(t);
  }, [s.buf, s.mode, s.done, verify]);

  useEffect(() => {
    if (!s.done) return;
    if (s.done.kind === 'unlocked') onUnlocked?.();
    else onSetComplete?.(s.done.pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.done]);

  const triedBiometric = useRef(false);
  const tryBiometric = async () => {
    if (biometric && (await biometric())) onUnlocked?.();
  };
  useEffect(() => {
    if (mode !== 'unlock' || !biometric || triedBiometric.current) return;
    triedBiometric.current = true;
    tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: top + 56, paddingBottom: bottom + 26, paddingHorizontal: 30, gap: 14, backgroundColor: colors.bg }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ramp.accent2[200], alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock" size={26} color={ramp.accent2[800]} />
      </View>
      <Text style={[heading(28), { textAlign: 'center' }]}>{copy.title}</Text>
      <Text accessibilityLiveRegion="polite" style={[body(15), { minHeight: 22, textAlign: 'center', color: copy.isError ? colors.danger : ramp.neutral[700] }]}>
        {copy.sub}
      </Text>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, marginBottom: 26 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: s.err ? colors.accent : colors.text, backgroundColor: i < s.buf.length ? colors.text : 'transparent' }}
          />
        ))}
      </View>
      <View style={{ width: 76 * 3 + 26 * 2, flexDirection: 'row', flexWrap: 'wrap', columnGap: 26, rowGap: 14 }}>
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={i} style={{ width: 76, height: 76 }} />
          ) : (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? 'Delete' : k}
              onPress={() => dispatch(k === 'del' ? { type: 'del' } : { type: 'press', digit: k })}
              style={({ pressed }) => ({
                width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
                backgroundColor: k === 'del' ? 'transparent' : pressed ? ramp.accent[300] : ramp.neutral[200],
              })}
            >
              {k === 'del' ? <Icon name="delete" size={26} /> : <Text style={heading(28, 1)}>{k}</Text>}
            </Pressable>
          ),
        )}
      </View>
      <View style={{ marginTop: 'auto', alignItems: 'center', gap: 4 }}>
        {mode === 'unlock' && biometric ? <Button label="Use biometrics" variant="ghost" onPress={tryBiometric} height={44} /> : null}
        {mode === 'set' && onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} height={44} /> : null}
      </View>
    </View>
  );
}
