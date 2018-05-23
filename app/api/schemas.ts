import { ItemTypeName } from '../data/items';

type BoolAsString = '0' | '1';

// A `/Content/lang/ww/compile` path
type ContentPath = string;

// A `/dff/static/lang/ww/compile` path
type RelativeUrlPath = string;

// Unix timestamp
type Timestamp = number;
type TimestampString = string;

export enum LimitedRateServiceType {
  HalfPriceDungeonLogic = 14,
  HalfPriceDungeonBanner = 15,
}

export enum RecordMateriaEffectType {
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

export enum RewardType {
  Completion = '1',
  FirstTime = '2',
  Mastery = '3',
  Bonus = '7'
}

interface Asset {
  bundle: {
    // `/Content/lang/ww/compile` path to PNG, JSON, or OGG
    [contentPath: string]: {
      // Hashes are MD5 checksums, base64-encoded, with two trailing `=` stripped.
      hash: string;
    }
  };
  assetPath: ContentPath;
}

interface Equipment {
  name: string;
  id: number;
  equipment_id: number;
  series_id: number;
  rarity: number;
  is_locked: boolean;
  created_at: Timestamp;
  category_id: number;     // 2 = Sword
  category_name: string;   // e.g., "Sword"
  equipment_type: number;  // 1 = weapon, 2 = armor, 3 = accessory
  is_weapon: boolean;
  is_armor: boolean;
  is_accessory: boolean;
  base_rarity: number;
  image_path: RelativeUrlPath;
  detail_image_path: RelativeUrlPath;
  thumbnail_path: RelativeUrlPath;
  sale_gil: number;
  ex_series_id: number;  // always 0

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

  atk_type: number;  // 0 = not a weapon, 1 = melee, 2 = ranged
  critical: number;  // 3 for most weapons, 5 for claws (and a few others?), 0 for non-weapons (and some weapons?)
  atk_ss_point_factor: number;  // always 0
  def_ss_point_factor: number;  // always 0

  allowed_buddy_id: number;  // always 0
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
  hammering_affect_param_key: string;     // e.g., "atk"
  hammering_num: number;                  // Current number of augments
  max_hammering_num: number;              // Maximum number of augments
  series_hammering_num: number;           // Synergy augments - equals ceil(hammering_num * 1.5)
  max_evolution_num: number;
  max_hyper_evolution_num: number;
  evolution_num: number;
  is_max_evolution_num: boolean;
  evol_max_level_of_base_rarity: {
    [s1: string]: {
      [s2: string]: number
    }
  };
  hyper_evolve_recipe: {
    materials: Array<{
      num: number;
      hyper_evolve_material_id: number;
    }>
    gil: number;
  };
  is_usable_as_enhancement_src: boolean;       // true for weapons and armor, false for accessories
  is_usable_as_enhancement_material: boolean;  // true for weapons and armor, false for accessories
  can_hyper_evolve_potentially: boolean;       // true for weapons and armor, false for accessories
  is_hammering_item: boolean;                  // always false

  // - Elemental boost: type 1, arg 120 for 20% bonus damage
  //   100 = fire, 101 = ice, 102 = lightning, 103 = earth, 104 = wind, 105 = water,
  //   106 = holy, 107 = dark, 108 = poison
  // - Resist element: type 2, arg 1 for vulnerable, 2 for minor, 4 for moderate, 7 for major
  // - Inflict debuff: type 3, arg 5 for "small chance"
  //   200 = poison, 201 = silence, 202 = paralyze, 203 = confuse, 205 = slow, 206 = stop,
  //   210 = blind, 211 = sleep, 212 = petrify, 214 = instant KO, 242 = interrupt
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
      is_unlocked: boolean;  // May be false for events that are not yet entered
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

    limited_rate_services?: Array<{
      // For a 1/2 stamina banner image, this is wait_sec_to_close 258570,
      // img_path, type 15, wait_sec_to_open 0.
      //
      // For a 1/2 stamina internal data, this is rate "0.5", dungeon_id_map,
      // play_mode 0, is_host 0, wait_sec_to_close 258570, type 14,
      // wait_sec_to_open 0.
      play_mode?: number;
      is_host?: number;
      rate?: string;
      dungeon_id_map?: { [id: string]: number };
      img_path?: RelativeUrlPath;
      type: LimitedRateServiceType;
      wait_sec_to_open: number;
      wait_sec_to_close: number;
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

export interface DungeonPrizeItem {
  type_name: ItemTypeName;
  num: number;
  image_path: RelativeUrlPath;
  is_got_grade_bonus_prize: number;
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

// Sample URL: http://ffrk.denagames.com/dff/world/dungeons?world_id=104001
export interface Dungeons {
  assets: Asset[];

  // Assets for Nightmare dungeons
  room_of_abyss_assets?: {
    common: {
      [s: string]: Asset;
    }
    picture: {
      [s: string]: Asset;
    }
  };

  dungeons: Dungeon[];
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
    [assetKey: string]: Asset;
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

  equipments: Equipment[];
}

// URL: http://ffrk.denagames.com/dff/achievement_room/get_released_record_materia_list
export interface ReleasedRecordMateriaList {
  record_materias: Array<{
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
  }>;
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
    is_locked: number;   // always false
    type: number;        // always 7
  }>;
}

export interface UpdateUserSession {
  success: boolean;
  user_session_key: string;
  SERVER_TIME: number;
}

// http://ffrk.denagames.com/dff/warehouse/get_equipment_list
export interface WarehouseGetEquipmentList {
  equipments: Array<{
    equipment_id: number;
    name: string;
    category_name: string;
    series_id: number;
    equipment_type: number;
    is_locked: boolean;
    category_id: number;
    created_at: Timestamp;
    image_path: RelativeUrlPath;
    ex_series_id: number;
    rarity: number;
    id: number;
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

    dungeon_id: string;
    dungeon_rank: number;
    is_dungeon_clear: number | null;

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

    unlock_dungeons: Array<{
      world_id: string;
      dungeon_id: string;
      name: string;
      is_force: boolean;
      world_name: string;
    }>;
  };
}
