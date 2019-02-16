import {
  AssetCollection,
  BoolAsNumber,
  NumberAsString,
  RelativeUrlPath,
  Timestamp,
} from './common';
import { OwnedRecordMateria, RecordMateria } from './recordMateria';

export interface Buddy {
  id: number;
  buddy_id: number;
  series_id: number;
  name: string;
  created_at: Timestamp;
  row: number;
  description: string;
  job_name: string;
  role_type: number;
  role_type_name: string;
  dress_record_id: number;
  dress_record_name: string;
  image_path: RelativeUrlPath;
  default_image_path: RelativeUrlPath;

  exp: number;
  level: number;
  level_max: number;
  evolution_num: number; // How many times the level cap has been broken

  series_level: number;

  can_equip_record_materia_num: number;
  record_materia_step: number;

  sp_mnd: number;
  atk: number;
  mdef: number;
  sp_acc: number;
  sp_matk: number;
  acc: number;
  def: number;
  sp_hp: number;
  sp_def: number;
  eva: number;
  sp_spd: number;
  matk: number;
  hp: number;
  spd: number;
  sp_mdef: number;
  sp_atk: number;
  mnd: number;
  sp_eva: number;

  weapon_id: number;
  armor_id: number;
  accessory_id: number;
  soul_strike_1_id: number;
  soul_strike_2_id: number;
  soul_strike_3_id: number;
  soul_strike_4_id: number;
  default_soul_strike_id: number;
  ability_1_id: number;
  ability_2_id: number;
  legend_materia_1_id: number;
  legend_materia_2_id: number;
  record_materia_1_id: number;

  is_visitant: boolean;
  is_guest_visitant: boolean;
  is_orichara_visitant: boolean;
  is_fixed_party_slot: boolean;

  sphere_skill_level: number;

  soul_strike_exp_map: {
    [id: string]: NumberAsString;
  };
  legend_materia_exp_map: {
    [id: string]: NumberAsString;
  };

  ability_category: {
    [id: string]: {
      category_id: number;
      rarity: number;
      name: string;
      is_extended: number;
    };
  };

  equipment_category: {
    [id: string]: {
      category_id: number;
      equipment_type: number;
      is_extended: number;
      factor: number;
    };
  };

  record_tear_boosters: {
    hp: number;
    matk: number;
    atk: number;
    spd: number;
    mdef: number;
    acc: number;
    mnd: number;
    def: number;
    eva: number;
  };

  brave_series_ids_map: {
    [id: number]: 1;
  };

  magia_point?: number;
  magia_exp?: number;
  magia_crystal_skill?: [];
}

export interface LegendMateria {
  id: number;
  name: string;
  buddy_id: number;
  buddy_name: string;
  description: string;
  disp_name: string;
  effect_type: number;
  recommend_priority: number;

  image_path: RelativeUrlPath;
  command_icon_path: RelativeUrlPath;
  required_exp: number;

  has_param_booster: boolean;
  atk_boost: number;
  matk_boost: number;
  def_boost: number;
  mdef_boost: number;
  mnd_boost: number;
  acc_boost: number;
  spd_boost: number;
  eva_boost: number;
  hp_boost: number;
}

export interface GrowEgg {
  exp: number;
  num: number;
  name: string;
  sale_gil: number;
  description: string;
  image_path: RelativeUrlPath;
  rarity: number;
  id: number;
}

export interface BuddyEvolvePost {
  user_buddy_id: number;
  user_memory_crystal_ids: number[];
  exec: BoolAsNumber;
}

// POST to http://ffrk.denagames.com/dff/buddy/evolve with exec 0
export interface BuddyEvolve {
  assets: AssetCollection;
  buddy: Buddy;
}

// POST to http://ffrk.denagames.com/dff/buddy/evolve with exec 1
export interface BuddyEvolveExec extends BuddyEvolve {
  user_memory_crystal: {
    buddy_role_type: number;
    memory_crystal_id: number;
    buddy_id: number;
    name: string;
    series_id: number;
    buddy_name: string;
    description: string;
    created_at: Timestamp;
    image_path: RelativeUrlPath;
  };

  record_materia?: OwnedRecordMateria; // newly acquired record materia
  new_record_materia?: OwnedRecordMateria; // newly unlocked record materia
  next_record_materia: RecordMateria;

  achieved_book_ids: number[];
  achieved_book_mission_ids: number[];
}

export interface GrowEggUsePost {
  user_buddy_id: number;
  grow_egg_id_2_num: {
    [id: number]: number;
  };
  is_recommended_used: BoolAsNumber;
  current_exp: number;
  exec: BoolAsNumber;
}

// POST to http://ffrk.denagames.com/dff/grow_egg/use
export interface GrowEggUse {
  grow_eggs: GrowEgg[];
  buddy: Buddy;
  record_materia?: RecordMateria;
  achieved_book_ids: number[];
  achieved_book_mission_ids: number[];
}
