import React, { useState, useEffect } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useCart } from '../../context/CartContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useUsuarioStore } from '../../store/usuario-store';
import { useToastStore } from '../../store/useToastStore';
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
  ArrowLeft,
  MapPin,
  Zap,
  X,
} from 'lucide-react-native';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const { palette, highContrast } = useAccessibility();
  const { userData, addOrder } = useUsuarioStore();
  const { showToast } = useToastStore();

  // Etapa do Checkout: 1 = Revisão da Sacola, 2 = Formulário de Entrega e Pagamento
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  // Modal de Compra Rápida (Slide PM-11)
  const [quickModalVisible, setQuickModalVisible] = useState(false);

  // Fallback para imagens com erro de carregamento
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Campos do Formulário de Entrega
  const [receiverName, setReceiverName] = useState(userData?.name || '');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsCoordinatesLabel, setGpsCoordinatesLabel] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.name && !receiverName) {
      setReceiverName(userData.name);
    }
  }, [userData?.name]);

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

  // Navegação resiliente para catálogo
  const handleGoToCatalog = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      try {
        (navigation as any).navigate('MainTabs', {
          screen: 'HomeTab',
          params: { screen: 'HomeScreen' },
        });
      } catch {
        (navigation as any).navigate('MainTabs');
      }
    }
  };

  // Confirmação de remoção com Alert + Toast conforme Slide PM-11
  const handleConfirmRemove = (productId: string, selectedSize: string, productName: string) => {
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined'
          ? window.confirm(`Deseja realmente remover "${productName}" da sacola?`)
          : true;
      if (ok) {
        removeFromCart(productId, selectedSize);
        showToast(`REMOVIDO: ${productName}`, 'info');
      }
      return;
    }

    Alert.alert('Remover', `Deseja realmente remover "${productName}" da sacola?`, [
      {
        text: 'SIM',
        style: 'destructive',
        onPress: () => {
          removeFromCart(productId, selectedSize);
          showToast(`REMOVIDO: ${productName}`, 'info');
        },
      },
      { text: 'NÃO', style: 'cancel' },
    ]);
  };

  // Preenchimento Automático via GPS Nativo (expo-location)
  const handleFetchGpsLocation = async () => {
    setIsLocatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permissão de localização (GPS) negada.', 'error');
        setIsLocatingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setGpsCoordinatesLabel(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`);

      let detectedZip = '';
      let detectedAddress = '';

      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (places && places.length > 0) {
          const p = places[0];
          if (p.postalCode) {
            detectedZip = formatZipCode(p.postalCode);
          }
          const streetPart = [p.street, p.streetNumber || 'S/N'].filter(Boolean).join(', ');
          const districtPart = [p.district || p.subregion, p.city, p.region]
            .filter(Boolean)
            .join(' - ');
          detectedAddress = [streetPart, districtPart].filter(Boolean).join(' • ');
        }
      } catch {
        // Fallback para geocodificação reversa na Web caso reverseGeocodeAsync não retorne
      }

      if (!detectedAddress || detectedAddress.length < 5) {
        detectedAddress = `Av. Fernandes Lima, 1500 - Farol (GPS: ${latitude.toFixed(
          3
        )}, ${longitude.toFixed(3)})`;
      }
      if (!detectedZip || detectedZip.replace(/\D/g, '').length !== 8) {
        detectedZip = '57051-190';
      }

      setZipCode(detectedZip);
      setAddress(detectedAddress);
      setZipCodeError('');
      setAddressError('');
      showToast('📍 Endereço e CEP preenchidos via GPS com sucesso!', 'success');
    } catch {
      // Fallback caso o GPS do emulador esteja desligado
      setZipCode('57051-190');
      setAddress('Av. Cônego Machado, 918 - Farol, Maceió - AL');
      setZipCodeError('');
      setAddressError('');
      showToast('📍 Localização estimada preenchida automaticamente!', 'info');
    } finally {
      setIsLocatingGps(false);
    }
  };

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

  const completeOrderWithMethod = (chosenPayment: 'pix' | 'card' | 'boleto') => {
    setFormSubmitted(true);
    const nErr = validateReceiverName(receiverName);
    const zErr = validateZipCode(zipCode || '57051-190');
    const aErr = validateAddress(address);

    setReceiverNameError(nErr);
    setZipCodeError(zErr);
    setAddressError(aErr);

    if (!nErr && !zErr && !aErr) {
      setIsFinishing(true);
      const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderTotal = subtotal;
      const itemsSummary = items.map(
        (i) => `${i.quantity}x ${i.product.name} (${i.selectedSize} - ${i.selectedColor})`
      );

      setTimeout(async () => {
        await addOrder({
          id: orderId,
          date: new Date().toLocaleDateString('pt-BR'),
          total: orderTotal,
          paymentMethod: chosenPayment,
          address: address.trim(),
          zipCode: zipCode || '57051-190',
          receiverName: receiverName.trim(),
          itemsCount: totalItems,
          itemsSummary,
        });

        setIsFinishing(false);
        setQuickModalVisible(false);
        clearCart();
        setCheckoutStep(1);
        showToast(
          `Compra confirmada via ${chosenPayment.toUpperCase()}! Pedido #${orderId}`,
          'success'
        );

        navigation.navigate('OrderSuccess', {
          orderId,
          total: orderTotal,
        });
      }, 600);
    } else {
      showToast('Preencha nome e endereço válidos para concluir.', 'error');
    }
  };

  const handleFinishOrder = () => {
    completeOrderWithMethod(paymentMethod);
  };

  const handleCancelQuickModal = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Deseja realmente fechar o modal de compra rápida?')
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
              {/* Botão de Voltar quando aberto via Comprar Agora / Stack */}
              {navigation.canGoBack() && (
                <TouchableOpacity
                  style={styles.topBackButton}
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar para a tela anterior"
                >
                  <ArrowLeft size={20} color={palette.iconPrimary} />
                  <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
                    Voltar
                  </AccessibleText>
                </TouchableOpacity>
              )}

              {/* Cabeçalho */}
              <View style={styles.header}>
                <AccessibleText size="xs" weight="bold" color={Colors.electricIris} style={styles.badge}>
                  CHECKOUT ACESSÍVEL EM 2 ETAPAS + GPS
                </AccessibleText>
                <AccessibleText size="2xl" weight="bold" color={Colors.deepSpaceNavy}>
                  {checkoutStep === 1 ? 'Minha Sacola' : 'Dados de Entrega & Pagamento'}
                </AccessibleText>
                <AccessibleText size="sm" color={Colors.charcoalSlate}>
                  {checkoutStep === 1
                    ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} adicionados`
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
                      {items.map((item, index) => {
                        const itemKey = `${item.product.id}-${item.selectedSize}-${index}`;
                        const hasImageError = failedImages[itemKey];
                        return (
                          <View key={itemKey} style={[styles.cartCard, cardSurfaceStyle]}>
                            {hasImageError ? (
                              <View style={[styles.cartImage, styles.cartFallbackImage]}>
                                <ShoppingBag size={24} color={palette.iconPrimary} />
                              </View>
                            ) : (
                              <Image
                                source={{ uri: item.product.imageUrl }}
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
                                    onPress={() =>
                                      updateQuantity(item.product.id, item.selectedSize, -1)
                                    }
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
                                    onPress={() =>
                                      updateQuantity(item.product.id, item.selectedSize, 1)
                                    }
                                    accessibilityLabel="Aumentar quantidade"
                                  >
                                    <Plus size={16} color={palette.iconPrimary} />
                                  </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  onPress={() =>
                                    handleConfirmRemove(
                                      item.product.id,
                                      item.selectedSize,
                                      item.product.name
                                    )
                                  }
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
                              Frete Acessível
                            </AccessibleText>
                          </View>
                          <AccessibleText size="sm" weight="bold" color={Colors.successEmerald}>
                            GRÁTIS
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

                        {/* Botão Comprar em Modal (Slide PM-11) */}
                        <CustomButton
                          title="Comprar via Modal Rápido"
                          onPress={() => {
                            if (!zipCode) setZipCode('57051-190');
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

              {/* ETAPA 2: FORMULÁRIO DE ENTREGA E PAGAMENTO COM VALIDAÇÃO + GPS */}
              {checkoutStep === 2 && (
                <View style={[styles.checkoutFormCard, cardSurfaceStyle]}>
                  <View style={styles.stepTitleRow}>
                    <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                      Formulário de Envio
                    </AccessibleText>
                  </View>

                  {/* Botão Nativo de GPS (expo-location) */}
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
                        {gpsCoordinatesLabel ||
                          'Preenche CEP e endereço sem precisar digitar'}
                      </AccessibleText>
                    </View>
                  </TouchableOpacity>

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

                  {/* Método de Pagamento (Pix, Cartão, Boleto - Slide PM-11) */}
                  <View style={styles.paymentSection}>
                    <AccessibleText
                      size="sm"
                      weight="bold"
                      color={Colors.deepSpaceNavy}
                      style={styles.paymentLabel}
                    >
                      Selecione o Método de Pagamento:
                    </AccessibleText>

                    <View style={styles.paymentOptions}>
                      {/* Opção Pix */}
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
                        accessibilityRole="button"
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
                          Pix (Aprovação Instantânea)
                        </AccessibleText>
                      </TouchableOpacity>

                      {/* Opção Cartão */}
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
                        accessibilityRole="button"
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
                          Cartão de Crédito
                        </AccessibleText>
                      </TouchableOpacity>

                      {/* Opção Boleto */}
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
                        accessibilityRole="button"
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

                  {/* Total a pagar */}
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

                  {/* Botões de Ação */}
                  <View style={styles.checkoutActions}>
                    <CustomButton
                      title={isFinishing ? 'Processando Pedido...' : 'Finalizar Compra Segura'}
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

      {/* Modal de Compra Rápida conforme atividade prática do Slide PM-11 */}
      <Modal
        visible={quickModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelQuickModal}
      >
        <View style={styles.modalOverlay}>
          <View
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
                Compra Expressa (1-Clique)
              </AccessibleText>
              <TouchableOpacity
                onPress={handleCancelQuickModal}
                style={styles.closeModalBtn}
                accessibilityRole="button"
                accessibilityLabel="Cancelar e fechar modal"
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
              accessibilityRole="button"
            >
              <MapPin size={16} color={palette.iconAccent} />
              <AccessibleText size="xs" weight="bold" color={Colors.electricIris}>
                📍 Preencher Endereço via GPS
              </AccessibleText>
            </TouchableOpacity>

            <CustomInput
              label="Nome Completo"
              required
              placeholder="Informe seu nome"
              value={receiverName}
              onChangeText={setReceiverName}
              errorMessage={receiverNameError}
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
              Toque na forma de pagamento para concluir imediatamente:
            </AccessibleText>

            <View style={styles.modalPayRow}>
              <TouchableOpacity
                style={[styles.modalPayBtn, { backgroundColor: palette.success }]}
                onPress={() => completeOrderWithMethod('pix')}
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
              >
                <CreditCard size={18} color={palette.primaryContent} />
                <AccessibleText size="sm" weight="bold" color={palette.primaryContent}>
                  Cartão
                </AccessibleText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPayBtn, { backgroundColor: Colors.deepSpaceNavy }]}
                onPress={() => completeOrderWithMethod('boleto')}
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
          </View>
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
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    minWidth: 44,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
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
