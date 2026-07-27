import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MaintenanceLog } from '../lib/types';
import { COLORS } from '../lib/colors';

interface Props {
  log: MaintenanceLog;
  baseUrl: string;
  onPressPhoto?: (url: string) => void;
}

export function LogEntry({ log, baseUrl, onPressPhoto }: Props) {
  const dateFormatted = log.date.slice(0, 10).split('-').reverse().join('/');
  return (
    <View style={styles.entry}>
      <View style={styles.timeline}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.content}>
        <Text style={styles.date}>{dateFormatted}</Text>
        <Text style={styles.desc}>{log.description}</Text>
        {log.photo_url ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressPhoto?.(`${baseUrl.replace('/api', '')}${log.photo_url}`)}
          >
            <Image
              source={{ uri: `${baseUrl.replace('/api', '')}${log.photo_url}` }}
              style={styles.photo}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  timeline: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderFocus,
    marginTop: 3,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  content: {
    flex: 1,
    gap: 4,
    paddingBottom: 4,
  },
  date: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  desc: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  photo: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: COLORS.surfaceAlt,
  },
});
