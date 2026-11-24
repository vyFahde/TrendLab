import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AccessibleText } from './AccessibleText';
import { CustomButton } from './CustomButton';
import { useAccessibility } from '../context/AccessibilityContext';
import { termsSections, TERMS_VERSION, TERMS_UPDATED_AT } from '../data/legalTerms';
import { X } from 'lucide-react-native';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

// LGPD: exibe o termo de uso e a política de privacidade (texto em src/data/legalTerms.ts)
export const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  const { palette, highContrast } = useAccessibility();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
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
            <View style={styles.headerText}>
              <AccessibleText size="lg" weight="bold" color={palette.textPrimary} accessibilityRole="header">
                Termos de Uso e Privacidade
              </AccessibleText>
              <AccessibleText size="xs" color={palette.textSecondary}>
                Versão {TERMS_VERSION} • {TERMS_UPDATED_AT}
              </AccessibleText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar termos de uso"
            >
              <X size={22} color={palette.iconPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator>
            {termsSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <AccessibleText size="sm" weight="bold" color={palette.textPrimary} accessibilityRole="header">
                  {section.title}
                </AccessibleText>
                {section.paragraphs.map((text) => (
                  <AccessibleText key={text} size="sm" color={palette.textPrimary}>
                    {text}
                  </AccessibleText>
                ))}
              </View>
            ))}
          </ScrollView>

          <CustomButton title="Fechar" onPress={onClose} variant="outline" />
        </View>
      </View>
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: 14,
    paddingBottom: 8,
  },
  section: {
    gap: 6,
  },
});
