import { EquipmentStatus, EquipmentType } from './types';

export const COLORS = {
  bg:          '#000000',
  surface:     '#0f0f0f',
  surfaceAlt:  '#1b1b1d',
  border:      '#26272d',
  borderFocus: '#2fe92b',
  accent:      '#2fe92b',
  accentSub:   '#2fe92b',
  text:        '#ffffff',
  textMuted:   '#6b7367',
  textSub:     '#bbcbb2',
  danger:      '#ff5102',
  success:     '#2fe92b',
};

export const STATUS_DOT: Record<EquipmentStatus, string> = {
  'Functional':        '#22c55e',
  'Needs maintenance': '#f59e0b',
  'In maintenance':    '#3b82f6',
  'Ready for sale':    '#a78bfa',
  'Sold':              '#64748b',
};

export const STATUS_COLORS: Record<EquipmentStatus, { bg: string; text: string; dot: string }> = {
  'Functional':        { bg: '#0d2518', text: '#4ade80', dot: '#22c55e' },
  'Needs maintenance': { bg: '#251b0d', text: '#fbbf24', dot: '#f59e0b' },
  'In maintenance':    { bg: '#0d1b2a', text: '#60a5fa', dot: '#3b82f6' },
  'Ready for sale':    { bg: '#1d0d2a', text: '#c4b5fd', dot: '#a78bfa' },
  'Sold':              { bg: '#161e29', text: '#94a3b8', dot: '#64748b' },
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  'Functional':        'OK',
  'Needs maintenance': 'Manutenção necessária',
  'In maintenance':    'Em manutenção',
  'Ready for sale':    'Disponível',
  'Sold':              'Vendido',
};

export const TYPE_ICONS: Record<EquipmentType, string> = {
  'Computer':    'monitor',
  'Notebook':    'laptop',
  'Printer':     'printer',
  'Label Maker': 'tag',
  'Network':     'globe',
  'Other':       'package',
};

export const TYPE_LABELS: Record<EquipmentType, string> = {
  'Computer':    'Computador',
  'Notebook':    'Notebook',
  'Printer':     'Impressora',
  'Label Maker': 'Etiquetadora',
  'Network':     'Rede',
  'Other':       'Outro',
};
