import { ItemTypeName } from '../../data/items';
import { Asset, AssetCollection, NumberAsString, RelativeUrlPath, Timestamp } from './common';

export enum NodeType {
  // noinspection JSUnusedGlobalSymbols
  Start = 1,
  Regular = 2,  // Normal "Corrupted" paintings (unconfirmed)
  Free = 3,     // Free play "Record" paintings (unconfirmed)
  Final = 4,    // Unconfirmed
}

export enum RewardType {
  // noinspection JSUnusedGlobalSymbols
  Completion = '1',
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
}

export const MinRewardGrade = 8;

export interface DungeonPrizeItem {
  type_name: ItemTypeName;
  num: number;
  image_path: RelativeUrlPath;
  is_got_grade_bonus_prize: number;  // 1 if an already received 1-time bonus
  grade_bonus_description?: string;
  disp_order?: number;
  name: string;
  id: number;
  clear_battle_time?: number;  // Clear time, in milliseconds
}

export interface Dungeon {
  id: number;
  name: string;
  series_id: number;
  prologue: string;
  epilogue: string;
  is_clear: boolean;
  is_master: boolean;
  is_new: boolean;
  is_unlocked: boolean;
  type: number;   // Whether it's on page 1 (normal) or page 2 (elite, part 2, etc.)

  // Does not take 1/2 stamina into account.  Summing stamina_list, dividing
  // by 2 and rounding down, minimum 1, is necessary to handle that.
  total_stamina: number;
  stamina_list: number[];

  opened_at: Timestamp;
  closed_at: Timestamp;

  challenge_level: number;
  progress_map_level: number;
  button_style: string;   // "NORMAL", "EXTRA", or "DOOM"
  prizes: {
    [s in RewardType]: DungeonPrizeItem[];
  };
}

// A node in a record dungeon's graph
export interface DungeonNode {
  world_id: number;
  x: number;
  y: number;
  path_info: null | {
    [id: string]: NumberAsString;  // ID of node reachable from here
  };
  dungeon_id: number;   // 0 for starting node
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
