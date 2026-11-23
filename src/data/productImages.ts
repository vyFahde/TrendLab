import type { ImageSourcePropType } from 'react-native';
import type { Product } from '../types';

const photos: Record<string, Record<string, ImageSourcePropType>> = {
  'prod-1': {
    'Azul Denim Escuro': require('../../assets/catalog/jeans-azul-escuro.jpg'),
    'Preto Clássico': require('../../assets/catalog/jeans-preto.jpg'),
    'Azul Médio': require('../../assets/catalog/jeans-azul-medio.jpg'),
  },
  'prod-2': {
    'Preto Profundo': require('../../assets/catalog/camiseta-preto.jpg'),
    'Branco Neve': require('../../assets/catalog/camiseta-branco.jpg'),
    'Verde Floresta': require('../../assets/catalog/camiseta-verde-floresta.jpg'),
  },
  'prod-3': {
    'Cinza Mescla': require('../../assets/catalog/moletom-cinza.jpg'),
    'Azul Marinho': require('../../assets/catalog/moletom-marinho.jpg'),
    'Terracota': require('../../assets/catalog/moletom-terracota.jpg'),
  },
  'prod-4': {
    'Verde Oliva': require('../../assets/catalog/vestido-verde-oliva.jpg'),
    'Azul Noite': require('../../assets/catalog/vestido-azul-noite.jpg'),
  },
  'prod-5': {
    'Preto Total': require('../../assets/catalog/tenis-preto.jpg'),
    'Cinza Claro': require('../../assets/catalog/tenis-cinza-claro.jpg'),
  },
  'prod-6': {
    'Verde Sálvia': require('../../assets/catalog/jaqueta-verde-salvia.jpg'),
    'Preto Fosco': require('../../assets/catalog/jaqueta-preto.jpg'),
    'Azul Petróleo': require('../../assets/catalog/jaqueta-azul-petroleo.jpg'),
  },
};

export function hasVariantPhoto(product: Product, color: string): boolean {
  return Boolean(photos[product.id]?.[color]);
}

export function getProductImage(product: Product, color = product.colors[0]?.name): ImageSourcePropType {
  return (color && photos[product.id]?.[color]) || { uri: product.imageUrl };
}
