import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

export function useDiscardGuard(shouldGuard: () => boolean, onDiscard: () => void): () => void {
  const navigation = useNavigation();
  const disarmed = useRef(false);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (disarmed.current || !shouldGuard()) return;
        e.preventDefault();
        Alert.alert('Discard this page?', 'Your words and attachments won’t be saved.', [
          { text: 'Keep writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              disarmed.current = true;
              onDiscard();
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }),
    [navigation, shouldGuard, onDiscard],
  );
  return () => { disarmed.current = true; };
}
