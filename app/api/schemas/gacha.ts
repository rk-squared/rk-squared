import { LegendMateria } from './characters';
import {
  AssetCollection,
  AwakeExplanation,
  BraveInfo,
  BurstCommand,
  ChainExplanation,
  DecimalNumberAsString,
  NumberAsString,
  RelativeUrlPath,
} from './common';
import { Equipment } from './equipment';
import { MemoryCrystal } from './party';
import { ItemPossessionLimit, User } from './user';

// Sample URL: http://ffrk.denagames.com/dff/gacha/show
export interface GachaShow {
  success: boolean;
  SERVER_TIME: number;
  is_closed_sefirosu_event: number;
  gacha_group: GachaGroup[];
  series_list: GachaSeriesList[];
  soul_piece_num: NumberAsString; // mythril amount
  config: GachaConfig;
  bgm_assets: AssetCollection;
}

interface GachaConfig {
  // Cost in gems for a half-price 11x pull
  pay_cost_011_half: number;
  // Cost in gems for a full-price 1x pull
  pay_cost_001: number;
}

/**
 * Used to group together the series happy draws (realms on parade)
 */
export interface GachaGroup {
  priority: number;
  closed_at: number;
  line_up_image_path: string;
  content_series_ids: number[];
  series_id: number;
  opened_at: number;
  tab_type_list: number[];
  show_closed_at_flg: boolean;
  href: string;
  id: number;
}

export interface GachaSeriesList {
  priority: number; // 0 means free daily draw and no-longer-active promos (like the "first relic draw", ID 1000)
  user_exchange_shop_exchanged_num: number;
  closed_at: number;
  rise_message: string;
  is_book_gacha: boolean;
  banner_list: BannerList[];
  line_up_image_path: string;
  logic_name: LogicType;
  box_list: BoxList[];
  is_all_free_payment: boolean;
  user_exchange_shop_prize_num: number;
  show_prob_rise_flg: boolean;
  additional_appeal_type: number;
  bgm: string;
  rise_image_path: string;
  series_name: string;
  tab_type_list: number[];
  bgm_id: number;
  total_executable_num: number;
  appeal_message: string;
  top_image_path: string;
  series_id: number;
  opened_at: number;
  line_up_disable_image_path: string;
  exchange_shop_id: number; // Identifies selectable relics (Acolyte Archives, Wondrous Selects, etc.)?
  show_closed_at_flg: boolean;
}

interface BannerList {
  wiki_url?: null | string;
  banner_image_type: number;
  item_id: number;
  disp_order: number;
  gacha_series_id: number;
  image_path: string;
  font_type: number;
  type: number;
  id: number;
  buddy_image_path: string;
  equipment?: Equipment;
}

interface BoxList {
  match_condition_list: any[];
  box_id: number;
  rarities: number[];
  entry_point_list: EntryPointList[];
}

interface EntryPointList {
  purchased_count: number;
  disp_depth: number;
  closed_at: number;
  pay_type_name: PayType;
  entry_point_id: number;
  is_normal_gacha: boolean;
  animation_type_name: AnimationTypeName;
  limit_type_name: LimitTypeName;
  executable_num: number;
  lot_num: number;
  image_id: number;
  pay_id: number; // 0 for gems or 91000000 for mythril
  required_user_item?: RequiredUserItem;
  tag: string;
  pay_cost: number;
  name: Name;
  description: Description;
  opened_at: number;
  coin_cost_of_item_and_coin_payment: number;
  disp_order: number;
  show_closed_at_flg: boolean;
  term_limit_num: number;
}

enum AnimationTypeName {
  Empty = '',
  Fee = 'fee',
}

enum Description {
  Empty = '',
  NeedTranslateText = '### need_translate_text ###',
}

enum LimitTypeName {
  Infinity = 'infinity',
  Today = 'today',
  Total = 'total',
}

enum Name {
  FirstRelicDraw = 'First Relic Draw',
  Free = 'Free',
  RareRelicDraw = 'Rare Relic Draw',
  RareRelicDrawX11 = 'Rare Relic Draw x11',
  RareRelicDrawX3 = 'Rare Relic Draw x 3',
  The100GemRareRelicDraw = '100-Gem Rare Relic Draw',
}

enum PayType {
  Coin = 'coin',
  Free = 'free',
  Item = 'item',
  ItemAndCoin = 'item_and_coin',
}

/**
 * Items needed to do a relic draw.  This is usually 91000000 ("Mythril"), but
 * Acolyte Archives draws use 95003001 through 95003009.
 */
interface RequiredUserItem {
  num: number;
  image_path: string;
  name: string;
  item_id: number;
}

enum LogicType {
  Plain = 'plain',
  RarityAssurance = 'rarity_assurance',
}

// Sample URL: http://ffrk.denagames.com/dff/exchange_shop/prize_list?shop_id=38
export interface ExchangeShopPrizeList {
  success: boolean;
  assets: {
    [s: string]: AssetCollection;
  };
  memory_crystals: MemoryCrystal[];
  exchange_shop: {
    default_bgm_id: number;
    closed_at: number;
    layout_type: number;
    system_name: string;
    name: string;
    description: string;
    opened_at: number;
    default_bgm_file: string;
    prizes: Prize[];
    required_item_id: number;
    id: number;
  };
  required_user_item: {
    num: number;
    name: string;
    unit_name: string;
    item_id: number;
  };
  SERVER_TIME: number;
}

export interface Prize {
  closed_at: number;
  convert_items: any[];
  exchangeable_num: number;
  opened_at: number;
  exchanged_num: number;
  disp_order: number;
  exchange_shop_id: number;
  image_path: string;
  group_id: number;
  item_package: ItemPackage;
  id: number;
  required_num: number;
}

export interface ItemPackage {
  items_num: number;
  id: number;
  items: PrizeItem[];
}

export interface PrizeItem {
  name: string;
  rarity: number;
  item_id: number;
  item_name: string;
  series_id: number;
  image_path: string;
  allowed_buddy_id: number;
  category_name: string;
  type_name: string; // 'EQUIPMENT'
  num: number;
  item_type_name: string; // 'EQUIPMENT'
  ex_series_id: number;

  soul_strike: PrizeSoulStrike;
  legend_materia: string;

  atk_type: number;
  atk_min: number;
  def_min: number;
  matk_min: number;
  mdef_min: number;
  mnd_min: number;
  acc_min: number;
  eva_min: number;
  hp_min: number;
  atk_max: number;
  def_max: number;
  matk_max: number;
  mdef_max: number;
  mnd_max: number;
  acc_max: number;
  eva_max: number;
  additional_bonus_atk: number;
  additional_bonus_def: number;
  additional_bonus_matk: number;
  additional_bonus_mdef: number;
  additional_bonus_mnd: number;
  additional_bonus_acc: number;
  additional_bonus_eva: number;
  additional_bonus_hp: number;
  critical: number;
  max_level_by_min_evloution_num: number;
  max_level_by_max_evolution_num: number;

  base_hammering_num: number;
  max_hammering_num: number;
  hammering_affect_param_key: string; // 'atk', 'def', 'matk', 'mdef', 'mnd'
  is_hammering_item: string;
  is_usable_as_enhancement_src: number;

  atk_max_of_min_evolution_num: number;
  def_max_of_min_evolution_num: number;
  matk_max_of_min_evolution_num: number;
  mdef_max_of_min_evolution_num: number;
  mnd_max_of_min_evolution_num: number;
  acc_max_of_min_evolution_num: number;
  eva_max_of_min_evolution_num: number;

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

export interface PrizeSoulStrike {
  id: number;
  name: string;
  disp_name: string;
  description: string;
  alias_name: string;
  extensive_description: string;
  image_path: RelativeUrlPath;
  disabled_image_path: RelativeUrlPath;
  allowed_buddy_id: number;
  allowed_buddy_name: string;
  soul_strike_category_id: number;
  soul_strike_category_name: string;

  strength_base: number;

  hp_boost: number;
  atk_boost: number;
  def_boost: number;
  matk_boost: number;
  mdef_boost: number;
  mnd_boost: number;
  spd_boost: number;
  acc_boost: number;
  eva_boost: number;

  cast_time: number;
  consume_ss_gauge: number;
  consume_ss_point: number;
  required_exp: number;
  usable_num: string;
  supporter_usable_num: number;
  recommend_priority: number;

  has_broken_max_damage_threshold_soul_strike: string;
  has_soul_strike_param_booster: number;
  is_awake_soul_strike: string;
  is_burst_soul_strike: string;
  is_combo_soul_strike: string;
  is_common_soul_strike: string;
  is_overflow_ougi_soul_strike: string;
  is_overflow_soul_strike: string;
  is_param_booster_soul_strike: number;
  is_sengi_soul_strike: string;
  is_someones_soul_strike: number;
  is_standard_soul_strike: string;
  is_super_soul_strike: number;
  is_ultra_soul_strike: string;
  is_unique_soul_strike: string;

  exercise_type: number;
  burst_spare_abilities: string;
  combo_explanations: string;
  awake_explanations: string;
  should_skip_supporter_effect: number;
  brave_info: string;

  action_id: number;
  animation_id: number;

  target_range: number;
  target_death: number;
  target_segment: number;
  target_method: number;
  active_target_method: number;
  max_damage_threshold_type: number;
  min_damage_threshold_type: number;
  status_ailments_id: number;
  status_ailments_factor: number;
  counter_enable: number;
  arg1: number;
  arg2: number;
  arg3: number | string;
  arg4: number;
  arg5: number;
  arg6: number | string;
  arg7: number | string;
  arg8: number | string;
  arg9: number;
  arg10: number;
  arg11: number;
  arg12: number;
  arg13: number;
  arg14: number;
  arg15: number;
  arg16: number;
  arg17: number;
  arg18: number;
  arg19: number;
  arg20: number;
  arg21: number;
  arg22: number;
  arg23: number;
  arg24: number;
  arg25: number;
  arg26: number;
  arg27: number;
  arg28: number;
  arg29: number;
  arg30: number;
}

// Sample URL: http://ffrk.denagames.com/dff/gacha/probability?series_id=788
export type GachaProbability = {
  success: boolean;
  significant_figures: {
    rarity: number;
    item: number;
    rarity_free: number;
  };
  SERVER_TIME: number;
} & {
  // Indexed by entry_point_id from GachaShow
  [entryPointId: string]: {
    // e.g., { "3": "60.96000", "4": "25.00000", "5": "8.01999", "6": "6.01999" }
    prob_by_rarity: { [key: string]: string };
    boost_rate_for_assured_lot: DecimalNumberAsString;

    // Note: soul_strike and soul_strike_id aren't actually populated here.
    equipments: Array<Equipment & { probability: DecimalNumberAsString }>;

    is_equal_prob_in_same_rarity: number;
    assured_rarity: string;
  };
};

// Sample URL: http://ffrk.denagames.com/dff/gacha/execute
// Request body: { "entry_point_id": 1799106, "auto_state": 2 }
export interface GachaExecute {
  success: boolean;

  gacha_series_id: NumberAsString;
  gacha_entry_point_id: NumberAsString;
  is_showable: number; // always 1
  acquired_gil: number;
  executable_count: number;

  total_drop_num: number;
  auto_generate_user_equipment_ids: number[]; // unique IDs for new equipment

  updated_entry_point_info: {}; // Always blank, for both regular banners and one-time draws

  assets: AssetCollection;
  user_item_possession_limits: ItemPossessionLimit[];

  drop_item_map: {
    // gives rarity and count of each equipment (relic) pulled
    [relicId: string]: {
      drop_num: number; // count
      rarity: NumberAsString;
    };
  };

  // Items drawn, and their associated soul breaks and legend materia
  items: Equipment[];
  soul_strikes: GachaExecuteSoulStrike[];
  legend_materias: LegendMateria[];

  // Empty arrays, although they could conceivably apply for unusual banners
  // like Black Friday's.
  ability_material: any[];
  ability: any[];
  auto_sold_user_equipment_ids: any[];
  battle_ticket: any[];
  beast: any[];
  beast_food: any[];
  buddy: any[];
  common: any[];
  dress_record: any[];
  equipment_hyper_evolve_material: any[];
  equipment_sp_material: any[];
  grow_egg: any[];
  memory_crystal: any[];
  mo_stamp: any[];
  music_ticket: any[];
  premium_pass: any[];
  record_materia: any[];
  record_tear: any[];
  sphere_material: any[];
  stamina_recovery_agent: any[];

  user: User;
  achieved_book_ids: number[];
  achieved_book_mission_ids: any[];
  SERVER_TIME: number;
}

interface GachaExecuteSoulStrike {
  id: number;
  name: string;
  disp_name: string;
  description: string;
  extensive_description: string;
  image_path: RelativeUrlPath;
  disabled_image_path: RelativeUrlPath;
  allowed_buddy_id: number;
  allowed_buddy_name: string;
  soul_strike_category_id: number;
  soul_strike_category_name: string;

  hp_boost: string;
  atk_boost: string;
  def_boost: string;
  matk_boost: string;
  mdef_boost: string;
  mnd_boost: string;
  spd_boost: string;
  acc_boost: string;
  eva_boost: string;

  consume_ss_point: number;
  consume_ss_gauge: number;
  usable_num: number;
  supporter_usable_num: number;
  recommend_priority: number;
  required_exp: number;

  has_broken_max_damage_threshold_soul_strike: boolean;
  has_soul_strike_param_booster: number;
  is_awake_soul_strike: boolean;
  is_burst_soul_strike: boolean;
  is_combo_soul_strike: boolean;
  is_common_soul_strike: boolean;
  is_default_soul_strike: boolean;
  is_overflow_ougi_soul_strike: boolean;
  is_overflow_soul_strike: boolean;
  is_param_booster_soul_strike: boolean;
  is_sengi_soul_strike: boolean;
  is_someones_soul_strike: boolean;
  is_standard_soul_strike: boolean;
  is_super_soul_strike: boolean;
  is_ultra_soul_strike: boolean;
  is_unique_soul_strike: boolean;

  ability_animation_id: number;

  awake_explanations?: AwakeExplanation[];
  burst_spare_abilities?: BurstCommand[];
  brave_info?: BraveInfo;
  combo_explanations?: ChainExplanation[];
}
