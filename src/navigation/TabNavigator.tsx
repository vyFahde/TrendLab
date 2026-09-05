import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { CartScreen } from '../screens/Cart/CartScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { useCart } from '../context/CartContext';
import Colors from '../theme/colors';
import { Home, ShoppingBag, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#A5B4FC', // Roxo suave de alto contraste contra Navy
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: Colors.deepSpaceNavy,
          borderTopColor: '#312E81',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarAccessibilityLabel: 'Aba Início: Catálogo de produtos inclusivos',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Sacola',
          tabBarAccessibilityLabel: `Aba Sacola: ${totalItems} itens no carrinho`,
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.warmCoral,
            color: Colors.white,
            fontWeight: 'bold',
            fontSize: 11,
          },
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Configurações',
          tabBarAccessibilityLabel: 'Aba Configurações: Ajustes do aplicativo e acessibilidade',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
