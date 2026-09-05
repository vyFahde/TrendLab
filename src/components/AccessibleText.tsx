import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
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
  const { fontScale, highContrast } = useAccessibility();

  const finalFontSize = Math.round(baseFontSizes[size] * fontScale);
  const finalColor = highContrast && color === Colors.charcoalSlate ? Colors.highInkSlate : color;

  return (
    <Text
      style={[
        {
          fontSize: finalFontSize,
          fontWeight: fontWeights[weight],
          color: finalColor,
          lineHeight: Math.round(finalFontSize * 1.35),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
