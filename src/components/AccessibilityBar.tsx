import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import * as Network from 'expo-network';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUsuarioStore } from '../store/usuario-store';
import { useToastStore } from '../store/useToastStore';
import { AccessibleText } from './AccessibleText';
import Colors from '../theme/colors';
import {
  EyeOff,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Contrast,
} from 'lucide-react-native';

export const AccessibilityBar: React.FC = () => {
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
    quickBarExpanded,
    toggleQuickBar,
  } = useAccessibility();
  const { fitProfile } = useUsuarioStore();
  const { showToast } = useToastStore();

  const networkState = Network.useNetworkState();
  const isOnline = networkState.isConnected !== false;
  const isWifi = networkState.type === Network.NetworkStateType.WIFI;

  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleSpeech = async () => {
    try {
      const currentlySpeaking = await Speech.isSpeakingAsync();
      if (currentlySpeaking || isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }

      const summary = `TrendLab Moda Acessível. Escala de texto em ${Math.round(
        fontScale * 100
      )} por cento. Modo foco ${focusMode ? 'ativado' : 'desativado'}. Alto contraste ${
        highContrast ? 'ativado' : 'desativado'
      }. Modo escuro ${
        darkMode ? 'ativado' : 'desativado'
      }. Seu tamanho recomendado no provador virtual é ${
        fitProfile.recommendedLetterSize
      } ou numérico ${fitProfile.recommendedNumericSize}.`;

      setIsSpeaking(true);
      Speech.speak(summary, {
        language: 'pt-BR',
        rate: 0.98,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
      showToast('Leitor de voz não disponível neste dispositivo.', 'info');
    }
  };

  const handleNetworkCheck = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const ip = await Network.getIpAddressAsync().catch(() => 'Indisponível');
      const connLabel =
        state.type === Network.NetworkStateType.WIFI
          ? 'Wi-Fi'
          : state.type === Network.NetworkStateType.CELLULAR
          ? 'Dados Móveis'
          : state.isConnected
          ? 'Rede Conectada'
          : 'Offline';
      showToast(
        `Status: ${connLabel} (${state.isConnected ? 'Online' : 'Sem conexão'}) • IP: ${ip}`,
        state.isConnected ? 'info' : 'error'
      );
    } catch {
      showToast(
        isOnline ? 'Conexão de rede ativa.' : 'Dispositivo sem conexão no momento.',
        isOnline ? 'info' : 'error'
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        darkMode && styles.containerDark,
        highContrast && styles.containerHighContrast,
      ]}
    >
      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.titleToggle}
          onPress={toggleQuickBar}
          accessibilityRole="button"
          accessibilityLabel={quickBarExpanded ? 'Recolher acessibilidade rápida' : 'Expandir acessibilidade rápida'}
          accessibilityState={{ expanded: quickBarExpanded }}
          aria-expanded={quickBarExpanded}
        >
          <SlidersHorizontal size={14} color={highContrast ? '#FACC15' : Colors.white} />
          <AccessibleText
            size="xs"
            weight="bold"
            color={highContrast ? '#FACC15' : Colors.white}
            style={styles.barTitle}
          >
            Acessibilidade Rápida
          </AccessibleText>
          {quickBarExpanded ? (
            <ChevronUp size={16} color={highContrast ? '#FACC15' : Colors.white} />
          ) : (
            <ChevronDown size={16} color={highContrast ? '#FACC15' : Colors.white} />
          )}
        </TouchableOpacity>

        {/* Indicador Nativo de Rede / Wi-Fi (expo-network) */}
        <TouchableOpacity
          style={[
            styles.networkBadge,
            !isOnline && styles.networkBadgeOffline,
            highContrast && styles.highContrastPillBorder,
          ]}
          onPress={handleNetworkCheck}
          accessibilityRole="button"
          accessibilityLabel={`Status da rede: ${
            isOnline ? (isWifi ? 'Conectado via Wi-Fi' : 'Online') : 'Offline'
          }. Toque para detalhes.`}
        >
          {isOnline ? (
            <Wifi size={13} color="#4ADE80" />
          ) : (
            <WifiOff size={13} color="#FCA5A5" />
          )}
          <AccessibleText size="xs" weight="semiBold" color={Colors.white}>
            {isOnline ? (isWifi ? 'Wi-Fi' : 'Online') : 'Offline'}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      {quickBarExpanded && (
        <View style={styles.controlsRow}>
          {/* Controle de Fonte (A- / A+) */}
          <View style={[styles.fontControls, highContrast && styles.highContrastPillBorder]}>
            <TouchableOpacity
              style={styles.pillButton}
              onPress={decreaseFont}
              accessibilityLabel="Diminuir tamanho da fonte"
              accessibilityRole="button"
            >
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                A-
              </AccessibleText>
            </TouchableOpacity>

            <View style={styles.scaleIndicator}>
              <AccessibleText size="xs" weight="bold" color={highContrast ? '#FACC15' : Colors.white}>
                {Math.round(fontScale * 100)}%
              </AccessibleText>
            </View>

            <TouchableOpacity
              style={styles.pillButton}
              onPress={increaseFont}
              accessibilityLabel="Aumentar tamanho da fonte"
              accessibilityRole="button"
            >
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                A+
              </AccessibleText>
            </TouchableOpacity>
          </View>

          {/* Modo Foco */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              focusMode && styles.toggleButtonActive,
              highContrast && styles.highContrastPillBorder,
            ]}
            onPress={toggleFocusMode}
            accessibilityLabel="Alternar Modo Foco para reduzir distrações visuais"
            accessibilityRole="button"
          >
            {focusMode ? (
              <Sparkles size={13} color={Colors.white} />
            ) : (
              <EyeOff size={13} color={Colors.white} />
            )}
            <AccessibleText size="xs" weight="semiBold" color={Colors.white}>
              {focusMode ? 'Foco' : 'Foco'}
            </AccessibleText>
          </TouchableOpacity>

          {/* Alto Contraste AAA */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              highContrast && styles.toggleButtonHighContrastActive,
              highContrast && styles.highContrastPillBorder,
            ]}
            onPress={toggleHighContrast}
            accessibilityLabel="Alternar alto contraste"
            accessibilityRole="button"
            accessibilityState={{ selected: highContrast }}
            aria-pressed={highContrast}
          >
            <Contrast size={13} color={highContrast ? '#000000' : Colors.white} />
            <AccessibleText
              size="xs"
              weight="bold"
              color={highContrast ? '#000000' : Colors.white}
            >
              AAA
            </AccessibleText>
          </TouchableOpacity>

          {/* Modo Escuro */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              darkMode && styles.toggleButtonDarkActive,
              highContrast && styles.highContrastPillBorder,
            ]}
            onPress={toggleDarkMode}
            accessibilityLabel={darkMode ? 'Desativar Modo Escuro' : 'Ativar Modo Escuro'}
            accessibilityRole="button"
          >
            {darkMode ? (
              <Sun size={14} color="#FACC15" />
            ) : (
              <Moon size={14} color={Colors.white} />
            )}
          </TouchableOpacity>

          {/* Atalho para Leitor de Áudio Nativo (expo-speech) */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isSpeaking && styles.toggleButtonSpeechActive,
              highContrast && styles.highContrastPillBorder,
            ]}
            onPress={handleToggleSpeech}
            accessibilityLabel={
              isSpeaking
                ? 'Parar leitura em voz alta'
                : 'Ativar leitor de áudio nativo para resumo de acessibilidade'
            }
            accessibilityRole="button"
          >
            {isSpeaking ? (
              <VolumeX size={14} color={Colors.white} />
            ) : (
              <Volume2 size={14} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.deepSpaceNavy,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#312E81',
  },
  containerDark: {
    backgroundColor: '#090D16',
    borderBottomColor: '#334155',
  },
  containerHighContrast: {
    backgroundColor: '#000000',
    borderBottomWidth: 2,
    borderBottomColor: '#FACC15',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleToggle: {
    minHeight: 44,
    flex: 1,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barTitle: {
    flexShrink: 1,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  networkBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  networkBadgeOffline: {
    backgroundColor: Colors.alertCrimson,
  },
  highContrastPillBorder: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  controlsRow: {
    paddingTop: 4,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 5,
  },
  fontControls: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 2,
  },
  pillButton: {
    minWidth: 32,
    minHeight: 34,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleIndicator: {
    paddingHorizontal: 3,
  },
  toggleButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    minHeight: 36,
    minWidth: 36,
    borderRadius: 8,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.warmCoral,
  },
  toggleButtonHighContrastActive: {
    backgroundColor: '#FACC15',
    borderColor: '#000000',
  },
  toggleButtonDarkActive: {
    backgroundColor: '#312E81',
  },
  toggleButtonSpeechActive: {
    backgroundColor: Colors.successEmerald,
  },
});
