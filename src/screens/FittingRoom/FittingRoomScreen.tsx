import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { ProductCard } from '../../components/ProductCard';
import { mockProducts } from '../../data/mockProducts';
import { useUsuarioStore } from '../../store/usuario-store';
import { useToastStore } from '../../store/useToastStore';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Product } from '../../types';
import Colors from '../../theme/colors';
import {
  Sparkles,
  Camera,
  Image as ImageIcon,
  Volume2,
  CheckCircle2,
  Trash2,
  Ruler,
} from 'lucide-react-native';

const fitOptions: { key: 'justo' | 'regular' | 'solto'; label: string; desc: string }[] = [
  { key: 'justo', label: 'Mais Justo', desc: 'Modelagem alinhada ao corpo' },
  { key: 'regular', label: 'Confortável (Padrão)', desc: 'Equilíbrio ideal sem apertar' },
  { key: 'solto', label: 'Mais Solto / Amplo', desc: 'Liberdade extra de movimento' },
];

export const FittingRoomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { fitProfile, updateFitProfile } = useUsuarioStore();
  const { showToast } = useToastStore();
  const { palette, highContrast, darkMode } = useAccessibility();

  // Hook de permissão da câmera conforme Slide PM-12
  const [cameraStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const [heightInput, setHeightInput] = useState(fitProfile.heightCm);
  const [weightInput, setWeightInput] = useState(fitProfile.weightKg);
  const [selectedFit, setSelectedFit] = useState<'justo' | 'regular' | 'solto'>(
    fitProfile.fitPreference
  );

  const handleSaveMeasurements = async () => {
    const h = parseFloat(heightInput);
    const w = parseFloat(weightInput);
    if (isNaN(h) || h < 120 || h > 230) {
      showToast('Informe uma altura válida entre 120 cm e 230 cm.', 'error');
      return;
    }
    if (isNaN(w) || w < 30 || w > 220) {
      showToast('Informe um peso válido entre 30 kg e 220 kg.', 'error');
      return;
    }

    await updateFitProfile({
      heightCm: heightInput,
      weightKg: weightInput,
      fitPreference: selectedFit,
    });
    showToast('Medidas atualizadas! Tamanho ideal recalculado.', 'success');
  };

  const handleSpeakRecommendation = async () => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
      }
      const message = `Tamanho recomendado: ${fitProfile.recommendedNumericSize} para calças e calçados, ou tamanho ${fitProfile.recommendedLetterSize} para camisetas, vestidos e casacos, com base nas suas medidas e preferência de caimento ${fitProfile.fitPreference}.`;
      Speech.speak(message, { language: 'pt-BR', rate: 0.98 });
      showToast('Reproduzindo recomendação em áudio...', 'info');
    } catch {
      showToast('Síntese de voz indisponível neste dispositivo.', 'info');
    }
  };

  // Função para abrir a Câmera Nativa seguindo exatamente o Slide PM-12
  const abrirCamera = async () => {
    try {
      if (!cameraStatus?.granted) {
        const resposta = await requestCameraPermission();
        if (!resposta.granted) {
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Permissão Necessária',
              'Precisamos de acesso à câmera para capturar sua foto no Provador Virtual.'
            );
          }
          showToast('Permissão da câmera negada.', 'error');
          return;
        }
      }

      const foto = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,
        mediaTypes: ['images'],
        quality: 0.4,
      });

      if (!foto.canceled && foto.assets && foto.assets[0]) {
        const asset = foto.assets[0];
        const uriFinal = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await updateFitProfile({ photoUri: uriFinal });
        showToast('Foto capturada com sucesso no Provador Virtual!', 'success');
      }
    } catch {
      showToast('Não foi possível abrir a câmera neste dispositivo.', 'error');
    }
  };

  // Função para abrir a Galeria seguindo exatamente o Slide PM-12
  const abrirGaleria = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('Permissão de acesso à galeria é necessária.', 'error');
        return;
      }

      const foto = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,
        allowsMultipleSelection: false,
        mediaTypes: ['images'],
        quality: 0.4,
      });

      if (!foto.canceled && foto.assets && foto.assets[0]) {
        const asset = foto.assets[0];
        const uriFinal = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await updateFitProfile({ photoUri: uriFinal });
        showToast('Imagem carregada da galeria com sucesso!', 'success');
      }
    } catch {
      showToast('Não foi possível acessar a galeria.', 'error');
    }
  };

  const compatibleProducts = useMemo(() => {
    return mockProducts.filter(
      (p) =>
        p.availableSizes.includes(fitProfile.recommendedLetterSize) ||
        p.availableSizes.includes(fitProfile.recommendedNumericSize)
    );
  }, [fitProfile.recommendedLetterSize, fitProfile.recommendedNumericSize]);

  const handleOpenProduct = (product: Product) => {
    navigation.navigate('HomeTab', {
      screen: 'ProductDetail',
      params: { product },
    });
  };

  const cardSurfaceStyle = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: highContrast ? 2 : 1,
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <AccessibleText size="xs" weight="bold" color={Colors.electricIris} style={styles.badge}>
          ASSISTENTE ANATÔMICO & CÂMERA NATIVA
        </AccessibleText>
        <AccessibleText size="2xl" weight="bold" color={Colors.deepSpaceNavy}>
          Provador Virtual
        </AccessibleText>
        <AccessibleText size="sm" color={Colors.charcoalSlate}>
          Descubra seu tamanho ideal sem esforço e teste combinações com foto.
        </AccessibleText>
      </View>

      {/* Card de Resultado Recomendado + Leitura de Voz */}
      <View
        style={[
          styles.recommendationBanner,
          (darkMode || highContrast) && {
            backgroundColor: palette.surface,
            borderColor: palette.success,
            borderWidth: highContrast ? 2.5 : 1.5,
          },
        ]}
      >
        <View style={styles.recTopRow}>
          <View style={styles.recTitleGroup}>
            <Sparkles size={20} color={palette.success} />
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Seu Tamanho Recomendado
            </AccessibleText>
          </View>
          <TouchableOpacity
            style={[
              styles.speakBtn,
              {
                backgroundColor: highContrast ? palette.primary : Colors.deepSpaceNavy,
                borderWidth: highContrast ? 2 : 0,
                borderColor: palette.borderStrong,
              },
            ]}
            onPress={handleSpeakRecommendation}
            accessibilityRole="button"
            accessibilityLabel="Ouvir tamanho recomendado em voz alta"
          >
            <Volume2 size={18} color={highContrast ? palette.primaryContent : Colors.white} />
            <AccessibleText
              size="xs"
              weight="bold"
              color={highContrast ? palette.primaryContent : Colors.white}
            >
              Ouvir
            </AccessibleText>
          </TouchableOpacity>
        </View>

        <View style={styles.sizeBoxesRow}>
          <View
            style={[
              styles.sizeResultCard,
              {
                backgroundColor: palette.surfaceSecondary,
                borderColor: palette.border,
              },
            ]}
          >
            <AccessibleText size="xs" color={Colors.charcoalSlate}>
              Letras (Camisetas/Casacos)
            </AccessibleText>
            <AccessibleText size="3xl" weight="bold" color={Colors.successEmerald}>
              {fitProfile.recommendedLetterSize}
            </AccessibleText>
          </View>

          <View
            style={[
              styles.sizeResultCard,
              {
                backgroundColor: palette.surfaceSecondary,
                borderColor: palette.border,
              },
            ]}
          >
            <AccessibleText size="xs" color={Colors.charcoalSlate}>
              Numérico (Calças/Calçados)
            </AccessibleText>
            <AccessibleText size="3xl" weight="bold" color={Colors.electricIris}>
              {fitProfile.recommendedNumericSize}
            </AccessibleText>
          </View>
        </View>

        <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.recHint}>
          ✓ Baseado em {fitProfile.heightCm} cm, {fitProfile.weightKg} kg e caimento{' '}
          {fitProfile.fitPreference}.
        </AccessibleText>
      </View>

      {/* Espelho Virtual com Câmera e Galeria (Slide PM-12) */}
      <View style={[styles.card, cardSurfaceStyle]}>
        <View style={styles.cardHeaderRow}>
          <Camera size={20} color={palette.iconAccent} />
          <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
            Espelho Virtual (Câmera / Galeria)
          </AccessibleText>
        </View>
        <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.cardDescription}>
          Tire uma foto com a câmera ou escolha da galeria para comparar o contraste das cores com seu tom de pele e estilo.
        </AccessibleText>

        {fitProfile.photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Image
              source={{ uri: fitProfile.photoUri }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <View style={styles.photoOverlayBadge}>
              <CheckCircle2 size={14} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                Tam. Ideal: {fitProfile.recommendedLetterSize} / {fitProfile.recommendedNumericSize}
              </AccessibleText>
            </View>
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={() => updateFitProfile({ photoUri: null })}
              accessibilityRole="button"
              accessibilityLabel="Remover foto do provador virtual"
            >
              <Trash2 size={16} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                Remover Foto
              </AccessibleText>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.emptyMirrorBox,
              {
                backgroundColor: palette.surfaceSecondary,
                borderColor: palette.border,
              },
            ]}
          >
            <Camera size={38} color={palette.iconPrimary} />
            <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.emptyMirrorText}>
              Nenhuma foto capturada ainda
            </AccessibleText>
          </View>
        )}

        <View style={styles.cameraButtonsRow}>
          <TouchableOpacity
            style={[
              styles.cameraBtnPrimary,
              {
                backgroundColor: palette.primary,
                borderWidth: highContrast ? 2 : 0,
                borderColor: palette.borderStrong,
              },
            ]}
            onPress={abrirCamera}
            accessibilityRole="button"
            accessibilityLabel="Tirar foto com a câmera"
          >
            <Camera size={18} color={palette.primaryContent} />
            <AccessibleText size="sm" weight="bold" color={palette.primaryContent}>
              Usar Câmera
            </AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cameraBtnSecondary,
              {
                backgroundColor: palette.surfaceSecondary,
                borderColor: palette.primary,
                borderWidth: highContrast ? 2 : 1.5,
              },
            ]}
            onPress={abrirGaleria}
            accessibilityRole="button"
            accessibilityLabel="Escolher foto da galeria"
          >
            <ImageIcon size={18} color={palette.iconAccent} />
            <AccessibleText size="sm" weight="bold" color={Colors.electricIris}>
              Abrir Galeria
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculadora de Medidas */}
      <View style={[styles.card, cardSurfaceStyle]}>
        <View style={styles.cardHeaderRow}>
          <Ruler size={20} color={palette.iconAccent} />
          <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
            Ajustar Minhas Medidas
          </AccessibleText>
        </View>

        <View style={styles.inputsGrid}>
          <View style={styles.inputHalf}>
            <CustomInput
              label="Altura (cm)"
              keyboardType="numeric"
              placeholder="Ex: 170"
              value={heightInput}
              onChangeText={setHeightInput}
            />
          </View>
          <View style={styles.inputHalf}>
            <CustomInput
              label="Peso (kg)"
              keyboardType="numeric"
              placeholder="Ex: 72"
              value={weightInput}
              onChangeText={setWeightInput}
            />
          </View>
        </View>

        <AccessibleText size="sm" weight="semiBold" color={Colors.highInkSlate} style={styles.fitLabel}>
          Preferência de Caimento Sensorial:
        </AccessibleText>

        <View style={styles.fitOptionsList}>
          {fitOptions.map((opt) => {
            const active = selectedFit === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.fitOptionCard,
                  {
                    backgroundColor: active ? palette.surfaceSecondary : palette.background,
                    borderColor: active ? palette.primary : palette.border,
                    borderWidth: active || highContrast ? 2 : 1.5,
                  },
                ]}
                onPress={() => setSelectedFit(opt.key)}
                accessibilityRole="button"
                accessibilityLabel={`${opt.label}: ${opt.desc}`}
              >
                <View style={styles.fitOptionTextWrap}>
                  <AccessibleText
                    size="sm"
                    weight="bold"
                    color={active ? Colors.electricIris : Colors.highInkSlate}
                  >
                    {opt.label}
                  </AccessibleText>
                  <AccessibleText size="xs" color={Colors.charcoalSlate}>
                    {opt.desc}
                  </AccessibleText>
                </View>
                {active && <CheckCircle2 size={20} color={palette.iconAccent} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <CustomButton
          title="Recalcular Tamanho Ideal"
          onPress={handleSaveMeasurements}
          variant="primary"
          icon={<Sparkles size={18} color={palette.primaryContent} />}
          style={styles.calcBtn}
        />
      </View>

      <View style={styles.compatibleHeader}>
        <AccessibleText size="lg" weight="bold" color={Colors.deepSpaceNavy}>
          Peças no Seu Tamanho ({compatibleProducts.length})
        </AccessibleText>
        <AccessibleText size="xs" color={Colors.charcoalSlate}>
          Listagem otimizada de produtos prontos para o seu perfil
        </AccessibleText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <AccessibilityBar />
      <FlatList
        data={compatibleProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => handleOpenProduct(item)} />
        )}
        ListHeaderComponent={renderHeader()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 14,
  },
  badge: {
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  recommendationBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  recTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.deepSpaceNavy,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 20,
  },
  sizeBoxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  sizeResultCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  recHint: {
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardDescription: {
    marginBottom: 12,
  },
  photoPreviewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoOverlayBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successEmerald,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.alertCrimson,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 40,
  },
  emptyMirrorBox: {
    height: 130,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  emptyMirrorText: {
    marginTop: 4,
  },
  cameraButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.electricIris,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  cameraBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: Colors.electricIris,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  inputHalf: {
    flex: 1,
  },
  fitLabel: {
    marginBottom: 8,
  },
  fitOptionsList: {
    gap: 8,
    marginBottom: 14,
  },
  fitOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cleanCanvas,
    minHeight: 52,
  },
  fitOptionCardActive: {
    borderColor: Colors.electricIris,
    backgroundColor: '#EEF2FF',
  },
  fitOptionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  calcBtn: {
    marginTop: 4,
  },
  compatibleHeader: {
    marginBottom: 12,
  },
});
