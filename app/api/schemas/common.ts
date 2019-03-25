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
