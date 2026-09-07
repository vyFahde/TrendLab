import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList, RootStackParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomButton } from '../../components/CustomButton';
import { useCart } from '../../context/CartContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import Colors from '../../theme/colors';
import {
  ArrowLeft,
  ZoomIn,
  Check,
  Sparkles,
  ShoppingBag,
  Zap,
  Info,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { product } = route.params;
  const rootNavigation = useNavigation<any>();
  const { addToCart } = useCart();
  const { focusMode } = useAccessibility();

  // Estados locais da peça
  const [selectedSize, setSelectedSize] = useState<string>(product.recommendedSize);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0].name);
  const [isSuperZoom, setIsSuperZoom] = useState<boolean>(false);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpeza de timeout ao desmontar a tela (Otimização de ciclo de vida)
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

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
    rootNavigation.navigate('Checkout');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navegação Superior */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a lista de produtos"
          >
            <ArrowLeft size={20} color={Colors.deepSpaceNavy} />
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
              Voltar
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Imagem do Produto com Botão de Super Zoom (Teresa - Baixa Visão) */}
        <View style={styles.imageContainer}>
          {imageError ? (
            <View style={[styles.image, styles.fallbackContainer]}>
              <ShoppingBag size={56} color={Colors.disabled} />
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.fallbackText}>
                Imagem indisponível no momento
              </AccessibleText>
            </View>
          ) : (
            <Image
              source={{ uri: product.imageUrl }}
              style={[styles.image, isSuperZoom && styles.imageSuperZoom]}
              resizeMode={isSuperZoom ? 'cover' : 'contain'}
              onError={() => setImageError(true)}
            />
          )}

          {/* Botão de Super Zoom */}
          {!imageError && (
            <TouchableOpacity
              style={[styles.zoomButton, isSuperZoom && styles.zoomButtonActive]}
              onPress={() => setIsSuperZoom(!isSuperZoom)}
              accessibilityRole="button"
              accessibilityLabel={isSuperZoom ? 'Desativar Super Zoom' : 'Ativar Super Zoom para ver textura do tecido'}
            >
              <ZoomIn size={18} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                {isSuperZoom ? 'Zoom Normal' : 'Super Zoom Tecido'}
              </AccessibleText>
            </TouchableOpacity>
          )}
        </View>

        {/* Título e Preço */}
        <View style={styles.infoCard}>
          <AccessibleText size="xs" weight="bold" color={Colors.charcoalSlate}>
            {product.category.toUpperCase()}
          </AccessibleText>

          <AccessibleText size="2xl" weight="bold" color={Colors.highInkSlate} style={styles.productTitle}>
            {product.name}
          </AccessibleText>

          <View style={styles.priceRow}>
            <AccessibleText size="3xl" weight="bold" color={Colors.electricIris}>
              {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </AccessibleText>
            {product.originalPrice && !focusMode && (
              <AccessibleText size="base" color={Colors.charcoalSlate} style={styles.originalPrice}>
                {product.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </AccessibleText>
            )}
          </View>

          {/* Banner do Provador Virtual Inteligente */}
          <View style={styles.recommenderCard}>
            <View style={styles.recommenderHeader}>
              <Sparkles size={18} color={Colors.successEmerald} />
              <AccessibleText size="sm" weight="bold" color={Colors.successEmerald}>
                Provador Virtual: Tamanho Ideal Sugerido
              </AccessibleText>
            </View>
            <AccessibleText size="sm" color={Colors.highInkSlate} style={styles.recommenderBody}>
              Com base no seu perfil anatômico e histórico de compras, o tamanho{' '}
              <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
                "{product.recommendedSize}"
              </AccessibleText>{' '}
              proporcionará o caimento ideal e sem aperto.
            </AccessibleText>
          </View>

          {/* Seleção de Tamanho */}
          <View style={styles.selectionSection}>
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy} style={styles.sectionLabel}>
              Selecione o Tamanho:
            </AccessibleText>
            <View style={styles.sizesRow}>
              {product.availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                const isIdeal = size === product.recommendedSize;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeBox,
                      isSelected && styles.sizeBoxSelected,
                      isIdeal && styles.sizeBoxIdeal,
                    ]}
                    onPress={() => setSelectedSize(size)}
                    accessibilityRole="button"
                    accessibilityLabel={`Tamanho ${size}${isIdeal ? ', tamanho recomendado para você' : ''}`}
                  >
                    <AccessibleText
                      size="base"
                      weight="bold"
                      color={isSelected ? Colors.white : Colors.highInkSlate}
                    >
                      {size}
                    </AccessibleText>
                    {isIdeal && (
                      <View style={styles.idealBadge}>
                        <AccessibleText size="xs" weight="bold" color={isSelected ? Colors.white : Colors.successEmerald}>
                          ★
                        </AccessibleText>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Seleção de Cores com Nomes Explícitos (Acessibilidade para Daltonismo) */}
          <View style={styles.selectionSection}>
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy} style={styles.sectionLabel}>
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
                      isSelected && styles.colorPillSelected,
                    ]}
                    onPress={() => setSelectedColor(c.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${c.name}, ${isSelected ? 'selecionada' : 'disponível'}`}
                  >
                    <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                    <AccessibleText
                      size="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      color={isSelected ? Colors.electricIris : Colors.highInkSlate}
                    >
                      {c.name}
                    </AccessibleText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Ficha Técnica Simplificada em Tópicos (Persona Gabriel - TDAH) */}
          <View style={styles.bulletSection}>
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy} style={styles.bulletTitle}>
              Destaques e Sensação Tátil:
            </AccessibleText>
            <View style={styles.fabricBadge}>
              <Info size={16} color={Colors.deepSpaceNavy} />
              <AccessibleText size="xs" weight="bold" color={Colors.deepSpaceNavy}>
                Tecido: {product.fabric}
              </AccessibleText>
            </View>

            {product.bulletPoints.map((point, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <AccessibleText size="sm" color={Colors.charcoalSlate} style={styles.bulletText}>
                  {point}
                </AccessibleText>
              </View>
            ))}
          </View>

          {/* Feedback Visual de Adicionado */}
          {addedFeedback && (
            <View style={styles.feedbackBanner}>
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
              icon={<ShoppingBag size={20} color={Colors.white} />}
            />

            <CustomButton
              title="Comprar Agora (1 Clique)"
              onPress={handleBuyNow}
              variant="success"
              icon={<Zap size={20} color={Colors.white} />}
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
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#E2E8F0',
    position: 'relative',
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
  imageSuperZoom: {
    transform: [{ scale: 1.4 }],
  },
  zoomButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  zoomButtonActive: {
    backgroundColor: Colors.warmCoral,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  productTitle: {
    marginVertical: 6,
  },
  priceRow: {
    flexDirection: 'row',
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
  sizeBoxSelected: {
    backgroundColor: Colors.deepSpaceNavy,
    borderColor: Colors.deepSpaceNavy,
  },
  sizeBoxIdeal: {
    borderColor: Colors.successEmerald,
    borderWidth: 2,
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.white,
  },
  colorPillSelected: {
    borderColor: Colors.electricIris,
    backgroundColor: '#EEF2FF',
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
