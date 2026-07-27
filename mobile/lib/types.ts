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
