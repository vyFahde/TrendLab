export const Colors = {
  deepSpaceNavy: '#1E1B4B',
  electricIris: '#4338CA',
  warmCoral: '#C43D27',
  cleanCanvas: '#F8FAFC',

  highInkSlate: '#0F172A',
  charcoalSlate: '#334155',

  successEmerald: '#15803D',
  alertCrimson: '#B91C1C',
  alertBackground: '#FEF2F2',

  focusRing: '#0F172A',
  pressedOverlay: 'rgba(15, 23, 42, 0.08)',

  white: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  inputBackground: '#F1F5F9',
  inputBorder: '#CBD5E1',
  disabled: '#94A3B8',
};

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  heading: string;
  accent: string;
  accentContrastText: string;
  primary: string;
  primaryContent: string;
  secondary: string;
  border: string;
  borderStrong: string;
  borderWidth: number;
  iconPrimary: string;
  iconAccent: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  coral: string;
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const getThemePalette = (darkMode: boolean, highContrast: boolean): ThemePalette => {
  if (darkMode && highContrast) {
    return {
      background: '#000000',
      surface: '#090D16',
      surfaceSecondary: '#111827',
      textPrimary: '#FFFFFF',
      textSecondary: '#FEF08A',
      heading: '#FFFFFF',
      accent: '#FACC15',
      accentContrastText: '#000000',
      primary: '#FACC15',
      primaryContent: '#000000',
      secondary: '#FB923C',
      border: '#FFFFFF',
      borderStrong: '#FACC15',
      borderWidth: 2.5,
      iconPrimary: '#FFFFFF',
      iconAccent: '#FACC15',
      success: '#4ADE80',
      successBg: '#052E16',
      danger: '#F87171',
      dangerBg: '#450A0A',
      coral: '#FB923C',
      tabBarBg: '#000000',
      tabBarActive: '#FACC15',
      tabBarInactive: '#FFFFFF',
    };
  }

  if (darkMode) {
    return {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceSecondary: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      heading: '#F8FAFC',
      accent: '#818CF8',
      accentContrastText: '#FFFFFF',
      primary: '#6366F1',
      primaryContent: '#FFFFFF',
      secondary: '#F97316',
      border: '#475569',
      borderStrong: '#818CF8',
      borderWidth: 1,
      iconPrimary: '#F8FAFC',
      iconAccent: '#A5B4FC',
      success: '#22C55E',
      successBg: '#064E3B',
      danger: '#F87171',
      dangerBg: '#450A0A',
      coral: '#F97316',
      tabBarBg: '#090D16',
      tabBarActive: '#A5B4FC',
      tabBarInactive: '#94A3B8',
    };
  }

  if (highContrast) {
    return {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSecondary: '#F1F5F9',
      textPrimary: '#000000',
      textSecondary: '#000000',
      heading: '#000000',
      accent: '#1E1B4B',
      accentContrastText: '#FFFFFF',
      primary: '#000000',
      primaryContent: '#FACC15',
      secondary: '#9A3412',
      border: '#000000',
      borderStrong: '#000000',
      borderWidth: 2.5,
      iconPrimary: '#000000',
      iconAccent: '#1E1B4B',
      success: '#14532D',
      successBg: '#DCFCE7',
      danger: '#7F1D1D',
      dangerBg: '#FEE2E2',
      coral: '#9A3412',
      tabBarBg: '#000000',
      tabBarActive: '#FACC15',
      tabBarInactive: '#FFFFFF',
    };
  }

  return {
    background: Colors.cleanCanvas,
    surface: Colors.white,
    surfaceSecondary: '#F1F5F9',
    textPrimary: Colors.highInkSlate,
    textSecondary: Colors.charcoalSlate,
    heading: Colors.deepSpaceNavy,
    accent: Colors.electricIris,
    accentContrastText: Colors.white,
    primary: Colors.electricIris,
    primaryContent: Colors.white,
    secondary: Colors.warmCoral,
    border: Colors.cardBorder,
    borderStrong: Colors.deepSpaceNavy,
    borderWidth: 1,
    iconPrimary: Colors.deepSpaceNavy,
    iconAccent: Colors.electricIris,
    success: Colors.successEmerald,
    successBg: '#F0FDF4',
    danger: Colors.alertCrimson,
    dangerBg: '#FEF2F2',
    coral: Colors.warmCoral,
    tabBarBg: Colors.deepSpaceNavy,
    tabBarActive: '#A5B4FC',
    tabBarInactive: '#94A3B8',
  };
};

export default Colors;
