import { RelativeUrlPath, Timestamp, TimestampString } from './common';
import { User } from './user';

export enum LimitedRateServiceType {
  // noinspection JSUnusedGlobalSymbols
  HalfPriceDungeonLogic = 14,
  HalfPriceDungeonBanner = 15,
}

export interface CrystalTower {
  layout_type: number;
  name: string;
  top_floor_info: {
    unlock_condition_type: number;
    top_floor_party_type: number;
  };
  crystal_tower_id: number;
  floor_infos: Array<{
    world_id: number;
    floor_icon_id: number;
    dungeon_total_stamina: number;
    floor: number;
    name: string;
    nonreusable_item_type: number;
    dungeon_challenge_level: number;
  }>;
}

export interface Event {
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
}

export interface World {
  has_brave_series_buddies: boolean;
  closed_at: Timestamp;
  bgm: string;
  dungeon_status_summary: {
    '1'?: {
      clear_count: number;
      master_count: number;
    };
    '2'?: {
      clear_count: number;
      master_count: number;
    };
  };
  door_image_path: RelativeUrlPath;
  dungeon_term_list: null | Array<{
    closed_at: TimestampString;
    id: string;
    type: string;
    opened_at: TimestampString;
  }>;
  series_formal_name: string;
  id: number;
  name: string;
  has_new_dungeon: boolean;
  series_id: number;
  opened_at: number;
  kept_out_at: Timestamp;
  is_unlocked: boolean; // May be false for events that are not yet entered
  image_path: RelativeUrlPath;
  type: number;
  banner_message: string;
}

export interface TextMaster {
  [s: string]: string;
}

// Data extracted from the main http://ffrk.denagames.com/dff/ startup request
export interface Main {
  appInitData: {
    crystal_towers: CrystalTower[];
    events: Event[];

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

    user: User;

    user_stamina_recovery_agents: Array<{
      num: number;
      stamina_recovery_agent_id: number; // 94100001 for stamina potions
    }>;

    worlds: World[];
  };
  textMaster: TextMaster;
}
