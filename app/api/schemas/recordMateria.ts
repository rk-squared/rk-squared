import { BoolAsNumber, RelativeUrlPath, Timestamp } from './common';
import { User } from './user';

export enum RecordMateriaEffectType {
  // noinspection JSUnusedGlobalSymbols
  FullAtb = 1,
  StatBoost = 3,
  StartBuff = 4,
  StartStatus = 5,
  LowHpStatus = 6,
  WeaknessBoost = 7,
  WeaponBoostPhysical = 8,
  BoostAbility = 9,
  BoostElement = 10,
  BoostHealing = 11,
  Counter = 12,
  AttackReplacement = 13,
  Loner = 14,
  StatGainWithHpDrop = 16,
  RandomAttackReplacement = 17,
  WeaponBoostBlackMagic = 18,
  AbilityRestore = 19,
  StartSoulBreak = 20,
  WeaponBoostMulti = 21,
  ArmorBoostStat = 22,
  SoulBreakCharge = 23,
  AbilityRestoreMulti = 24,
  WeaponBoostStat = 25,
  DoubleCast = 26,
  ExpBonus = 27,
  AttachReplacementHeal = 28,
  ReducedDamage = 29,
}

export interface RecordMateria {
  buddy_role_type: number;
  effect_type: RecordMateriaEffectType;
  step: number;               // 1-4, giving number of the record materia for that character
  record_materia_id: number;  // identical to ID
  cond_description: string;
  id: number;
  buddy_image_path: RelativeUrlPath;
  disp_type: number;          // unknown meaning
  command_icon_path: RelativeUrlPath;
  buddy_id: number;
  buddy_series_id: number;
  name: string;
  buddy_name: string;
  description: string;
  image_path: RelativeUrlPath;
  disp_name: string;          // name, with {n} for newline
}

export interface OwnedRecordMateria extends RecordMateria {
  is_favorite: boolean;
  created_at: Timestamp;
  prev_record_materia_name: string;
}

// URL: http://ffrk.denagames.com/dff/achievement_room/get_released_record_materia_list
export interface ReleasedRecordMateriaList {
  record_materias: RecordMateria[];
  achieved_record_materia_map: {
    // Maps record materia ID, in string form, to the number 1.
    [id: string]: number;
  };
  item_achievement_infos: Array<{
    priority: number;    // always 7
    cond: string;
    closed_at: number;   // always 0
    release_id: number;
    item_id: number;
    opened_at: number;   // always 0
    is_locked: boolean;  // always false
    type: number;        // always 7
  }>;
}

export interface SetFavoriteRecordMateriaPost {
  id_to_flag: {
    [id: number]: BoolAsNumber;
  };
}

// POST to http://ffrk.denagames.com/dff/inventory/set_favorite_record_materia
export interface SetFavoriteRecordMateria {
  // The one updated record materia, *before* the favorite status is applied.
  record_materias: OwnedRecordMateria[];
  user: User;
}
