import {
  Asset,
  AssetCollection,
  BoolAsString,
  ItemTypeName,
  NumberAsString,
  RelativeUrlPath,
  Timestamp,
} from './common';
import { User } from './user';

export enum NodeType {
  Start = 1,
  Regular = 2, // Normal "Corrupted" paintings (unconfirmed)
  Free = 3, // Free play "Record" paintings (unconfirmed)
  Final = 4, // Unconfirmed
}

export enum RewardType {
  // EachCompletion is referred to as "Completion" in game; this name makes it
  // very explicit that it's available multiple times.
  EachCompletion = '1',
  FirstTime = '2',
  Mastery = '3',

  // Recurring (?) time-based (?) bonuses - e.g., for Magicite
  Bonus = '7',

  // One-time bonuses - e.g., for Neo Torments, or damage-based for
  // "Damage Race - Ancient Foes",
  GradeAOrSub30 = '8',
  GradeBOrSub40 = '9',
  GradeCOrSub50 = '10',
  GradeDOrSub60 = '11',
  GradeEOrHp100 = '12',
  GradeFOrHp90 = '13',
  Hp80 = '14',
  Hp70 = '15',
  Hp60 = '16',
  Hp50 = '17',
  Hp40 = '18',
  Hp30 = '19',
  Hp20 = '20',
  Hp10 = '21',

  // Alternate one-time bonuses for Odin.
  ElementalFire = '8',
  ElementalIce = '9',
  ElementalWind = '10',
  ElementalEarth = '11',
  ElementalLightning = '12',
  ElementalWater = '13',
  ElementalHoly = '14',
  ElementalDark = '15',
  Elemental1Win = '16',

  // Anima lenses are shown separately.  I don't know why the game is designed
  // this way.
  AnimaLens = '28',
}

export const MinRewardGrade = 8;

/**
 * We normally try to avoid hard-coding world IDs, but Dark Odin has a few
 * unique traits, so it simplifies code to have this available.
 */
export const DarkOdinWorldId = 13052;

export interface DungeonPrizeItem {
  type_name: ItemTypeName;
  num: number;
  image_path: RelativeUrlPath;
  is_got_grade_bonus_prize: number; // 1 if an already received 1-time bonus
  grade_bonus_description?: string;
  disp_order?: number;
  name: string;
  id: number;
  clear_battle_time?: number; // Clear time, in milliseconds
}

export interface DungeonDropItem {
  type_name: ItemTypeName;
  num: number;
  image_path: RelativeUrlPath;
  name: string;
  id: number;
}

export interface Dungeon {
  id: number;
  world_id?: number;
  rank?: number;
  name: string;
  series_id: number;
  order_no: number;
  prologue: string;
  prologue_image_path: RelativeUrlPath;
  epilogue: string;
  epilogue_image_path: RelativeUrlPath;
  background_image_path: RelativeUrlPath;
  is_clear: boolean;
  is_master: boolean;
  is_new: boolean;
  is_unlocked: boolean;
  is_restricted: boolean;
  has_battle: boolean;
  type: number; // Whether it's on page 1 (normal) or page 2 (elite, part 2, etc.)

  // Does not take 1/2 stamina into account.  Summing stamina_list, dividing
  // by 2 and rounding down, minimum 1, is necessary to handle that.
  total_stamina: number;
  stamina_list: number[];
  required_max_stamina?: number;

  stamina_consume_type: number; // Magicites use 1
  supporter_type: number; // Magicites use 1
  recommend_beast_type?: number;
  ss_gauge_type: number; // 0 is normal
  buddy_additional_status_bonus_level: number; // normally 0
  continue_allowable_type: number;

  opened_at: Timestamp;
  closed_at: Timestamp;

  challenge_level: number;
  progress_map_level: number;
  platform_style: number;
  button_style: 'NORMAL' | 'EXTRA' | 'DOOM';
  prizes: { [s in RewardType]: DungeonPrizeItem[] };

  // Dungeon IDs that must be cleared to access this dungeon.
  unlock_conditions: {
    [dungeonId: string]: BoolAsString;
  };

  unlocked_series_ids: number[];
  ability_category_bonus_map: {};
  battle_ticket_id_2_num: {};
  battle_drop_items: DungeonDropItem[];

  memory_labo_group_id?: number;
  // Not tracked/processed: memory_labo_recommendation_infos

  // Not yet tracked/processed: captures (medal conditions)
}

// A node in a record dungeon's graph
export interface DungeonNode {
  world_id: number;
  x: number;
  y: number;
  path_info: null | {
    [id: string]: NumberAsString; // ID of node reachable from here
  };
  dungeon_id: number; // 0 for starting node
  id: number;
  type: NodeType;
  remaining_treasure_num: number;
}

// Sample URL: http://ffrk.denagames.com/dff/world/dungeons?world_id=104001
export interface Dungeons {
  assets: Asset[];

  // Assets for Nightmare dungeons
  room_of_abyss_assets?: {
    common: AssetCollection;
    picture: AssetCollection;
  };

  dungeons: Dungeon[];

  // Record Dungeons nodes
  dungeon_list_nodes?: DungeonNode[];
  dungeon_id_node_id_map?: Array<{
    [id: string]: string;
  }>;
}

// Sample URL: http://ffrk.denagames.com/dff/event/original_scenario/11001/get_data_for_region_list
export interface GetDataForRegionList {
  region_list: Array<{
    is_all_unlock_condition_cleared: number;
    first_world_id: string;
    name: string;
    unlock_condition_descriptions: string[];
    is_open: number;
    id: string;
    type: string;
    formal_name: string;
  }>;
}

// Sample URL: http://ffrk.denagames.com/dff/event/original_scenario/11002/progress_battle_list_gimmick
export interface ProgressBattleListGimmick {
  user: User;
  gimmick: {
    id: number;
    has_shown: number;
  };
  gimmick_effect: {
    // We've only ever observed one gimmick (treasure chests), but others may
    // exist, so leave lots of flexibility in what we expect here.
    item_possession_limits?: Array<{
      current_num: number;
      item_type_name: string;
      max_num: number;
      enable_give_num: number;
    }>;
    effect?: {
      assets: AssetCollection;
      prize_master: {
        [id: string]: DungeonPrizeItem;
      };
    };
  };
}
