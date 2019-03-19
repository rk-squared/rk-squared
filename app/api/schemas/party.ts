import { NumberAsString, RelativeUrlPath, Timestamp } from './common';

export interface Ability {
  category_type: number;
  panel_name: string;
  next_grade: number;
  num: number;
  grade: number;
  category_name: string;
  thumbnail_path: RelativeUrlPath;
  is_locked: boolean;
  factor_category_type: string;
  category_id: number;
  animation_id: number;
  created_at: number;
  disable_generation: boolean;
  display_category_id: number;
  id: number;
  required_gil: number;
  ability_id: number;
  arg1: number;
  command_icon_path: RelativeUrlPath;
  target_range: number;
  name: string;
  arg3: number;
  description: string;
  sale_gil: number;
  factor_category: number;
  arg2: number;
  image_path: RelativeUrlPath;
  rarity: number;
  max_grade: number;
}

/**
 * Arcana
 */
export interface BeastFood {
  exp: number;
  num: number;
  name: string;
  sale_gil: number;
  description: string;
  image_path: RelativeUrlPath;
  rarity: number;
  id: number;
}

export interface DressRecord {
  name: string;
  disp_name: string; // Name with embedded "{n}"
  image_path: RelativeUrlPath;
  buddy_id: number;
  dress_record_id: number;
}

/**
 * Dark Matter
 */
export interface EquipmentHyperEvolveMaterial {
  exp: number;
  num: number;
  name: string;
  sale_gil: number;
  description: string;
  created_at: Timestamp;
  image_path: RelativeUrlPath;
  rarity: number;
  id: number;
}

/**
 * Equipment upgrade materials - scarletite, adamantite, and rosetta stones
 */
export interface EquipmentSpMaterial {
  exp: number;
  num: number;
  name: string;
  sale_gil: number;
  equipment_type: number;
  description: string;
  image_path: RelativeUrlPath;
  rarity: number;
  id: number;
  hammering_num: number; // How much it increases augments (i.e., 1 for Rosetta, 0 everywhere else)
}

export interface ItemPossessionLimit {
  current_num: number;
  item_type_name: string;
  max_num: number;
  enable_give_num: number;
}

/**
 * Ability materials, including orbs and records.  Aka "materials."
 */
export interface Material {
  num: number;
  name: string;
  sale_gil: number;
  description: string;
  created_at: Timestamp;
  image_path: RelativeUrlPath;
  rarity: number;
  type: number;
  id: number;
}

export interface MemoryCrystal {
  buddy_role_type: number;
  memory_crystal_id: number;
  buddy_id: number;
  name: string;
  series_id: number;
  buddy_name: string;
  description: string;
  created_at: number;
  image_path: RelativeUrlPath;
}

export interface Party {
  beast_id_main: NumberAsString;
  slot_to_beast_id_sub: { [slot: number]: number }; // 4 slots
  slot_to_buddy_id: { [slot: number]: number }; // 5 slots
  user_id: number;
}

/**
 * A soul strike (soul break) as it shows up in the party list
 */
export interface PartySoulStrike {
  id: number;
  name: string;
  disp_name: string;
  soul_strike_category_id: number;
  soul_strike_category_name: string; // e.g., 'STANDARD'
  allowed_buddy_id: number;
  allowed_buddy_name: string;
  description: string;
  extensive_description: string;
  consume_ss_point: number;
  consume_ss_gauge: number;
  required_exp: number;

  usable_num: number;
  recommend_priority: number;
  image_path: RelativeUrlPath;
  disabled_image_path: RelativeUrlPath;
  ability_animation_id: number;
  supporter_usable_num: number;

  is_common_soul_strike: boolean;
  is_unique_soul_strike: boolean;
  has_broken_max_damage_threshold_soul_strike: boolean;
  is_super_soul_strike: boolean;
  is_awake_soul_strike: boolean;
  is_sengi_soul_strike: boolean;
  is_param_booster_soul_strike: boolean;
  is_combo_soul_strike: boolean;
  is_default_soul_strike: boolean;
  is_burst_soul_strike: boolean;
  is_overflow_ougi_soul_strike: boolean;
  is_ultra_soul_strike: boolean;
  is_overflow_soul_strike: boolean;
  is_standard_soul_strike: boolean;
  is_someones_soul_strike: boolean;

  burst_spare_abilities?: Array<{
    category_type: number;
    panel_name: string;
    target_range: number;
    command_icon_path: RelativeUrlPath;
    name: string;
    category_name: string; // e.g., 'White Magic'
    thumbnail_path: RelativeUrlPath;
    description: string;
    category_id: number;
    animation_id: number;
    image_path: RelativeUrlPath;
    rarity: number;
    disable_generation: boolean;
    display_category_id: number;
  }>;
}

/**
 * A warehoused record materia
 */
export interface RecordMateriaWarehouse {
  record_materia_id: number;
}

/**
 * Motes - both job motes and 3/4/5 star motes
 */
export interface SphereMaterial {
  created_at: Timestamp;
  num: number;
  image_path: RelativeUrlPath;
  rarity: number;
  name: string;
  id: number;
  description: string;
}
