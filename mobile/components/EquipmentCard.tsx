import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Equipment } from '../lib/types';
import { COLORS, STATUS_DOT, TYPE_ICONS } from '../lib/colors';
import { StatusBadge } from './StatusBadge';

interface Props {
  equipment: Equipment;
  baseUrl: string;
}

export function EquipmentCard({ equipment, baseUrl }: Props) {
  const router = useRouter();
  const dot = STATUS_DOT[equipment.status] ?? '#555';
  const typeIcon = (TYPE_ICONS[equipment.type] || 'package') as keyof typeof Feather.glyphMap;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/equipment/${equipment.id}`)}
      activeOpacity={0.6}
    >
      <View style={styles.body}>
        <View style={styles.contentRow}>
          <View style={styles.textContainer}>
            <View style={styles.topRow}>
              <View style={styles.topRowLeft}>
                <Feather
                  name={typeIcon}
                  size={14}
                  color={COLORS.textSub}
                  style={styles.typeIcon}
                />
                <Text style={styles.name} numberOfLines={1}>
                  {equipment.brand} {equipment.model}
                </Text>
              </View>
              <StatusBadge status={equipment.status} size="sm" />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {equipment.serial_number ? equipment.serial_number : equipment.internal_code}
              </Text>
              {(equipment.type === 'Printer' || equipment.type === 'Label Maker') && equipment.page_count != null ? (
                <>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.meta}>
                    {equipment.page_count.toLocaleString('pt-BR')} pág{equipment.page_count !== 1 ? 's' : ''}
                  </Text>
                </>
              ) : null}
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
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    justifyContent: 'space-between',
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
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
    borderRadius: 4,
    backgroundColor: COLORS.surfaceAlt,
  },
});
