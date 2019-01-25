import { UrlWithStringQuery } from 'url';

import { ItemTypeName } from '../../data/items';
import {
  AssetCollection,
  BoolAsNumber,
  BoolAsString,
  ContentPath,
  NumberAsString,
  RelativeUrlPath,
  Timestamp,
} from './common';

import { Buddy, GrowEgg } from './characters';
import { OwnedRecordMateria } from './recordMateria';

export { Battles } from './battles';
export { Dungeons } from './dungeons';
export { Main } from './main';
export { ReleasedRecordMateriaList } from './recordMateria';
export * from './warehouse';

/**
 * Debuffs.  These could also be extracted from appInitData's
 * constants.STATUS_AILMENTS.TYPE_OF.
 */
export enum DebuffType {
  // noinspection JSUnusedGlobalSymbols
  Poison = '200',
  Silence = '201',
  Paralyze = '202',
  Confuse = '203',
  Slow = '205',
  Stop = '206',
  Blind = '210',
  Sleep = '211',
  Petrify = '212',
  InstantKO = '214',
  Interrupt = '242',
}

/**
 * Damage codes.  Aka "EXERCISE_TYPE."  These can be found in battle.js.
 */
export enum DamageType {
  // noinspection JSUnusedGlobalSymbols
  PHY = 1,
  WHT = 3,
  BLK = 4,
  BLU = 5,
  SUM = 6,
  NAT = 7, // aka "Inborn"
  NIN = 8,
  NONE = 9,
}

/**
 * Ability schools.  Aka "ABILITY_CATEGORY_ID."
 */
export enum SchoolType {
  BLACK_MAGIC = 1,
  WHITE_MAGIC = 2,
  SUMMONING = 3,
  SPELLBLADE = 4,
  COMBAT = 5,
  SUPPORT = 6,
  CELERITY = 7,
  DRAGOON = 8,
  MONK = 9,
  THIEF = 10,
  KNIGHT = 11,
  SAMURAI = 12,
  NINJA = 13,
  BARD = 14,
  DANCER = 15,
  MACHINIST = 16,
  DARKNESS = 17,
  SHOOTER = 19,
  WITCH = 20,
  HEAVY = 21,
  BURST_MODE = 51,
  ATTACK = 53,
}

interface Equipment {
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
  hammering_affect_param_key: string; // e.g., "atk"
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

  // - Elemental boost: type 1, arg 120 for 20% bonus damage
  //   100 = fire, 101 = ice, 102 = lightning, 103 = earth, 104 = wind, 105 = water,
  //   106 = holy, 107 = dark, 108 = poison
  // - Resist element: type 2, arg 1 for vulnerable, 2 for minor, 4 for moderate, 7 for major
  // - Inflict debuff: type 3, arg 5 for "small chance".  attribute_id gives DebuffType.
  // - Resist debuff: type 4, arg 10 for "moderate amount"
  attributes: Array<{
    arg: string;
    type: string;
    attribute_id: string;
  }>;
  additional_bonus_attributes: Array<{
    arg: string;
    type: string;
    attribute_id: string;
  }>;
}

export interface DropItem {
  // "1" through "5", corresponding to stars?
  rarity: number;

  // UID of the parent monster.  Duplicated from parent monster for
  // potions, gil, magicite.
  uid?: string;

  // Type - see DropItemType enum.  `drop_item_${type}_${rarity}` gives the
  // assetKey of the drop icon.
  type: string | number;

  // Which wave of the battle - e.g., "1"?  Duplicated from parent
  // monster for potions.
  round?: number;

  // Amount of gil
  amount?: number;

  // Number for magicite
  num?: string;

  // Item ID for magicite
  item_id?: string;
}

export interface GachaShow {
  series_list: Array<{
    priority: number;
    closed_at: Timestamp;
    rise_message: string;
    banner_list: Array<{
      banner_image_type: number;
      item_id: number;
      disp_order: number;
      gacha_series_id: number;
      image_path: RelativeUrlPath;
      font_type: number;
      id: number;
      type: number;
      buddy_image_path: RelativeUrlPath;
    }>;
    line_up_image_path: RelativeUrlPath;
    logic_name: string; // 'plain' (only used for initial freebie) or 'rarity_assurance'
    box_list: Array<{
      box_id: number;
      rarities: number[];
      entry_point_list: Array<{
        purchased_count: number;
        disp_depth: number;
        closed_at: Timestamp;
        pay_type_name: string; // "coin" (gems), "item_and_coin"
        entry_point_id: number;
        animation_type_name: string;
        limit_type_name: string; // e.g., "total", "infinity"
        executable_num: number; // 1 for 100-gem, 99999 otherwise
        lot_num: number; // How many items you get
        image_id: number;
        pay_id: number; // 0 for 100-gem, 91000000 for a Mythril pull
        tag: string;
        pay_cost: number; // Number of gems or Mythril
        name: string; // "100-Gem Rare Relic Draw", "Rare Relic Draw x11"
        description: string;
        opened_at: Timestamp;
        coin_cost_of_item_and_coin_payment: number;
        disp_order: number;
        show_closed_at_flg: boolean;
        term_limit_num: number; // 1 for a single-time draw (Realm Dungeon Lucky Draw or 100-gem pull), 0 otherwise
        required_user_item?: {
          num: number;
          image_path: RelativeUrlPath;
          name: string; // Mythril
          item_id: number; // 91000000
        };
      }>;
    }>;
    is_all_free_payment: false;
    user_exchange_shop_prize_num: number;
    show_prob_rise_flg: boolean;
    additional_appeal_type: number;
    bgm: string;
    rise_image_path: RelativeUrlPath;
    series_name: string;
    bgm_id: number;
    total_executable_num: number; // 1 for a one-time banner (Realm Dungeon Lucky Draw), 0 otherwise
    appeal_message: string;
    top_image_path: RelativeUrlPath;
    series_id: number;
    opened_at: Timestamp;
    exchange_shop_id: number;
    show_closed_at_flg: boolean;
  }>;
}

export interface GetBattleInit {
  assets: AssetCollection;

  battle: {
    is_inescapable: BoolAsString;
    show_timer_type: BoolAsString;

    background: {
      assets: {
        [assetKey: string]: ContentPath;
      };
      animationTime: number;
      animation_info: {
        bgEffectIds: string[];
        id: string;
      };
    };

    rounds: Array<{
      background_change_type: string; // "0" or "2"; meaning unknown

      enemy: Array<{
        deform_animation_info: Array<{}>;
        is_sp_enemy: BoolAsString;

        children: Array<{
          drop_item_list: DropItem[];
        }>;
      }>;

      drop_item_list: DropItem[];
      drop_materias: Array<{
        buddy_pos: string; // E.g., "05" for party member 5
        name: string;
        description: string;
        item_id: string;
      }>;
    }>;

    assets: {
      // Simple mapping of asset key to `/Content/lang/ww/compile` path
      [assetKey: string]: ContentPath;
    };
  };
}

export function isRecordDungeonPartyList(url: UrlWithStringQuery | undefined) {
  return url && url.pathname && url.pathname.includes('original_scenario/');
}

// http://ffrk.denagames.com/dff/party/list
// Record dungeons use a similar but restricted schema.  For example:
// http://ffrk.denagames.com/dff/event/original_scenario/11002/party/list?dungeon_id=40100217
export interface PartyList {
  buddies: Buddy[];

  // Not present for original_scenario
  record_materias: OwnedRecordMateria[];

  // Not present for original_scenario
  record_materias_warehouse: Array<{
    record_materia_id: number;
  }>;

  sphere_materials: Array<{
    created_at: Timestamp;
    num: number;
    image_path: RelativeUrlPath;
    rarity: number;
    name: string;
    id: number;
    description: string;
  }>;

  grow_eggs: GrowEgg[];

  equipment_hyper_evolve_materials: Array<{
    exp: number;
    num: number;
    name: string;
    sale_gil: number;
    description: string;
    created_at: Timestamp;
    image_path: RelativeUrlPath;
    rarity: number;
    id: number;
  }>;

  materials: Array<{
    num: number;
    name: string;
    sale_gil: number;
    description: string;
    created_at: Timestamp;
    image_path: RelativeUrlPath;
    rarity: number;
    type: number;
    id: number;
  }>;

  equipment_sp_materials: Array<{
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
  }>;

  dress_records: Array<{
    disp_name: string; // Name with embedded "{n}"
    image_path: RelativeUrlPath;
    buddy_id: number;
    name: string;
    dress_record_id: number;
  }>;

  equipments: Equipment[];
}

export interface UpdateUserSession {
  success: boolean;
  user_session_key: string;
  SERVER_TIME: number;
}

export interface WorldBattles {
  battles: Array<{
    sp_enemy_id: number;
    name: string; // e.g., "Liquid Flame Record"
    user_clear_time: number; // Clear time in milliseconds
    dungeon_id: number;
    id: number;
  }>;
}

// A POST of encoded data to a URL like
// http://ffrk.denagames.com/dff/event/wday/607/win_battle or
// http://ffrk.denagames.com/dff/battle/win
export interface WinBattle {
  result: {
    clear_time_info: {
      clear_battle_time: number | null; // Clear time in milliseconds
      can_show_clear_time: number; // 0 or 1
    };

    dungeon_id: string;
    dungeon_rank: number;
    is_dungeon_clear: number | null;

    buddy: Array<{
      name: string;
      buddy_id: NumberAsString;
      id: NumberAsString;
      hp: number;
      max_hp: number;
      status_ailments: DebuffType[];
      exp: {
        previous_exp: NumberAsString;
        previous_level: number;
        current_exp: number;
        current_level: number;
        exp_bonus_info: {
          type_name: 'NORMAL' | 'SERIES';
          boost_rate: number | null; // E.g., 150 for 150% experience
        };
        is_level_max: '' | '1';
        level_to_hp_max: {
          [level: string]: number;
        };
        level_to_exp: {
          [level: string]: number;
        };
      };
      is_dead: BoolAsNumber;
      status_bonus_flg_of: {
        buddy: BoolAsNumber;
        weapon: BoolAsNumber;
        armor: BoolAsNumber;
        accessory: BoolAsNumber;
      };
      status_bonus_type_of: BoolAsNumber;

      soul_strike_exps: Array<{
        soul_strike_name: string;
        soul_strike_disp_name: string;
        soul_strike_description: string;
        equipment_id: NumberAsString;
        soul_strike_id: NumberAsString;

        previous_exp: NumberAsString;
        disp_exp: NumberAsString;
        new_exp: NumberAsString;
        required_exp: NumberAsString;

        evolution_num: NumberAsString;
        is_level_up: string;
        is_already_mastered: BoolAsString;

        assets: AssetCollection;
        param_booster: {};
      }>;
      legend_materia_exps: Array<{
        legend_materia_name: string;
        legend_materia_disp_name: string;
        legend_materia_description: string;
        equipment_id: NumberAsString;
        soul_strike_id: NumberAsString;

        previous_exp: NumberAsString;
        disp_exp: NumberAsString;
        new_exp: NumberAsString;
        required_exp: NumberAsString;

        evolution_num: NumberAsString;
        is_level_up: string;
        is_already_mastered: BoolAsString;

        assets: AssetCollection;
        param_booster: {};
      }>;

      is_guest_visitant: BoolAsNumber;

      animation: {
        buddy_id: NumberAsString;
        path: NumberAsString;
        dress_record_id: NumberAsString;
        left_1_offset_x: NumberAsString;
        left_1_offset_y: NumberAsString;
        right_1_offset_x: NumberAsString;
        right_1_offset_y: NumberAsString;
        left_2_offset_x: NumberAsString;
        left_2_offset_y: NumberAsString;
        right_2_offset_x: NumberAsString;
        right_2_offset_y: NumberAsString;
        assets: AssetCollection;
      };
    }>;

    prize_master: {
      [id: string]: {
        type_name: ItemTypeName;
        name: string;
        description?: string;
        sale_gil?: string;
        item_id: string;
        image_path: ContentPath;
        rarity: number | string;
        type?: string;
        rarity_item_id: any;
      };
    };

    unlock_dungeons: Array<{
      world_id: string;
      dungeon_id: string;
      name: string;
      is_force: boolean;
      world_name: string;
    }>;
  };
}
