import { StyleSheet } from 'react-native';
import { getTheme, type ThemeName } from './tokens';

/**
 * A StyleSheet that follows the theme. `StyleSheet.create({ ... colors.bg ... })` at module level would keep the colours
 * of whichever theme was live when the file was imported, so build the sheet from a factory instead and call the result
 * while rendering:
 *
 *   const useStyles = themedStyles(() => ({ card: { backgroundColor: colors.surface } }));
 *   function Card() { const styles = useStyles(); ... }
 *
 * The sheet is rebuilt only when the theme changes.
 */
export function themedStyles<T extends StyleSheet.NamedStyles<T>>(factory: () => T): () => T {
  let cache: { theme: ThemeName; styles: T } | null = null;
  return () => {
    const theme = getTheme();
    if (!cache || cache.theme !== theme) cache = { theme, styles: StyleSheet.create(factory()) };
    return cache.styles;
  };
}
