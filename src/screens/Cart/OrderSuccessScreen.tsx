import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomButton } from '../../components/CustomButton';
import Colors from '../../theme/colors';
import { CheckCircle2, ShoppingBag, Truck, ArrowRight, Home } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderSuccess'>;

export const OrderSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId, total } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ícone Animado de Sucesso */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={64} color={Colors.white} />
        </View>

        <AccessibleText size="xs" weight="bold" color={Colors.successEmerald} style={styles.badge}>
          PAGAMENTO APROVADO ✓
        </AccessibleText>

        <AccessibleText size="3xl" weight="bold" color={Colors.deepSpaceNavy} style={styles.title}>
          Pedido Confirmado!
        </AccessibleText>

        <AccessibleText size="sm" color={Colors.charcoalSlate} style={styles.subtitle}>
          Seu pedido foi registrado com sucesso e já está sendo preparado pela nossa equipe.
        </AccessibleText>

        {/* Card com Detalhes do Pedido */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <AccessibleText size="sm" color={Colors.charcoalSlate}>
              Número do Pedido:
            </AccessibleText>
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
              #{orderId}
            </AccessibleText>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <AccessibleText size="sm" color={Colors.charcoalSlate}>
              Valor Total:
            </AccessibleText>
            <AccessibleText size="lg" weight="bold" color={Colors.electricIris}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </AccessibleText>
          </View>

          <View style={styles.divider} />

          <View style={styles.shippingNotice}>
            <Truck size={20} color={Colors.successEmerald} />
            <View style={styles.shippingText}>
              <AccessibleText size="xs" weight="bold" color={Colors.successEmerald}>
                Frete Acessível com Rastreamento
              </AccessibleText>
              <AccessibleText size="xs" color={Colors.charcoalSlate}>
                Enviaremos atualizações por SMS e leitor de tela para o seu celular.
              </AccessibleText>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actions}>
          <CustomButton
            title="Voltar ao Catálogo (Início)"
            onPress={() => navigation.replace('MainTabs')}
            variant="primary"
            icon={<Home size={20} color={Colors.white} />}
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
  },
  mainButton: {
    width: '100%',
  },
});
