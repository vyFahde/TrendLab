import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList, Product } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { ProductCard } from '../../components/ProductCard';
import { CustomButton } from '../../components/CustomButton';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useUsuarioStore } from '../../store/usuario-store';
import { useToastStore } from '../../store/useToastStore';
import { api } from '../../services/api';
import Colors from '../../theme/colors';
import {
  Search,
  Mic,
  Sparkles,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react-native';

const categories = ['Todas', 'Calças', 'Camisetas', 'Casacos', 'Vestidos', 'Calçados'];
const sizeFilters = ['Todos', 'P', 'M', 'G', 'GG', '38', '40', '42', '44'];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { focusMode, highContrast, darkMode, palette } = useAccessibility();
  const {
    userData,
    usuario,
    products,
    fetchProductsFromApi,
    isSyncingApi,
  } = useUsuarioStore();
  const { showToast } = useToastStore();

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('Todos');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  useEffect(() => {
    api.getProducts(selectedCategory);
  }, [selectedCategory]);

  const handleRefreshCatalog = async () => {
    await fetchProductsFromApi();
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Todas' || product.category === selectedCategory;
      const matchesSize =
        selectedSizeFilter === 'Todos' ||
        product.availableSizes.includes(selectedSizeFilter);
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.fabric.toLowerCase().includes(query) ||
        product.colors.some((c) => c.name.toLowerCase().includes(query));
      return matchesCategory && matchesSize && matchesSearch;
    });

    if (sortOrder === 'asc') {
      return [...result].sort((a, b) => a.price - b.price);
    }
    if (sortOrder === 'desc') {
      return [...result].sort((a, b) => b.price - a.price);
    }
    return result;
  }, [products, selectedCategory, selectedSizeFilter, sortOrder, searchQuery]);

  const handleVoiceSearchSimulation = () => setVoiceModalVisible(true);

  const handleClearAllFilters = () => {
    setSelectedCategory('Todas');
    setSelectedSizeFilter('Todos');
    setSortOrder('default');
    setSearchQuery('');
    showToast('Todos os filtros foram restaurados.', 'info');
  };

  const hasActiveFilters =
    selectedCategory !== 'Todas' ||
    selectedSizeFilter !== 'Todos' ||
    sortOrder !== 'default' ||
    searchQuery.trim().length > 0;

  const displayName = userData?.name || usuario || 'Visitante';

  const renderListHeader = () => (
    <View>
      <View style={styles.header}>
        <AccessibleText size="xs" weight="bold" color={palette.accent} style={styles.brandTag}>
          TRENDLAB • BEM-VINDO(A), {displayName.toUpperCase()}
        </AccessibleText>
        <AccessibleText size="2xl" weight="bold" color={palette.textPrimary}>
          Catálogo Inclusivo
        </AccessibleText>
        <AccessibleText size="sm" color={palette.textSecondary}>
          Peças selecionadas com alto contraste, descrições táteis e tamanhos inteligentes.
        </AccessibleText>
      </View>

      {/* Barra de Busca + Comando de Voz + Botão de Filtros Avançados (Modal) */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: palette.surface,
              borderColor: highContrast ? palette.border : darkMode ? '#475569' : Colors.inputBorder,
              borderWidth: highContrast ? 2.5 : 2,
            },
          ]}
        >
          <Search size={20} color={palette.iconPrimary} />
          <TextInput
            style={[styles.searchInput, { color: palette.textPrimary }]}
            placeholder="Buscar peça, tecido ou cor..."
            placeholderTextColor={palette.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Campo de busca de produtos"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearch}
              accessibilityRole="button"
              accessibilityLabel="Limpar texto da busca"
            >
              <AccessibleText size="sm" weight="bold" color={palette.textPrimary}>
                ✕
              </AccessibleText>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.voiceButton,
            highContrast && {
              backgroundColor: palette.accent,
              borderWidth: 2,
              borderColor: palette.border,
            },
          ]}
          onPress={handleVoiceSearchSimulation}
          accessibilityLabel="Abrir busca por voz simulada"
          accessibilityRole="button"
        >
          <Mic size={22} color={highContrast && darkMode ? '#000000' : Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            (selectedSizeFilter !== 'Todos' || sortOrder !== 'default') &&
              styles.filterButtonActive,
            highContrast && {
              borderWidth: 2,
              borderColor: palette.border,
            },
          ]}
          onPress={() => setFilterModalVisible(true)}
          accessibilityLabel="Abrir modal de filtros por tamanho e preço"
          accessibilityRole="button"
        >
          <SlidersHorizontal size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {!focusMode && (
        <TouchableOpacity
          style={[
            styles.bannerContainer,
            {
              backgroundColor: darkMode ? palette.surface : '#EEF2FF',
              borderColor: highContrast ? palette.border : darkMode ? '#475569' : '#C7D2FE',
              borderWidth: highContrast ? 2.5 : 1.5,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => (navigation as any).navigate('FittingRoomTab')}
          accessibilityRole="button"
          accessibilityLabel="Ir para o Provador Virtual Inteligente"
        >
          <View style={styles.bannerTopRow}>
            <View
              style={[
                styles.bannerBadge,
                highContrast && {
                  backgroundColor: palette.accent,
                },
              ]}
            >
              <Sparkles
                size={14}
                color={highContrast ? palette.accentContrastText : Colors.white}
              />
              <AccessibleText
                size="xs"
                weight="bold"
                color={highContrast ? palette.accentContrastText : Colors.white}
              >
                PROVADOR VIRTUAL INTERATIVO
              </AccessibleText>
            </View>
            <ArrowRight size={18} color={palette.iconPrimary} />
          </View>
          <AccessibleText size="base" weight="bold" color={palette.heading}>
            Recomendação inteligente de caimento
          </AccessibleText>
          <AccessibleText size="xs" color={palette.textSecondary} style={styles.bannerText}>
            Toque aqui para calcular seu tamanho ideal em todas as peças da loja.
          </AccessibleText>
        </TouchableOpacity>
      )}

      <View style={styles.categoriesSection}>
        <AccessibleText size="sm" weight="bold" color={palette.heading} style={styles.sectionTitle}>
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
                  {
                    backgroundColor: isSelected ? palette.accent : palette.surface,
                    borderColor: isSelected ? palette.accent : palette.border,
                    borderWidth: highContrast ? 2.5 : 1.5,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${cat}, ${
                  isSelected ? 'selecionada' : 'não selecionada'
                }`}
              >
                <AccessibleText
                  size="sm"
                  weight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? palette.accentContrastText : palette.textPrimary}
                >
                  {cat}
                </AccessibleText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productsHeader}>
        <View>
          <AccessibleText size="base" weight="bold" color={palette.heading}>
            Peças Disponíveis ({filteredProducts.length})
          </AccessibleText>
          {selectedSizeFilter !== 'Todos' && (
            <AccessibleText size="xs" weight="semiBold" color={palette.accent}>
              Filtro ativo: Tamanho {selectedSizeFilter}
            </AccessibleText>
          )}
        </View>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={handleClearAllFilters}
            style={styles.clearFilterButton}
            accessibilityRole="button"
            accessibilityLabel="Limpar todos os filtros ativos"
          >
            <AccessibleText size="xs" weight="bold" color={palette.coral}>
              Limpar filtros
            </AccessibleText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <AccessibleText size="base" weight="semiBold" color={palette.textSecondary}>
        Nenhum produto encontrado para sua busca.
      </AccessibleText>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleClearAllFilters}
        accessibilityRole="button"
      >
        <AccessibleText size="sm" weight="bold" color={palette.accent}>
          Restaurar Catálogo Completo
        </AccessibleText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <AccessibilityBar />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item: Product) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
          />
        )}
        ListHeaderComponent={renderListHeader()}
        ListEmptyComponent={renderEmptyState()}
        refreshing={isSyncingApi}
        onRefresh={handleRefreshCatalog}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
      />

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                borderTopWidth: highContrast ? 2.5 : 0,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AccessibleText size="lg" weight="bold" color={palette.heading}>
                Filtros Rápidos Acessíveis
              </AccessibleText>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeModalBtn}
                accessibilityRole="button"
                accessibilityLabel="Fechar janela de filtros"
              >
                <X size={22} color={palette.iconPrimary} />
              </TouchableOpacity>
            </View>

            <AccessibleText size="sm" weight="bold" color={palette.heading} style={styles.modalSectionTitle}>
              Filtrar por Tamanho:
            </AccessibleText>
            <View style={styles.modalChipsWrap}>
              {sizeFilters.map((sz) => {
                const active = selectedSizeFilter === sz;
                return (
                  <TouchableOpacity
                    key={sz}
                    style={[
                      styles.sizeChip,
                      {
                        backgroundColor: active ? palette.accent : palette.surfaceSecondary,
                        borderColor: active ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => setSelectedSizeFilter(sz)}
                    accessibilityRole="button"
                  >
                    <AccessibleText
                      size="sm"
                      weight="bold"
                      color={active ? palette.accentContrastText : palette.textPrimary}
                    >
                      {sz}
                    </AccessibleText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AccessibleText size="sm" weight="bold" color={palette.heading} style={styles.modalSectionTitle}>
              Ordenar por Preço:
            </AccessibleText>
            <View style={styles.sortRow}>
              {[
                { key: 'default', label: 'Relevância' },
                { key: 'asc', label: 'Menor Preço' },
                { key: 'desc', label: 'Maior Preço' },
              ].map((opt) => {
                const active = sortOrder === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.sortChip,
                      {
                        backgroundColor: active ? palette.accent : palette.surfaceSecondary,
                        borderColor: active ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => setSortOrder(opt.key as 'default' | 'asc' | 'desc')}
                    accessibilityRole="button"
                  >
                    <AccessibleText
                      size="xs"
                      weight="bold"
                      color={active ? palette.accentContrastText : palette.textPrimary}
                    >
                      {opt.label}
                    </AccessibleText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Aplicar Filtros"
                onPress={() => {
                  setFilterModalVisible(false);
                  showToast('Filtros aplicados ao catálogo!', 'success');
                }}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Busca por Voz (Compatível com Web e Mobile) */}
      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={[styles.modalSheet, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <AccessibleText size="lg" weight="bold" color={palette.heading}>
                Busca por voz simulada
              </AccessibleText>
              <TouchableOpacity
                onPress={() => setVoiceModalVisible(false)}
                style={styles.closeModalBtn}
                accessibilityRole="button"
                accessibilityLabel="Fechar busca por voz simulada"
              >
                <X size={22} color={palette.iconPrimary} />
              </TouchableOpacity>
            </View>
            <AccessibleText size="sm" color={palette.textSecondary} style={styles.voiceModalDesc}>
              Escolha uma frase de exemplo para buscar no catálogo. O microfone fica desligado.
            </AccessibleText>
            <View style={styles.voiceCommandsList}>
              {[
                { label: 'Calça jeans', term: 'jeans' },
                { label: 'Camiseta de algodão', term: 'camiseta' },
                { label: 'Tênis sem cadarço', term: 'tênis' },
                { label: 'Limpar busca', term: '' },
              ].map((cmd) => (
                <TouchableOpacity
                  key={cmd.label}
                  accessibilityRole="button"
                  style={[
                    styles.voiceCommandBtn,
                    {
                      backgroundColor: palette.surfaceSecondary,
                      borderColor: palette.border,
                    },
                  ]}
                  onPress={() => {
                    setSearchQuery(cmd.term);
                    setVoiceModalVisible(false);
                  }}
                >
                  <AccessibleText size="sm" weight="bold" color={palette.accent}>
                    {cmd.label}
                  </AccessibleText>
                </TouchableOpacity>
              ))}
            </View>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 14,
  },
  brandTag: {
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    backgroundColor: Colors.electricIris,
    minWidth: 50,
    minHeight: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: Colors.deepSpaceNavy,
    minWidth: 50,
    minHeight: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.warmCoral,
  },
  bannerContainer: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearFilterButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  resetButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
    marginBottom: 16,
  },
  closeModalBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSectionTitle: {
    marginBottom: 10,
    marginTop: 6,
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sizeChip: {
    minWidth: 48,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cleanCanvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sortChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cleanCanvas,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modalActions: {
    marginTop: 4,
  },
  voiceModalDesc: {
    marginBottom: 12,
  },
  voiceCommandsList: {
    gap: 10,
  },
  voiceCommandBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
});
