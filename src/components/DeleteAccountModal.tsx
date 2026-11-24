import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AccessibleText } from './AccessibleText';
import { CustomInput } from './CustomInput';
import { CustomButton } from './CustomButton';
import { useAccessibility } from '../context/AccessibilityContext';
import Colors from '../theme/colors';
import { Trash2, X } from 'lucide-react-native';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>; // quem chama exclui no servidor (DELETE /api/users/me)
}

// LGPD - direito à exclusão: pede a senha para confirmar e explica o que será apagado
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onClose, onConfirm }) => {
  const { palette, highContrast } = useAccessibility();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cada vez que o modal abre, começa limpo
  useEffect(() => {
    if (visible) {
      setPassword('');
      setError(null);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!password) {
      setError('Digite sua senha para confirmar a exclusão.');
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir a conta. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={deleting ? undefined : onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderTopWidth: highContrast ? 2 : 0,
              borderColor: palette.borderStrong,
            },
          ]}
        >
          <View style={styles.header}>
            <AccessibleText size="lg" weight="bold" color={palette.danger} accessibilityRole="header">
              Excluir minha conta
            </AccessibleText>
            <TouchableOpacity
              onPress={onClose}
              disabled={deleting}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar sem excluir a conta"
            >
              <X size={22} color={palette.iconPrimary} />
            </TouchableOpacity>
          </View>

          <AccessibleText size="sm" color={palette.textPrimary}>
            Esta ação é permanente e não pode ser desfeita. Serão apagados:
          </AccessibleText>
          <View style={styles.list}>
            <AccessibleText size="sm" color={palette.textPrimary}>• seu cadastro (nome, e-mail e senha);</AccessibleText>
            <AccessibleText size="sm" color={palette.textPrimary}>• todos os seus pedidos no servidor;</AccessibleText>
            <AccessibleText size="sm" color={palette.textPrimary}>
              • os dados guardados neste aparelho (foto de perfil e medidas do provador).
            </AccessibleText>
          </View>

          <CustomInput
            label="Confirme sua senha"
            required
            isPassword
            placeholder="Digite sua senha atual"
            value={password}
            onChangeText={setPassword}
            errorMessage={error ?? undefined}
          />

          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: palette.danger, opacity: deleting ? 0.6 : 1 }]}
            onPress={handleConfirm}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Excluir minha conta definitivamente"
          >
            <Trash2 size={18} color={Colors.white} />
            <AccessibleText size="sm" weight="bold" color={Colors.white}>
              {deleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </AccessibleText>
          </TouchableOpacity>
          <CustomButton title="Cancelar" onPress={onClose} variant="outline" disabled={deleting} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: 4,
  },
  dangerBtn: {
    minHeight: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
});
