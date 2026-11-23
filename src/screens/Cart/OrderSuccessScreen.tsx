import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import { RootStackParamList } from '../../types';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomButton } from '../../components/CustomButton';
import { useAccessibility } from '../../context/AccessibilityContext';
import Colors from '../../theme/colors';
import { CheckCircle2, Truck, Home, Volume2, VolumeX } from 'lucide-react-native';
import { useToastStore } from '../../store/useToastStore';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderSuccess'>;

export const OrderSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId, total } = route.params;
  const { palette, highContrast } = useAccessibility();

  const [isReading, setIsReading] = useState(false);
  const reading = useRef(false);
  const showToast = useToastStore((state) => state.showToast);

  const finishReading = useCallback(() => {
    reading.current = false;
    setIsReading(false);
  }, []);

  useFocusEffect(useCallback(() => () => {
    if (reading.current) {
      finishReading();
      void Speech.stop().catch(() => {});
    }
  }, [finishReading]));

  const handleSpeechError = () => {
    finishReading();
    showToast('Não foi possível ler o pedido em voz alta.', 'info');
  };

  const toggleReading = async () => {
    try {
      if (reading.current) {
        await Speech.stop();
        finishReading();
        return;
      }

      reading.current = true;
      setIsReading(true);
      const amount = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const summary = 'Pedido de demonstração ' + orderId + ' registrado. Valor total: ' + amount + '. Nenhuma cobrança será realizada.';
      Speech.speak(summary, {
        language: 'pt-BR',
        rate: 0.98,
        onDone: finishReading,
        onStopped: finishReading,
        onError: handleSpeechError,
      });
    } catch {
      handleSpeechError();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <AccessibilityBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ícone Animado de Sucesso */}
        <View style={[styles.iconCircle, { backgroundColor: palette.success }]}>
          <CheckCircle2 size={64} color={highContrast ? '#000000' : Colors.white} />
        </View>

        <AccessibleText size="xs" weight="bold" color={Colors.successEmerald} style={styles.badge}>
          PEDIDO DE DEMONSTRAÇÃO
        </AccessibleText>

        <AccessibleText size="3xl" weight="bold" color={Colors.deepSpaceNavy} style={styles.title}>
          Pedido Confirmado!
        </AccessibleText>

        <AccessibleText size="sm" color={Colors.charcoalSlate} style={styles.subtitle}>
          Seu pedido foi registrado. Nenhuma cobrança ou entrega será realizada.
        </AccessibleText>

        {/* Card com Detalhes do Pedido */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <View style={styles.detailRow}>
            <AccessibleText size="sm" color={Colors.charcoalSlate}>
              Número do Pedido:
            </AccessibleText>
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
              #{orderId}
            </AccessibleText>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <View style={styles.detailRow}>
            <AccessibleText size="sm" color={Colors.charcoalSlate}>
              Valor Total:
            </AccessibleText>
            <AccessibleText size="lg" weight="bold" color={Colors.electricIris}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </AccessibleText>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <View
            style={[
              styles.shippingNotice,
              {
                backgroundColor: palette.surfaceSecondary,
                borderWidth: highContrast ? 1.5 : 0,
                borderColor: palette.success,
              },
            ]}
          >
            <Truck size={20} color={palette.success} />
            <View style={styles.shippingText}>
              <AccessibleText size="xs" weight="bold" color={Colors.successEmerald}>
                Entrega simulada
              </AccessibleText>
              <AccessibleText size="xs" color={Colors.charcoalSlate}>
                Os dados de entrega ficam no histórico deste pedido.
              </AccessibleText>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actions}>
          <CustomButton
            title={isReading ? 'Parar leitura do pedido' : 'Ouvir resumo do pedido'}
            onPress={toggleReading}
            variant="outline"
            icon={isReading ? <VolumeX size={20} color={palette.accent} /> : <Volume2 size={20} color={palette.accent} />}
            style={styles.mainButton}
          />
          <CustomButton
            title="Voltar ao Catálogo"
            onPress={() => navigation.popTo('MainTabs', { screen: 'HomeTab', params: { screen: 'HomeScreen', pop: true } })}
            variant="primary"
            icon={<Home size={20} color={palette.primaryContent} />}
            style={styles.mainButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successEmerald,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.successEmerald,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 28,
    shadowColor: Colors.deepSpaceNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 6,
  },
  shippingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  shippingText: {
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  mainButton: {
    width: '100%',
  },
});
