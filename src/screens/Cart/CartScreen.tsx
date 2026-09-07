import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useCart } from '../../context/CartContext';
import Colors from '../../theme/colors';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  QrCode,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from 'lucide-react-native';

// No ambiente Web (computador), TouchableWithoutFeedback intercepta cliques do mouse e desfoca o input.
// Por isso, ativamos o fechamento de teclado por toque fora apenas em dispositivos móveis (Android/iOS).
const DismissKeyboard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (Platform.OS === 'web') {
    return children;
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();

  // Etapa do Checkout: 1 = Revisão da Sacola, 2 = Formulário de Entrega e Pagamento
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  // Fallback para imagens com erro de carregamento
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Campos do Formulário de Entrega
  const [receiverName, setReceiverName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Máscara e formatação de CEP (XXXXX-XXX)
  const formatZipCode = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 8);
    if (clean.length > 5) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return clean;
  };

  // Erros de Validação do Formulário
  const [receiverNameError, setReceiverNameError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Funções de Validação
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

  // Preenchimento rápido para apresentação (Persona Gabriel / Teresa)
  const handleAutoFillAddress = () => {
    setReceiverName('Teresa Tavares');
    setZipCode('57000-000');
    setAddress('Av. Fernandes Lima, 120 - Farol');
    setReceiverNameError('');
    setZipCodeError('');
    setAddressError('');
  };

  const handleFinishOrder = () => {
    setFormSubmitted(true);
    const nErr = validateReceiverName(receiverName);
    const zErr = validateZipCode(zipCode);
    const aErr = validateAddress(address);

    setReceiverNameError(nErr);
    setZipCodeError(zErr);
    setAddressError(aErr);

    if (!nErr && !zErr && !aErr) {
      const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderTotal = subtotal;

      clearCart();
      setCheckoutStep(1);

      // Redireciona para a tela dedicada de pedido realizado com sucesso
      navigation.navigate('OrderSuccess', {
        orderId,
        total: orderTotal,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <DismissKeyboard>
            <View>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <AccessibleText size="xs" weight="bold" color={Colors.electricIris} style={styles.badge}>
            CHECKOUT ACESSÍVEL EM 2 ETAPAS
          </AccessibleText>
          <AccessibleText size="2xl" weight="bold" color={Colors.deepSpaceNavy}>
            {checkoutStep === 1 ? 'Minha Sacola' : 'Dados de Entrega & Pagamento'}
          </AccessibleText>
          <AccessibleText size="sm" color={Colors.charcoalSlate}>
            {checkoutStep === 1
              ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} adicionados`
              : 'Preencha o endereço simplificado para finalizar seu pedido.'}
          </AccessibleText>
        </View>

        {/* Indicador de Passos */}
        <View style={styles.stepsBar}>
          <View style={[styles.stepItem, checkoutStep === 1 && styles.stepItemActive]}>
            <AccessibleText
              size="xs"
              weight="bold"
              color={checkoutStep === 1 ? Colors.white : Colors.charcoalSlate}
            >
              1. Revisar Peças
            </AccessibleText>
          </View>
          <View style={[styles.stepItem, checkoutStep === 2 && styles.stepItemActive]}>
            <AccessibleText
              size="xs"
              weight="bold"
              color={checkoutStep === 2 ? Colors.white : Colors.charcoalSlate}
            >
              2. Entrega e Pagamento
            </AccessibleText>
          </View>
        </View>

        {/* ETAPA 1: REVISÃO DOS ITENS NA SACOLA */}
        {checkoutStep === 1 && (
          <View>
            {items.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingBag size={54} color={Colors.disabled} />
                <AccessibleText
                  size="lg"
                  weight="bold"
                  color={Colors.deepSpaceNavy}
                  style={styles.emptyTitle}
                >
                  Sua sacola está vazia
                </AccessibleText>
                <AccessibleText
                  size="sm"
                  color={Colors.charcoalSlate}
                  style={styles.emptySubtitle}
                >
                  Explore nossas coleções acessíveis e encontre peças perfeitas para seu estilo.
                </AccessibleText>
                <CustomButton
                  title="Ver Produtos da Loja"
                  onPress={() => (navigation as any).navigate('HomeTab', { screen: 'HomeScreen' })}
                  variant="primary"
                  style={styles.backShopButton}
                />
              </View>
            ) : (
              <View>
                {items.map((item, index) => {
                  const itemKey = `${item.product.id}-${item.selectedSize}-${index}`;
                  const hasImageError = failedImages[itemKey];
                  return (
                    <View key={itemKey} style={styles.cartCard}>
                      {hasImageError ? (
                        <View style={[styles.cartImage, styles.cartFallbackImage]}>
                          <ShoppingBag size={24} color={Colors.disabled} />
                        </View>
                      ) : (
                        <Image
                          source={{ uri: item.product.imageUrl }}
                          style={styles.cartImage}
                          onError={() => setFailedImages((prev) => ({ ...prev, [itemKey]: true }))}
                        />
                      )}

                    <View style={styles.cartInfo}>
                      <AccessibleText size="base" weight="bold" color={Colors.highInkSlate} numberOfLines={1}>
                        {item.product.name}
                      </AccessibleText>

                      <View style={styles.tagsRow}>
                        <View style={styles.tag}>
                          <AccessibleText size="xs" weight="semiBold" color={Colors.deepSpaceNavy}>
                            Tam: {item.selectedSize}
                          </AccessibleText>
                        </View>
                        <View style={styles.tag}>
                          <AccessibleText size="xs" weight="semiBold" color={Colors.deepSpaceNavy}>
                            Cor: {item.selectedColor}
                          </AccessibleText>
                        </View>
                      </View>

                      <AccessibleText size="base" weight="bold" color={Colors.electricIris} style={styles.itemPrice}>
                        {(item.product.price * item.quantity).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </AccessibleText>

                      {/* Controles de Quantidade */}
                      <View style={styles.qtyRow}>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.product.id, item.selectedSize, -1)}
                            accessibilityLabel="Diminuir quantidade"
                          >
                            <Minus size={16} color={Colors.highInkSlate} />
                          </TouchableOpacity>

                          <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate} style={styles.qtyNumber}>
                            {item.quantity}
                          </AccessibleText>

                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.product.id, item.selectedSize, 1)}
                            accessibilityLabel="Aumentar quantidade"
                          >
                            <Plus size={16} color={Colors.highInkSlate} />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => removeFromCart(item.product.id, item.selectedSize)}
                          accessibilityLabel="Remover item da sacola"
                        >
                          <Trash2 size={18} color={Colors.alertCrimson} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}

                {/* Resumo de Valores */}
                <View style={styles.summaryCard}>
                  <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy} style={styles.summaryTitle}>
                    Resumo do Pedido
                  </AccessibleText>

                  <View style={styles.summaryRow}>
                    <AccessibleText size="sm" color={Colors.charcoalSlate}>
                      Subtotal
                    </AccessibleText>
                    <AccessibleText size="sm" weight="semiBold" color={Colors.highInkSlate}>
                      {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </AccessibleText>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.shippingTag}>
                      <Truck size={16} color={Colors.successEmerald} />
                      <AccessibleText size="xs" weight="bold" color={Colors.successEmerald}>
                        Frete Acessível
                      </AccessibleText>
                    </View>
                    <AccessibleText size="sm" weight="bold" color={Colors.successEmerald}>
                      GRÁTIS
                    </AccessibleText>
                  </View>

                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                      Total
                    </AccessibleText>
                    <AccessibleText size="xl" weight="bold" color={Colors.electricIris}>
                      {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </AccessibleText>
                  </View>

                  <CustomButton
                    title="Prosseguir para Entrega (Etapa 2)"
                    onPress={() => setCheckoutStep(2)}
                    variant="primary"
                    icon={<ArrowRight size={20} color={Colors.white} />}
                    style={styles.proceedButton}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ETAPA 2: FORMULÁRIO DE ENTREGA E PAGAMENTO COM VALIDAÇÃO */}
        {checkoutStep === 2 && (
          <View style={styles.checkoutFormCard}>
            <View style={styles.stepTitleRow}>
              <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                Formulário de Envio
              </AccessibleText>
              <TouchableOpacity onPress={handleAutoFillAddress} style={styles.autoFillButton}>
                <AccessibleText size="xs" weight="bold" color={Colors.electricIris}>
                  ⚡ Preencher Rápido (Demo)
                </AccessibleText>
              </TouchableOpacity>
            </View>

            {/* Nome do Destinatário */}
            <CustomInput
              label="Nome do Destinatário"
              required
              placeholder="Quem receberá o pacote?"
              value={receiverName}
              onChangeText={(t) => {
                setReceiverName(t);
                if (formSubmitted) setReceiverNameError(validateReceiverName(t));
              }}
              errorMessage={receiverNameError}
              isValid={Boolean(receiverName && !validateReceiverName(receiverName))}
            />

            {/* CEP */}
            <CustomInput
              label="CEP de Entrega"
              required
              placeholder="00000-000"
              keyboardType="numeric"
              maxLength={9}
              value={zipCode}
              onChangeText={(t) => {
                const formatted = formatZipCode(t);
                setZipCode(formatted);
                if (formSubmitted) setZipCodeError(validateZipCode(formatted));
              }}
              errorMessage={zipCodeError}
              isValid={Boolean(zipCode && !validateZipCode(zipCode))}
              helperText="Entrega gratuita com rastreamento por SMS e áudio."
            />

            {/* Endereço Completo */}
            <CustomInput
              label="Endereço e Número"
              required
              placeholder="Rua, número, complemento e bairro"
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                if (formSubmitted) setAddressError(validateAddress(t));
              }}
              errorMessage={addressError}
              isValid={Boolean(address && !validateAddress(address))}
            />

            {/* Método de Pagamento */}
            <View style={styles.paymentSection}>
              <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy} style={styles.paymentLabel}>
                Selecione o Método de Pagamento:
              </AccessibleText>

              <View style={styles.paymentOptions}>
                {/* Opção Pix (Direta - Persona Gabriel) */}
                <TouchableOpacity
                  style={[
                    styles.paymentOptionCard,
                    paymentMethod === 'pix' && styles.paymentOptionCardSelected,
                  ]}
                  onPress={() => setPaymentMethod('pix')}
                  accessibilityRole="button"
                >
                  <QrCode size={22} color={paymentMethod === 'pix' ? Colors.electricIris : Colors.charcoalSlate} />
                  <AccessibleText
                    size="sm"
                    weight={paymentMethod === 'pix' ? 'bold' : 'medium'}
                    color={paymentMethod === 'pix' ? Colors.electricIris : Colors.highInkSlate}
                  >
                    Pix (Aprovação Instantânea)
                  </AccessibleText>
                </TouchableOpacity>

                {/* Opção Cartão */}
                <TouchableOpacity
                  style={[
                    styles.paymentOptionCard,
                    paymentMethod === 'card' && styles.paymentOptionCardSelected,
                  ]}
                  onPress={() => setPaymentMethod('card')}
                  accessibilityRole="button"
                >
                  <CreditCard size={22} color={paymentMethod === 'card' ? Colors.electricIris : Colors.charcoalSlate} />
                  <AccessibleText
                    size="sm"
                    weight={paymentMethod === 'card' ? 'bold' : 'medium'}
                    color={paymentMethod === 'card' ? Colors.electricIris : Colors.highInkSlate}
                  >
                    Cartão de Crédito
                  </AccessibleText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total a pagar */}
            <View style={styles.totalConfirmBox}>
              <AccessibleText size="sm" color={Colors.charcoalSlate}>
                Valor Total do Pedido:
              </AccessibleText>
              <AccessibleText size="2xl" weight="bold" color={Colors.electricIris}>
                {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </AccessibleText>
            </View>

            {/* Botões de Ação */}
            <View style={styles.checkoutActions}>
              <CustomButton
                title="Finalizar Compra Segura"
                onPress={handleFinishOrder}
                variant="success"
                icon={<CheckCircle2 size={20} color={Colors.white} />}
              />

              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setCheckoutStep(1)}
              >
                <AccessibleText size="sm" weight="bold" color={Colors.charcoalSlate}>
                  ← Voltar para revisão da sacola
                </AccessibleText>
              </TouchableOpacity>
            </View>
          </View>
        )}
            </View>
          </DismissKeyboard>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
  },
  badge: {
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  stepsBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  stepItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  stepItemActive: {
    backgroundColor: Colors.deepSpaceNavy,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  backShopButton: {
    minWidth: 200,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    gap: 12,
  },
  cartImage: {
    width: 80,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cartFallbackImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartInfo: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemPrice: {
    marginVertical: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  qtyButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyNumber: {
    paddingHorizontal: 10,
  },
  deleteButton: {
    padding: 6,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 10,
  },
  summaryTitle: {
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shippingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 14,
    marginTop: 4,
  },
  proceedButton: {
    marginTop: 14,
  },
  checkoutFormCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoFillButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  paymentSection: {
    marginVertical: 12,
  },
  paymentLabel: {
    marginBottom: 8,
  },
  paymentOptions: {
    gap: 8,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.cleanCanvas,
  },
  paymentOptionCardSelected: {
    borderColor: Colors.electricIris,
    backgroundColor: '#EEF2FF',
  },
  totalConfirmBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkoutActions: {
    gap: 12,
  },
  backStepButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
