import * as _ from 'lodash';

export enum ItemType {
  Ability = 'ability',
  Arcana = 'beast_food',
  Character = 'buddy',
  Common = 'common',
  GrowthEgg = 'grow_egg',
  Orb = 'ability_material',
  Magicite = 'beast',
  MemoryCrystal = 'memory_crystal',
  Mote = 'sphere_material',
  Relic = 'equipment',
  UpgradeMaterial = 'equipment_sp_material',
}
export type ItemTypeName =
  'ABILITY' |
  'BEAST_FOOD' |
  'BUDDY' |
  'COMMON' |
  'GROW_EGG' |
  'ABILITY_MATERIAL' |
  'BEAST' |
  'MEMORY_CRYSTAL' |
  'EQUIPMENT' |
  'EQUIPMENT_SP_MATERIAL' |
  'SPHERE_MATERIAL';

// Looks up from internal type names to ItemType enum values
function makeItemTypeLookup() {
  const result: {[s: string]: ItemType} = {};
  for (const i of Object.keys(ItemType)) {
    result[ItemType[i as any]] = i as ItemType;
    result[ItemType[i as any].toUpperCase()] = i as ItemType;
  }
  return result;
}
export const ItemTypeLookup = makeItemTypeLookup();

export const items = [
  {
    name: 'Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098003
  },
  {
    name: 'Large Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098004
  },
  {
    name: 'Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099003
  },
  {
    name: 'Large Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099004
  },
  {
    name: 'Power Orb',
    type: ItemType.Orb,
    id: 40000003
  },
  {
    name: 'Greater Power Orb',
    type: ItemType.Orb,
    id: 40000004
  },
  {
    name: 'Major Power Orb',
    type: ItemType.Orb,
    id: 40000005
  },
  {
    name: 'White Orb',
    type: ItemType.Orb,
    id: 40000008
  },
  {
    name: 'Greater White Orb',
    type: ItemType.Orb,
    id: 40000009
  },
  {
    name: 'Major White Orb',
    type: ItemType.Orb,
    id: 40000010
  },
  {
    name: 'Lesser Black Orb',
    type: ItemType.Orb,
    id: 40000012
  },
  {
    name: 'Black Orb',
    type: ItemType.Orb,
    id: 40000013
  },
  {
    name: 'Greater Black Orb',
    type: ItemType.Orb,
    id: 40000014
  },
  {
    name: 'Major Black Orb',
    type: ItemType.Orb,
    id: 40000015
  },
  {
    name: 'Lesser Summon Orb',
    type: ItemType.Orb,
    id: 40000022
  },
  {
    name: 'Lesser Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000027
  },
  {
    name: 'Greater Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000029
  },
  {
    name: 'Major Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000030
  },
  {
    name: 'Greater Fire Orb',
    type: ItemType.Orb,
    id: 40000034
  },
  {
    name: 'Major Fire Orb',
    type: ItemType.Orb,
    id: 40000035
  },
  {
    name: 'Ice Orb',
    type: ItemType.Orb,
    id: 40000038
  },
  {
    name: 'Greater Ice Orb',
    type: ItemType.Orb,
    id: 40000039
  },
  {
    name: 'Major Ice Orb',
    type: ItemType.Orb,
    id: 40000040
  },
  {
    name: 'Lightning Orb',
    type: ItemType.Orb,
    id: 40000043
  },
  {
    name: 'Greater Lightning Orb',
    type: ItemType.Orb,
    id: 40000044
  },
  {
    name: 'Major Lightning Orb',
    type: ItemType.Orb,
    id: 40000045
  },
  {
    name: 'Major Earth Orb',
    type: ItemType.Orb,
    id: 40000050
  },
  {
    name: 'Lesser Wind Orb',
    type: ItemType.Orb,
    id: 40000052
  },
  {
    name: 'Greater Wind Orb',
    type: ItemType.Orb,
    id: 40000054
  },
  {
    name: 'Major Wind Orb',
    type: ItemType.Orb,
    id: 40000055
  },
  {
    name: 'Greater Holy Orb',
    type: ItemType.Orb,
    id: 40000059
  },
  {
    name: 'Major Holy Orb',
    type: ItemType.Orb,
    id: 40000060
  },
  {
    name: 'Greater Dark Orb',
    type: ItemType.Orb,
    id: 40000064
  },
  {
    name: 'Major Dark Orb',
    type: ItemType.Orb,
    id: 40000065
  },
  {
    name: 'Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000003
  },
  {
    name: 'Mythril',
    type: ItemType.Common,
    id: 91000000
  },
  {
    name: 'Gil',
    type: ItemType.Common,
    id: 92000000
  },
  {
    name: 'Stamina Shard',
    type: ItemType.Common,
    id: 94000000
  },
  {
    name: 'Soul of a Hero',
    type: ItemType.Common,
    id: 95001011
  },
  {
    name: 'Memory Crystal Lode',
    type: ItemType.Common,
    id: 95001012
  },
  {
    name: 'Memory Crystal II Lode',
    type: ItemType.Common,
    id: 95001013
  },
  {
    name: 'Gysahl Greens',
    type: ItemType.Common,
    id: 95001014
  },
  {
    name: 'Memory Crystal III Lode',
    type: ItemType.Common,
    id: 95001020
  },
  {
    name: 'Spirit Mote (5★)',
    type: ItemType.Mote,
    id: 130100300
  },
  {
    name: 'Dexterity Mote (5★)',
    type: ItemType.Mote,
    id: 130200300
  },
  {
    name: 'Vitality Mote (5★)',
    type: ItemType.Mote,
    id: 130300300
  },
  {
    name: 'Wisdom Mote (5★)',
    type: ItemType.Mote,
    id: 130400300
  },
  {
    name: 'Bravery Mote (5★)',
    type: ItemType.Mote,
    id: 130500300
  }
];

export const itemsById = _.zipObject(items.map(i => i.id), items);
