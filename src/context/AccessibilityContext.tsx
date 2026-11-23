import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemePalette, ThemePalette } from '../theme/colors';

interface AccessibilityContextData {
  fontScale: number;
  focusMode: boolean;
  highContrast: boolean;
  darkMode: boolean;
  quickBarExpanded: boolean;
  palette: ThemePalette;
  increaseFont: () => void;
  decreaseFont: () => void;
  toggleFocusMode: () => void;
  toggleHighContrast: () => void;
  toggleDarkMode: () => void;
  toggleQuickBar: () => void;
  resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextData>({} as AccessibilityContextData);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [quickBarExpanded, setQuickBarExpanded] = useState(true);

  // Carregar preferências salvas do AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedFont, savedFocus, savedContrast, savedDark, savedQuickBar] = await Promise.all([
          AsyncStorage.getItem('@trendlab:fontScale'),
          AsyncStorage.getItem('@trendlab:focusMode'),
          AsyncStorage.getItem('@trendlab:highContrast'),
          AsyncStorage.getItem('@trendlab:darkMode'),
          AsyncStorage.getItem('@trendlab:quickBarExpanded'),
        ]);

        if (savedFont) setFontScale(parseFloat(savedFont));
        if (savedFocus) setFocusMode(savedFocus === 'true');
        if (savedContrast) setHighContrast(savedContrast === 'true');
        if (savedDark) setDarkMode(savedDark === 'true');
        if (savedQuickBar !== null) setQuickBarExpanded(savedQuickBar === 'true');
      } catch (error) {
        console.warn('Erro ao carregar preferências de acessibilidade', error);
      }
    };
    loadPreferences();
  }, []);

  const increaseFont = async () => {
    setFontScale((prev) => {
      const next = prev < 1.3 ? Number((prev + 0.1).toFixed(2)) : prev;
      AsyncStorage.setItem('@trendlab:fontScale', next.toString());
      return next;
    });
  };

  const decreaseFont = async () => {
    setFontScale((prev) => {
      const next = prev > 0.9 ? Number((prev - 0.1).toFixed(2)) : prev;
      AsyncStorage.setItem('@trendlab:fontScale', next.toString());
      return next;
    });
  };

  const toggleFocusMode = async () => {
    setFocusMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem('@trendlab:focusMode', next.toString());
      return next;
    });
  };

  const toggleHighContrast = async () => {
    setHighContrast((prev) => {
      const next = !prev;
      AsyncStorage.setItem('@trendlab:highContrast', next.toString());
      return next;
    });
  };

  const toggleDarkMode = async () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem('@trendlab:darkMode', next.toString());
      return next;
    });
  };

  const toggleQuickBar = () => {
    const next = !quickBarExpanded;
    setQuickBarExpanded(next);
    void AsyncStorage.setItem('@trendlab:quickBarExpanded', String(next)).catch((error) => {
      console.warn('Erro ao salvar o estado da barra de acessibilidade', error);
    });
  };

  const resetAccessibility = async () => {
    setFontScale(1.0);
    setFocusMode(false);
    setHighContrast(false);
    setDarkMode(false);
    setQuickBarExpanded(true);
    await AsyncStorage.multiRemove([
      '@trendlab:fontScale',
      '@trendlab:focusMode',
      '@trendlab:highContrast',
      '@trendlab:darkMode',
      '@trendlab:quickBarExpanded',
    ]);
  };

  const palette = useMemo(
    () => getThemePalette(darkMode, highContrast),
    [darkMode, highContrast]
  );

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        focusMode,
        highContrast,
        darkMode,
        palette,
        increaseFont,
        decreaseFont,
        toggleFocusMode,
        toggleHighContrast,
        toggleDarkMode,
        quickBarExpanded,
        toggleQuickBar,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
