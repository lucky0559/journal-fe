import { Alert, Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth';
import { DEMO_DATA } from '@/config';
import { pinVault } from '@/data/pinVaultInstance';
import { demoEntries } from '@/domain/demoData';
import { todayIso } from '@/lib/dates';
import { TIMES } from '@/lib/time';
import { exportPages } from '@/services/exporter';
import { social } from '@/social';
import { useEntries, useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { useToast } from '@/state/toastStore';
import { radii, ramp, colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Toggle } from '@/ui/Toggle';

const card = { backgroundColor: colors.surface, borderRadius: radii.container, padding: 20, gap: 14 } as const;

function Row({ title, sub, right }: { title: string; sub: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={body(16, 'semi')}>{title}</Text>
        <Text style={[body(13), { color: ramp.neutral[700] }]}>{sub}</Text>
      </View>
      {right}
    </View>
  );
}

function ListButton({ label, sub, onPress, danger }: { label: string; sub?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ height: 52, paddingHorizontal: 14, borderRadius: 24, justifyContent: 'center', backgroundColor: pressed ? (danger ? ramp.accent[100] : ramp.neutral[300]) : 'transparent' })}
    >
      <Text style={[body(15, 'semi'), { color: danger ? ramp.accent[700] : colors.text }]}>{label}</Text>
      {sub ? <Text style={[body(12), { color: ramp.neutral[700] }]}>{sub}</Text> : null}
    </Pressable>
  );
}

export function MeScreen() {
  const router = useRouter();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const entries = useEntries((s) => s.entries);
  const show = useToast((s) => s.show);
  const account = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  const toggleLock = async () => {
    if (settings.lockOn) {
      await pinVault.clear();
      await update({ lockOn: false });
      show('App lock is off');
    } else {
      router.push({ pathname: '/pin', params: { after: 'me' } });
    }
  };

  const doExport = async () => {
    show(`Exporting ${entries.length} ${entries.length === 1 ? 'page' : 'pages'} as PDF…`);
    try {
      if ((await exportPages(entries, settings.name)) === 'unavailable') show('Sharing isn’t available on this device');
    } catch {
      show('Couldn’t export your pages. Try again.');
    }
  };

  return (
    <Screen gap={18} bottomPad={30} topPad={18}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: ramp.accent2[300], alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[heading(28, 1), { color: ramp.accent2[900] }]}>{(settings.name || 'M').trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={heading(28)}>{settings.name || 'friend'}</Text>
          <Text style={[body(14), { color: ramp.neutral[700] }]}>{`${entries.length} ${entries.length === 1 ? 'page' : 'pages'} so far`}</Text>
        </View>
      </View>

      <View style={card}>
        <Row
          title="Nightly nudge" sub="One reminder, at a time you choose"
          right={<Toggle value={settings.remind} onChange={(v) => update({ remind: v })} accessibilityLabel="Nightly nudge" />}
        />
        {settings.remind ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} selected={settings.remindTime === t} onPress={() => update({ remindTime: t, remind: true })} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={card}>
        <Row
          title="App lock" sub="Ask for your PIN when the app opens"
          right={<Toggle value={settings.lockOn} onChange={toggleLock} accessibilityLabel="App lock" />}
        />
        {settings.lockOn ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => useLock.getState().lock()}
            style={({ pressed }) => ({ alignSelf: 'flex-start', height: 44, paddingHorizontal: 18, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: pressed ? ramp.neutral[300] : 'transparent' })}
          >
            <Icon name="lock" size={16} />
            <Text style={body(14, 'semi')}>Lock now</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, padding: 8 }}>
        <ListButton label="Export my pages" onPress={doExport} />
        {account ? (
          <ListButton
            label="Sign out" sub={account.email}
            onPress={async () => { await signOut(); router.replace('/login'); }}
          />
        ) : null}
        {account ? (
          <ListButton
            label="Share my profile link"
            onPress={() => void Share.share({ message: `Add me on Journal: journal:///friends/${account.id}` })}
          />
        ) : null}
        <ListButton label="Replay the welcome" onPress={() => router.push('/onboarding')} />
        {account ? (
          <ListButton
            label="Delete my account" danger
            onPress={() =>
              Alert.alert('Delete your account?', 'This removes your account and your whole journal from our servers, including pages marked Only me. Pages on this phone stay.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await social.deleteAccount();
                      // The pages stay here, but they no longer have a server copy: a later sign-in saves them afresh.
                      await useEntries.getState().detachFromAccount();
                      await useSettings.getState().update({ syncOwner: '' });
                      await signOut();
                      router.replace('/login');
                    } catch {
                      show('Couldn’t delete your account. Try again.');
                    }
                  },
                },
              ])
            }
          />
        ) : null}
        {DEMO_DATA ? (
          <ListButton
            label="Reset demo data" danger
            onPress={async () => { await useEntries.getState().replaceAll(demoEntries(todayIso())); show('Demo data restored'); }}
          />
        ) : null}
      </View>
    </Screen>
  );
}
