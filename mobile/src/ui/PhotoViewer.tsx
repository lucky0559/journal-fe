import { useState } from 'react';
import { Modal, Pressable, StatusBar, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';

interface Props { uri: string | null; onClose: () => void }

/**
 * A photo, full screen: the picture itself, rounded, sitting on a soft blur of its own colours (the way a story is previewed).
 * Tap anywhere, press back, or use the arrow to close.
 */
export function PhotoViewer({ uri, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const [ratio, setRatio] = useState(4 / 3);
  if (!uri) return null;

  let w = width - 36;
  let h = w / ratio;
  const maxH = height * 0.74;
  if (h > maxH) { h = maxH; w = h * ratio; }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={onClose} style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={{ uri }} blurRadius={70} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' }} />
        <Image
          accessibilityLabel="Photo"
          source={{ uri }}
          contentFit="cover"
          onLoad={(e) => { if (e.source.width && e.source.height) setRatio(e.source.width / e.source.height); }}
          style={{ width: w, height: h, borderRadius: 18 }}
        />
        <View pointerEvents="none" style={{ position: 'absolute', top: top + 10, left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </View>
      </Pressable>
    </Modal>
  );
}
