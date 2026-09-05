import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { AccessibleText } from './AccessibleText';
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

  const hasError = Boolean(errorMessage);

  const getBorderColor = () => {
    if (hasError) return Colors.alertCrimson; // #B91C1C
    if (isValid && value && value.length > 0) return Colors.successEmerald; // #15803D
    if (isFocused) return Colors.electricIris;
    return Colors.inputBorder;
  };

  return (
    <View style={styles.wrapper}>
      {/* Label acessível com indicação de obrigatório */}
      <View style={styles.labelRow}>
        <AccessibleText size="sm" weight="semiBold" color={Colors.highInkSlate}>
          {label}
        </AccessibleText>
        {required && (
          <AccessibleText size="sm" weight="bold" color={Colors.alertCrimson}>
            {' *'}
          </AccessibleText>
        )}
      </View>

      {/* Campo de Entrada */}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          hasError && styles.errorContainer,
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholderTextColor={Colors.charcoalSlate}
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

        {/* Ícone de Sucesso */}
        {isValid && !hasError && value && value.length > 0 && (
          <View style={styles.statusIcon}>
            <CheckCircle2 size={20} color={Colors.successEmerald} />
          </View>
        )}

        {/* Ícone de Erro */}
        {hasError && (
          <View style={styles.statusIcon}>
            <AlertTriangle size={20} color={Colors.alertCrimson} />
          </View>
        )}

        {/* Alternar visibilidade de Senha */}
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            accessibilityRole="button"
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.charcoalSlate} />
            ) : (
              <Eye size={20} color={Colors.charcoalSlate} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Mensagem de Erro com Alto Contraste Alert Crimson (#B91C1C) */}
      {hasError && (
        <View style={styles.messageRow}>
          <AccessibleText size="xs" weight="semiBold" color={Colors.alertCrimson}>
            ⚠️ {errorMessage}
          </AccessibleText>
        </View>
      )}

      {/* Texto de Ajuda (quando não houver erro) */}
      {!hasError && helperText && (
        <View style={styles.messageRow}>
          <AccessibleText size="xs" color={Colors.charcoalSlate}>
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
    minHeight: 52, // Alvo de toque confortável
  },
  errorContainer: {
    backgroundColor: '#FEF2F2', // Fundo levemente avermelhado para reforço visual
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
    padding: 6,
    marginLeft: 4,
  },
  messageRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
});
