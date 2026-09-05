import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList, Product } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { ProductCard } from '../../components/ProductCard';
import { mockProducts } from '../../data/mockProducts';
import { useAccessibility } from '../../context/AccessibilityContext';
import Colors from '../../theme/colors';
import { Search, Mic, Sparkles, Filter } from 'lucide-react-native';

const categories = ['Todas', 'Calças', 'Camisetas', 'Casacos', 'Vestidos', 'Calçados'];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { focusMode } = useAccessibility();

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtro de produtos
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Todas' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.fabric.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Simulação de busca por voz acessível (Fluxo Persona Teresa)
  const handleVoiceSearchSimulation = () => {
    Alert.alert(
      '🎙️ Busca por Voz Acessível',
      'Simulação de comando de voz ativo. Selecione um termo falado:',
      [
        {
          text: '"Calça jeans feminina"',
          onPress: () => setSearchQuery('jeans'),
        },
        {
          text: '"Camiseta"',
          onPress: () => setSearchQuery('camiseta'),
        },
        {
          text: 'Limpar busca',
          style: 'destructive',
          onPress: () => setSearchQuery(''),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saudação e Título Acessível */}
        <View style={styles.header}>
          <AccessibleText size="xs" weight="bold" color={Colors.electricIris} style={styles.brandTag}>
            TRENDLAB • MODA ACESSÍVEL
          </AccessibleText>
          <AccessibleText size="2xl" weight="bold" color={Colors.highInkSlate}>
            Catálogo Inclusivo
          </AccessibleText>
          <AccessibleText size="sm" color={Colors.charcoalSlate}>
            Peças selecionadas com alto contraste, descrições táteis e tamanhos inteligentes.
          </AccessibleText>
        </View>

        {/* Barra de Pesquisa com Busca por Voz (WCAG AAA) */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color={Colors.charcoalSlate} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por peça, tecido ou cor..."
              placeholderTextColor={Colors.charcoalSlate}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Campo de busca de produtos"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                <AccessibleText size="sm" weight="bold" color={Colors.charcoalSlate}>
                  ✕
                </AccessibleText>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.voiceButton}
            onPress={handleVoiceSearchSimulation}
            accessibilityLabel="Ativar busca por voz"
            accessibilityRole="button"
          >
            <Mic size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Banner Informativo (Oculto no Modo Foco para Calm UI - TDAH) */}
        {!focusMode && (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerBadge}>
              <Sparkles size={14} color={Colors.white} />
              <AccessibleText size="xs" weight="bold" color={Colors.white}>
                PROVADOR VIRTUAL ATIVO
              </AccessibleText>
            </View>
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Recomendação inteligente de caimento
            </AccessibleText>
            <AccessibleText size="xs" color={Colors.charcoalSlate} style={styles.bannerText}>
              Evite trocas com nossa análise guiada de medidas e modelagens especiais.
            </AccessibleText>
          </View>
        )}

        {/* Carrossel de Categorias de Baixa Complexidade */}
        <View style={styles.categoriesSection}>
          <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy} style={styles.sectionTitle}>
            Filtrar por Categoria:
          </AccessibleText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsList}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  accessibilityRole="button"
                  accessibilityLabel={`Categoria ${cat}, ${isSelected ? 'selecionada' : 'não selecionada'}`}
                >
                  <AccessibleText
                    size="sm"
                    weight={isSelected ? 'bold' : 'medium'}
                    color={isSelected ? Colors.white : Colors.highInkSlate}
                  >
                    {cat}
                  </AccessibleText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista de Produtos */}
        <View style={styles.productsSection}>
          <View style={styles.productsHeader}>
            <AccessibleText size="base" weight="bold" color={Colors.deepSpaceNavy}>
              Peças Disponíveis ({filteredProducts.length})
            </AccessibleText>
            {selectedCategory !== 'Todas' && (
              <TouchableOpacity onPress={() => setSelectedCategory('Todas')}>
                <AccessibleText size="xs" weight="bold" color={Colors.warmCoral}>
                  Limpar filtro
                </AccessibleText>
              </TouchableOpacity>
            )}
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AccessibleText size="base" weight="semiBold" color={Colors.charcoalSlate}>
                Nenhum produto encontrado para sua busca.
              </AccessibleText>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todas');
                }}
              >
                <AccessibleText size="sm" weight="bold" color={Colors.electricIris}>
                  Restaurar Catálogo Completo
                </AccessibleText>
              </TouchableOpacity>
            </View>
          ) : (
            filteredProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              />
            ))
          )}
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
  },
  header: {
    marginBottom: 14,
  },
  brandTag: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.highInkSlate,
    marginLeft: 8,
  },
  clearSearch: {
    padding: 6,
  },
  voiceButton: {
    backgroundColor: Colors.electricIris,
    minWidth: 52,
    minHeight: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.deepSpaceNavy,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  bannerText: {
    marginTop: 4,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  categoryChipsList: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  categoryChipSelected: {
    backgroundColor: Colors.deepSpaceNavy,
    borderColor: Colors.deepSpaceNavy,
  },
  productsSection: {
    marginTop: 6,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  resetButton: {
    marginTop: 12,
    padding: 8,
  },
});
