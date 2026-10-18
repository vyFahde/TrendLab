import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useToastStore } from '../store/useToastStore';
import { AccessibleText } from './AccessibleText';
import Colors from '../theme/colors';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react-native';

export const AccessibleToast: React.FC = () => {
  const { visible, message, type, hideToast } = useToastStore();

  if (!visible || !message) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return Colors.successEmerald;
      case 'error':
        return Colors.alertCrimson;
      case 'info':
      default:
        return Colors.deepSpaceNavy;
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color={Colors.white} />;
      case 'error':
        return <AlertTriangle size={20} color={Colors.white} />;
      case 'info':
      default:
        return <Info size={20} color={Colors.white} />;
    }
  };

  return (
    <View
      style={[styles.toastContainer, { backgroundColor: getBackgroundColor() }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.contentRow}>
        {renderIcon()}
        <AccessibleText size="xs" weight="bold" color={Colors.white} style={styles.messageText}>
          {message}
        </AccessibleText>
      </View>
      <TouchableOpacity
        onPress={hideToast}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel="Fechar notificação"
      >
        <X size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 92,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: Colors.deepSpaceNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  messageText: {
    flex: 1,
  },
  closeBtn: {
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
