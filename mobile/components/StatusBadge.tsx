import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EquipmentStatus } from '../lib/types';
import { STATUS_COLORS, STATUS_DOT, STATUS_LABELS } from '../lib/colors';

interface Props {
  status: EquipmentStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['Functional'];
  const dot = STATUS_DOT[status] ?? '#555';
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.text, { color: c.text }, size === 'sm' && styles.textSm]}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 11,
  },
});
