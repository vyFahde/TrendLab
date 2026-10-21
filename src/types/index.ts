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

export interface FitProfile {
  heightCm: string;
  weightKg: string;
  fitPreference: 'justo' | 'regular' | 'solto';
  recommendedLetterSize: string;
  recommendedNumericSize: string;
  photoUri?: string | null;
}

export interface OrderRecord {
  id: string;
  date: string;
  total: number;
  paymentMethod: 'pix' | 'card' | 'boleto';
  address: string;
  zipCode: string;
  receiverName: string;
  itemsCount: number;
  itemsSummary: string[];
  userEmail?: string;
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
  FittingRoomTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};
