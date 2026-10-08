import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomNav } from '@/ui/BottomNav';
import { Fab } from '@/ui/Fab';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={(p) => <BottomNav {...p} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Today' }} />
        <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
        <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
        <Tabs.Screen name="me" options={{ title: 'Me' }} />
      </Tabs>
      <Fab />
    </View>
  );
}
