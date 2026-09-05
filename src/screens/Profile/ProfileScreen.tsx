import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomButton } from '../../components/CustomButton';
import { useAccessibility } from '../../context/AccessibilityContext';
import Colors from '../../theme/colors';
import {
  Sliders,
  Type,
  Sparkles,
  Contrast,
  RotateCcw,
  LogOut,
  User,
  Eye,
  Brain,
  CheckCircle2,
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Deseja encerrar sua sessão no TrendLab?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => navigation.replace('Login'),
      },
    ]);
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
              Configurações
            </AccessibleText>
            <AccessibleText size="xs" color={Colors.charcoalSlate}>
              Preferências do usuário, leitura e acessibilidade
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

        {/* Seção das Personas do Projeto (Para Apresentação Didática) */}
        <View style={styles.section}>
          <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy} style={styles.sectionMainTitle}>
            Personas do Projeto TrendLab
          </AccessibleText>

          {/* Card Teresa */}
          <View style={styles.personaCard}>
            <View style={styles.personaBadge}>
              <Eye size={16} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                Baixa Visão & Astigmatismo
              </AccessibleText>
            </View>
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Teresa Tavares (52 anos)
            </AccessibleText>
            <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.personaText}>
              • Fontes escalonáveis até 130% sem quebrar o layout{'\n'}
              • Contraste WCAG AAA (16.5:1 no cabeçalho){'\n'}
              • Super Zoom para ver texturas de tecido no Provador
            </AccessibleText>
          </View>

          {/* Card Gabriel */}
          <View style={styles.personaCard}>
            <View style={[styles.personaBadge, { backgroundColor: Colors.warmCoral }]}>
              <Brain size={16} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                TDAH & Dislexia
              </AccessibleText>
            </View>
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Gabriel Gomes (20 anos)
            </AccessibleText>
            <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.personaText}>
              • Modo Foco (Calm UI sem propagandas distrativas){'\n'}
              • Fichas de produto em tópicos objetivos (bullet points){'\n'}
              • Checkout direto em 2 etapas com Pix rápido
            </AccessibleText>
          </View>
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
  sectionMainTitle: {
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
  personaCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  personaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.deepSpaceNavy,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  personaText: {
    marginTop: 6,
    lineHeight: 18,
  },
  logoutSection: {
    marginTop: 10,
  },
});
