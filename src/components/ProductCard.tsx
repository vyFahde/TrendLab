import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Product } from '../types';
import { AccessibleText } from './AccessibleText';
import Colors from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import { Star, Sparkles, Check, ShoppingBag } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { focusMode, highContrast } = useAccessibility();
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Produto: ${product.name}. Categoria: ${product.category}. Preço: ${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Tamanho recomendado: ${product.recommendedSize}`}
      style={[
        styles.card,
        highContrast && styles.cardHighContrast,
      ]}
    >
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={[styles.image, styles.fallbackContainer]}>
            <ShoppingBag size={36} color={Colors.disabled} />
          </View>
        ) : (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Badge de Promoção (oculto no Modo Foco para evitar sobrecarga visual - TDAH) */}
        {!focusMode && product.originalPrice && (
          <View style={styles.promoBadge}>
            <AccessibleText size="xs" weight="bold" color={Colors.white}>
              OFERTA
            </AccessibleText>
          </View>
        )}

        {/* Badge de Tamanho Ideal com Success Emerald */}
        <View style={styles.sizeBadge}>
          <Check size={12} color={Colors.white} />
          <AccessibleText size="xs" weight="bold" color={Colors.white} style={styles.sizeBadgeText}>
            Tam: {product.recommendedSize}
          </AccessibleText>
        </View>
      </View>

      <View style={styles.details}>
        <AccessibleText size="xs" weight="semiBold" color={Colors.charcoalSlate}>
          {product.category}
        </AccessibleText>

        <AccessibleText
          size="base"
          weight="bold"
          color={Colors.highInkSlate}
          numberOfLines={2}
          style={styles.name}
        >
          {product.name}
        </AccessibleText>

        {/* Avaliação em estrelas (simplificada no Modo Foco) */}
        {!focusMode && (
          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <AccessibleText size="xs" weight="semiBold" color={Colors.charcoalSlate} style={styles.ratingText}>
              {product.rating} ({product.reviewCount})
            </AccessibleText>
          </View>
        )}

        {/* Informação rápida de tecido (Teresa - Baixa Visão) */}
        <AccessibleText
          size="xs"
          color={Colors.charcoalSlate}
          numberOfLines={1}
          style={styles.fabric}
        >
          🧵 {product.fabric}
        </AccessibleText>

        {/* Preço com alto contraste */}
        <View style={styles.priceRow}>
          <AccessibleText size="lg" weight="bold" color={Colors.electricIris}>
            {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </AccessibleText>
          {!focusMode && product.originalPrice && (
            <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.originalPrice}>
              {product.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </AccessibleText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.deepSpaceNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHighContrast: {
    borderWidth: 2,
    borderColor: Colors.deepSpaceNavy,
  },
  imageContainer: {
    width: '100%',
    height: 180,
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
  },
  promoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.warmCoral,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.successEmerald,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeBadgeText: {
    marginLeft: 2,
  },
  details: {
    padding: 14,
  },
  name: {
    marginVertical: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingText: {
    marginLeft: 4,
  },
  fabric: {
    marginTop: 2,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
});
