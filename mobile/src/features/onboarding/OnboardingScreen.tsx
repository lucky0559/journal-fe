import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseRadii } from '@/lib/blob';
import { TIMES } from '@/lib/time';
import { useAuth } from '@/auth';
import { useSettings } from '@/state';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Blob } from '@/ui/Blob';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { ScreenFade } from '@/ui/ScreenFade';
import { ONBOARDING_CTA, canContinue } from './onboardingLogic';
import { StepDots } from './StepDots';

const BLOB = parseRadii('58% 42% 38% 62% / 64% 46% 54% 36%');
const CIRCLE = parseRadii('50%');

export function OnboardingScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [step, setStep] = useState(0);
  const googleName = useAuth((s) => s.user?.givenName);
  const [name, setName] = useState(settings.name || googleName || '');
  const [time, setTime] = useState<string | null>(settings.remind ? settings.remindTime : null);

  useEffect(() => {
    if (step === 0) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setStep((s) => s - 1); return true; });
    return () => sub.remove();
  }, [step]);

  const next = async () => {
    if (!canContinue(step, name)) return;
    if (step === 1) await update({ name: name.trim() });
    if (step === 2) await update({ remind: time !== null, remindTime: time ?? settings.remindTime });
    if (step === 3) return router.push({ pathname: '/pin', params: { after: 'today' } });
    setStep(step + 1);
  };
  const skipPin = async () => {
    await update({ onboarded: true });
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade style={{ paddingTop: top + 10, paddingHorizontal: 26, paddingBottom: bottom + 26, gap: 20 }}>
        <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setStep(step - 1)} style={styles.back}>
              <Icon name="arrow-left" size={22} />
            </Pressable>
          ) : <View />}
          <StepDots count={ONBOARDING_CTA.length} step={step} />
        </View>

        <View style={{ flex: 1, gap: step === 0 ? 20 : 16, paddingTop: step === 0 ? 0 : 40 }}>
          {step === 0 && (
            <>
              <View style={{ height: 270 }}>
                <View style={{ position: 'absolute', left: 0, top: 30 }}><Blob radii={CIRCLE} size={190} color={ramp.accent[300]} /></View>
                <View style={{ position: 'absolute', right: 6, top: 0 }}><Blob radii={BLOB} size={150} color={ramp.accent2[300]} /></View>
                <View style={{ position: 'absolute', left: 150, top: 170 }}><Blob radii={CIRCLE} size={92} color={ramp.accent[500]} /></View>
              </View>
              <Text style={heading(36, 1.08)}>A softer place to put your day.</Text>
              <Text style={[body(16, 'body', 1.5), { color: ramp.neutral[800] }]}>A mood, a few words, maybe a photo. Two minutes is plenty.</Text>
            </>
          )}
          {step === 1 && (
            <>
              <Text style={heading(32)}>What should we call you?</Text>
              <Text style={[body(15), { color: ramp.neutral[700] }]}>Only you will ever see this.</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor={ramp.neutral[500]}
                maxLength={40}
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.input}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Text style={heading(32)}>When do you usually wind down?</Text>
              <Text style={[body(15, 'body', 1.5), { color: ramp.neutral[700] }]}>We’ll send one gentle nudge a night. Never more.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {TIMES.map((t) => (
                  <View key={t} style={{ width: '48%' }}>
                    <WideChip label={t} selected={time === t} onPress={() => setTime(t)} />
                  </View>
                ))}
                <View style={{ width: '100%' }}>
                  <WideChip label="No reminders" selected={time === null} onPress={() => setTime(null)} />
                </View>
              </View>
            </>
          )}
          {step === 3 && (
            <>
              <View style={styles.lockCircle}><Icon name="lock" size={44} color={ramp.accent2[800]} /></View>
              <Text style={heading(32)}>Keep your pages private?</Text>
              <Text style={[body(15, 'body', 1.5), { color: ramp.neutral[700] }]}>
                Add a 4-digit PIN and the app will ask for it every time it opens. You can change this later.
              </Text>
            </>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <Button label={ONBOARDING_CTA[step]} onPress={next} disabled={!canContinue(step, name)} />
          {step === 3 && <Button label="Not now" variant="ghost" onPress={skipPin} />}
        </View>
      </ScreenFade>
    </View>
  );
}

/** 56px full-width pill used for the reminder choices. */
function WideChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Chip label={label} selected={selected} onPress={onPress} height={56} fill />;
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: {
    height: 56, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: ramp.neutral[100],
    paddingHorizontal: 22, fontFamily: 'Figtree_400Regular', fontSize: 18, color: colors.text, marginTop: 8,
  },
  lockCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: ramp.accent2[200], alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
});
