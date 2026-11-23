import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getProductImage, hasVariantPhoto } from '../../data/productImages';
import * as Speech from 'expo-speech';
import { HomeStackParamList, TabParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomButton } from '../../components/CustomButton';
import { useCart } from '../../context/CartContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useUsuarioStore } from '../../store/usuario-store';
import { useToastStore } from '../../store/useToastStore';
import Colors from '../../theme/colors';
import {
  ArrowLeft,
  ZoomIn,
  Check,
  Sparkles,
  ShoppingBag,
  Zap,
  Info,
  Volume2,
  VolumeX,
  Move,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetail'>;

const LENS_SIZE = 148;
const ZOOM_SCALE = 2.6;

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { product } = route.params;
  const { addToCart } = useCart();
  const { highContrast, darkMode, palette } = useAccessibility();
  const { fitProfile } = useUsuarioStore();
  const { showToast } = useToastStore();

  // Calcula o tamanho ideal dinâmico de acordo com o Provador Virtual (Zustand)
  const isNumericCategory = product.category === 'Calças' || product.category === 'Calçados';
  const candidateIdealSize = isNumericCategory
    ? fitProfile.recommendedNumericSize
    : fitProfile.recommendedLetterSize;
  const effectiveIdealSize = product.availableSizes.includes(candidateIdealSize)
    ? candidateIdealSize
    : product.recommendedSize;

  const [selectedSize, setSelectedSize] = useState<string>(effectiveIdealSize);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name ?? '');
  const imageSource = getProductImage(product, selectedColor);
  const currency = { style: 'currency', currency: 'BRL' } as const;
  const currentPrice = product.price.toLocaleString('pt-BR', currency);
  const previousPrice = product.originalPrice?.toLocaleString('pt-BR', currency);
  const hasSelectedColorPhoto = hasVariantPhoto(product, selectedColor);
  const [isSuperZoom, setIsSuperZoom] = useState<boolean>(false);
  const [isDraggingLens, setIsDraggingLens] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 320,
  });
  const [lensPos, setLensPos] = useState<{ x: number; y: number }>({ x: 180, y: 160 });

  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedSize(effectiveIdealSize);
  }, [effectiveIdealSize]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      Speech.stop().catch(() => {});
    };
  }, []);

  const clampLensPosition = (rawX: number, rawY: number) => {
    const pad = 28;
    const clampedX = Math.max(pad, Math.min(containerSize.width - pad, rawX));
    const clampedY = Math.max(pad, Math.min(containerSize.height - pad, rawY));
    return { x: clampedX, y: clampedY };
  };

  const handleImageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
      setLensPos({ x: width / 2, y: height / 2 });
    }
  };

  const handleResponderEvent = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    if (typeof locationX === 'number' && typeof locationY === 'number') {
      setLensPos(clampLensPosition(locationX, locationY));
    }
  };

  const nudgeLens = (dx: number, dy: number) => {
    setLensPos((prev) => clampLensPosition(prev.x + dx, prev.y + dy));
  };

  const handleToggleSuperZoom = () => {
    const next = !isSuperZoom;
    setIsSuperZoom(next);
    if (next) {
      setLensPos({ x: containerSize.width / 2, y: containerSize.height / 2 });
      showToast('Super Zoom ativo: arraste a lupa pelo tecido!', 'info');
    }
  };

  const handleToggleAudioDescription = async () => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking || isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }

      const colorNames = product.colors.map((c) => c.name).join(', ');
      const highlights = product.bulletPoints.join('. ');
      const description = `${product.name}, categoria ${product.category}. Preço: ${product.price.toFixed(
        2
      )} reais. Tamanho recomendado para você: ${effectiveIdealSize}, com base no seu perfil do provador virtual. Tecido: ${
        product.fabric
      }. Cores disponíveis: ${colorNames}. Destaques da peça: ${highlights}.`;

      setIsSpeaking(true);
      Speech.speak(description, {
        language: 'pt-BR',
        rate: 0.98,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
      showToast('Síntese de voz não disponível neste dispositivo.', 'info');
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    setAddedFeedback(true);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setAddedFeedback(false);
    }, 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor);
    navigation.getParent<BottomTabNavigationProp<TabParamList>>()?.navigate('CartTab');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <AccessibilityBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingLens}
      >
        <View style={styles.topNav}>
          <TouchableOpacity
            style={[
              styles.backButton,
              highContrast && {
                borderWidth: 2,
                borderColor: palette.border,
                borderRadius: 10,
              },
            ]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a lista de produtos"
          >
            <ArrowLeft size={20} color={palette.iconPrimary} />
            <AccessibleText size="sm" weight="bold" color={palette.heading}>
              Voltar
            </AccessibleText>
          </TouchableOpacity>

          {/* Botão de Audiodescrição Completa da Peça (expo-speech) */}
          <TouchableOpacity
            style={[
              styles.audioDescBtn,
              isSpeaking && styles.audioDescBtnActive,
              highContrast && {
                borderWidth: 2,
                borderColor: palette.border,
              },
            ]}
            onPress={handleToggleAudioDescription}
            accessibilityRole="button"
            accessibilityLabel={
              isSpeaking
                ? 'Parar audiodescrição da peça'
                : 'Ouvir audiodescrição completa da peça'
            }
          >
            {isSpeaking ? (
              <VolumeX size={18} color={Colors.white} />
            ) : (
              <Volume2 size={18} color={Colors.white} />
            )}
            <AccessibleText size="xs" weight="bold" color={Colors.white}>
              {isSpeaking ? 'Parar Áudio' : 'Audiodescrição'}
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Área da Imagem com Lupa Móvel de Super Zoom */}
        <View
          style={styles.imageContainer}
          onLayout={handleImageLayout}
          onStartShouldSetResponder={() => isSuperZoom}
          onMoveShouldSetResponder={() => isSuperZoom}
          onResponderGrant={(e) => {
            setIsDraggingLens(true);
            handleResponderEvent(e);
          }}
          onResponderMove={handleResponderEvent}
          onResponderRelease={() => setIsDraggingLens(false)}
          onResponderTerminate={() => setIsDraggingLens(false)}
        >
          {imageError ? (
            <View style={[styles.image, styles.fallbackContainer]}>
              <ShoppingBag size={56} color={Colors.disabled} />
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.fallbackText}>
                Imagem indisponível no momento
              </AccessibleText>
            </View>
          ) : (
            <Image
              key={selectedColor}
              source={imageSource}
              accessible
              accessibilityLabel={hasSelectedColorPhoto ? `${product.name} na cor ${selectedColor}` : `Foto de referência de ${product.name}`}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}

          {/* Lupa Móvel Interativa (Super Zoom) */}
          {!imageError && isSuperZoom && (
            <View
              pointerEvents="none"
              style={[
                styles.loupeWindow,
                {
                  left: lensPos.x - LENS_SIZE / 2,
                  top: lensPos.y - LENS_SIZE / 2,
                  borderColor: highContrast ? '#FACC15' : Colors.electricIris,
                },
              ]}
            >
              <Image
                source={imageSource}
                resizeMode="contain"
                style={{
                  position: 'absolute',
                  width: containerSize.width * ZOOM_SCALE,
                  height: containerSize.height * ZOOM_SCALE,
                  left: LENS_SIZE / 2 - lensPos.x * ZOOM_SCALE,
                  top: LENS_SIZE / 2 - lensPos.y * ZOOM_SCALE,
                }}
              />
              <View style={styles.loupeBadge}>
                <AccessibleText size="xs" weight="bold" color={Colors.white}>
                  2.6x
                </AccessibleText>
              </View>
            </View>
          )}

          {!imageError && (
            <TouchableOpacity
              style={[
                styles.zoomButton,
                isSuperZoom && styles.zoomButtonActive,
                highContrast && {
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                },
              ]}
              onPress={handleToggleSuperZoom}
              accessibilityRole="button"
              accessibilityLabel={
                isSuperZoom
                  ? 'Desativar Super Zoom'
                  : 'Ativar Super Zoom com lupa móvel sobre o tecido'
              }
            >
              <ZoomIn size={18} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                Super Zoom
              </AccessibleText>
            </TouchableOpacity>
          )}
        </View>

        {(!imageError && selectedColor) && (
          <AccessibleText size="xs" color={palette.textSecondary} style={{ paddingHorizontal: 16, marginTop: 6 }}>
            {hasSelectedColorPhoto ? `Imagem ilustrativa · ${selectedColor}` : 'Foto de referência · sem imagem específica desta cor'}
          </AccessibleText>
        )}

        {/* Controles Assistivos da Lupa quando o Super Zoom está ativo */}
        {isSuperZoom && !imageError && (
          <View
            style={[
              styles.loupeControlsBar,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.loupeHintRow}>
              <Move size={16} color={palette.iconAccent} />
              <AccessibleText size="xs" weight="bold" color={palette.textPrimary}>
                Arraste o dedo na foto para mover a lupa ou use as setas:
              </AccessibleText>
            </View>
            <View style={styles.nudgeButtonsRow}>
              <TouchableOpacity
                style={[styles.nudgeBtn, { borderColor: palette.border }]}
                onPress={() => nudgeLens(-35, 0)}
                accessibilityRole="button"
                accessibilityLabel="Mover lupa para a esquerda"
              >
                <AccessibleText size="sm" weight="bold" color={palette.textPrimary}>
                  ← Esq
                </AccessibleText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nudgeBtn, { borderColor: palette.border }]}
                onPress={() => nudgeLens(0, -35)}
                accessibilityRole="button"
                accessibilityLabel="Mover lupa para cima"
              >
                <AccessibleText size="sm" weight="bold" color={palette.textPrimary}>
                  ↑ Cima
                </AccessibleText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nudgeBtn, { borderColor: palette.border }]}
                onPress={() => nudgeLens(0, 35)}
                accessibilityRole="button"
                accessibilityLabel="Mover lupa para baixo"
              >
                <AccessibleText size="sm" weight="bold" color={palette.textPrimary}>
                  ↓ Baixo
                </AccessibleText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nudgeBtn, { borderColor: palette.border }]}
                onPress={() => nudgeLens(35, 0)}
                accessibilityRole="button"
                accessibilityLabel="Mover lupa para a direita"
              >
                <AccessibleText size="sm" weight="bold" color={palette.textPrimary}>
                  Dir →
                </AccessibleText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderWidth: palette.borderWidth,
            },
          ]}
        >
          <AccessibleText size="xs" weight="bold" color={palette.textSecondary}>
            {product.category.toUpperCase()}
          </AccessibleText>

          <AccessibleText size="2xl" weight="bold" color={palette.textPrimary} style={styles.productTitle}>
            {product.name}
          </AccessibleText>

          <View style={styles.priceRow}>
            <AccessibleText size="3xl" weight="bold" color={palette.accent}>
              {currentPrice}
            </AccessibleText>
            {previousPrice && (
              <AccessibleText size="base" color={palette.textSecondary}>
                Antes <AccessibleText size="base" color={palette.textSecondary} style={styles.originalPrice}>{previousPrice}</AccessibleText>
              </AccessibleText>
            )}
          </View>

          {/* Banner do Provador Virtual Inteligente */}
          <View
            style={[
              styles.recommenderCard,
              {
                backgroundColor: palette.successBg,
                borderColor: palette.success,
                borderWidth: highContrast ? 2.5 : 1.5,
              },
            ]}
          >
            <View style={styles.recommenderHeader}>
              <Sparkles size={18} color={palette.success} />
              <AccessibleText size="base" weight="bold" color={palette.success}>
                Provador Virtual: Tamanho Ideal Sugerido
              </AccessibleText>
            </View>
            <AccessibleText size="base" color={palette.textPrimary} style={styles.recommenderBody}>
              Com base no seu perfil anatômico ({fitProfile.heightCm}cm, {fitProfile.weightKg}kg), o tamanho{' '}
              <AccessibleText size="base" weight="bold" color={palette.heading}>
                "{effectiveIdealSize}"
              </AccessibleText>{' '}
              proporcionará o caimento ideal e sem aperto.
            </AccessibleText>
            <TouchableOpacity
              style={styles.openFittingRoomLink}
              onPress={() => navigation.getParent<BottomTabNavigationProp<TabParamList>>()?.navigate('FittingRoomTab')}
              accessibilityRole="button"
              accessibilityLabel="Abrir Provador Virtual para ajustar medidas"
            >
              <AccessibleText size="xs" weight="bold" color={palette.accent}>
                Personalizar medidas no Provador Virtual →
              </AccessibleText>
            </TouchableOpacity>
          </View>

          <View style={styles.selectionSection}>
            <AccessibleText size="sm" weight="bold" color={palette.heading} style={styles.sectionLabel}>
              Selecione o Tamanho:
            </AccessibleText>
            <View style={styles.sizesRow}>
              {product.availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                const isIdeal = size === effectiveIdealSize;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeBox,
                      {
                        backgroundColor: isSelected
                          ? palette.accent
                          : palette.surfaceSecondary,
                        borderColor: isIdeal ? palette.success : palette.border,
                        borderWidth: isIdeal || highContrast ? 2.5 : 1.5,
                      },
                    ]}
                    onPress={() => setSelectedSize(size)}
                    accessibilityRole="button"
                    accessibilityLabel={`Tamanho ${size}${
                      isIdeal ? ', tamanho recomendado para você' : ''
                    }`}
                  >
                    <AccessibleText
                      size="base"
                      weight="bold"
                      color={isSelected ? palette.accentContrastText : palette.textPrimary}
                    >
                      {size}
                    </AccessibleText>
                    {isIdeal && (
                      <View style={styles.idealBadge}>
                        <Check
                          size={11}
                          color={isSelected ? palette.accentContrastText : palette.success}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.selectionSection}>
            <AccessibleText size="sm" weight="bold" color={palette.heading} style={styles.sectionLabel}>
              Cor Selecionada: {selectedColor}
            </AccessibleText>
            <View style={styles.colorsRow}>
              {product.colors.map((c) => {
                const isSelected = selectedColor === c.name;
                return (
                  <TouchableOpacity
                    key={c.name}
                    style={[
                      styles.colorPill,
                      {
                        backgroundColor: isSelected
                          ? palette.surfaceSecondary
                          : palette.surface,
                        borderColor: isSelected ? palette.accent : palette.border,
                        borderWidth: isSelected || highContrast ? 2.5 : 1.5,
                      },
                    ]}
                    onPress={() => {
                      setImageError(false);
                      setSelectedColor(c.name);
                    }}
                    accessibilityState={{ selected: isSelected }}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${c.name}, ${
                      isSelected ? 'selecionada' : 'disponível'
                    }`}
                  >
                    <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                    <AccessibleText
                      size="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      color={isSelected ? palette.accent : palette.textPrimary}
                    >
                      {c.name}
                    </AccessibleText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.bulletSection, { borderTopColor: palette.border }]}>
            <AccessibleText size="lg" weight="bold" color={palette.heading} style={styles.bulletTitle}>
              Destaques e Sensação Tátil:
            </AccessibleText>
            <View style={[styles.fabricBadge, { backgroundColor: palette.surfaceSecondary }]}>
              <Info size={16} color={palette.iconPrimary} />
              <AccessibleText size="sm" weight="bold" color={palette.textPrimary}>
                Tecido: {product.fabric}
              </AccessibleText>
            </View>

            {product.bulletPoints.map((point, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: palette.accent }]} />
                <AccessibleText size="base" color={palette.textSecondary} style={styles.bulletText}>
                  {point}
                </AccessibleText>
              </View>
            ))}
          </View>

          {/* Feedback Visual de Adicionado */}
          {addedFeedback && (
            <View style={styles.feedbackBanner} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <Check size={20} color={Colors.white} />
              <AccessibleText size="sm" weight="bold" color={Colors.white}>
                Item adicionado à sua sacola com sucesso!
              </AccessibleText>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.actionButtons}>
            <CustomButton
              title="Adicionar à Sacola"
              onPress={handleAddToCart}
              variant="primary"
              icon={
                <ShoppingBag
                  size={20}
                  color={highContrast && darkMode ? '#000000' : Colors.white}
                />
              }
            />

            <CustomButton
              title="Comprar agora"
              onPress={handleBuyNow}
              variant="success"
              icon={
                <Zap
                  size={20}
                  color={highContrast && darkMode ? '#000000' : Colors.white}
                />
              }
              style={styles.buyNowButton}
            />
          </View>
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
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioDescBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.electricIris,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 22,
  },
  audioDescBtnActive: {
    backgroundColor: Colors.warmCoral,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    letterSpacing: 0.2,
  },
  loupeWindow: {
    position: 'absolute',
    width: LENS_SIZE,
    height: LENS_SIZE,
    borderRadius: LENS_SIZE / 2,
    borderWidth: 4,
    borderColor: Colors.electricIris,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  loupeBadge: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  loupeControlsBar: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  loupeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nudgeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nudgeBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 27, 75, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 22,
    justifyContent: 'center',
  },
  zoomButtonActive: {
    backgroundColor: Colors.warmCoral,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  productTitle: {
    marginVertical: 6,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  recommenderCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  recommenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recommenderBody: {
    lineHeight: 20,
  },
  openFittingRoomLink: {
    marginTop: 8,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
  selectionSection: {
    marginBottom: 18,
  },
  sectionLabel: {
    marginBottom: 10,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeBox: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cleanCanvas,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  idealBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  bulletSection: {
    marginVertical: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  bulletTitle: {
    marginBottom: 8,
  },
  fabricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.electricIris,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successEmerald,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    justifyContent: 'center',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  buyNowButton: {
    backgroundColor: Colors.successEmerald,
  },
});
