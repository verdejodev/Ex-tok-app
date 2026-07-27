import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { apiFetch, getBaseUrl } from '../lib/api';
import { Equipment, EquipmentStatus, EquipmentType } from '../lib/types';
import { COLORS, STATUS_DOT, STATUS_LABELS as STATUS_LABELS_MAP, TYPE_ICONS, TYPE_LABELS } from '../lib/colors';
import { EquipmentCard } from '../components/EquipmentCard';

const STATUSES: (EquipmentStatus | 'Todas')[] = [
  'Todas', 'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
];

const STATUS_LABELS: Record<string, string> = {
  'Todas': 'Todas',
  ...STATUS_LABELS_MAP,
};

const TYPES: (EquipmentType | 'Todos')[] = [
  'Todos', 'Computer', 'Notebook', 'Printer', 'Label Maker', 'Network', 'Other'
];

export default function HomeScreen() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<EquipmentStatus[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<EquipmentType[]>([]);
  const [sortByPageCount, setSortByPageCount] = useState<'none' | 'desc' | 'asc'>('none');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      let url = '/equipments';
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (params.toString()) url += '?' + params.toString();

      const [data, base] = await Promise.all([
        apiFetch<Equipment[]>(url),
        getBaseUrl()
      ]);
      setEquipments(data);
      setBaseUrl(base);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredEquipments = equipments.filter(e => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(e.type);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(e.status);
    return matchesType && matchesStatus;
  });

  const sortedAndFilteredEquipments = [...filteredEquipments].sort((a, b) => {
    if (sortByPageCount === 'desc') {
      const countA = a.page_count !== null ? a.page_count : -1;
      const countB = b.page_count !== null ? b.page_count : -1;
      return countB - countA;
    } else if (sortByPageCount === 'asc') {
      const countA = a.page_count !== null ? a.page_count : Infinity;
      const countB = b.page_count !== null ? b.page_count : Infinity;
      return countA - countB;
    }
    return 0; // 'none'
  });

  const activeFiltersCount = selectedStatuses.length + selectedTypes.length + (sortByPageCount !== 'none' ? 1 : 0);

  const okCount = equipments.filter(e => e.status === 'Functional').length;
  const maintenanceCount = equipments.filter(
    e => e.status === 'Needs maintenance' || e.status === 'In maintenance'
  ).length;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Buscar por patrimônio, specs..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      {/* Accordion Filters */}
      <TouchableOpacity
        style={[
          styles.accordionHeader,
          filtersExpanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
        ]}
        onPress={() => setFiltersExpanded(!filtersExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.accordionHeaderLeft}>
          <Feather name="filter" size={14} color={COLORS.textSub} />
          <Text style={styles.accordionHeaderText}>
            Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount} ativos)` : ''}
          </Text>
        </View>
        <Feather name={filtersExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSub} />
      </TouchableOpacity>

      {filtersExpanded && (
        <View style={styles.filtersContentContainer}>
          <Text style={styles.filterGroupLabel}>Tipo de Equipamento</Text>
          <View style={styles.chipsContainer}>
            {TYPES.map(t => {
              const active = t === 'Todos' ? selectedTypes.length === 0 : selectedTypes.includes(t as EquipmentType);
              const iconName = t !== 'Todos' ? TYPE_ICONS[t as EquipmentType] : 'list';
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, active && styles.chipActive]}
                  onPress={() => {
                    if (t === 'Todos') {
                      setSelectedTypes([]);
                    } else {
                      const val = t as EquipmentType;
                      setSelectedTypes(prev =>
                        prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
                      );
                    }
                  }}
                >
                  <Feather
                    name={iconName as keyof typeof Feather.glyphMap}
                    size={12}
                    color={active ? COLORS.text : COLORS.textSub}
                    style={styles.typeIcon}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t === 'Todos' ? 'Todos' : TYPE_LABELS[t as EquipmentType]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.filterGroupLabel}>Status</Text>
          <View style={styles.chipsContainer}>
            {STATUSES.map(s => {
              const active = s === 'Todas' ? selectedStatuses.length === 0 : selectedStatuses.includes(s as EquipmentStatus);
              const dot = s !== 'Todas' ? STATUS_DOT[s as EquipmentStatus] : undefined;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, active && styles.chipActive]}
                  onPress={() => {
                    if (s === 'Todas') {
                      setSelectedStatuses([]);
                    } else {
                      const val = s as EquipmentStatus;
                      setSelectedStatuses(prev =>
                        prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
                      );
                    }
                  }}
                >
                  {dot ? (
                    <View style={[styles.chipDot, { backgroundColor: dot, opacity: active ? 1 : 0.5 }]} />
                  ) : null}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {STATUS_LABELS[s] ?? s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.filterGroupLabel}>Ordenação por Contador</Text>
          <View style={styles.chipsContainer}>
            <TouchableOpacity
              style={[styles.typeChip, sortByPageCount === 'none' && styles.chipActive]}
              onPress={() => setSortByPageCount('none')}
            >
              <Text style={[styles.chipText, sortByPageCount === 'none' && styles.chipTextActive]}>
                Padrão
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, sortByPageCount === 'desc' && styles.chipActive]}
              onPress={() => setSortByPageCount('desc')}
            >
              <Text style={[styles.chipText, sortByPageCount === 'desc' && styles.chipTextActive]}>
                Maior para menor ⬇
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, sortByPageCount === 'asc' && styles.chipActive]}
              onPress={() => setSortByPageCount('asc')}
            >
              <Text style={[styles.chipText, sortByPageCount === 'asc' && styles.chipTextActive]}>
                Menor para maior ⬆
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {filteredEquipments.length} exibido{filteredEquipments.length !== 1 ? 's' : ''} (de {equipments.length} ativo{equipments.length !== 1 ? 's' : ''})
          {okCount > 0 ? `  ·  ${okCount} OK` : ''}
          {maintenanceCount > 0 ? `  ·  ${maintenanceCount} em manutenção` : ''}
        </Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={styles.errorLink}>Configurações</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator color={COLORS.textSub} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={sortedAndFilteredEquipments}
          keyExtractor={e => e.id}
          renderItem={({ item }) => <EquipmentCard equipment={item} baseUrl={baseUrl} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={COLORS.textSub}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum equipamento encontrado.</Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/equipment/new')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionHeaderText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContentContainer: {
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    gap: 12,
    marginBottom: 8,
  },
  filterGroupLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },

  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.borderFocus,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  typeIcon: {
    fontSize: 12,
  },
  chipText: { color: COLORS.textSub, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: COLORS.text },

  summary: { paddingHorizontal: 16, paddingVertical: 8 },
  summaryText: { color: COLORS.textMuted, fontSize: 12 },

  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#3f1010',
    borderRadius: 4,
    padding: 12,
    gap: 4,
  },
  errorText: { color: '#f87171', fontSize: 13 },
  errorLink: { color: COLORS.textSub, fontSize: 12, textDecorationLine: 'underline' },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 60, fontSize: 14 },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: { color: '#0a0a0a', fontSize: 26, fontWeight: '300', lineHeight: 30 },

  settingsBtn: {
    position: 'absolute',
    bottom: 34,
    left: 20,
  },
  settingsIcon: { color: COLORS.textMuted, fontSize: 20 },
});
