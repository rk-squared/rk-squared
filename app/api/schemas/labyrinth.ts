import { Capture } from './battles';
import { ItemTypeName } from './common';

export enum DisplayPaintingId {
  GreenCombatant = 100001,
  OrangeCombatant = 100002,
  RedCombatant = 100003,
  Master = 200001,
  Treasure1 = 300101,
  Treasure2 = 300102,
  Treasure3 = 300103,
  Treasure4 = 300104,
  Treasure5 = 300202,
  Treasure6 = 300203,
  Exploration1 = 400001,
  Exploration2 = 400002,
  Exploration3 = 400008,
  Onslaught = 500001,
  Portal = 600001,
  Restoration = 700001,
}

// Sample URL: http://ffrk.denagames.com/dff/event/labyrinth/4500/get_display_paintings
export interface LabyrinthDisplayPaintings {
  success: boolean;

  labyrinth_dungeon_session: LabyrinthDungeonSession;
  labyrinth_items: LabyrinthItem[];
  unsettled_items: {
    num: number;
    image_path: string;
    item_type_name: ItemTypeName;
    item_name: string;
    item_id: number;
    is_buddy_sacred_equipment: boolean;
  }[];
  current_labyrinth_point: number;

  SERVER_TIME: number;
}

export interface LabyrinthDungeonSession {
  current_floor: number;
  labyrinth_point: number;
  party_info: {
    historia_crystal_ids: number[];
    user_equipment_ids: number[];
    user_ability_ids: number[];
    record_materia_ids: number[];
    user_beast_ids: number[];
    user_buddy_ids: number[];
  };
  current_painting_status: number;
  display_paintings: DisplayPainting[];
  addon_record_materia_id_map: { [key: string]: number };
  remaining_painting_num: number;

  // These are present for select_painting and choose_explore_painting,
  // depending on the type of painting selected and the exploration results.
  // They can also be present for get_display_paintings if the user restarts the
  // game while at a painting.
  current_painting?: CurrentPainting;
  explore_painting_event?: ExplorePaintingEvent;
  treasure_chest_ids?: number[];
  dungeon?: Dungeon;
}

interface DisplayPainting {
  /** A DisplayPaintingId value */
  painting_id: number;
  name: string;
  /** Equals the first digit of painting_id */
  type: number;
  /** Sequential number of the painting on this floor */
  no: number;
  is_special_effect: boolean;
  description: string;
  display_type?: number;
  dungeon?: Dungeon;
}

// TODO: Deduplicate with other Dungeon interfaces
export interface Dungeon {
  unlock_conditions: {};
  closed_at: number;
  order_no: number;
  is_restricted: boolean;
  stamina_consume_type: number;
  supporter_type: number;
  epilogue_image_path: string;
  bgm: string;
  is_require_ranking: boolean;
  stamina_list: number[];
  ability_category_bonus_map: {};
  is_auto_lap: boolean;
  unlocked_series_ids: any[];
  id: number;
  world_id: number;
  button_style: string;
  total_stamina: number;
  name: string;
  ss_gauge_type: number;
  has_battle: boolean;
  type: number;
  epilogue: string;
  progress_map_level: number;
  platform_style: number;
  has_field: boolean;
  prologue: string;
  buddy_additional_status_bonus_level: number;
  challenge_level: number;
  prizes: { [key: string]: any[] };
  battle_ticket_id_2_num: {};
  battle_drop_items: any[];
  series_id: number;
  required_max_stamina: number;
  opened_at: number;
  continue_allowable_type: number;
  prologue_image_path: string;
  background_image_path: string;
  captures: Capture[];
}

interface LabyrinthItem {
  num: number;
  labyrinth_item: {
    image_path: string;
    rarity: number;
    name: string;
    id: number;
    sale_gil: number;
    description: string;
  };
}

// Sample URL: http://ffrk.denagames.com/dff/event/labyrinth/4500/select_painting
// This is the request issued when you go to an Exploration or Treasure painting.
export interface LabyrinthSelectPainting {
  success: boolean;

  labyrinth_dungeon_session: LabyrinthDungeonSession;
  current_labyrinth_point: number;

  SERVER_TIME: number;
}

// Sample URL: http://ffrk.denagames.com/dff/event/labyrinth/4500/choose_explore_painting
export interface LabyrinthChooseExplorePainting {
  success: boolean;

  is_hit: boolean;

  labyrinth_dungeon_session: LabyrinthDungeonSession;

  SERVER_TIME: number;
}

export interface CurrentPainting {
  painting_id: number;
  name: string;
  type: number;
  description: string;
}

export interface ExplorePaintingEvent {
  id: number;
  type: number;
  text_master_id: string;
  sub_text_master_id_1: string;
  sub_text_master_id_2: string;
  sub_text_master_id_3: string;
}

// Sample URL: http://ffrk.denagames.com/dff/event/labyrinth/4500/finish_current_painting
export interface LabyrinthFinishPainting {
  success: boolean;
  SERVER_TIME: number;
}

interface RecordMateria {
  record_materia_id: string;
  user_buddy_id: string;
  slot: string;
}

interface Equipment {
  user_equipment_id: string;
  user_buddy_id: string;
  slot: string;
}

interface SoulStrike {
  soul_strike_id: string;
  user_buddy_id: string;
  slot: string;
}

interface LegendMateria {
  legend_materia_id: string;
  user_buddy_id: string;
  slot: string;
}

interface Row {
  row: string;
  user_buddy_id: string;
}

interface Ability {
  user_buddy_id: string;
  user_ability_id: string;
  slot: string;
}

interface MemoryAbrasion {
  memory_abrasion: string;
  user_buddy_id: string;
}

export interface LabyrinthBuddyInfo {
  record_materias: RecordMateria[];
  equipments: Equipment[];
  soul_strikes: SoulStrike[];
  legend_materias: LegendMateria[];
  rows: Row[];
  abilities: Ability[];
  memory_abrasions: MemoryAbrasion[];
}

export interface LabyrinthBuddyInfoData {
  success: boolean;
  labyrinth_buddy_info: LabyrinthBuddyInfo;
  SERVER_TIME: number;
}

export interface SlotToBeastIdSub {
  1: number;
  2: number;
  3: number;
  4: number;
}

export interface SlotToBuddyId {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface Party {
  historia_crystal_id: number;
  enable_talisman_type: number;
  party_no: number;
  beast_id_main: string;
  slot_to_beast_id_sub: SlotToBeastIdSub;
  slot_to_buddy_id: SlotToBuddyId;
  user_id: any;
}

export interface LabyrinthPartyList {
  success: boolean;
  SERVER_TIME: number;
  parties: Party[];
}
