import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { AccessibleText } from './AccessibleText';
import { useAccessibility } from '../context/AccessibilityContext';
import Colors from '../theme/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'success';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { highContrast, darkMode, palette } = useAccessibility();

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return Colors.disabled;
    if (highContrast && darkMode) {
      switch (variant) {
        case 'primary':
          return pressed ? '#EAB308' : '#FACC15';
        case 'secondary':
          return pressed ? '#1E293B' : '#111827';
        case 'success':
          return pressed ? '#16A34A' : '#22C55E';
        case 'outline':
          return pressed ? '#1E293B' : '#000000';
      }
    }
    if (highContrast) {
      switch (variant) {
        case 'primary':
          return pressed ? '#000000' : '#0F172A';
        case 'secondary':
          return pressed ? '#000000' : '#1E1B4B';
        case 'success':
          return pressed ? '#052E16' : '#14532D';
        case 'outline':
          return pressed ? '#E2E8F0' : '#FFFFFF';
      }
    }
    switch (variant) {
      case 'primary':
        return pressed ? '#3730A3' : Colors.electricIris;
      case 'secondary':
        return pressed ? '#17143A' : darkMode ? '#334155' : Colors.deepSpaceNavy;
      case 'success':
        return pressed ? '#166534' : Colors.successEmerald;
      case 'outline':
        return pressed ? Colors.pressedOverlay : 'transparent';
      default:
        return pressed ? '#3730A3' : Colors.electricIris;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.white;
    if (highContrast && darkMode) {
      if (variant === 'primary' || variant === 'success') return '#000000';
      return '#FACC15';
    }
    if (highContrast) {
      if (variant === 'outline') return '#000000';
      return '#FFFFFF';
    }
    if (variant === 'outline') {
      return palette.accent;
    }
    return Colors.white;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBackgroundColor(pressed) },
        variant === 'outline' && [
          styles.outlineBorder,
          { borderColor: palette.accent },
        ],
        highContrast && {
          borderWidth: 2.5,
          borderColor: darkMode ? '#FFFFFF' : '#000000',
        },
        pressed && !disabled && !loading && styles.pressedTransform,
        isFocused && [styles.focusRing, { borderColor: palette.border }],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <AccessibleText
            weight="bold"
            size="base"
            color={getTextColor()}
            style={styles.text}
          >
            {title}
          </AccessibleText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: Colors.deepSpaceNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pressedTransform: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  focusRing: {
    borderWidth: 3,
    borderColor: Colors.focusRing,
  },
  outlineBorder: {
    borderWidth: 2,
    borderColor: Colors.electricIris,
    elevation: 0,
    shadowOpacity: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
  },
});
