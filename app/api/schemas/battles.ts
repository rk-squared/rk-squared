import { AssetCollection } from './common';
import { DungeonPrizeItem } from './dungeons';
import { User } from './user';

// Sample URL: http://ffrk.denagames.com/dff/world/battles
// or http://ffrk.denagames.com/dff/mo/single/world/battles
export interface Battles {
  success: boolean;
  user_dungeon: UserDungeon;
  party: Party;
  assets: AssetCollection;
  dungeon_session: DungeonSession;
  user_battle_tickets: any[];
  battles: Battle[];
  fellow_session: FellowSession;
  sp_enemies: SPEnemy[];
  user: User;
}

export interface Battle {
  id: number;
  dungeon_id: number;
  name: string;

  battle_ticket_id_2_num: { [key: string]: number };
  round_num: number;
  sp_enemy_id: number;
  order_no: number;
  play_mode: number;
  grade_score_type?: GradeScoreType;
  grade_score?: GradeScore;

  /**
   * Clear time, in milliseconds.  Used for, e.g., magicite.
   */
  user_clear_time?: number;

  has_boss: number;
  stamina: number;
  is_unlocked: boolean;
  has_battle_ticket: number;
  show_timer_type: number;
}

export enum GradeScoreType {
  // noinspection JSUnusedGlobalSymbols
  DECREASED_HP = 3, // Observed with Bomb Brigade
  DECREASED_HP_AND_CLEAR_TIME = 4, // Standard for Neo Torments
}

export interface GradeScore {
  maxHp: number;
  elapsedBattleTimeFromBeginning: number;
  isDefeated: boolean;
  decreasedAmountOfHp: number;
}

export interface DungeonSession {
  closed_at: number;
  party_status: { [key: string]: PartyStatus };
  max_active_skill_num: number;
  is_restricted: number;
  ability_category_bonus_map: {};
  battle_id: number;
  unlocked_series_ids: any[];
  buddy_additional_status_bonus_level: number;
  dungeon_id: number;
  remain_active_skill_num: number;
  max_supporter_ss_gauge: number;
  world_id: number;
  supporter_ss_gauge: number;
  series_id: number;
  opened_at: number;
  kept_out_at: number;
  should_show_progress_effect: boolean;
}

export interface PartyStatus {
  user_buddy_id: number;
  hp: number;
  no: number;
  soul_strike_gauge: number;
  soul_strike_id_to_rest_num: { [key: string]: string };
  ability_1_num: number;
  ability_2_num: number;
  status_ailments: any[];
}

export interface FellowSession {
  has_fellow: boolean;
  fellow_profile: FellowProfile;
  can_follow: boolean;
  status: number;
  can_remake_fellow_list: boolean;
  has_supporter: boolean;
}

export interface FellowProfile {
  supporter_buddy_weapon_hammering_num: number;
  supporter_buddy_armor_hammering_num: number;
  supporter_buddy_sp_mdef: number;
  supporter_buddy_accessory_level: number;
  supporter_buddy_brave_series_ids_map: { [key: string]: number };
  supporter_buddy_armor_max_level: number;
  supporter_buddy_accessory_name: string;
  supporter_buddy_sp_spd: number;
  supporter_buddy_def: number;
  supporter_buddy_series_id: number;
  supporter_buddy_sp_atk: number;
  supporter_buddy_armor_image_path: string;
  supporter_buddy_dress_record: number;
  supporter_buddy_atk: number;
  supporter_buddy_role_type_name: string;
  soul_strike_exp: number;
  via_battle: boolean;
  supporter_buddy_evolution_num: number;
  supporter_buddy_hp: number;
  supporter_buddy_role_type: number;
  supporter_buddy_armor_name: string;
  supporter_buddy_accessory_id: number;
  supporter_buddy_matk: number;
  supporter_buddy_mnd: number;
  supporter_buddy_accessory_series_id: number;
  supporter_buddy_sp_def: number;
  supporter_buddy_armor_series_id: number;
  supporter_buddy_accessory_image_path: string;
  user_id: number;
  supporter_buddy_ability_category: {};
  supporter_buddy_armor_id: number;
  supporter_buddy_id: number;
  supporter_buddy_sp_acc: number;
  supporter_buddy_level: number;
  last_logged_in_at: number;
  profile_message: string;
  supporter_buddy_eva: number;
  supporter_buddy_weapon_max_hammering_num: number;
  supporter_buddy_weapon_name: string;
  supporter_buddy_sp_mnd: number;
  soul_strike: SoulStrike;
  supporter_buddy_weapon_ex_series_id: number;
  supporter_buddy_accessory_max_level: number;
  supporter_buddy_armor_max_hammering_num: number;
  supporter_buddy_job_name: string;
  nickname: string;
  supporter_buddy_weapon_max_level: number;
  supporter_buddy_weapon_id: number;
  supporter_buddy_image_path: string;
  supporter_buddy_weapon_level: number;
  supporter_buddy_acc: number;
  supporter_buddy_sp_hp: number;
  supporter_buddy_weapon_series_id: number;
  supporter_buddy_spd: number;
  supporter_buddy_armor_level: number;
  supporter_buddy_accessory_ex_series_id: number;
  supporter_buddy_sp_matk: number;
  supporter_buddy_sp_eva: number;
  supporter_buddy_mdef: number;
  default_soul_strike_id: number;
  supporter_buddy_weapon_image_path: string;
  supporter_buddy_armor_ex_series_id: number;
}

export interface SoulStrike {
  allowed_buddy_id: number;
  is_common_soul_strike: boolean;
  soul_strike_category_name: string;
  is_unique_soul_strike: boolean;
  has_broken_max_damage_threshold_soul_strike: boolean;
  is_super_soul_strike: boolean;
  recommend_priority: number;
  id: number;
  is_sengi_soul_strike: boolean;
  allowed_buddy_name: string;
  name: string;
  soul_strike_category_id: number;
  is_param_booster_soul_strike: boolean;
  description: string;
  consume_ss_gauge: number;
  combo_explanations: ComboExplanation[];
  required_exp: number;
  is_combo_soul_strike: boolean;
  consume_ss_point: number;
  usable_num: number;
  extensive_description: string;
  is_default_soul_strike: boolean;
  disabled_image_path: string;
  is_burst_soul_strike: boolean;
  is_overflow_ougi_soul_strike: boolean;
  is_ultra_soul_strike: boolean;
  supporter_usable_num: number;
  disp_name: string;
  image_path: string;
  is_overflow_soul_strike: boolean;
  ability_animation_id: number;
  is_standard_soul_strike: boolean;
  is_someones_soul_strike: boolean;
}

export interface ComboExplanation {
  image_path: string;
  condition_text: string;
  effect_text: string;
}

export interface Party {
  beast_id_main: string;
  slot_to_beast_id_sub: { [key: string]: number };
  slot_to_buddy_id: { [key: string]: number };
  user_id: number;
}

export interface SPEnemy {
  deform_animation_info: DeformAnimationInfo[];
  children: Child[];
  id: string;
  battle_list_adjustment: BattleListAdjustment;
  ai_arguments: AIArgument[];
}

export interface AIArgument {
  arg_type: string;
  tag: string;
  arg_value: string;
}

export interface BattleListAdjustment {
  init_tag: string;
  offset_y: number;
  enemy_id: number;
  hidden_children: any[];
  scale: number;
  alter_type: number;
  offset_x: number;
  arrange_type: number;
  alter_asset_key: string;
}

export interface Child {
  enemy_id: string;
  params: Param[];
  child_pos_id: string;
}

export interface Param {
  disp_name: string;
  animation_info: AnimationInfo;
}

export interface AnimationInfo {
  enemy_status_id: string;
  uses_fix_pos: boolean;
  hp_gauge_size: string;
  offset_y: string;
  path: string;
  assets: AnimationInfoAssets;
  scale: string;
  offset_x: string;
}

export interface AnimationInfoAssets {
  'boss-1150009_1': string;
}

export interface DeformAnimationInfo {
  enemy_id: string;
  is_random: boolean;
  deform_tag: string;
  id: string;
  path: string;
  state: string[];
}

export interface UserDungeon {
  unlock_conditions: UnlockConditions;
  closed_at: number;
  order_no: number;
  is_restricted: boolean;
  stamina_consume_type: number;
  supporter_type: number;
  epilogue_image_path: string;
  bgm: string;
  stamina_list: number[];
  ability_category_bonus_map: {};
  unlocked_series_ids: any[];
  id: number;
  world_id: number;
  button_style: string;
  name: string;
  total_stamina: number;
  ss_gauge_type: number;
  has_battle: boolean;
  type: number;
  epilogue: string;
  progress_map_level: number;
  platform_style: number;
  is_clear: boolean;
  is_new: boolean;
  prologue: string;
  buddy_additional_status_bonus_level: number;
  challenge_level: number;
  prizes: { [key: string]: DungeonPrizeItem[] };
  battle_ticket_id_2_num: {};
  battle_drop_items: DungeonPrizeItem[];
  is_master: boolean;
  series_id: number;
  required_max_stamina: number;
  opened_at: number;
  continue_allowable_type: number;
  is_unlocked: boolean;
  prologue_image_path: string;
  rank: number;
  captures: Capture[];
  background_image_path: string;
}

export interface Capture {
  enemy_id: string;
  sp_scores: SPScore[];
  image_path: string;
  tip_battle: TipBattle;
}

export interface SPScore {
  battle_id: number;
  title: string;
}

export interface TipBattle {
  group_id: number;
  html_content: string;
  id: number;
  title: string;
  message: string;
}

export interface UnlockConditions {
  '15048602': string;
}
