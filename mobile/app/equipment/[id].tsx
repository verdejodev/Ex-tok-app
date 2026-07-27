import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, RefreshControl, Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { apiFetch, apiUpload, getBaseUrl } from '../../lib/api';
import { Equipment, EquipmentStatus, EquipmentType, MaintenanceLog, Photo } from '../../lib/types';
import { COLORS, STATUS_COLORS, STATUS_DOT, STATUS_LABELS, TYPE_ICONS, TYPE_LABELS } from '../../lib/colors';
import { StatusBadge } from '../../components/StatusBadge';
import { LogEntry } from '../../components/LogEntry';

const STATUSES: EquipmentStatus[] = [
  'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
];

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
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={100}
      extraHeight={135}
      keyboardShouldPersistTaps="handled"
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
                  <Feather
                    name={icon as keyof typeof Feather.glyphMap}
                    size={13}
                    color={active ? COLORS.text : COLORS.textSub}
                    style={styles.optionIcon}
                  />
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
              style={{ height: 140, borderRadius: 4, marginBottom: 12, backgroundColor: COLORS.surfaceAlt }}
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

      {/* Fullscreen Photo Modal */}
      <Modal visible={!!fullscreenPhoto} transparent animationType="fade" onRequestClose={() => setFullscreenPhoto(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setFullscreenPhoto(null)}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setFullscreenPhoto(null)}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          {fullscreenPhoto ? (
            <Image source={{ uri: fullscreenPhoto }} style={styles.modalImage} resizeMode="contain" />
          ) : null}
        </TouchableOpacity>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  bannerContainer: {
    height: 180,
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
    backgroundColor: COLORS.surfaceAlt,
  },

  logPhotoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoBtnText: { color: COLORS.textSub, fontSize: 13 },

  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  saveBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 15 },

  deleteBtn: {
    borderRadius: 4,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f1010',
    marginBottom: 8,
  },
  deleteBtnText: { color: '#f87171', fontWeight: '500', fontSize: 14 },

  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
});
