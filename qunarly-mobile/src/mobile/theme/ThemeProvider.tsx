import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from './theme';

type ThemeContextValue = {
  theme: AppTheme;
  colorScheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  colorScheme: 'light',
});

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => (colorScheme === 'dark' ? darkTheme : lightTheme), [colorScheme]);

  return <ThemeContext.Provider value={{ theme, colorScheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
