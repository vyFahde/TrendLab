import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AccessibleToast } from './src/components/AccessibleToast';

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 500;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <CartProvider>
            <View style={[styles.outerRoot, isDesktopWeb && styles.desktopWebBackdrop]}>
              <View style={[styles.appWrapper, isDesktopWeb && styles.mobilePhoneFrame]}>
                <NavigationContainer>
                  <StatusBar style="light" />
                  <AppNavigator />
                  <AccessibleToast />
                </NavigationContainer>
              </View>
            </View>
          </CartProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerRoot: {
    flex: 1,
  },
  desktopWebBackdrop: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  appWrapper: {
    flex: 1,
    width: '100%',
  },
  mobilePhoneFrame: {
    maxWidth: 412,
    maxHeight: 892,
    width: '100%',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
});
