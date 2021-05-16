import { LegendMateria } from './characters';
import { Equipment } from './equipment';
import { PartySoulStrike } from './party';
import { OwnedRecordMateria } from './recordMateria';

export interface WarehouseBringRecordMateriasPost {
  ids: number[];
}

// http://ffrk.denagames.com/dff/warehouse/bring_record_materias
export interface WarehouseBringRecordMaterias {
  record_materias: OwnedRecordMateria[];
}

/**
 * Vault relics
 *
 * http://ffrk.denagames.com/dff/warehouse/get_equipment_list
 */
export interface WarehouseGetEquipmentList {
  // This used to be just a pared-down list of equipment.  It was updated
  // (probably as part of enhanced vault sorting) to include the same
  // information as in the party screen.
  equipments: Equipment[];
  // These are limited to only the soul breaks and legend materia granted by
  // equipment in the vault.
  soul_strikes: PartySoulStrike[];
  legend_materias: LegendMateria[];
}

export interface WarehouseStoreRecordMateriasPost {
  ids: number[];
}

// http://ffrk.denagames.com/dff/warehouse/store_record_materias
export interface WarehouseStoreRecordMaterias {
  achieved_book_ids: number[];
  achieved_book_mission_ids: number[];
}
