export enum ItemType {
  Arcana = 'beast_food',
  Character = 'buddy',
  Common = 'common',
  GrowthEgg = 'grow_egg',
  Orb = 'ability_material',
  Magicite = 'beast',
  MemoryCrystal = 'memory_crystal',
  Relic = 'equipment',
  UpgradeMaterial = 'equipment_sp_material',
}
export type ItemTypeName =
  'BEAST_FOOD' |
  'BUDDY' |
  'COMMON' |
  'GROW_EGG' |
  'ABILITY_MATERIAL' |
  'BEAST' |
  'MEMORY_CRYSTAL' |
  'EQUIPMENT' |
  'EQUIPMENT_SP_MATERIAL';

export const items = [
  {
    name: 'Gil',
    type: ItemType.Common,
    id: 92000000,
  },
  {
    name: 'Stamina Shard',
    type: ItemType.Common,
    id: 94000000,
  },
  {
    name: 'Mythril',
    type: ItemType.Common,
    id: 91000000,
  },
  {
    name: 'Gysahl Greens',
    type: ItemType.Common,
    id: 95001014,
  }
];
