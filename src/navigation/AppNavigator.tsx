import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { TabNavigator } from './TabNavigator';
import { ProductDetailScreen } from '../screens/ProductDetail/ProductDetailScreen';
import { CartScreen } from '../screens/Cart/CartScreen';
import Colors from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cleanCanvas },
      }}
    >
      {/* Fluxo de Autenticação (Requisito Obrigatório da Atividade) */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Navegação Principal por Abas Inferiores (Bônus de Navegação Avançada) */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Fluxo Stack de Detalhe e Compra */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CartScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};
