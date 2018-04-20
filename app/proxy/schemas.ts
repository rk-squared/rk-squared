import { ItemTypeName } from '../data/items';

type BoolAsString = '0' | '1';

// A `/Content/lang/ww/compile` path
type ContentPath = string;

// A `/dff/static/lang/ww/compile` path
type RelativeUrlPath = string;

// Unix timestamp
type Timestamp = number;
type TimestampString = string;

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

    worlds: Array<{
      has_brave_series_buddies: boolean;
      closed_at: Timestamp;
      bgm: string;
      dungeon_status_summary: Array<{
        clear_count: number;
        master_count: number;
      }>;
      door_image_path: RelativeUrlPath;
      dungeon_term_list?: Array<{
        closed_at: TimestampString;
        id: string;
        type: string;
        opened: TimestampString;
      }>;
      series_formal_name: string;
      id: number;
      name: string;
      has_new_dungeon: boolean;
      series_id: number;
      opened_at: number;
      kept_out_at: Timestamp;
      is_unlocked: boolean;
      image_path: RelativeUrlPath;
      type: number;
      banner_message: string;
    }>;

    events: Array<{
      world_id: number;
      battle_list_bg_type: number;
      // challenge (incl. GL Torment), beast, extreme (GL Nightmare), suppress (MO), wday (Power Up Dungeons),
      // rotation (mote dungeons)
      type_name: string;
      has_intro_movie: boolean;
      ex_opened_at: Timestamp;
      order_weight: number;
      image_path: RelativeUrlPath;
      type: number;
      id: number;
      // e.g., "nightmare_dungeon" (Torment), "beast_element_dungeon", "crystal_tower", "ff4_reopen_ww201804"
      tag: string;
      background_image_path: RelativeUrlPath;
    }>;
  };
  textMaster: {
    [s: string]: string;
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
      [s: string]: Array<{  // FIXME: is is actually a RewardType
        type_name: ItemTypeName;
        num: number;
        image_path: RelativeUrlPath;
        is_got_grade_bonus_prize: number;
        name: string;
        id: number;
        clear_battle_time?: number;  // Clear time, in milliseconds
      }>;
    }
  }>;
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
    logic_name: string;  // 'plain' (only used for initial freebie) or 'rarity_assurance'
    box_list: Array<{
      box_id: number;
      rarities: number[];
      entry_point_list: Array<{
        purchased_count: number;
        disp_depth: number;
        closed_at: Timestamp;
        pay_type_name: string;  // "coin" (gems), "item_and_coin"
        entry_point_id: number;
        animation_type_name: string;
        limit_type_name: string;  // e.g., "total", "infinity"
        executable_num: number;   // 1 for 100-gem, 99999 otherwise
        lot_num: number;          // How many items you get
        image_id: number;
        pay_id: number;           // 0 for 100-gem, 91000000 for a Mythril pull
        tag: string;
        pay_cost: number;         // Number of gems or Mythril
        name: string;             // "100-Gem Rare Relic Draw", "Rare Relic Draw x11"
        description: string;
        opened_at: Timestamp;
        coin_cost_of_item_and_coin_payment: number;
        disp_order: number;
        show_closed_at_flg: boolean;
        term_limit_num: number    // 1 for a single-time draw (Realm Dungeon Lucky Draw or 100-gem pull), 0 otherwise
        required_user_item?: {
          num: number;
          image_path: RelativeUrlPath;
          name: string;     // Mythril
          item_id: number;  // 91000000
        }
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
    total_executable_num: number;  // 1 for a one-time banner (Realm Dungeon Lucky Draw), 0 otherwise
    appeal_message: string;
    top_image_path: RelativeUrlPath;
    series_id: number;
    opened_at: Timestamp;
    exchange_shop_id: number;
    show_closed_at_flg: boolean;
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

      drop_item_list: DropItem[];
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

export interface PartyList {
  sphere_materials: Array<{
    created_at: Timestamp;
    num: number;
    image_path: RelativeUrlPath;
    rarity: number;
    name: string;
    id: number;
    description: string;
  }>;
  grow_eggs: Array<{
    exp: number;
    num: number;
    name: string;
    sale_gil: number;
    description: string;
    image_path: RelativeUrlPath;
    rarity: number;
    id: number;
  }>;
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
    hammering_num: number;   // How much it increases augments (i.e., 1 for Rosetta, 0 everywhere else)
  }>;
  dress_records: Array<{
    disp_name: string;       // Name with embedded "{n}"
    image_path: RelativeUrlPath;
    buddy_id: number;
    name: string;
    dress_record_id: number;
  }>;
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
