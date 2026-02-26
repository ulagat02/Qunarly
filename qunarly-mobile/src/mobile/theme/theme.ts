export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  placeholder: string;
  overlay: string;
};

export type AppTheme = {
  dark: boolean;
  colors: ThemeColors;
};

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#1B1B1B',
    mutedText: '#607D8B',
    border: '#D0D0D0',
    primary: '#2E7D32',
    danger: '#D32F2F',
    success: '#2E7D32',
    placeholder: '#9E9E9E',
    overlay: 'rgba(0,0,0,0.35)',
  },
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#0E0F12',
    surface: '#16181C',
    text: '#F5F5F5',
    mutedText: '#A0A7B3',
    border: '#2A2D33',
    primary: '#5FAF6E',
    danger: '#EF5350',
    success: '#6BBE7B',
    placeholder: '#7A7F88',
    overlay: 'rgba(0,0,0,0.6)',
  },
};
