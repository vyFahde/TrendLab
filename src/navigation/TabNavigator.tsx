import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import { CartScreen, ProfileScreen, FittingRoomScreen } from '../screens';
import { HomeStackNavigator } from './HomeStackNavigator';
import { useCart } from '../context/CartContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Colors from '../theme/colors';
import { Home, Sparkles, ShoppingBag, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const { totalItems } = useCart();
  const { highContrast, palette } = useAccessibility();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.tabBarActive,
        tabBarInactiveTintColor: palette.tabBarInactive,
        tabBarStyle: {
          backgroundColor: palette.tabBarBg,
          borderTopColor: highContrast ? '#FACC15' : '#312E81',
          borderTopWidth: highContrast ? 2 : 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: highContrast ? '800' : '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Início',
          tabBarAccessibilityLabel: 'Início e Catálogo',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="FittingRoomTab"
        component={FittingRoomScreen}
        options={{
          tabBarLabel: 'Provador',
          tabBarAccessibilityLabel: 'Provador Virtual Inteligente',
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Sacola',
          tabBarAccessibilityLabel: totalItems > 0 ? `Sacola, ${totalItems} itens` : 'Sacola',
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: highContrast ? '#FACC15' : Colors.warmCoral,
            color: highContrast ? '#000000' : Colors.white,
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
          tabBarLabel: 'Minha Conta',
          tabBarAccessibilityLabel: 'Minha Conta e Configurações de Acessibilidade',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
