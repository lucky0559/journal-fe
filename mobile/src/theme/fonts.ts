import { useFonts } from 'expo-font';
import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';

export const fontFamily = {
  heading: 'Caprasimo_400Regular',
  body: 'Figtree_400Regular',
  semi: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Caprasimo_400Regular, Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold });
  return loaded || !!error; // never block the app forever on a font error
}
