import { UrlWithStringQuery } from 'url';

import {
  AssetCollection,
  BoolAsNumber,
  BoolAsString,
  ContentPath,
  ItemTypeName,
  NumberAsString,
} from './common';

import { Buddy, GrowEgg, LegendMateria } from './characters';
import { Equipment } from './equipment';
import {
  Ability,
  BeastFood,
  DressRecord,
  EquipmentHyperEvolveMaterial,
  EquipmentSpMaterial,
  Material,
  MemoryCrystal,
  Party,
  PartySoulStrike,
  RecordMateriaWarehouse,
  SphereMaterial,
} from './party';
import { OwnedRecordMateria } from './recordMateria';
import { ItemPossessionLimit, User } from './user';

export { ItemTypeName } from './common';
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

export function isLabyrinthPartyList(url: UrlWithStringQuery | undefined) {
  return url && url.pathname && url.pathname.includes('labyrinth/');
}

// http://ffrk.denagames.com/dff/party/list
// Record dungeons use a similar but restricted schema.  For example:
// http://ffrk.denagames.com/dff/event/original_scenario/11002/party/list?dungeon_id=40100217
//
// As of February 2019, this appears to be discontinued in favor of
// party/list_buddy, party/list_equipment, and party/list_other
//
// As of June 2021, see also dff/labyrinth/party/list, which is completely
// different; it gives a `parties` array with IDs of the three parties' members.
export interface PartyList {
  buddies: Buddy[];

  // Not present for original_scenario
  record_materias: OwnedRecordMateria[];

  // Not present for original_scenario
  record_materias_warehouse: RecordMateriaWarehouse[];

  mo_buddy_info: any; // not yet implemented

  // Note: Some of the following may not be present for original_scenario
  user_supporter_buddy: Buddy;
  memory_crystals: MemoryCrystal[];
  item_possession_limits: ItemPossessionLimit[];
  abilities: Ability[];
  sphere_materials: SphereMaterial[];
  grow_eggs: GrowEgg[];
  equipment_hyper_evolve_materials: EquipmentHyperEvolveMaterial[];
  materials: Material[];
  equipment_sp_materials: EquipmentSpMaterial[];
  dress_records: DressRecord[];
  equipments: Equipment[];
  soul_strikes: PartySoulStrike[];
  legend_materias: LegendMateria[];
}

/**
 * Sample URL: http://ffrk.denagames.com/dff/party/list_buddy
 *
 * Starting with the May 2021 maintenance, this is retrieved in multiple parts;
 * e.g., http://ffrk.denagames.com/dff/party/list_buddy?part=0&split=3 through
 * http://ffrk.denagames.com/dff/party/list_buddy?part=2&split=3, retrieved in
 * parallel.
 */
export interface PartyListBuddy {
  soul_strikes: PartySoulStrike[];
  legend_materias: LegendMateria[];
  buddies: Buddy[];
}

// Sample URL: http://ffrk.denagames.com/dff/party/list_equipment
export interface PartyListEquipment {
  equipments: Equipment[];
}

// Sample URL: http://ffrk.denagames.com/dff/party/list_other
export interface PartyListOther {
  abilities: Ability[];
  beast_foods: BeastFood[];
  dress_records: DressRecord[];
  equipment_hyper_evolve_materials: EquipmentHyperEvolveMaterial[];
  equipment_sp_materials: EquipmentSpMaterial[];
  grow_eggs: GrowEgg[];
  item_possession_limits: ItemPossessionLimit[];
  materials: Material[];
  memory_crystals: MemoryCrystal[];
  mo_buddy_info: any; // not yet implemented
  party: Party;
  record_materias: OwnedRecordMateria[];
  record_materias_warehouse: RecordMateriaWarehouse[];
  sphere_materials: SphereMaterial[];
  user: User;
  user_supporter_buddy: Buddy;
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

// A POST of encrypted data to a URL like
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

      magia_point_info: {
        cur_magia_exp: number;
        magia_lv_to_magia_exp: {
          [level: string]: number;
        };
        magia_lv_to_magia_point: {
          [level: string]: number;
        };
        prev_magia_exp: number;
        prev_magia_lv: number;
        cur_unused_magia_point: number;
        prev_unused_magia_point: number;
        cur_magia_lv: number;
        is_magia_lv_max: number;
      };

      // After the 12/4/2019 maintenance update that removed the requirement to
      // master soul breaks, these properties no longer exist.
      soul_strike_exps?: Array<{
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
      legend_materia_exps?: Array<{
        legend_materia_name: string;
        legend_materia_disp_name: string;
        legend_materia_description: string;
        equipment_id: NumberAsString;
        legend_materia_id: NumberAsString;

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
