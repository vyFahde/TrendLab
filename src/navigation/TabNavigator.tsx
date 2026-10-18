import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from '../types';
import { CartScreen, ProfileScreen, FittingRoomScreen } from '../screens';
import { HomeStackNavigator } from './HomeStackNavigator';
import { useCart } from '../context/CartContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUsuarioStore } from '../store/usuario-store';
import { api } from '../services/api';
import Colors from '../theme/colors';
import { Home, Sparkles, ShoppingBag, Settings } from 'lucide-react-native';

const Tab = createBottomTabNavigator<TabParamList>();

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { totalItems } = useCart();
  const { highContrast, palette } = useAccessibility();
  const { fetchProductsFromApi, syncWithBackend, usuario, jwtToken } = useUsuarioStore();
  const insets = useSafeAreaInsets();

  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 10);

  return (
    <View
      role="tablist"
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: palette.tabBarBg,
          borderTopColor: highContrast ? '#FACC15' : '#312E81',
          borderTopWidth: highContrast ? 2 : 1,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tintColor = isFocused ? palette.tabBarActive : palette.tabBarInactive;

        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (route.name === 'HomeTab') {
            fetchProductsFromApi();
          } else if (route.name === 'ProfileTab') {
            syncWithBackend();
          } else if (route.name === 'CartTab') {
            api.getOrders(usuario, jwtToken);
          } else if (route.name === 'FittingRoomTab') {
            api.checkHealth();
          }

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const showCartBadge = route.name === 'CartTab' && totalItems > 0;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.75}
            style={styles.tabItem}
          >
            <View style={styles.iconWrapper}>
              {options.tabBarIcon?.({ focused: isFocused, color: tintColor, size: 22 })}
              {showCartBadge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: highContrast ? '#FACC15' : Colors.warmCoral,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: highContrast ? '#000000' : Colors.white,
                      },
                    ]}
                  >
                    {totalItems}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: tintColor,
                  fontWeight: highContrast || isFocused ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 52,
  },
  iconWrapper: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    textAlign: 'center',
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: 'bold',
  },
});

