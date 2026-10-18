import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import Colors from '../theme/colors';

interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  weight?: 'regular' | 'medium' | 'bold' | 'semiBold';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  color?: string;
}

const baseFontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  style,
  weight = 'regular',
  size = 'base',
  color = Colors.highInkSlate,
  ...rest
}) => {
  const { fontScale, highContrast, darkMode, palette } = useAccessibility();

  const finalFontSize = Math.round(baseFontSizes[size] * fontScale);

  const resolveAccessibleColor = (rawColor: string): string => {
    if (!darkMode && !highContrast) return rawColor;

    switch (rawColor) {
      case Colors.highInkSlate:
        return palette.textPrimary;
      case Colors.charcoalSlate:
        return palette.textSecondary;
      case Colors.deepSpaceNavy:
        return palette.heading;
      case Colors.electricIris:
        return palette.accent;
      case Colors.warmCoral:
        return palette.coral;
      case Colors.successEmerald:
        return palette.success;
      case Colors.alertCrimson:
        return palette.danger;
      default:
        return rawColor;
    }
  };

  // Em Alto Contraste, reforça o peso da fonte para máxima nitidez
  const effectiveWeight = highContrast
    ? weight === 'regular'
      ? 'semiBold'
      : 'bold'
    : weight;

  const finalColor = resolveAccessibleColor(color);

  return (
    <Text
      style={[
        {
          fontSize: finalFontSize,
          fontWeight: fontWeights[effectiveWeight],
          color: finalColor,
          lineHeight: Math.round(finalFontSize * 1.38),
          letterSpacing: highContrast ? 0.35 : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
