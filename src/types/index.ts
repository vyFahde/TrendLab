export interface Product {
  id: string;
  name: string;
  category: 'Camisetas' | 'Calças' | 'Vestidos' | 'Casacos' | 'Calçados';
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  fabric: string; // Ex: '100% Algodão Penteado Toque Macio' (para acessibilidade visual)
  bulletPoints: string[]; // Tópicos diretos para facilidade de leitura (TDAH/Dislexia)
  availableSizes: string[];
  recommendedSize: string; // Recomendação inteligente do provador virtual
  colors: { name: string; hex: string }[];
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ProductDetail: { product: Product };
  Checkout: undefined;
  OrderSuccess: { orderId: string; total: number };
};

export type TabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};
