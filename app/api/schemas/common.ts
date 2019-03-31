export type BoolAsNumber = 0 | 1;
export type BoolAsString = '0' | '1';

// A number string
export type NumberAsString = string;
export type DecimalNumberAsString = string;

// A `/Content/lang/ww/compile` path
export type ContentPath = string;

// A `/dff/static/lang/ww/compile` path
export type RelativeUrlPath = string;

// Unix timestamp
export type Timestamp = number;
export type TimestampString = string;

export interface Asset {
  bundle: {
    // `/Content/lang/ww/compile` path to PNG, JSON, or OGG
    [contentPath: string]: {
      // Hashes are MD5 checksums, base64-encoded, with two trailing `=` stripped.
      hash: string;
    };
  };
  assetPath: ContentPath;
}

export interface AssetCollection {
  [assetKey: string]: Asset;
}

export type ItemTypeName =
  | 'ABILITY'
  | 'ABILITY_MATERIAL'
  | 'BATTLE_TICKET'
  | 'BEAST'
  | 'BEAST_FOOD'
  | 'BUDDY'
  | 'COMMON'
  | 'DRESS_RECORD'
  | 'EQUIPMENT'
  | 'EQUIPMENT_HYPER_EVOLVE_MATERIAL'
  | 'EQUIPMENT_SP_MATERIAL'
  | 'GROW_EGG'
  | 'MEMORY_CRYSTAL'
  | 'MUSIC_TICKET'
  | 'RECORD_MATERIA'
  | 'RECORD_TEAR'
  | 'SPHERE_MATERIAL';

// Soul break components - soul breaks themselves have different forms in different contexts
export interface AwakeExplanation {
  name_text: string;
  description_text: string;
}
export interface BraveInfo {
  brave_abilities: BraveAbility[];
  level_up_condition_text: 'Use a thief ability.';
  brave_level_map_ability: BraveAbility;
}
interface BraveAbility {
  type_name: string; // e.g., 'ABILITY'
  arg1: number;
  target_range: number;
  command_icon_path: string;
  name: string;
  category_name: string;
  description: string;
  item_id: number;
  level?: number;
  rarity: number;
  max_grade: number;
}
export interface BurstCommand {
  category_type: number;
  panel_name: string;
  target_range: number;
  command_icon_path: RelativeUrlPath;
  name: string;
  category_name: string; // e.g., 'White Magic'
  thumbnail_path: RelativeUrlPath;
  description: string;
  category_id: number;
  animation_id: number;
  image_path: RelativeUrlPath;
  rarity: number;
  disable_generation: boolean;
  display_category_id: number;
}
export interface ChainExplanation {
  image_path: string;
  condition_text: string;
  effect_text: string;
}
