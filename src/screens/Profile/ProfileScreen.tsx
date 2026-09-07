import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomButton } from '../../components/CustomButton';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../theme/colors';
import {
  Sliders,
  Type,
  Sparkles,
  Contrast,
  RotateCcw,
  LogOut,
  User,
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logoutUser } = useAuth();
  const {
    fontScale,
    increaseFont,
    decreaseFont,
    focusMode,
    toggleFocusMode,
    highContrast,
    toggleHighContrast,
    resetAccessibility,
  } = useAccessibility();

  const performLogout = async () => {
    try {
      await logoutUser();
      const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>() || navigation;
      rootNav.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.warn('Erro ao encerrar sessão:', error);
      (navigation as any).navigate('Login');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Deseja realmente encerrar sua sessão no TrendLab?') : true;
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert('Sair da Conta', 'Deseja encerrar sua sessão no TrendLab?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Usuário / Configurações */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={36} color={Colors.white} />
          </View>
          <View style={styles.userInfo}>
            <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
              {user?.name || 'Configurações'}
            </AccessibleText>
            <AccessibleText size="xs" color={Colors.charcoalSlate}>
              {user?.email || 'Preferências do usuário, leitura e acessibilidade'}
            </AccessibleText>
          </View>
        </View>

        {/* Painel Central de Preferências Acessíveis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={20} color={Colors.deepSpaceNavy} />
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Ajustes de Leitura e Foco
            </AccessibleText>
          </View>

          {/* Ajuste de Escala de Fonte */}
          <View style={styles.preferenceCard}>
            <View style={styles.prefTitleRow}>
              <Type size={20} color={Colors.electricIris} />
              <View style={styles.prefText}>
                <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate}>
                  Tamanho do Texto (Fonte)
                </AccessibleText>
                <AccessibleText size="xs" color={Colors.charcoalSlate}>
                  Atual: {Math.round(fontScale * 100)}% da escala padrão
                </AccessibleText>
              </View>
            </View>

            <View style={styles.fontStepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={decreaseFont}
                accessibilityLabel="Diminuir texto"
              >
                <AccessibleText size="base" weight="bold" color={Colors.white}>
                  A -
                </AccessibleText>
              </TouchableOpacity>

              <View style={styles.scaleValue}>
                <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
                  {fontScale.toFixed(1)}x
                </AccessibleText>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={increaseFont}
                accessibilityLabel="Aumentar texto"
              >
                <AccessibleText size="base" weight="bold" color={Colors.white}>
                  A +
                </AccessibleText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Alternador de Modo Foco (Calm UI - TDAH) */}
          <View style={styles.switchCard}>
            <View style={styles.switchInfo}>
              <View style={styles.prefTitleRow}>
                <Sparkles size={20} color={Colors.warmCoral} />
                <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate} style={styles.switchTitle}>
                  Modo Foco (Calm UI)
                </AccessibleText>
              </View>
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.switchDesc}>
                Oculta propagandas, badges piscantes e reduz sobrecarga cognitiva para TDAH e dislexia.
              </AccessibleText>
            </View>

            <Switch
              value={focusMode}
              onValueChange={toggleFocusMode}
              trackColor={{ false: '#CBD5E1', true: Colors.warmCoral }}
              thumbColor={Colors.white}
              accessibilityLabel="Ativar ou desativar Modo Foco"
            />
          </View>

          {/* Alternador de Alto Contraste AAA */}
          <View style={styles.switchCard}>
            <View style={styles.switchInfo}>
              <View style={styles.prefTitleRow}>
                <Contrast size={20} color={Colors.electricIris} />
                <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate} style={styles.switchTitle}>
                  Alto Contraste (WCAG AAA)
                </AccessibleText>
              </View>
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.switchDesc}>
                Bordas reforçadas em Deep Space Navy e cores de máxima legibilidade para baixa visão.
              </AccessibleText>
            </View>

            <Switch
              value={highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: '#CBD5E1', true: Colors.electricIris }}
              thumbColor={Colors.white}
              accessibilityLabel="Ativar ou desativar Alto Contraste AAA"
            />
          </View>

          {/* Botão de Restaurar Padrões */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetAccessibility}
            accessibilityRole="button"
          >
            <RotateCcw size={16} color={Colors.charcoalSlate} />
            <AccessibleText size="xs" weight="semiBold" color={Colors.charcoalSlate}>
              Restaurar Padrões de Acessibilidade
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Botão Sair */}
        <View style={styles.logoutSection}>
          <CustomButton
            title="Encerrar Sessão (Logout)"
            onPress={handleLogout}
            variant="outline"
            icon={<LogOut size={18} color={Colors.electricIris} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.deepSpaceNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  preferenceCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  prefTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefText: {
    flex: 1,
  },
  fontStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  stepBtn: {
    backgroundColor: Colors.electricIris,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  scaleValue: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    marginLeft: 4,
  },
  switchDesc: {
    marginTop: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  logoutSection: {
    marginTop: 10,
  },
});
