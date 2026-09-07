import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LoginScreen, RegisterScreen,  ProductDetailScreen, CartScreen, OrderSuccessScreen, } from '../screens';
import { TabNavigator } from './TabNavigator';
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

      {/* Fluxo Stack de Checkout e Sucesso */}
      <Stack.Screen
        name="Checkout"
        component={CartScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
};
