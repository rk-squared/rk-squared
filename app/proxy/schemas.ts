type BoolAsString = '0' | '1';

export interface DropItem {
  // "1" through "5", corresponding to stars?
  rarity: number;

  // UID of the parent monster.  Duplicated from parent monster for
  // potions, gil, magicite.
  uid?: string;

  // Type - see enums.  `drop_item_${type}_${rarity}` gives the
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

export interface GetBattleInit {
  is_inescapable: BoolAsString;
  show_timer_type: BoolAsString;

  assets: {
    [assetKey: string]: {
      bundle: {
        // `/Content/lang/ww/compile` path to PNG, JSON, or OGG
        [contentPath: string]: {
          hash: string;
        }
      };
      // `/Content/lang/ww/compile` path to PNG or JSON
      assetPath: string;
    }
  };

  battle: {
    rounds: Array<{
      enemy: Array<{
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
      [assetKey: string]: string;
    }
  };
}