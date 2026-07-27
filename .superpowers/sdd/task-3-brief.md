### Task 3: Mobile App Adaptation

**Files:**
- Modify: `mobile/lib/types.ts`
- Modify: `mobile/lib/colors.ts`
- Modify: `mobile/app/_layout.tsx`
- Modify: `mobile/app/index.tsx`
- Rename folder: `mobile/app/printer/` -> `mobile/app/equipment/`
- Modify: `mobile/app/equipment/new.tsx` (formerly `mobile/app/printer/new.tsx`)
- Modify: `mobile/app/equipment/[id].tsx` (formerly `mobile/app/printer/[id].tsx`)
- Modify: `mobile/components/PrinterCard.tsx` (Rename to `mobile/components/EquipmentCard.tsx` in a follow-up step)

**Interfaces:**
- Produces: React Native client interface mapped to generalized IT equipments model.

- [ ] **Step 1: Update type definitions**

  Update `mobile/lib/types.ts` to rename types (`Printer` -> `Equipment`) and support new `type` and `specs` fields.

  Replace `mobile/lib/types.ts` content with:
  ```typescript
  export type EquipmentStatus =
    | 'Functional'
    | 'Needs maintenance'
    | 'In maintenance'
    | 'Ready for sale'
    | 'Sold';

  export type EquipmentType =
    | 'Computer'
    | 'Notebook'
    | 'Printer'
    | 'Label Maker'
    | 'Network'
    | 'Other';

  export interface Equipment {
    id: string;
    type: EquipmentType;
    brand: string;
    model: string;
    serial_number: string | null;
    internal_code: string;
    status: EquipmentStatus;
    page_count: number | null;
    part_needed: string | null;
    location: string | null;
    estimated_value: number | null;
    notes: string | null;
    specs: string | null;
    photo_count?: number;
    primary_photo_url?: string | null;
    created_at: string;
    updated_at: string;
    photos?: Photo[];
  }

  export interface MaintenanceLog {
    id: string;
    equipment_id: string;
    date: string;
    description: string;
    photo_url: string | null;
    created_at: string;
  }

  export interface Photo {
    id: string;
    equipment_id: string;
    log_id: string | null;
    url: string;
    created_at: string;
  }
  ```

- [ ] **Step 2: Update design colors and define type icons**

  Update `mobile/lib/colors.ts` to map type icons and update type mappings.

  Replace `mobile/lib/colors.ts` with:
  ```typescript
  import { EquipmentStatus, EquipmentType } from './types';

  export const COLORS = {
    bg:          '#0a0a0a',
    surface:     '#111111',
    surfaceAlt:  '#1a1a1a',
    border:      '#222222',
    borderFocus: '#444444',
    accent:      '#ffffff',
    accentSub:   '#666666',
    text:        '#f0f0f0',
    textMuted:   '#555555',
    textSub:     '#888888',
    danger:      '#ef4444',
    success:     '#22c55e',
  };

  export const STATUS_DOT: Record<EquipmentStatus, string> = {
    'Functional':        '#22c55e',
    'Needs maintenance': '#f59e0b',
    'In maintenance':    '#3b82f6',
    'Ready for sale':    '#a78bfa',
    'Sold':              '#555555',
  };

  export const STATUS_COLORS: Record<EquipmentStatus, { bg: string; text: string; dot: string }> = {
    'Functional':        { bg: '#0d1f0d', text: '#4ade80', dot: '#22c55e' },
    'Needs maintenance': { bg: '#1f1400', text: '#fbbf24', dot: '#f59e0b' },
    'In maintenance':    { bg: '#0d1225', text: '#60a5fa', dot: '#3b82f6' },
    'Ready for sale':    { bg: '#160d2a', text: '#c4b5fd', dot: '#a78bfa' },
    'Sold':              { bg: '#111111', text: '#666666', dot: '#444444' },
  };

  export const TYPE_ICONS: Record<EquipmentType, string> = {
    'Computer':    '🖥️',
    'Notebook':    '💻',
    'Printer':     '🖨️',
    'Label Maker': '🏷️',
    'Network':     '🌐',
    'Other':       '📦',
  };

  export const TYPE_LABELS: Record<EquipmentType, string> = {
    'Computer':    'Computador',
    'Notebook':    'Notebook',
    'Printer':     'Impressora',
    'Label Maker': 'Etiquetadora',
    'Network':     'Rede',
    'Other':       'Outro',
  };
  ```

- [ ] **Step 3: Update app navigation layout**

  Update `mobile/app/_layout.tsx` stack naming routes to use equipment instead of printer.

  Replace lines 15-21 in `mobile/app/_layout.tsx` with:
  ```typescript
          <Stack.Screen name="index" options={{ title: 'Inventário de TI' }} />
          <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
          <Stack.Screen name="equipment/new" options={{ title: 'Novo Equipamento' }} />
          <Stack.Screen name="equipment/[id]" options={{ title: 'Detalhes' }} />
  ```

- [ ] **Step 4: Rename app/printer folder**

  Rename Expo router screen folder.
  Run: `mv /home/night/Documentos/appimpressoras/mobile/app/printer /home/night/Documentos/appimpressoras/mobile/app/equipment`

- [ ] **Step 5: Rename and rewrite PrinterCard component**

  Create `mobile/components/EquipmentCard.tsx` based on `PrinterCard.tsx`, updating it to take `Equipment`, display `TYPE_ICONS` next to the name, and change naming. Then delete the old `PrinterCard.tsx`.

  Create `mobile/components/EquipmentCard.tsx` with:
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
  import { useRouter } from 'expo-router';
  import { Equipment } from '../lib/types';
  import { COLORS, STATUS_DOT, TYPE_ICONS } from '../lib/colors';

  interface Props {
    equipment: Equipment;
    baseUrl: string;
  }

  export function EquipmentCard({ equipment, baseUrl }: Props) {
    const router = useRouter();
    const dot = STATUS_DOT[equipment.status] ?? '#555';
    const typeIcon = TYPE_ICONS[equipment.type] || '📦';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/equipment/${equipment.id}`)}
        activeOpacity={0.6}
      >
        <View style={[styles.statusLine, { backgroundColor: dot }]} />

        <View style={styles.body}>
          <View style={styles.contentRow}>
            <View style={styles.textContainer}>
              <View style={styles.topRow}>
                <Text style={styles.typeIcon}>{typeIcon}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {equipment.brand} {equipment.model}
                </Text>
                {equipment.part_needed ? (
                  <View style={styles.alertDot} />
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {equipment.serial_number ? equipment.serial_number : equipment.internal_code}
                </Text>
                {equipment.location ? (
                  <>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.meta}>{equipment.location}</Text>
                  </>
                ) : null}
                {equipment.photo_count ? (
                  <>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.meta}>{equipment.photo_count} foto{equipment.photo_count !== 1 ? 's' : ''}</Text>
                  </>
                ) : null}
              </View>

              {equipment.specs ? (
                <Text style={styles.specsText} numberOfLines={1}>
                  {equipment.specs}
                </Text>
              ) : null}

              {equipment.part_needed ? (
                <Text style={styles.partNeeded} numberOfLines={1}>
                  ⚠️ {equipment.part_needed}
                </Text>
              ) : null}
            </View>

            {equipment.primary_photo_url && baseUrl ? (
              <Image
                source={{ uri: `${baseUrl.replace('/api', '')}${equipment.primary_photo_url}` }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: 10,
      marginBottom: 8,
      overflow: 'hidden',
    },
    statusLine: {
      width: 3,
      borderRadius: 0,
    },
    body: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    textContainer: {
      flex: 1,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typeIcon: {
      fontSize: 14,
    },
    name: {
      flex: 1,
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    alertDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#f59e0b',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    meta: {
      color: COLORS.textSub,
      fontSize: 12,
    },
    metaSep: {
      color: COLORS.textMuted,
      fontSize: 12,
    },
    specsText: {
      color: COLORS.textSub,
      fontSize: 12,
      fontStyle: 'italic',
    },
    partNeeded: {
      color: '#fbbf24',
      fontSize: 12,
      marginTop: 2,
    },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: 6,
      backgroundColor: COLORS.surfaceAlt,
    },
  });
  ```

  Run: `rm /home/night/Documentos/appimpressoras/mobile/components/PrinterCard.tsx`

- [ ] **Step 6: Update Home Screen**

  Update `mobile/app/index.tsx` to query `/api/equipments`, support new type definitions, render `EquipmentCard`, and show count tags.

  Replace `mobile/app/index.tsx` with:
  ```typescript
  import React, { useCallback, useEffect, useState } from 'react';
  import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator, RefreshControl, ScrollView,
  } from 'react-native';
  import { useRouter, useFocusEffect } from 'expo-router';
  import { apiFetch, getBaseUrl } from '../lib/api';
  import { Equipment, EquipmentStatus, EquipmentType } from '../lib/types';
  import { COLORS, STATUS_DOT, TYPE_ICONS, TYPE_LABELS } from '../lib/colors';
  import { EquipmentCard } from '../components/EquipmentCard';

  const STATUSES: (EquipmentStatus | 'Todas')[] = [
    'Todas', 'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
  ];

  const STATUS_LABELS: Record<string, string> = {
    'Todas': 'Todas',
    'Functional': 'OK',
    'Needs maintenance': 'Manutenção',
    'In maintenance': 'Em manutenção',
    'Ready for sale': 'Disponível',
    'Sold': 'Vendidos',
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
    const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | 'Todas'>('Todas');
    const [selectedType, setSelectedType] = useState<EquipmentType | 'Todos'>('Todos');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
      setError(null);
      try {
        let url = '/equipments';
        const params = new URLSearchParams();
        if (selectedStatus !== 'Todas') params.set('status', selectedStatus);
        if (selectedType !== 'Todos') params.set('type', selectedType);
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
    }, [selectedStatus, selectedType, query]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const okCount = equipments.filter(e => e.status === 'Functional').length;
    const maintenanceCount = equipments.filter(
      e => e.status === 'Needs maintenance' || e.status === 'In maintenance'
    ).length;

    return (
      <View style={styles.container}>
        {/* Search */}
        <div style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder="Buscar por patrimônio, specs..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </div>

        {/* Type Filter horizontal list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeFilterRow}
          contentContainerStyle={styles.filterContent}
        >
          {TYPES.map(t => {
            const active = selectedType === t;
            const icon = t !== 'Todos' ? TYPE_ICONS[t as EquipmentType] : '📋';
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, active && styles.chipActive]}
                onPress={() => setSelectedType(t)}
              >
                <Text style={styles.typeIcon}>{icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t === 'Todos' ? 'Todos' : TYPE_LABELS[t as EquipmentType]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Filter horizontal list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilterRow}
          contentContainerStyle={styles.filterContent}
        >
          {STATUSES.map(s => {
            const active = selectedStatus === s;
            const dot = s !== 'Todas' ? STATUS_DOT[s as EquipmentStatus] : undefined;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, active && styles.chipActive]}
                onPress={() => setSelectedStatus(s)}
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
        </ScrollView>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {equipments.length} ativo{equipments.length !== 1 ? 's' : ''}
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
            data={equipments}
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
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: COLORS.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    typeFilterRow: { maxHeight: 38, marginBottom: 4 },
    statusFilterRow: { maxHeight: 38 },
    filterContent: { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
    
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
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
      borderRadius: 6,
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
      borderRadius: 8,
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
  ```

- [ ] **Step 7: Update New Equipment screen**

  Rewrite `mobile/app/equipment/new.tsx` to support the generalised `Equipment` type, selection of types, and saving of specs.

  Replace `mobile/app/equipment/new.tsx` content with:
  ```typescript
  import React, { useState } from 'react';
  import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Image,
  } from 'react-native';
  import * as ImagePicker from 'expo-image-picker';
  import * as ImageManipulator from 'expo-image-manipulator';
  import { useRouter } from 'expo-router';
  import { apiFetch, apiUpload } from '../../lib/api';
  import { Equipment, EquipmentStatus, EquipmentType } from '../../lib/types';
  import { COLORS, STATUS_COLORS, STATUS_DOT, TYPE_ICONS, TYPE_LABELS } from '../../lib/colors';

  const STATUSES: EquipmentStatus[] = [
    'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
  ];

  const STATUS_LABELS: Record<EquipmentStatus, string> = {
    'Functional': 'OK',
    'Needs maintenance': 'Manutenção necessária',
    'In maintenance': 'Em manutenção',
    'Ready for sale': 'Disponível',
    'Sold': 'Vendido',
  };

  const TYPES: EquipmentType[] = [
    'Computer', 'Notebook', 'Printer', 'Label Maker', 'Network', 'Other'
  ];

  async function compressAndUpload(uri: string, equipmentId: string): Promise<string> {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    const form = new FormData();
    form.append('photo', {
      uri: compressed.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    form.append('equipment_id', equipmentId);
    const result = await apiUpload<{ url: string }>('/photos', form);
    return result.url;
  }

  export default function NewEquipmentScreen() {
    const router = useRouter();
    const [type, setType] = useState<EquipmentType>('Computer');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [status, setStatus] = useState<EquipmentStatus>('Functional');
    const [pageCount, setPageCount] = useState('');
    const [partNeeded, setPartNeeded] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [specs, setSpecs] = useState('');
    const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    async function pickImage() {
      const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Permissão negada'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingPhotos(prev => [...prev, result.assets[0].uri]);
      }
    }

    async function takePhoto() {
      const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Câmera negada'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled && result.assets[0]) {
        setPendingPhotos(prev => [...prev, result.assets[0].uri]);
      }
    }

    async function save() {
      if (!brand.trim() || !model.trim()) {
        Alert.alert('Campos obrigatórios', 'Marca e modelo são obrigatórios.');
        return;
      }
      setSaving(true);
      try {
        const count = parseInt(pageCount, 10);
        const equipment = await apiFetch<Equipment>('/equipments', {
          method: 'POST',
          body: JSON.stringify({
            type,
            brand: brand.trim(),
            model: model.trim(),
            serial_number: serial.trim() || null,
            status,
            page_count: !isNaN(count) ? count : null,
            part_needed: partNeeded.trim() || null,
            location: location.trim() || null,
            notes: notes.trim() || null,
            specs: specs.trim() || null,
          }),
        });
        for (const uri of pendingPhotos) {
          await compressAndUpload(uri, equipment.id);
        }
        router.replace(`/equipment/${equipment.id}`);
      } catch (e: unknown) {
        Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar');
      } finally {
        setSaving(false);
      }
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* — Tipo do Equipamento — */}
        <Text style={styles.section}>Tipo de Equipamento</Text>
        <View style={styles.typeGrid}>
          {TYPES.map(t => {
            const active = type === t;
            const icon = TYPE_ICONS[t];
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, active && styles.typeOptionActive]}
                onPress={() => setType(t)}
              >
                <Text style={styles.optionIcon}>{icon}</Text>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* — Identificação — */}
        <Text style={styles.section}>Identificação</Text>

        <Text style={styles.label}>Marca <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Dell, Lenovo, HP, Brother…"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Modelo <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="ThinkPad L14, LaserJet P2035…"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Número de série <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={styles.input}
          value={serial}
          onChangeText={setSerial}
          placeholder="Gerado automaticamente se vazio"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* — Especificações Técnicas — */}
        <Text style={styles.section}>Especificações</Text>
        <Text style={styles.label}>Ficha Técnica (Livre)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={specs}
          onChangeText={setSpecs}
          placeholder={
            type === 'Computer' || type === 'Notebook'
              ? 'ex: Core i5, 16GB RAM, SSD 512GB, Windows 11'
              : type === 'Printer'
              ? 'ex: Laser Monocromática, Toner TN880, Conexão USB/Rede'
              : 'Informações técnicas do equipamento…'
          }
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* — Estado — */}
        <Text style={styles.section}>Estado</Text>

        <View style={styles.statusGrid}>
          {STATUSES.map(s => {
            const active = status === s;
            const dot = STATUS_DOT[s];
            const c = STATUS_COLORS[s];
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusOption,
                  active && { backgroundColor: c.bg, borderColor: c.dot },
                ]}
                onPress={() => setStatus(s)}
              >
                <View style={[styles.optionDot, { backgroundColor: dot }]} />
                <Text style={[styles.optionText, active && { color: c.text }]}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {type === 'Printer' && (
          <>
            <Text style={styles.label}>Contagem de páginas</Text>
            <TextInput
              style={styles.input}
              value={pageCount}
              onChangeText={setPageCount}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={styles.label}>Peça necessária</Text>
        <TextInput
          style={styles.input}
          value={partNeeded}
          onChangeText={setPartNeeded}
          placeholder="toner, teclado, bateria, cabo…"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* — Localização — */}
        <Text style={styles.section}>Localização e notas</Text>

        <Text style={styles.label}>Local no estoque</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Prateleira 3, Armário B…"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Notas e Observações</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações de reparo ou pendências…"
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* — Fotos — */}
        <Text style={styles.section}>Fotos</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {pendingPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {pendingPhotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.thumb} />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar equipamento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 16, paddingBottom: 48 },

    section: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 12,
    },

    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    typeOptionActive: {
      backgroundColor: COLORS.surfaceAlt,
      borderColor: COLORS.borderFocus,
    },
    optionIcon: { fontSize: 13 },
    optionLabel: { color: COLORS.textSub, fontSize: 13 },
    optionLabelActive: { color: COLORS.text, fontWeight: '500' },

    label: {
      color: COLORS.textSub,
      fontSize: 13,
      marginBottom: 6,
    },
    required: { color: COLORS.textMuted },
    optional: { color: COLORS.textMuted, fontWeight: '400' },

    input: {
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 12,
    },
    textarea: { height: 80 },

    statusGrid: {
      gap: 8,
      marginBottom: 12,
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    optionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    optionText: {
      color: COLORS.textSub,
      fontSize: 14,
      fontWeight: '400',
    },

    photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    photoBtn: {
      flex: 1,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    photoBtnText: { color: COLORS.textSub, fontSize: 14 },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    thumb: {
      width: 88,
      height: 88,
      borderRadius: 8,
      backgroundColor: COLORS.surfaceAlt,
    },

    saveBtn: {
      backgroundColor: COLORS.accent,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    saveBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 15 },
  });
  ```

- [ ] **Step 8: Update Equipment Details screen**

  Rewrite `mobile/app/equipment/[id].tsx` to support type switching, free text specs, routing to `/equipments/`, and logs.

  Replace `mobile/app/equipment/[id].tsx` content with:
  ```typescript
  import React, { useCallback, useEffect, useState } from 'react';
  import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Alert, ActivityIndicator, Image, RefreshControl, Modal,
  } from 'react-native';
  import * as ImagePicker from 'expo-image-picker';
  import * as ImageManipulator from 'expo-image-manipulator';
  import { useLocalSearchParams, useRouter } from 'expo-router';
  import { apiFetch, apiUpload, getBaseUrl } from '../../lib/api';
  import { Equipment, EquipmentStatus, EquipmentType, MaintenanceLog, Photo } from '../../lib/types';
  import { COLORS, STATUS_COLORS, STATUS_DOT, TYPE_ICONS, TYPE_LABELS } from '../../lib/colors';
  import { StatusBadge } from '../../components/StatusBadge';
  import { LogEntry } from '../../components/LogEntry';

  const STATUSES: EquipmentStatus[] = [
    'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
  ];

  const STATUS_LABELS: Record<EquipmentStatus, string> = {
    'Functional': 'OK',
    'Needs maintenance': 'Manutenção necessária',
    'In maintenance': 'Em manutenção',
    'Ready for sale': 'Disponível',
    'Sold': 'Vendido',
  };

  const TYPES: EquipmentType[] = [
    'Computer', 'Notebook', 'Printer', 'Label Maker', 'Network', 'Other'
  ];

  async function compressAndUpload(
    uri: string,
    equipmentId: string,
    logId?: string
  ): Promise<string> {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    const form = new FormData();
    form.append('photo', {
      uri: compressed.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    form.append('equipment_id', equipmentId);
    if (logId) form.append('log_id', logId);
    const result = await apiUpload<{ url: string }>('/photos', form);
    return result.url;
  }

  export default function EquipmentDetailScreen() {
    const rawId = useLocalSearchParams<{ id: string }>().id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const router = useRouter();

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [baseUrl, setBaseUrl] = useState('');

    // edit state
    const [type, setType] = useState<EquipmentType>('Computer');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [status, setStatus] = useState<EquipmentStatus>('Functional');
    const [pageCount, setPageCount] = useState('');
    const [partNeeded, setPartNeeded] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [specs, setSpecs] = useState('');
    const [saving, setSaving] = useState(false);

    // log state
    const [logDesc, setLogDesc] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
    const [logPhoto, setLogPhoto] = useState<string | null>(null);
    const [addingLog, setAddingLog] = useState(false);
    const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

    const load = useCallback(async () => {
      try {
        const [e, l, base] = await Promise.all([
          apiFetch<Equipment>(`/equipments/${id}`),
          apiFetch<MaintenanceLog[]>(`/equipments/${id}/logs`),
          getBaseUrl(),
        ]);
        setEquipment(e);
        setLogs(l);
        setBaseUrl(base);
        setType(e.type);
        setBrand(e.brand);
        setModel(e.model);
        setSerial(e.serial_number ?? '');
        setStatus(e.status);
        setPageCount(e.page_count != null ? String(e.page_count) : '');
        setPartNeeded(e.part_needed ?? '');
        setLocation(e.location ?? '');
        setNotes(e.notes ?? '');
        setSpecs(e.specs ?? '');
      } catch (err: unknown) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao carregar');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function saveDetails() {
      setSaving(true);
      try {
        const count = parseInt(pageCount, 10);
        await apiFetch(`/equipments/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            type,
            brand: brand.trim(),
            model: model.trim(),
            serial_number: serial.trim() || null,
            status,
            page_count: !isNaN(count) ? count : null,
            part_needed: partNeeded.trim() || null,
            location: location.trim() || null,
            notes: notes.trim() || null,
            specs: specs.trim() || null,
          }),
        });
        Alert.alert('Salvo');
        load();
      } catch (err: unknown) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao salvar');
      } finally {
        setSaving(false);
      }
    }

    async function deleteEquipment() {
      Alert.alert(
        'Excluir equipamento',
        'Apaga todos os dados e fotos permanentemente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir', style: 'destructive',
            onPress: async () => {
              try {
                await apiFetch(`/equipments/${id}`, { method: 'DELETE' });
                router.replace('/');
              } catch (err: unknown) {
                Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao excluir');
              }
            },
          },
        ]
      );
    }

    async function pickLogPhoto() {
      const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Permissão negada'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled && result.assets[0]) setLogPhoto(result.assets[0].uri);
    }

    async function pickLogPhotoFromGallery() {
      const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Permissão negada'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) setLogPhoto(result.assets[0].uri);
    }

    async function addLog() {
      if (!logDesc.trim()) { Alert.alert('Descrição obrigatória'); return; }
      setAddingLog(true);
      try {
        const form = new FormData();
        form.append('description', logDesc.trim());
        form.append('date', logDate);
        if (logPhoto) {
          const compressed = await ImageManipulator.manipulateAsync(
            logPhoto,
            [{ resize: { width: 1200 } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
          );
          form.append('photo', {
            uri: compressed.uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
          } as unknown as Blob);
        }
        await apiUpload(`/equipments/${id}/logs`, form);
        setLogDesc('');
        setLogPhoto(null);
        setLogDate(new Date().toISOString().slice(0, 10));
        load();
      } catch (err: unknown) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao adicionar');
      } finally {
        setAddingLog(false);
      }
    }

    if (loading) return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.textSub} size="large" />
      </View>
    );

    if (!equipment) return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Equipamento não encontrado</Text>
      </View>
    );

    const primaryPhotoUrl = equipment.photos?.[0]?.url;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.textSub}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{equipment.brand} {equipment.model}</Text>
            <Text style={styles.code}>{equipment.internal_code}</Text>
          </View>
          <StatusBadge status={equipment.status} size="sm" />
        </View>

        {/* Primary Photo Banner */}
        {primaryPhotoUrl && baseUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFullscreenPhoto(`${baseUrl.replace('/api', '')}${primaryPhotoUrl}`)}
            style={styles.bannerContainer}
          >
            <Image
              source={{ uri: `${baseUrl.replace('/api', '')}${primaryPhotoUrl}` }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerOverlayText}>Visualizar Foto</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Detalhes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Histórico {logs.length > 0 ? `(${logs.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' ? (
          <View>
            <Text style={styles.section}>Tipo de Equipamento</Text>
            <View style={styles.typeGrid}>
              {TYPES.map(t => {
                const active = type === t;
                const icon = TYPE_ICONS[t];
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, active && styles.typeOptionActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={styles.optionIcon}>{icon}</Text>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.section}>Identificação</Text>

            <Text style={styles.label}>Marca</Text>
            <TextInput style={styles.input} value={brand} onChangeText={setBrand}
              placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Modelo</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel}
              placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Número de série</Text>
            <TextInput style={styles.input} value={serial} onChangeText={setSerial}
              placeholder="N/A" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.section}>Especificações</Text>
            <Text style={styles.label}>Ficha Técnica</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={specs}
              onChangeText={setSpecs}
              placeholder="Detalhes técnicos livre…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.section}>Estado</Text>

            <View style={styles.statusGrid}>
              {STATUSES.map(s => {
                const active = status === s;
                const dot = STATUS_DOT[s];
                const c = STATUS_COLORS[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      active && { backgroundColor: c.bg, borderColor: c.dot },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <View style={[styles.optionDot, { backgroundColor: dot }]} />
                    <Text style={[styles.optionText, active && { color: c.text }]}>
                      {STATUS_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {type === 'Printer' && (
              <>
                <Text style={styles.label}>Contagem de páginas</Text>
                <TextInput style={styles.input} value={pageCount} onChangeText={setPageCount}
                  keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />
              </>
            )}

            <Text style={styles.label}>Peça necessária</Text>
            <TextInput style={styles.input} value={partNeeded} onChangeText={setPartNeeded}
              placeholder="toner, fusor…" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.section}>Localização e notas</Text>

            <Text style={styles.label}>Localização</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation}
              placeholder="Prateleira 3" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Notas técnicas</Text>
            <TextInput
              style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes}
              multiline numberOfLines={4} textAlignVertical="top"
              placeholderTextColor={COLORS.textMuted}
            />

            {equipment.photos && equipment.photos.length > 0 && (
              <>
                <Text style={styles.section}>Fotos</Text>
                <View style={styles.photoGrid}>
                  {(equipment.photos as Photo[]).map(p => {
                    const fullUrl = `${baseUrl.replace('/api', '')}${p.url}`;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.8}
                        onPress={() => setFullscreenPhoto(fullUrl)}
                      >
                        <Image
                          source={{ uri: fullUrl }}
                          style={styles.thumb}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveDetails} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#0a0a0a" />
                : <Text style={styles.saveBtnText}>Salvar alterações</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={deleteEquipment}>
              <Text style={styles.deleteBtnText}>Excluir equipamento</Text>
            </TouchableOpacity>
          </View>

        ) : (
          /* ————— HISTORY TAB ————— */
          <View>
            <Text style={styles.section}>Novo registro</Text>

            <Text style={styles.label}>Data</Text>
            <TextInput style={styles.input} value={logDate} onChangeText={setLogDate}
              placeholder="AAAA-MM-DD" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={logDesc} onChangeText={setLogDesc}
              multiline numberOfLines={3} textAlignVertical="top"
              placeholder="O que foi feito ou observado…"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.logPhotoRow}>
              <TouchableOpacity style={[styles.photoBtn, { flex: 1 }]} onPress={pickLogPhoto}>
                <Text style={styles.photoBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoBtn, { flex: 1 }]} onPress={pickLogPhotoFromGallery}>
                <Text style={styles.photoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            {logPhoto && (
              <Image
                source={{ uri: logPhoto }}
                style={{ height: 140, borderRadius: 8, marginBottom: 12, backgroundColor: COLORS.surfaceAlt }}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={addLog} disabled={addingLog}>
              {addingLog
                ? <ActivityIndicator color="#0a0a0a" />
                : <Text style={styles.saveBtnText}>Adicionar ao histórico</Text>
              }
            </TouchableOpacity>

            <Text style={styles.section}>Histórico</Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum registro ainda.</Text>
            ) : (
              logs.map(log => (
                <LogEntry
                  key={log.id}
                  log={log}
                  baseUrl={baseUrl}
                  onPressPhoto={setFullscreenPhoto}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 16, paddingBottom: 60 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

    bannerContainer: {
      height: 180,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
      backgroundColor: COLORS.surface,
      position: 'relative',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingVertical: 6,
      alignItems: 'center',
    },
    bannerOverlayText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    modalBg: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalHeader: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10,
    },
    closeBtn: {
      backgroundColor: '#222',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#444',
    },
    closeBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    modalImage: {
      width: '100%',
      height: '80%',
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    headerLeft: { flex: 1, paddingRight: 12 },
    title: { color: COLORS.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
    code: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },

    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingBottom: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: COLORS.accent },
    tabText: { color: COLORS.textMuted, fontWeight: '500', fontSize: 14 },
    tabTextActive: { color: COLORS.text },

    section: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 12,
    },
    
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    typeOptionActive: {
      backgroundColor: COLORS.surfaceAlt,
      borderColor: COLORS.borderFocus,
    },
    optionIcon: { fontSize: 12 },
    optionLabel: { color: COLORS.textSub, fontSize: 12 },
    optionLabelActive: { color: COLORS.text, fontWeight: '500' },

    label: { color: COLORS.textSub, fontSize: 13, marginBottom: 6 },

    input: {
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 12,
    },
    textarea: { height: 80 },

    statusGrid: { gap: 8, marginBottom: 12 },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    optionDot: { width: 8, height: 8, borderRadius: 4 },
    optionText: { color: COLORS.textSub, fontSize: 14 },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    thumb: {
      width: 88,
      height: 88,
      borderRadius: 8,
      backgroundColor: COLORS.surfaceAlt,
    },

    logPhotoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    photoBtn: {
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    photoBtnText: { color: COLORS.textSub, fontSize: 13 },

    saveBtn: {
      backgroundColor: COLORS.accent,
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 10,
    },
    saveBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 15 },

    deleteBtn: {
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#3f1010',
      marginBottom: 8,
    },
    deleteBtnText: { color: '#f87171', fontWeight: '500', fontSize: 14 },

    emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  });
  ```

---

## Plan Verification

- Compile mobile app to verify type alignment:
  ```bash
  cd mobile && npx tsc --noEmit
  ```
- Send request to backend alias route:
  ```bash
  curl -I http://localhost:3000/api/printers
  ```
  Expected: HTTP 200 OK (alias compatibility working perfectly).
