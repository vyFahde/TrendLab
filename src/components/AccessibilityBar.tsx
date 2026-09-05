import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { AccessibleText } from './AccessibleText';
import Colors from '../theme/colors';
import { Eye, EyeOff, Sparkles, SlidersHorizontal } from 'lucide-react-native';

export const AccessibilityBar: React.FC = () => {
  const { fontScale, increaseFont, decreaseFont, focusMode, toggleFocusMode, highContrast, toggleHighContrast } =
    useAccessibility();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <SlidersHorizontal size={16} color={Colors.white} />
        <AccessibleText size="xs" weight="medium" color={Colors.white} style={styles.barTitle}>
          Acessibilidade Rápida
        </AccessibleText>
      </View>

      <View style={styles.controlsRow}>
        {/* Controle de Fonte */}
        <View style={styles.fontControls}>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={decreaseFont}
            accessibilityLabel="Diminuir tamanho da fonte"
            accessibilityRole="button"
          >
            <AccessibleText size="sm" weight="bold" color={Colors.white}>
              A-
            </AccessibleText>
          </TouchableOpacity>

          <View style={styles.scaleIndicator}>
            <AccessibleText size="xs" weight="bold" color={Colors.white}>
              {Math.round(fontScale * 100)}%
            </AccessibleText>
          </View>

          <TouchableOpacity
            style={styles.pillButton}
            onPress={increaseFont}
            accessibilityLabel="Aumentar tamanho da fonte"
            accessibilityRole="button"
          >
            <AccessibleText size="sm" weight="bold" color={Colors.white}>
              A+
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Botão Modo Foco (TDAH / Calm UI) */}
        <TouchableOpacity
          style={[styles.toggleButton, focusMode && styles.toggleButtonActive]}
          onPress={toggleFocusMode}
          accessibilityLabel="Alternar Modo Foco para reduzir distrações visuais"
          accessibilityRole="button"
        >
          {focusMode ? (
            <Sparkles size={16} color={Colors.white} />
          ) : (
            <EyeOff size={16} color={Colors.white} />
          )}
          <AccessibleText
            size="xs"
            weight="semiBold"
            color={Colors.white}
            style={styles.toggleText}
          >
            {focusMode ? 'Foco: ON' : 'Modo Foco'}
          </AccessibleText>
        </TouchableOpacity>

        {/* Botão Alto Contraste */}
        <TouchableOpacity
          style={[styles.toggleButton, highContrast && styles.toggleButtonActive]}
          onPress={toggleHighContrast}
          accessibilityLabel="Alternar Alto Contraste AAA"
          accessibilityRole="button"
        >
          <AccessibleText
            size="xs"
            weight="semiBold"
            color={Colors.white}
          >
            {highContrast ? 'AAA: ON' : 'Contraste'}
          </AccessibleText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.deepSpaceNavy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#312E81',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  barTitle: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 2,
  },
  pillButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleIndicator: {
    paddingHorizontal: 6,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.warmCoral,
  },
  toggleText: {
    marginLeft: 2,
  },
});
