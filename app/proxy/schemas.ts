import { ItemTypeName } from '../data/items';

type BoolAsString = '0' | '1';

// A `/Content/lang/ww/compile` path
type ContentPath = string;

// A `/dff/static/lang/ww/compile` path
type RelativeUrlPath = string;

export enum RewardType {
  Completion = '1',
  FirstTime = '2',
  Mastery = '3',
  Bonus = '7'
}

// Data extracted from the main http://ffrk.denagames.com/dff/ startup request
export interface Main {
  appInitData: {
    user: {
      stamina_piece: number;
      soul_piece: number;
      residual_stamina_piece: number;
      start_time_of_today: number;
      stamina_recovery_time: number;
      max_followee_num: number;
      dungeon_id: number;
      id: number;
      release_id: number;
      stamina_info: {
        additional_stamina: number;
        current_max_stamina: number;
        prev_max_stamina: number;
        got_stamina_piece: number;
      };
      func_tutorial_flags: {
        [s: string]: boolean;
      }
      name: string;
      has_all_clear_ver_to_show: false;
      stamina: number;
      can_review: true;
      tutorial_step: number;
      followee_num: number;
      stamina_recovery_remaining_time: number;
      gil: number;
      is_update_last_logined_at: false;
      last_logined_at: number;
      max_follower_num: number;
      max_stamina: number;
    }

    user_stamina_recovery_agents: Array<{
      num: number;
      stamina_recovery_agent_id: number;  // 94100001 for stamina potions
    }>;
  };
  textMaster: {
  };
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

// Sample URL: http://ffrk.denagames.com/dff/world/dungeons?world_id=104001
export interface Dungeons {
  dungeons: Array<{
    name: string;
    prologue: string;
    epilogue: string;
    is_clear: boolean;
    is_master: boolean;
    is_new: boolean;
    is_unlocked: boolean;
    prizes: {
      [s: string]: {  // FIXME: is is actually a RewardType
        type_name: ItemTypeName;
        num: number;
        image_path: RelativeUrlPath;
        is_got_grade_bonus_prize: number;
        name: string;
        id: number;
        clear_battle_time?: number;  // Clear time, in milliseconds
      }
    }
  }>;
}

export interface GetBattleInit {
  assets: {
    [assetKey: string]: {
      bundle: {
        // `/Content/lang/ww/compile` path to PNG, JSON, or OGG
        [contentPath: string]: {
          // Hashes are MD5 checksums, base64-encoded, with two trailing `=` stripped.
          hash: string;
        }
      };
      // `/Content/lang/ww/compile` path to PNG or JSON
      assetPath: string;
    }
  };

  battle: {
    is_inescapable: BoolAsString;
    show_timer_type: BoolAsString;

    background: {
      assets: {
        [assetKey: string]: ContentPath;
      }
      animationTime: number;
      animation_info: {
        bgEffectIds: string[];
        id: string;
      }
    }

    rounds: Array<{
      background_change_type: string;  // "0" or "2"; meaning unknown

      enemy: Array<{
        deform_animation_info: Array<{}>;
        is_sp_enemy: BoolAsString;

        children: Array<{
          drop_item_list: DropItem[];
        }>;
      }>;

      drop_materias: Array<{
        buddy_pos: string;    // E.g., "05" for party member 5
        name: string;
        description: string;
        item_id: string;
      }>;
    }>;

    assets: {
      // Simple mapping of asset key to `/Content/lang/ww/compile` path
      [assetKey: string]: ContentPath;
    }
  };
}

export interface WorldBattles {
  battles: Array<{
    sp_enemy_id: number;
    name: string;             // e.g., "Liquid Flame Record"
    user_clear_time: number;  // Clear time in milliseconds
    dungeon_id: number;
    id: number;
  }>;
}

export interface WinBattle {
  result: {
    clear_time_info: {
      clear_battle_time: number;    // Clear time in milliseconds
      can_show_clear_time: number;  // 0 or 1
    };

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
      }
    }
  };
}
