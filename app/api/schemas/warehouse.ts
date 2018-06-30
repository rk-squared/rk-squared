import { RelativeUrlPath, Timestamp } from './common';
import { OwnedRecordMateria } from './recordMateria';

export interface WarehouseBringRecordMateriasPost {
  ids: number[];
}

// http://ffrk.denagames.com/dff/warehouse/bring_record_materias
export interface WarehouseBringRecordMaterias {
  record_materias: OwnedRecordMateria[];
}

// http://ffrk.denagames.com/dff/warehouse/get_equipment_list
export interface WarehouseGetEquipmentList {
  equipments: Array<{
    equipment_id: number;
    name: string;
    category_name: string;
    series_id: number;
    equipment_type: number;
    is_locked: boolean;
    category_id: number;
    created_at: Timestamp;
    image_path: RelativeUrlPath;
    ex_series_id: number;
    rarity: number;
    id: number;
  }>;
}

export interface WarehouseStoreRecordMateriasPost {
  ids: number[];
}

// http://ffrk.denagames.com/dff/warehouse/store_record_materias
export interface WarehouseStoreRecordMaterias {
  achieved_book_ids: number[];
  achieved_book_mission_ids: number[];
}
