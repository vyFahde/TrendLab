import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LoginScreen, RegisterScreen, CartScreen, OrderSuccessScreen } from '../screens';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cleanCanvas },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Checkout"
            component={CartScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="OrderSuccess"
            component={OrderSuccessScreen}
            options={{ animation: 'fade' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
