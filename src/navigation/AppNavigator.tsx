import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { AccessibleText } from '../components/AccessibleText';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LoginScreen, RegisterScreen, OrderSuccessScreen } from '../screens';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const { palette } = useAccessibility();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.accent} />
        <AccessibleText color={palette.textPrimary} accessibilityLiveRegion="polite">
          Abrindo o TrendLab. Se o servidor estiver iniciando, aguarde até um minuto.
        </AccessibleText>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cleanCanvas },
      }}
    >
      {/* ROTAS PROTEGIDAS: com usuário autenticado mostra o app; sem usuário, só Login e Cadastro. */}
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
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
