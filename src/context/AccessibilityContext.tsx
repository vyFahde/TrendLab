import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilityContextData {
  fontScale: number; // 0.9, 1.0, 1.15, 1.30
  focusMode: boolean; // Calm UI: oculta banners e estímulos excessivos (TDAH)
  highContrast: boolean; // Contraste estendido para baixa visão
  increaseFont: () => void;
  decreaseFont: () => void;
  toggleFocusMode: () => void;
  toggleHighContrast: () => void;
  resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextData>({} as AccessibilityContextData);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Carregar preferências salvas do AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedFont = await AsyncStorage.getItem('@trendlab:fontScale');
        const savedFocus = await AsyncStorage.getItem('@trendlab:focusMode');
        const savedContrast = await AsyncStorage.getItem('@trendlab:highContrast');

        if (savedFont) setFontScale(parseFloat(savedFont));
        if (savedFocus) setFocusMode(savedFocus === 'true');
        if (savedContrast) setHighContrast(savedContrast === 'true');
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

  const resetAccessibility = async () => {
    setFontScale(1.0);
    setFocusMode(false);
    setHighContrast(false);
    await AsyncStorage.multiRemove([
      '@trendlab:fontScale',
      '@trendlab:focusMode',
      '@trendlab:highContrast',
    ]);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        focusMode,
        highContrast,
        increaseFont,
        decreaseFont,
        toggleFocusMode,
        toggleHighContrast,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
