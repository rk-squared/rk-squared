import { RelativeUrlPath, Timestamp, TimestampString } from './common';

export enum LimitedRateServiceType {
  // noinspection JSUnusedGlobalSymbols
  HalfPriceDungeonLogic = 14,
  HalfPriceDungeonBanner = 15,
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
      clear_count: number
      master_count: number;
    };
    '2'?: {
      clear_count: number
      master_count: number;
    };
  };
  door_image_path: RelativeUrlPath;
  dungeon_term_list: null | Array<{
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
}

export interface TextMaster {
  [s: string]: string;
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

    worlds: World[];

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
  };
  textMaster: TextMaster;
}
