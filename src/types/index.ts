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
