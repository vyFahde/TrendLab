import { getProductImage } from '../data/productImages';
import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Product } from '../types';
import { AccessibleText } from './AccessibleText';
import Colors from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import { Star, Check, ShoppingBag } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { focusMode, highContrast, darkMode, palette } = useAccessibility();
  const [imageError, setImageError] = useState(false);
  const currency = { style: 'currency', currency: 'BRL' } as const;
  const currentPrice = product.price.toLocaleString('pt-BR', currency);
  const previousPrice = product.originalPrice?.toLocaleString('pt-BR', currency);
  const priceLabel = 'Preço atual ' + currentPrice + (previousPrice ? '. Preço anterior ' + previousPrice : '');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Produto: ${product.name}. Categoria: ${product.category}. ${priceLabel}. Tamanho recomendado: ${product.recommendedSize}`}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
        },
      ]}
    >
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={[styles.image, styles.fallbackContainer, { backgroundColor: palette.surfaceSecondary }]}>
            <ShoppingBag size={36} color={palette.iconPrimary} />
          </View>
        ) : (
          <Image
            source={getProductImage(product)}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        )}

        {!focusMode && product.originalPrice && (
          <View
            style={[
              styles.promoBadge,
              highContrast && {
                backgroundColor: '#000000',
                borderWidth: 2,
                borderColor: '#FACC15',
              },
            ]}
          >
            <AccessibleText
              size="xs"
              weight="bold"
              color={highContrast ? '#FACC15' : Colors.white}
            >
              OFERTA
            </AccessibleText>
          </View>
        )}

        <View
          style={[
            styles.sizeBadge,
            highContrast && {
              backgroundColor: '#052E16',
              borderWidth: 2,
              borderColor: '#4ADE80',
            },
          ]}
        >
          <Check size={13} color={highContrast ? '#4ADE80' : Colors.white} />
          <AccessibleText
            size="xs"
            weight="bold"
            color={highContrast ? '#4ADE80' : Colors.white}
            style={styles.sizeBadgeText}
          >
            Tam: {product.recommendedSize}
          </AccessibleText>
        </View>
      </View>

      <View style={styles.details}>
        <AccessibleText size="xs" weight="semiBold" color={palette.textSecondary}>
          {product.category.toUpperCase()}
        </AccessibleText>

        <AccessibleText
          size="base"
          weight="bold"
          color={palette.textPrimary}
          numberOfLines={2}
          style={styles.name}
        >
          {product.name}
        </AccessibleText>

        {!focusMode && (
          <View style={styles.ratingRow}>
            <Star
              size={15}
              color={highContrast && darkMode ? '#FACC15' : '#D97706'}
              fill={highContrast && darkMode ? '#FACC15' : '#F59E0B'}
            />
            <AccessibleText
              size="xs"
              weight="semiBold"
              color={palette.textSecondary}
              style={styles.ratingText}
            >
              {product.rating} ({product.reviewCount} avaliações)
            </AccessibleText>
          </View>
        )}

        <AccessibleText
          size="sm"
          color={palette.textSecondary}
          numberOfLines={2}
          style={styles.fabric}
        >
          {product.fabric}
        </AccessibleText>

        <View style={styles.priceRow}>
          <AccessibleText size="lg" weight="bold" color={palette.accent}>
            {currentPrice}
          </AccessibleText>
          {previousPrice && (
            <AccessibleText size="xs" color={palette.textSecondary}>
              Antes <AccessibleText size="xs" color={palette.textSecondary} style={styles.originalPrice}>{previousPrice}</AccessibleText>
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
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
});
