import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { ProductCard } from '../../components/ProductCard';
import { useUsuarioStore } from '../../store/usuario-store';
import { useToastStore } from '../../store/useToastStore';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Product } from '../../types';
import Colors from '../../theme/colors';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  Ruler,
} from 'lucide-react-native';

const fitOptions: { key: 'justo' | 'regular' | 'solto'; label: string; desc: string }[] = [
  { key: 'justo', label: 'Mais Justo', desc: 'Modelagem alinhada ao corpo' },
  { key: 'regular', label: 'Confortável (Padrão)', desc: 'Equilíbrio ideal sem apertar' },
  { key: 'solto', label: 'Mais Solto / Amplo', desc: 'Liberdade extra de movimento' },
];

export const FittingRoomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { fitProfile, updateFitProfile, products } = useUsuarioStore();
  const { showToast } = useToastStore();
  const { palette, highContrast, darkMode } = useAccessibility();

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

  // Filtra o catálogo exibindo apenas as peças disponíveis no tamanho calculado do usuário
  const compatibleProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.availableSizes.includes(fitProfile.recommendedLetterSize) ||
        p.availableSizes.includes(fitProfile.recommendedNumericSize)
    );
  }, [products, fitProfile.recommendedLetterSize, fitProfile.recommendedNumericSize]);

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
          ASSISTENTE ANATÔMICO DE MEDIDAS
        </AccessibleText>
        <AccessibleText size="2xl" weight="bold" color={Colors.deepSpaceNavy}>
          Provador Virtual
        </AccessibleText>
        <AccessibleText size="sm" color={Colors.charcoalSlate}>
          Descubra seu tamanho ideal com base nas suas medidas e preferência de caimento.
        </AccessibleText>
      </View>

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
          Produtos disponíveis no catálogo compatíveis com as suas medidas
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
