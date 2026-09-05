import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { AccessibleText } from './AccessibleText';
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
  const getBackgroundColor = () => {
    if (disabled) return Colors.disabled;
    switch (variant) {
      case 'primary':
        return Colors.electricIris; // CTA padrão (#4338CA)
      case 'secondary':
        return Colors.deepSpaceNavy;
      case 'success':
        return Colors.successEmerald; // #15803D
      case 'outline':
        return 'transparent';
      default:
        return Colors.electricIris;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return disabled ? Colors.disabled : Colors.electricIris;
    }
    return Colors.white;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52, // Garante tamanho mínimo acessível para toque
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
