export interface Product {
  id: string;
  name: string;
  category: 'Camisetas' | 'Calças' | 'Vestidos' | 'Casacos' | 'Calçados';
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  fabric: string;
  bulletPoints: string[];
  availableSizes: string[];
  recommendedSize: string;
  colors: { name: string; hex: string }[];
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

// Stack interno da aba Início (mantém a Bottom Tab visível ao abrir os Detalhes)
export type HomeStackParamList = {
  HomeScreen: undefined;
  ProductDetail: { product: Product };
};

// Rotas raiz do App
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Checkout: undefined;
  OrderSuccess: { orderId: string; total: number };
};

// Rotas das Abas Inferiores
export type TabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};
