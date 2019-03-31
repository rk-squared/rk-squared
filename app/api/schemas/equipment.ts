import { LegendMateria } from './characters';
import { RelativeUrlPath, Timestamp } from './common';
import { PartySoulStrike } from './party';

export interface Equipment {
  name: string;
  id: number;
  equipment_id: number;
  series_id: number;
  rarity: number;
  is_locked: boolean;
  created_at: Timestamp;
  category_id: number; // 2 = Sword
  category_name: string; // e.g., "Sword"
  equipment_type: number; // 1 = weapon, 2 = armor, 3 = accessory
  is_weapon: boolean;
  is_armor: boolean;
  is_accessory: boolean;
  base_rarity: number;
  image_path: RelativeUrlPath;
  detail_image_path: RelativeUrlPath;
  thumbnail_path: RelativeUrlPath;
  sale_gil: number;
  ex_series_id: number; // always 0

  // Current stats (not counting synergy or augments)
  hp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  mnd: number;
  acc: number;
  eva: number;

  // Synergy stats
  sp_hp: number;
  sp_atk: number;
  sp_def: number;
  sp_matk: number;
  sp_mdef: number;
  sp_mnd: number;
  sp_acc: number;
  sp_eva: number;

  // Starting stats
  hp_min: number;
  atk_min: number;
  def_min: number;
  matk_min: number;
  mdef_min: number;
  mnd_min: number;
  acc_min: number;
  eva_min: number;

  // These are always 0.
  additional_bonus_hp: number;
  additional_bonus_atk: number;
  additional_bonus_def: number;
  additional_bonus_matk: number;
  additional_bonus_mdef: number;
  additional_bonus_mnd: number;
  additional_bonus_acc: number;
  additional_bonus_eva: number;

  atk_type: number; // 0 = not a weapon, 1 = melee, 2 = ranged
  critical: number; // 3 for most weapons, 5 for claws (and a few others?), 0 for non-weapons (and some weapons?)
  atk_ss_point_factor: number; // always 0
  def_ss_point_factor: number; // always 0

  allowed_buddy_id: number; // always 0
  has_soul_strike: boolean;
  has_someones_soul_strike: boolean;
  soul_strike_id: number;
  legend_materia_id: number;

  exp: number;
  level: number;
  level_max: number;
  is_max_level: boolean;
  can_evolve_now: boolean;
  can_evolve_potentially: boolean;
  can_hyper_evolve_now: boolean;
  required_enhancement_base_gil: number;
  required_evolution_gil: number;
  is_max_hyper_evolution_num: boolean;
  hammering_affect_param_key: string; // 'atk', 'def', 'matk', 'mdef', 'mnd'
  hammering_num: number; // Current number of augments
  max_hammering_num: number; // Maximum number of augments
  series_hammering_num: number; // Synergy augments - equals ceil(hammering_num * 1.5)
  max_evolution_num: number;
  max_hyper_evolution_num: number;
  evolution_num: number;
  is_max_evolution_num: boolean;
  evol_max_level_of_base_rarity: {
    [s1: string]: {
      [s2: string]: number;
    };
  };
  hyper_evolve_recipe: {
    materials: Array<{
      num: number;
      hyper_evolve_material_id: number;
    }>;
    gil: number;
  };
  is_usable_as_enhancement_src: boolean; // true for weapons and armor, false for accessories
  is_usable_as_enhancement_material: boolean; // true for weapons and armor, false for accessories
  can_hyper_evolve_potentially: boolean; // true for weapons and armor, false for accessories
  is_hammering_item: boolean; // always false
  is_sacred_equipment?: boolean; // added circa 4A, not present in older equipments
  is_buddy_sacred_equipment?: boolean;
  is_usable_as_rainbow_crystal_material?: boolean;

  attributes: EquipmentAttribute[];
  additional_bonus_attributes: EquipmentAttribute[]; // Realm Synergy attributes

  // These show up in gacha banners' BannerList but not in the normal party
  // equipment lists or in gacha/execute.
  soul_strike?: PartySoulStrike;
  legend_materia?: LegendMateria;
}

/**
 * - Elemental boost: type 1, arg 120 for 20% bonus damage
 *   100 = fire, 101 = ice, 102 = lightning, 103 = earth, 104 = wind, 105 = water,
 *   106 = holy, 107 = dark, 108 = poison
 * - Resist element: type 2, arg 1 for vulnerable, 2 for minor, 4 for moderate, 7 for major
 * - Inflict debuff: type 3, arg 5 for "small chance".  attribute_id gives DebuffType.
 * - Resist debuff: type 4, arg 10 for "moderate amount"
 */
interface EquipmentAttribute {
  arg: string;
  type: string;
  attribute_id: string;
}
