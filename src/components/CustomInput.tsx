import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { AccessibleText } from './AccessibleText';
import { useAccessibility } from '../context/AccessibilityContext';
import Colors from '../theme/colors';
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react-native';

interface CustomInputProps extends TextInputProps {
  label: string;
  errorMessage?: string;
  isValid?: boolean;
  helperText?: string;
  isPassword?: boolean;
  required?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  errorMessage,
  isValid = false,
  helperText,
  isPassword = false,
  required = false,
  value,
  onBlur,
  onFocus,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { highContrast, darkMode, palette } = useAccessibility();

  const hasError = Boolean(errorMessage);

  const getBorderColor = () => {
    if (hasError) return palette.danger;
    if (isValid && value && value.length > 0) return palette.success;
    if (isFocused) return palette.accent;
    if (highContrast) return palette.border;
    return darkMode ? '#64748B' : Colors.inputBorder;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <AccessibleText size="sm" weight="semiBold" color={palette.textPrimary}>
          {label}
        </AccessibleText>
        {required && (
          <AccessibleText size="sm" weight="bold" color={palette.danger}>
            {' *'}
          </AccessibleText>
        )}
      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: darkMode ? palette.surfaceSecondary : Colors.white,
            borderColor: getBorderColor(),
            borderWidth: highContrast ? 2.5 : 2,
          },
          hasError && { backgroundColor: palette.dangerBg },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: palette.textPrimary }]}
          placeholderTextColor={palette.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          accessibilityLabel={label}
          accessibilityHint={errorMessage || helperText}
          {...rest}
        />

        {isValid && !hasError && value && value.length > 0 && (
          <View style={styles.statusIcon}>
            <CheckCircle2 size={20} color={palette.success} />
          </View>
        )}

        {hasError && (
          <View style={styles.statusIcon}>
            <AlertTriangle size={20} color={palette.danger} />
          </View>
        )}

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            accessibilityRole="button"
          >
            {showPassword ? (
              <EyeOff size={20} color={palette.iconPrimary} />
            ) : (
              <Eye size={20} color={palette.iconPrimary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {hasError && (
        <View style={styles.messageRow}>
          <AccessibleText size="xs" weight="semiBold" color={palette.danger}>
            ⚠️ {errorMessage}
          </AccessibleText>
        </View>
      )}

      {!hasError && helperText && (
        <View style={styles.messageRow}>
          <AccessibleText size="xs" color={palette.textSecondary}>
            {helperText}
          </AccessibleText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.highInkSlate,
    paddingVertical: 12,
  },
  statusIcon: {
    marginLeft: 8,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  messageRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
});
