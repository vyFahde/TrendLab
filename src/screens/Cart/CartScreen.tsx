import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getProductImage } from '../../data/productImages';
import * as Location from 'expo-location';
import { CartItem, OrderRecord, RootStackParamList, TabParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useCart } from '../../context/CartContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useUsuarioStore } from '../../store/usuario-store';
import Colors from '../../theme/colors';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  QrCode,
  FileText,
  Truck,
  CheckCircle2,
  MapPin,
  Zap,
  X,
} from 'lucide-react-native';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'CartTab'>>();
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const { palette, highContrast } = useAccessibility();
  const { userData, addOrder } = useUsuarioStore();

  // Etapa do Checkout: 1 = Revisão da Sacola, 2 = Formulário de Entrega e Pagamento
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [quickModalVisible, setQuickModalVisible] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [receiverName, setReceiverName] = useState(userData?.name || '');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const submittingOrder = useRef(false);

  useEffect(() => {
    if (userData?.name && !receiverName) {
      setReceiverName(userData.name);
    }
  }, [userData?.name]);

  // Aplica máscara de CEP no padrão XXXXX-XXX
  const formatZipCode = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 8);
    if (clean.length > 5) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return clean;
  };

  const [receiverNameError, setReceiverNameError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleGoToCatalog = () => {
    navigation.navigate('HomeTab', { screen: 'HomeScreen', pop: true });
  };

  const handleConfirmRemove = (item: CartItem) => {
    const description = `${item.product.name}, tamanho ${item.selectedSize}, ${item.selectedColor}`;
    const question = `Remover ${description} da sacola?`;
    if (Platform.OS === 'web') {
      if (window.confirm(question)) removeFromCart(item);
      return;
    }

    Alert.alert('Remover item', question, [
      { text: 'Manter item', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeFromCart(item) },
    ]);
  };

  const handleFetchGpsLocation = async () => {
    setIsLocatingGps(true);
    setGpsFeedback(null);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsFeedback({ message: 'Permissão de localização negada. Preencha o endereço e o CEP manualmente.', error: true });
        return;
      }

      const lookup = async () => {
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        return place;
      };
      const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Tempo de localização excedido.')), 12_000);
      });
      const place = await Promise.race([lookup(), deadline]);
      const detectedZip = place?.postalCode ? formatZipCode(place.postalCode) : '';
      if (!place?.street || !place.streetNumber || detectedZip.length !== 9) {
        setGpsFeedback({ message: 'O GPS não encontrou endereço e CEP completos. Preencha os campos manualmente.', error: true });
        return;
      }

      const street = [place.street, place.streetNumber].filter(Boolean).join(', ');
      const locality = [place.district, place.city, place.region].filter(Boolean).join(' - ');
      const detectedAddress = [street, locality].filter(Boolean).join(' • ');
      setZipCode(current => current === zipCode ? detectedZip : current);
      setAddress(current => current === address ? detectedAddress : current);
      setZipCodeError('');
      setAddressError('');
      setGpsFeedback({
        message: 'Localização encontrada. Confira os dados antes de continuar.',
        error: false,
      });
    } catch {
      setGpsFeedback({ message: 'Não foi possível localizar seu endereço. Preencha o endereço e o CEP manualmente.', error: true });
    } finally {
      if (timeout) clearTimeout(timeout);
      setIsLocatingGps(false);
    }
  };

  const gpsNotice = gpsFeedback && (
    <AccessibleText size="sm" color={gpsFeedback.error ? palette.danger : palette.textSecondary} accessibilityLiveRegion="polite">
      {gpsFeedback.message}
    </AccessibleText>
  );

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

  // Finaliza a compra: valida o formulário e chama addOrder -> POST /api/pedidos (CRUD - Create).
  const completeOrderWithMethod = async (chosenPayment: OrderRecord['paymentMethod']) => {
    if (submittingOrder.current || !items.length) return;
    setOrderError(null);
    setFormSubmitted(true);
    const nameError = validateReceiverName(receiverName);
    const cepError = validateZipCode(zipCode);
    const streetError = validateAddress(address);
    setReceiverNameError(nameError);
    setZipCodeError(cepError);
    setAddressError(streetError);
    if (nameError || cepError || streetError) return;

    submittingOrder.current = true;
    setIsFinishing(true);
    const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;
    const total = subtotal;
    try {
      await addOrder({
        id: orderId,
        date: new Date().toLocaleDateString('pt-BR'),
        total,
        paymentMethod: chosenPayment,
        address: address.trim(),
        zipCode,
        receiverName: receiverName.trim(),
        itemsCount: totalItems,
        itemsSummary: items.map(item => `${item.quantity}x ${item.product.name} (${item.selectedSize} - ${item.selectedColor})`),
      });
      setQuickModalVisible(false);
      clearCart();
      setCheckoutStep(1);
      setFormSubmitted(false);
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('OrderSuccess', { orderId, total });
    } catch {
      setOrderError('O servidor não confirmou o pedido. Verifique o histórico antes de tentar novamente.');
    } finally {
      submittingOrder.current = false;
      setIsFinishing(false);
    }
  };

  const orderNotice = orderError && (
    <AccessibleText size="sm" color={palette.danger} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      {orderError}
    </AccessibleText>
  );

  const handleFinishOrder = () => {
    completeOrderWithMethod(paymentMethod);
  };

  const handleCancelQuickModal = () => {
    if (submittingOrder.current) return;
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Deseja realmente fechar a compra rápida?')
          : true;
      if (confirmed) setQuickModalVisible(false);
      return;
    }

    Alert.alert('Cancelar Compra', 'Deseja fechar a janela de compra rápida?', [
      { text: 'Continuar comprando', style: 'cancel' },
      {
        text: 'SIM, Fechar',
        style: 'destructive',
        onPress: () => setQuickModalVisible(false),
      },
    ]);
  };

  const cardSurfaceStyle = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: highContrast ? 2 : 1,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <AccessibilityBar />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
              {/* Cabeçalho */}
              <View style={styles.header}>
                <AccessibleText size="xs" weight="bold" color={Colors.electricIris} style={styles.badge}>
                  Etapa {checkoutStep} de 2
                </AccessibleText>
                <AccessibleText size="2xl" weight="bold" color={Colors.deepSpaceNavy}>
                  {checkoutStep === 1 ? 'Minha Sacola' : 'Dados de Entrega & Pagamento'}
                </AccessibleText>
                <AccessibleText size="sm" color={Colors.charcoalSlate}>
                  {checkoutStep === 1
                    ? (totalItems === 1 ? '1 item adicionado' : `${totalItems} itens adicionados`)
                    : 'Preencha ou use o GPS para localizar seu endereço automaticamente.'}
                </AccessibleText>
              </View>

              {/* Indicador de Passos */}
              <View
                style={[
                  styles.stepsBar,
                  {
                    backgroundColor: palette.surfaceSecondary,
                    borderWidth: highContrast ? 1.5 : 0,
                    borderColor: palette.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.stepItem,
                    checkoutStep === 1 && {
                      backgroundColor: palette.primary,
                    },
                  ]}
                  onPress={() => setCheckoutStep(1)}
                  accessibilityRole="button"
                >
                  <AccessibleText
                    size="xs"
                    weight="bold"
                    color={checkoutStep === 1 ? palette.primaryContent : Colors.charcoalSlate}
                  >
                    1. Revisar Peças
                  </AccessibleText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.stepItem,
                    checkoutStep === 2 && {
                      backgroundColor: palette.primary,
                    },
                  ]}
                  onPress={() => {
                    if (items.length > 0) setCheckoutStep(2);
                  }}
                  accessibilityRole="button"
                >
                  <AccessibleText
                    size="xs"
                    weight="bold"
                    color={checkoutStep === 2 ? palette.primaryContent : Colors.charcoalSlate}
                  >
                    2. Entrega e Pagamento
                  </AccessibleText>
                </TouchableOpacity>
              </View>

              {/* ETAPA 1: REVISÃO DOS ITENS NA SACOLA */}
              {checkoutStep === 1 && (
                <View>
                  {items.length === 0 ? (
                    <View style={[styles.emptyCart, cardSurfaceStyle]}>
                      <ShoppingBag size={54} color={palette.iconPrimary} />
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
                        onPress={handleGoToCatalog}
                        variant="primary"
                        style={styles.backShopButton}
                      />
                    </View>
                  ) : (
                    <View>
                      {items.map((item) => {
                        const itemKey = JSON.stringify([item.product.id, item.selectedSize, item.selectedColor]);
                        const hasImageError = failedImages[itemKey];
                        return (
                          <View key={itemKey} style={[styles.cartCard, cardSurfaceStyle]}>
                            {hasImageError ? (
                              <View style={[styles.cartImage, styles.cartFallbackImage]}>
                                <ShoppingBag size={24} color={palette.iconPrimary} />
                              </View>
                            ) : (
                              <Image
                                source={getProductImage(item.product, item.selectedColor)}
                                resizeMode="contain"
                                style={styles.cartImage}
                                onError={() =>
                                  setFailedImages((prev) => ({ ...prev, [itemKey]: true }))
                                }
                              />
                            )}

                            <View style={styles.cartInfo}>
                              <AccessibleText
                                size="base"
                                weight="bold"
                                color={Colors.highInkSlate}
                                numberOfLines={1}
                              >
                                {item.product.name}
                              </AccessibleText>

                              <View style={styles.tagsRow}>
                                <View
                                  style={[
                                    styles.tag,
                                    { backgroundColor: palette.surfaceSecondary },
                                  ]}
                                >
                                  <AccessibleText
                                    size="xs"
                                    weight="semiBold"
                                    color={Colors.deepSpaceNavy}
                                  >
                                    Tam: {item.selectedSize}
                                  </AccessibleText>
                                </View>
                                <View
                                  style={[
                                    styles.tag,
                                    { backgroundColor: palette.surfaceSecondary },
                                  ]}
                                >
                                  <AccessibleText
                                    size="xs"
                                    weight="semiBold"
                                    color={Colors.deepSpaceNavy}
                                  >
                                    Cor: {item.selectedColor}
                                  </AccessibleText>
                                </View>
                              </View>

                              <AccessibleText
                                size="base"
                                weight="bold"
                                color={Colors.electricIris}
                                style={styles.itemPrice}
                              >
                                {(item.product.price * item.quantity).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </AccessibleText>

                              {/* Controles de Quantidade */}
                              <View style={styles.qtyRow}>
                                <View
                                  style={[
                                    styles.qtyControls,
                                    {
                                      backgroundColor: palette.surfaceSecondary,
                                      borderWidth: highContrast ? 1.5 : 0,
                                      borderColor: palette.border,
                                    },
                                  ]}
                                >
                                  <TouchableOpacity
                                    style={styles.qtyButton}
                                    onPress={() => item.quantity === 1 ? handleConfirmRemove(item) : updateQuantity(item, -1)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Diminuir quantidade"
                                  >
                                    <Minus size={16} color={palette.iconPrimary} />
                                  </TouchableOpacity>

                                  <AccessibleText
                                    size="sm"
                                    weight="bold"
                                    color={Colors.highInkSlate}
                                    style={styles.qtyNumber}
                                  >
                                    {item.quantity}
                                  </AccessibleText>

                                  <TouchableOpacity
                                    style={styles.qtyButton}
                                    onPress={() => updateQuantity(item, 1)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Aumentar quantidade"
                                  >
                                    <Plus size={16} color={palette.iconPrimary} />
                                  </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  onPress={() => handleConfirmRemove(item)}
                                  accessibilityRole="button"
                                  accessibilityLabel="Remover item da sacola"
                                >
                                  <Trash2 size={18} color={palette.danger} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}

                      {/* Resumo de Valores */}
                      <View style={[styles.summaryCard, cardSurfaceStyle]}>
                        <AccessibleText
                          size="base"
                          weight="bold"
                          color={Colors.deepSpaceNavy}
                          style={styles.summaryTitle}
                        >
                          Resumo do Pedido
                        </AccessibleText>

                        <View style={styles.summaryRow}>
                          <AccessibleText size="sm" color={Colors.charcoalSlate}>
                            Subtotal
                          </AccessibleText>
                          <AccessibleText size="sm" weight="semiBold" color={Colors.highInkSlate}>
                            {subtotal.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </AccessibleText>
                        </View>

                        <View style={styles.summaryRow}>
                          <View style={styles.shippingTag}>
                            <Truck size={16} color={palette.success} />
                            <AccessibleText size="xs" weight="bold" color={Colors.successEmerald}>
                              Entrega de demonstração
                            </AccessibleText>
                          </View>
                          <AccessibleText size="sm" weight="bold" color={Colors.successEmerald}>
                            Simulada
                          </AccessibleText>
                        </View>

                        <View
                          style={[
                            styles.summaryRow,
                            styles.totalRow,
                            { borderTopColor: palette.border },
                          ]}
                        >
                          <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                            Total
                          </AccessibleText>
                          <AccessibleText size="xl" weight="bold" color={Colors.electricIris}>
                            {subtotal.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </AccessibleText>
                        </View>

                        <CustomButton
                          title="Prosseguir para Entrega (Etapa 2)"
                          onPress={() => setCheckoutStep(2)}
                          variant="primary"
                          icon={<ArrowRight size={20} color={palette.primaryContent} />}
                          style={styles.proceedButton}
                        />

                        <CustomButton
                          title="Compra rápida"
                          onPress={() => {
                            setOrderError(null);
                            setQuickModalVisible(true);
                          }}
                          variant="secondary"
                          icon={<Zap size={18} color={highContrast ? '#000000' : Colors.white} />}
                          style={styles.quickModalTrigger}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Etapa 2: Formulário de entrega e pagamento */}
              {checkoutStep === 2 && (
                <View style={[styles.checkoutFormCard, cardSurfaceStyle]}>
                  <View style={styles.stepTitleRow}>
                    <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                      Formulário de Envio
                    </AccessibleText>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.gpsButton,
                      {
                        backgroundColor: palette.surfaceSecondary,
                        borderColor: palette.primary,
                        borderWidth: highContrast ? 2 : 1.5,
                      },
                    ]}
                    onPress={handleFetchGpsLocation}
                    disabled={isLocatingGps}
                    accessibilityRole="button"
                    accessibilityLabel="Preencher CEP e endereço automaticamente usando GPS atual"
                  >
                    {isLocatingGps ? (
                      <ActivityIndicator color={palette.iconAccent} size="small" />
                    ) : (
                      <MapPin size={20} color={palette.iconAccent} />
                    )}
                    <View style={styles.gpsTextContainer}>
                      <AccessibleText size="sm" weight="bold" color={Colors.electricIris}>
                        {isLocatingGps
                          ? 'Obtendo localização via GPS...'
                          : 'Usar Minha Localização Atual (GPS)'}
                      </AccessibleText>
                      <AccessibleText size="xs" color={Colors.charcoalSlate}>
                        Preenche CEP e endereço quando disponíveis.
                      </AccessibleText>
                    </View>
                  </TouchableOpacity>
                  {gpsNotice}

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
                    helperText="Digite os oito dígitos do CEP."
                  />

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

                  <View style={styles.paymentSection}>
                    <AccessibleText
                      size="sm"
                      weight="bold"
                      color={Colors.deepSpaceNavy}
                      style={styles.paymentLabel}
                    >
                      Forma de pagamento simulada
                    </AccessibleText>

                    <AccessibleText size="xs" color={palette.textSecondary}>
                      Nenhuma cobrança será feita neste pedido de demonstração.
                    </AccessibleText>
                    <View style={styles.paymentOptions} accessibilityRole="radiogroup" accessibilityLabel="Forma de pagamento simulada">
                      <TouchableOpacity
                        style={[
                          styles.paymentOptionCard,
                          {
                            backgroundColor:
                              paymentMethod === 'pix'
                                ? palette.surfaceSecondary
                                : palette.background,
                            borderColor:
                              paymentMethod === 'pix' ? palette.primary : palette.border,
                            borderWidth: paymentMethod === 'pix' || highContrast ? 2 : 1.5,
                          },
                        ]}
                        onPress={() => setPaymentMethod('pix')}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: paymentMethod === 'pix' }}
                        aria-checked={paymentMethod === 'pix'}
                      >
                        <QrCode
                          size={22}
                          color={
                            paymentMethod === 'pix' ? palette.iconAccent : palette.iconPrimary
                          }
                        />
                        <AccessibleText
                          size="sm"
                          weight={paymentMethod === 'pix' ? 'bold' : 'medium'}
                          color={
                            paymentMethod === 'pix' ? Colors.electricIris : Colors.highInkSlate
                          }
                        >
                          Pix
                        </AccessibleText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentOptionCard,
                          {
                            backgroundColor:
                              paymentMethod === 'card'
                                ? palette.surfaceSecondary
                                : palette.background,
                            borderColor:
                              paymentMethod === 'card' ? palette.primary : palette.border,
                            borderWidth: paymentMethod === 'card' || highContrast ? 2 : 1.5,
                          },
                        ]}
                        onPress={() => setPaymentMethod('card')}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: paymentMethod === 'card' }}
                        aria-checked={paymentMethod === 'card'}
                      >
                        <CreditCard
                          size={22}
                          color={
                            paymentMethod === 'card' ? palette.iconAccent : palette.iconPrimary
                          }
                        />
                        <AccessibleText
                          size="sm"
                          weight={paymentMethod === 'card' ? 'bold' : 'medium'}
                          color={
                            paymentMethod === 'card' ? Colors.electricIris : Colors.highInkSlate
                          }
                        >
                          Cartão de crédito
                        </AccessibleText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentOptionCard,
                          {
                            backgroundColor:
                              paymentMethod === 'boleto'
                                ? palette.surfaceSecondary
                                : palette.background,
                            borderColor:
                              paymentMethod === 'boleto' ? palette.primary : palette.border,
                            borderWidth: paymentMethod === 'boleto' || highContrast ? 2 : 1.5,
                          },
                        ]}
                        onPress={() => setPaymentMethod('boleto')}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: paymentMethod === 'boleto' }}
                        aria-checked={paymentMethod === 'boleto'}
                      >
                        <FileText
                          size={22}
                          color={
                            paymentMethod === 'boleto'
                              ? palette.iconAccent
                              : palette.iconPrimary
                          }
                        />
                        <AccessibleText
                          size="sm"
                          weight={paymentMethod === 'boleto' ? 'bold' : 'medium'}
                          color={
                            paymentMethod === 'boleto' ? Colors.electricIris : Colors.highInkSlate
                          }
                        >
                          Boleto Bancário Acessível
                        </AccessibleText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.totalConfirmBox,
                      {
                        backgroundColor: palette.surfaceSecondary,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <AccessibleText size="sm" color={Colors.charcoalSlate}>
                      Valor Total do Pedido:
                    </AccessibleText>
                    <AccessibleText size="2xl" weight="bold" color={Colors.electricIris}>
                      {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </AccessibleText>
                  </View>

                  {orderNotice}
                  <View style={styles.checkoutActions}>
                    <CustomButton
                      title={isFinishing ? 'Processando Pedido...' : 'Registrar pedido de teste'}
                      onPress={handleFinishOrder}
                      loading={isFinishing}
                      variant="success"
                      icon={<CheckCircle2 size={20} color={highContrast ? '#000000' : Colors.white} />}
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
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={quickModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelQuickModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            accessibilityViewIsModal
            style={[
              styles.modalSheet,
              {
                backgroundColor: palette.surface,
                borderTopWidth: highContrast ? 2 : 0,
                borderColor: palette.borderStrong,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                Compra rápida
              </AccessibleText>
              <TouchableOpacity
                onPress={handleCancelQuickModal}
                style={styles.closeModalBtn}
                accessibilityRole="button"
                accessibilityLabel="Fechar compra rápida"
              >
                <X size={22} color={palette.iconPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.gpsButtonCompact,
                {
                  backgroundColor: palette.surfaceSecondary,
                  borderColor: palette.primary,
                },
              ]}
              onPress={handleFetchGpsLocation}
              disabled={isLocatingGps}
              accessibilityRole="button"
            >
              <MapPin size={16} color={palette.iconAccent} />
              <AccessibleText size="xs" weight="bold" color={Colors.electricIris}>
                {isLocatingGps ? 'Obtendo localização…' : 'Preencher endereço via GPS'}
              </AccessibleText>
            </TouchableOpacity>
            {gpsNotice}

            <CustomInput
              label="Nome Completo"
              required
              placeholder="Informe seu nome"
              value={receiverName}
              onChangeText={setReceiverName}
              errorMessage={receiverNameError}
            />

            <CustomInput
              label="CEP de entrega"
              required
              placeholder="00000-000"
              keyboardType="numeric"
              maxLength={9}
              value={zipCode}
              onChangeText={value => setZipCode(formatZipCode(value))}
              errorMessage={zipCodeError}
            />

            <CustomInput
              label="Endereço de Entrega"
              required
              placeholder="Rua, número e bairro"
              value={address}
              onChangeText={setAddress}
              errorMessage={addressError}
            />

            <AccessibleText
              size="xs"
              weight="bold"
              color={Colors.deepSpaceNavy}
              style={styles.modalPayLabel}
            >
              Escolha uma forma de pagamento simulada. Nenhuma cobrança será feita.
            </AccessibleText>

            {orderNotice}
            <View style={styles.modalPayRow}>
              <TouchableOpacity
                style={[styles.modalPayBtn, { backgroundColor: palette.success }]}
                onPress={() => completeOrderWithMethod('pix')}
                disabled={isFinishing}
              >
                <QrCode size={18} color={highContrast ? '#000000' : Colors.white} />
                <AccessibleText
                  size="sm"
                  weight="bold"
                  color={highContrast ? '#000000' : Colors.white}
                >
                  Pix
                </AccessibleText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPayBtn, { backgroundColor: palette.primary }]}
                onPress={() => completeOrderWithMethod('card')}
                disabled={isFinishing}
              >
                <CreditCard size={18} color={palette.primaryContent} />
                <AccessibleText size="sm" weight="bold" color={palette.primaryContent}>
                  Cartão
                </AccessibleText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPayBtn, { backgroundColor: Colors.deepSpaceNavy }]}
                onPress={() => completeOrderWithMethod('boleto')}
                disabled={isFinishing}
              >
                <FileText size={18} color={Colors.white} />
                <AccessibleText size="sm" weight="bold" color={Colors.white}>
                  Boleto
                </AccessibleText>
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Cancelar Compra"
              onPress={handleCancelQuickModal}
              variant="outline"
              style={styles.cancelModalBtn}
            />
          </ScrollView>
        </View>
      </Modal>
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
    paddingVertical: 10,
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
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyNumber: {
    paddingHorizontal: 8,
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  quickModalTrigger: {
    marginTop: 10,
  },
  checkoutFormCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  stepTitleRow: {
    marginBottom: 12,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: Colors.electricIris,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    minHeight: 54,
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.electricIris,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 44,
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
    minHeight: 52,
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
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeModalBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPayLabel: {
    marginBottom: 8,
    marginTop: 4,
  },
  modalPayRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modalPayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  cancelModalBtn: {
    marginTop: 2,
  },
});
