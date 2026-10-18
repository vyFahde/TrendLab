import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { RootStackParamList, OrderRecord } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomButton } from '../../components/CustomButton';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { useUsuarioStore } from '../../store/usuario-store';
import { useToastStore } from '../../store/useToastStore';
import Colors from '../../theme/colors';
import {
  Sliders,
  Type,
  Sparkles,
  Contrast,
  RotateCcw,
  LogOut,
  User,
  Camera,
  Image as ImageIcon,
  Wifi,
  Package,
  X,
  CheckCircle2,
  Moon,
  Sun,
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logoutUser } = useAuth();
  const { usuario, userData, avatarUri, setAvatarUri, orders } = useUsuarioStore();
  const { showToast } = useToastStore();

  const {
    fontScale,
    increaseFont,
    decreaseFont,
    focusMode,
    toggleFocusMode,
    highContrast,
    toggleHighContrast,
    darkMode,
    toggleDarkMode,
    palette,
    resetAccessibility,
  } = useAccessibility();

  // Hook de permissão da câmera conforme Slide PM-12
  const [status, requestPermission] = ImagePicker.useCameraPermissions();

  // Estado de Rede / Wi-Fi (expo-network)
  const networkState = Network.useNetworkState();
  const [deviceIp, setDeviceIp] = useState<string>('Carregando...');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    Network.getIpAddressAsync()
      .then((ip) => setDeviceIp(ip || 'Indisponível'))
      .catch(() => setDeviceIp('Indisponível'));
  }, [networkState.type, networkState.isConnected]);

  // Função para abrir Câmera conforme Slide PM-12
  const abrirCameraPerfil = async () => {
    try {
      if (!status?.granted) {
        const resposta = await requestPermission();
        if (!resposta.granted) {
          showToast('Permissão para acessar a câmera negada.', 'error');
          return;
        }
      }

      const foto = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,
        mediaTypes: ['images'],
        quality: 0.3,
      });

      if (!foto.canceled && foto.assets && foto.assets[0]) {
        const imgUri = foto.assets[0].base64
          ? 'data:image/jpg;base64,' + foto.assets[0].base64
          : foto.assets[0].uri;
        await setAvatarUri(imgUri);
        showToast('Foto de perfil atualizada com a câmera!', 'success');
      }
    } catch {
      showToast('Câmera indisponível neste ambiente.', 'error');
    }
  };

  // Função para abrir Galeria conforme Slide PM-12
  const abrirGaleriaPerfil = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast('Permissão para acessar a galeria negada.', 'error');
        return;
      }

      const foto = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,
        allowsMultipleSelection: false,
        mediaTypes: ['images'],
        quality: 0.3,
      });

      if (!foto.canceled && foto.assets && foto.assets[0]) {
        const imgUri = foto.assets[0].base64
          ? 'data:image/jpg;base64,' + foto.assets[0].base64
          : foto.assets[0].uri;
        await setAvatarUri(imgUri);
        showToast('Foto de perfil atualizada da galeria!', 'success');
      }
    } catch {
      showToast('Não foi possível abrir a galeria.', 'error');
    }
  };

  const performLogout = async () => {
    try {
      await logoutUser();
      showToast('Sessão encerrada com segurança.', 'info');
      const rootNav =
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>() || navigation;
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
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Deseja realmente encerrar sua sessão no TrendLab?')
          : true;
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

  const connectionLabel =
    networkState.type === Network.NetworkStateType.WIFI
      ? 'Wi-Fi Conectado'
      : networkState.type === Network.NetworkStateType.CELLULAR
      ? 'Dados Móveis (4G/5G)'
      : networkState.isConnected !== false
      ? 'Conectado à Internet'
      : 'Sem Conexão (Offline)';

  const cardSurfaceStyle = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: highContrast ? 2 : 1,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <AccessibilityBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Usuário com Câmera e Galeria (Slide PM-12 + Zustand PM-13) */}
        <View style={[styles.userCard, cardSurfaceStyle]}>
          <View style={styles.userTopRow}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[styles.avatarImage, { borderColor: palette.primary }]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: highContrast ? palette.primary : Colors.deepSpaceNavy,
                  },
                ]}
              >
                <User size={34} color={highContrast ? palette.primaryContent : Colors.white} />
              </View>
            )}
            <View style={styles.userInfo}>
              <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                {userData?.name || user?.name || 'Minha Conta'}
              </AccessibleText>
              <AccessibleText size="xs" color={Colors.charcoalSlate}>
                {usuario || user?.email || 'Preferências do usuário e histórico'}
              </AccessibleText>
            </View>
          </View>

          <View style={styles.avatarActionsRow}>
            <TouchableOpacity
              style={[
                styles.photoActionBtn,
                {
                  backgroundColor: palette.primary,
                  borderWidth: highContrast ? 2 : 0,
                  borderColor: palette.borderStrong,
                },
              ]}
              onPress={abrirCameraPerfil}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto de perfil com a câmera"
            >
              <Camera size={16} color={palette.primaryContent} />
              <AccessibleText size="xs" weight="bold" color={palette.primaryContent}>
                Tirar Foto
              </AccessibleText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.photoActionBtnOutline,
                {
                  backgroundColor: palette.surfaceSecondary,
                  borderColor: palette.primary,
                  borderWidth: highContrast ? 2 : 1.5,
                },
              ]}
              onPress={abrirGaleriaPerfil}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto de perfil da galeria"
            >
              <ImageIcon size={16} color={palette.iconAccent} />
              <AccessibleText size="xs" weight="bold" color={Colors.electricIris}>
                Da Galeria
              </AccessibleText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnóstico Nativo de Rede / Wi-Fi (expo-network) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wifi size={20} color={palette.iconAccent} />
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Status de Rede e Conectividade
            </AccessibleText>
          </View>

          <View style={[styles.networkCard, cardSurfaceStyle]}>
            <View style={styles.networkRow}>
              <AccessibleText size="xs" color={Colors.charcoalSlate}>
                Tipo de Conexão:
              </AccessibleText>
              <AccessibleText
                size="xs"
                weight="bold"
                color={
                  networkState.isConnected !== false
                    ? Colors.successEmerald
                    : Colors.alertCrimson
                }
              >
                ✓ {connectionLabel}
              </AccessibleText>
            </View>
            <View style={styles.networkRow}>
              <AccessibleText size="xs" color={Colors.charcoalSlate}>
                Endereço IP do Dispositivo:
              </AccessibleText>
              <AccessibleText size="xs" weight="semiBold" color={Colors.highInkSlate}>
                {deviceIp}
              </AccessibleText>
            </View>
          </View>
        </View>

        {/* Histórico de Pedidos (PDF 3.1 + Zustand) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={palette.iconAccent} />
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Histórico de Pedidos ({orders.length})
            </AccessibleText>
          </View>

          {orders.length === 0 ? (
            <View style={[styles.emptyOrdersCard, cardSurfaceStyle]}>
              <AccessibleText size="xs" color={Colors.charcoalSlate}>
                Você ainda não finalizou pedidos nesta sessão. Seus pedidos concluídos aparecerão aqui.
              </AccessibleText>
            </View>
          ) : (
            orders.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                style={[styles.orderCard, cardSurfaceStyle]}
                onPress={() => setSelectedOrder(ord)}
                accessibilityRole="button"
                accessibilityLabel={`Pedido ${ord.id}, valor ${ord.total.toFixed(
                  2
                )} reais. Toque para ver detalhes.`}
              >
                <View style={styles.orderCardHeader}>
                  <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
                    Pedido #{ord.id}
                  </AccessibleText>
                  <View
                    style={[
                      styles.orderStatusBadge,
                      (darkMode || highContrast) && {
                        backgroundColor: palette.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: palette.success,
                      },
                    ]}
                  >
                    <CheckCircle2 size={12} color={palette.success} />
                    <AccessibleText size="xs" weight="bold" color={Colors.successEmerald}>
                      Aprovado ({ord.paymentMethod.toUpperCase()})
                    </AccessibleText>
                  </View>
                </View>
                <AccessibleText size="xs" color={Colors.charcoalSlate}>
                  Data: {ord.date} • {ord.itemsCount} {ord.itemsCount === 1 ? 'peça' : 'peças'}
                </AccessibleText>
                <AccessibleText size="sm" weight="bold" color={Colors.electricIris} style={styles.orderTotalText}>
                  {ord.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </AccessibleText>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Painel Central de Preferências Acessíveis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={20} color={palette.iconAccent} />
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Ajustes de Leitura, Contraste e Tema
            </AccessibleText>
          </View>

          {/* Ajuste de Escala de Fonte */}
          <View style={[styles.preferenceCard, cardSurfaceStyle]}>
            <View style={styles.prefTitleRow}>
              <Type size={20} color={palette.iconAccent} />
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
                style={[styles.stepBtn, { backgroundColor: palette.primary }]}
                onPress={decreaseFont}
                accessibilityLabel="Diminuir texto"
              >
                <AccessibleText size="base" weight="bold" color={palette.primaryContent}>
                  A -
                </AccessibleText>
              </TouchableOpacity>

              <View style={[styles.scaleValue, { backgroundColor: palette.surfaceSecondary }]}>
                <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
                  {fontScale.toFixed(1)}x
                </AccessibleText>
              </View>

              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: palette.primary }]}
                onPress={increaseFont}
                accessibilityLabel="Aumentar texto"
              >
                <AccessibleText size="base" weight="bold" color={palette.primaryContent}>
                  A +
                </AccessibleText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modo Escuro */}
          <View style={[styles.switchCard, cardSurfaceStyle]}>
            <View style={styles.switchInfo}>
              <View style={styles.prefTitleRow}>
                {darkMode ? (
                  <Sun size={20} color={palette.iconAccent} />
                ) : (
                  <Moon size={20} color={palette.iconAccent} />
                )}
                <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate} style={styles.switchTitle}>
                  Modo Escuro (Noturno)
                </AccessibleText>
              </View>
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.switchDesc}>
                Reduz o brilho da tela com paleta escura confortável para ambientes com pouca luz.
              </AccessibleText>
            </View>

            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#CBD5E1', true: palette.primary }}
              thumbColor={Colors.white}
              accessibilityLabel="Ativar ou desativar Modo Escuro"
            />
          </View>

          {/* Modo Foco */}
          <View style={[styles.switchCard, cardSurfaceStyle]}>
            <View style={styles.switchInfo}>
              <View style={styles.prefTitleRow}>
                <Sparkles size={20} color={palette.secondary} />
                <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate} style={styles.switchTitle}>
                  Modo Foco
                </AccessibleText>
              </View>
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.switchDesc}>
                Oculta animações, badges promocionais e reduz distrações visuais.
              </AccessibleText>
            </View>

            <Switch
              value={focusMode}
              onValueChange={toggleFocusMode}
              trackColor={{ false: '#CBD5E1', true: palette.secondary }}
              thumbColor={Colors.white}
              accessibilityLabel="Ativar ou desativar Modo Foco"
            />
          </View>

          {/* Alto Contraste */}
          <View style={[styles.switchCard, cardSurfaceStyle]}>
            <View style={styles.switchInfo}>
              <View style={styles.prefTitleRow}>
                <Contrast size={20} color={palette.iconAccent} />
                <AccessibleText size="sm" weight="bold" color={Colors.highInkSlate} style={styles.switchTitle}>
                  Alto Contraste (WCAG AAA)
                </AccessibleText>
              </View>
              <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.switchDesc}>
                Bordas reforçadas, ícones destacados e cores de máxima legibilidade.
              </AccessibleText>
            </View>

            <Switch
              value={highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: '#CBD5E1', true: palette.primary }}
              thumbColor={Colors.white}
              accessibilityLabel="Ativar ou desativar Alto Contraste"
            />
          </View>

          {/* Botão de Restaurar Padrões */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              resetAccessibility();
              showToast('Padrões de acessibilidade restaurados!', 'info');
            }}
            accessibilityRole="button"
          >
            <RotateCcw size={16} color={palette.iconPrimary} />
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
            icon={<LogOut size={18} color={palette.iconAccent} />}
          />
        </View>
      </ScrollView>

      {/* Modal de Detalhes do Pedido */}
      <Modal
        visible={Boolean(selectedOrder)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
                Detalhes do Pedido #{selectedOrder?.id}
              </AccessibleText>
              <TouchableOpacity
                onPress={() => setSelectedOrder(null)}
                style={styles.closeModalBtn}
                accessibilityRole="button"
              >
                <X size={22} color={Colors.highInkSlate} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.modalBody}>
                <AccessibleText size="xs" color={Colors.charcoalSlate}>
                  Destinatário: {selectedOrder.receiverName}
                </AccessibleText>
                <AccessibleText size="xs" color={Colors.charcoalSlate}>
                  Endereço: {selectedOrder.address} (CEP: {selectedOrder.zipCode})
                </AccessibleText>
                <AccessibleText size="xs" color={Colors.charcoalSlate}>
                  Pagamento: {selectedOrder.paymentMethod.toUpperCase()} • Data:{' '}
                  {selectedOrder.date}
                </AccessibleText>

                <View style={styles.modalItemsBox}>
                  <AccessibleText size="xs" weight="bold" color={Colors.deepSpaceNavy}>
                    Itens comprados:
                  </AccessibleText>
                  {selectedOrder.itemsSummary.map((line, idx) => (
                    <AccessibleText key={idx} size="xs" color={Colors.highInkSlate}>
                      • {line}
                    </AccessibleText>
                  ))}
                </View>

                <AccessibleText size="lg" weight="bold" color={Colors.electricIris}>
                  Total:{' '}
                  {selectedOrder.total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </AccessibleText>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.deepSpaceNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.electricIris,
  },
  userInfo: {
    flex: 1,
  },
  avatarActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.electricIris,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  photoActionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: Colors.electricIris,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  networkCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyOrdersCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderTotalText: {
    marginTop: 6,
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
    minHeight: 44,
    justifyContent: 'center',
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
    minHeight: 44,
    marginTop: 4,
  },
  logoutSection: {
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeModalBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 8,
  },
  modalItemsBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    gap: 4,
  },
});
