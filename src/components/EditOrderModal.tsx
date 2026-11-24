import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { OrderRecord, OrderUpdate } from '../types';
import { AccessibleText } from './AccessibleText';
import { CustomInput } from './CustomInput';
import { CustomButton } from './CustomButton';
import { useAccessibility } from '../context/AccessibilityContext';
import Colors from '../theme/colors';
import { X } from 'lucide-react-native';

interface EditOrderModalProps {
  order: OrderRecord | null; // pedido em edição (null = modal fechado)
  onClose: () => void;
  onSave: (changes: OrderUpdate) => Promise<void>; // quem chama envia ao back-end (PUT)
}

const paymentOptions: { value: OrderRecord['paymentMethod']; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'card', label: 'Cartão' },
  { value: 'boleto', label: 'Boleto' },
];

// Mesmas regras do checkout (CartScreen), aplicadas antes de enviar ao servidor
const formatZipCode = (val: string) => {
  const clean = val.replace(/\D/g, '').slice(0, 8);
  return clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
};

const validateReceiverName = (val: string) => {
  if (!val.trim()) return 'Informe o nome completo do destinatário.';
  if (val.trim().length < 3) return 'Nome deve ter ao menos 3 caracteres.';
  return '';
};

const validateZipCode = (val: string) => {
  const clean = val.replace(/\D/g, '');
  if (!clean) return 'Informe o CEP para entrega.';
  if (clean.length !== 8) return 'O CEP deve conter exatamente 8 dígitos.';
  return '';
};

const validateAddress = (val: string) => {
  if (!val.trim()) return 'Informe a rua e o número da residência.';
  if (val.trim().length < 5) return 'Endereço muito curto. Inclua logradouro e número.';
  return '';
};

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSave }) => {
  const { palette, highContrast } = useAccessibility();
  const [receiverName, setReceiverName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderRecord['paymentMethod']>('pix');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sempre que um pedido é aberto, o formulário começa com os valores atuais dele
  useEffect(() => {
    if (!order) return;
    setReceiverName(order.receiverName);
    setZipCode(formatZipCode(order.zipCode));
    setAddress(order.address);
    setPaymentMethod(order.paymentMethod);
    setSubmitted(false);
    setSaveError(null);
  }, [order]);

  const nameError = validateReceiverName(receiverName);
  const zipError = validateZipCode(zipCode);
  const addressError = validateAddress(address);

  const handleSave = async () => {
    setSubmitted(true);
    setSaveError(null);
    if (nameError || zipError || addressError) return;

    setSaving(true);
    try {
      await onSave({
        receiverName: receiverName.trim(),
        zipCode,
        address: address.trim(),
        paymentMethod,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={Boolean(order)} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <AccessibleText size="lg" weight="bold" color={palette.textPrimary}>
              Editar Pedido #{order?.id}
            </AccessibleText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar edição do pedido"
            >
              <X size={22} color={palette.iconPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <CustomInput
              label="Nome do Destinatário"
              required
              value={receiverName}
              onChangeText={setReceiverName}
              errorMessage={submitted ? nameError : ''}
              isValid={!nameError}
            />
            <CustomInput
              label="CEP de Entrega"
              required
              keyboardType="numeric"
              maxLength={9}
              placeholder="00000-000"
              value={zipCode}
              onChangeText={(t) => setZipCode(formatZipCode(t))}
              errorMessage={submitted ? zipError : ''}
              isValid={!zipError}
            />
            <CustomInput
              label="Endereço e Número"
              required
              value={address}
              onChangeText={setAddress}
              errorMessage={submitted ? addressError : ''}
              isValid={!addressError}
            />

            <AccessibleText size="sm" weight="semiBold" color={palette.textPrimary}>
              Forma de pagamento simulada
            </AccessibleText>
            <View style={styles.paymentRow} accessibilityRole="radiogroup">
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: selected ? palette.surfaceSecondary : palette.background,
                        borderColor: selected ? palette.primary : palette.border,
                        borderWidth: selected || highContrast ? 2 : 1.5,
                      },
                    ]}
                    onPress={() => setPaymentMethod(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={opt.label}
                  >
                    <AccessibleText
                      size="sm"
                      weight={selected ? 'bold' : 'medium'}
                      color={selected ? Colors.electricIris : palette.textPrimary}
                    >
                      {opt.label}
                    </AccessibleText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {saveError && (
              <AccessibleText
                size="sm"
                color={palette.danger}
                accessibilityLiveRegion="assertive"
                accessibilityRole="alert"
              >
                {saveError}
              </AccessibleText>
            )}

            <CustomButton title="Salvar Alterações" onPress={handleSave} loading={saving} disabled={saving} />
            <CustomButton title="Cancelar" onPress={onClose} variant="outline" disabled={saving} />
          </ScrollView>
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
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
