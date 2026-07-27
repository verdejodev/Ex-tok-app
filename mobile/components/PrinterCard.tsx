import React from 'react';
import { EquipmentCard } from './EquipmentCard';
import { Equipment } from '../lib/types';

interface Props {
  printer: Equipment;
  baseUrl: string;
}

export function PrinterCard({ printer, baseUrl }: Props) {
  return <EquipmentCard equipment={printer} baseUrl={baseUrl} />;
}
