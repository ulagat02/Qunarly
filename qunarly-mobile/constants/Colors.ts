import { darkTheme, lightTheme } from '@/src/mobile/theme';

export default {
  light: {
    text: lightTheme.colors.text,
    background: lightTheme.colors.background,
    tint: lightTheme.colors.primary,
    tabIconDefault: lightTheme.colors.mutedText,
    tabIconSelected: lightTheme.colors.primary,
  },
  dark: {
    text: darkTheme.colors.text,
    background: darkTheme.colors.background,
    tint: darkTheme.colors.primary,
    tabIconDefault: darkTheme.colors.mutedText,
    tabIconSelected: darkTheme.colors.primary,
  },
};
