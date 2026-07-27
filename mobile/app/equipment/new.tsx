import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { apiFetch, apiUpload } from '../../lib/api';
import { Equipment, EquipmentStatus, EquipmentType } from '../../lib/types';
import { COLORS, STATUS_COLORS, STATUS_DOT, STATUS_LABELS, TYPE_ICONS, TYPE_LABELS } from '../../lib/colors';

const STATUSES: EquipmentStatus[] = [
  'Functional', 'Needs maintenance', 'In maintenance', 'Ready for sale', 'Sold',
];

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
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={100}
      extraHeight={135}
      keyboardShouldPersistTaps="handled"
    >

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
    </KeyboardAwareScrollView>
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
    backgroundColor: COLORS.surfaceAlt,
  },

  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 15 },
});
