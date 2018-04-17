import * as _ from 'lodash';

export enum ItemType {
  Ability = 'ability',
  Arcana = 'beast_food',
  Character = 'buddy',
  Common = 'common',
  DarkMatter = 'equipment_hyper_evolve_material',
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
  'EQUIPMENT_HYPER_EVOLVE_MATERIAL' |
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
    name: 'Dark Matter (1★)',
    type: ItemType.DarkMatter,
    id: 25096001
  },
  {
    name: 'Dark Matter (2★)',
    type: ItemType.DarkMatter,
    id: 25096002
  },
  {
    name: 'Dark Matter (3★)',
    type: ItemType.DarkMatter,
    id: 25096003
  },
  {
    name: 'Dark Matter (4★)',
    type: ItemType.DarkMatter,
    id: 25096004
  },
  {
    name: 'Dark Matter (5★)',
    type: ItemType.DarkMatter,
    id: 25096005
  },
  {
    name: 'Dark Matter (6★)',
    type: ItemType.DarkMatter,
    id: 25096006
  },

  {
    name: 'Rosetta Stone',
    type: ItemType.UpgradeMaterial,
    id: 25097001
  },
  {
    name: 'Tiny Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098001
  },
  {
    name: 'Small Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098002
  },
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
    name: 'Giant Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098005
  },
  {
    name: 'Tiny Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099001
  },
  {
    name: 'Small Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099002
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
    name: 'Giant Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099005
  },

  {
    name: 'Minor Power Orb',
    type: ItemType.Orb,
    id: 40000001
  },
  {
    name: 'Lesser Power Orb',
    type: ItemType.Orb,
    id: 40000002
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
    name: 'Minor White Orb',
    type: ItemType.Orb,
    id: 40000006
  },
  {
    name: 'Lesser White Orb',
    type: ItemType.Orb,
    id: 40000007
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
    name: 'Minor Black Orb',
    type: ItemType.Orb,
    id: 40000011
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
    name: 'Minor Blue Orb',
    type: ItemType.Orb,
    id: 40000016
  },
  {
    name: 'Lesser Blue Orb',
    type: ItemType.Orb,
    id: 40000017
  },
  {
    name: 'Blue Orb',
    type: ItemType.Orb,
    id: 40000018
  },
  {
    name: 'Greater Blue Orb',
    type: ItemType.Orb,
    id: 40000019
  },
  {
    name: 'Major Blue Orb',
    type: ItemType.Orb,
    id: 40000020
  },
  {
    name: 'Minor Summon Orb',
    type: ItemType.Orb,
    id: 40000021
  },
  {
    name: 'Lesser Summon Orb',
    type: ItemType.Orb,
    id: 40000022
  },
  {
    name: 'Summon Orb',
    type: ItemType.Orb,
    id: 40000023
  },
  {
    name: 'Greater Summon Orb',
    type: ItemType.Orb,
    id: 40000024
  },
  {
    name: 'Major Summon Orb',
    type: ItemType.Orb,
    id: 40000025
  },
  {
    name: 'Minor Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000026
  },
  {
    name: 'Lesser Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000027
  },
  {
    name: 'Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000028
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
    name: 'Minor Fire Orb',
    type: ItemType.Orb,
    id: 40000031
  },
  {
    name: 'Lesser Fire Orb',
    type: ItemType.Orb,
    id: 40000032
  },
  {
    name: 'Fire Orb',
    type: ItemType.Orb,
    id: 40000033
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
    name: 'Minor Ice Orb',
    type: ItemType.Orb,
    id: 40000036
  },
  {
    name: 'Lesser Ice Orb',
    type: ItemType.Orb,
    id: 40000037
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
    name: 'Minor Lightning Orb',
    type: ItemType.Orb,
    id: 40000041
  },
  {
    name: 'Lesser Lightning Orb',
    type: ItemType.Orb,
    id: 40000042
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
    name: 'Minor Earth Orb',
    type: ItemType.Orb,
    id: 40000046
  },
  {
    name: 'Lesser Earth Orb',
    type: ItemType.Orb,
    id: 40000047
  },
  {
    name: 'Earth Orb',
    type: ItemType.Orb,
    id: 40000048
  },
  {
    name: 'Greater Earth Orb',
    type: ItemType.Orb,
    id: 40000049
  },
  {
    name: 'Major Earth Orb',
    type: ItemType.Orb,
    id: 40000050
  },
  {
    name: 'Minor Wind Orb',
    type: ItemType.Orb,
    id: 40000051
  },
  {
    name: 'Lesser Wind Orb',
    type: ItemType.Orb,
    id: 40000052
  },
  {
    name: 'Wind Orb',
    type: ItemType.Orb,
    id: 40000053
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
    name: 'Minor Holy Orb',
    type: ItemType.Orb,
    id: 40000056
  },
  {
    name: 'Lesser Holy Orb',
    type: ItemType.Orb,
    id: 40000057
  },
  {
    name: 'Holy Orb',
    type: ItemType.Orb,
    id: 40000058
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
    name: 'Minor Dark Orb',
    type: ItemType.Orb,
    id: 40000061
  },
  {
    name: 'Lesser Dark Orb',
    type: ItemType.Orb,
    id: 40000062
  },
  {
    name: 'Dark Orb',
    type: ItemType.Orb,
    id: 40000063
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
    name: 'Power Crystal',
    type: ItemType.Orb,
    id: 40000066
  },
  {
    name: 'White Crystal',
    type: ItemType.Orb,
    id: 40000067
  },
  {
    name: 'Black Crystal',
    type: ItemType.Orb,
    id: 40000068
  },
  {
    name: 'Blue Crystal',
    type: ItemType.Orb,
    id: 40000069
  },
  {
    name: 'Summoning Crystal',
    type: ItemType.Orb,
    id: 40000070
  },
  {
    name: 'Non-Elemental Crystal',
    type: ItemType.Orb,
    id: 40000071
  },
  {
    name: 'Fire Crystal',
    type: ItemType.Orb,
    id: 40000072
  },
  {
    name: 'Ice Crystal',
    type: ItemType.Orb,
    id: 40000073
  },
  {
    name: 'Lightning Crystal',
    type: ItemType.Orb,
    id: 40000074
  },
  {
    name: 'Earth Crystal',
    type: ItemType.Orb,
    id: 40000075
  },
  {
    name: 'Wind Crystal',
    type: ItemType.Orb,
    id: 40000076
  },
  {
    name: 'Holy Crystal',
    type: ItemType.Orb,
    id: 40000077
  },
  {
    name: 'Dark Crystal',
    type: ItemType.Orb,
    id: 40000078
  },

  {
    name: 'Crushdown Record',
    type: ItemType.Orb,
    id: 40000080
  },
  {
    name: 'Reraise Record',
    type: ItemType.Orb,
    id: 40000081
  },
  {
    name: 'Neo Bahamut Record',
    type: ItemType.Orb,
    id: 40000082
  },
  {
    name: 'Quadruple Foul Record',
    type: ItemType.Orb,
    id: 40000083
  },
  {
    name: 'Northern Cross Record',
    type: ItemType.Orb,
    id: 40000084
  },
  {
    name: 'Meltdown Record',
    type: ItemType.Orb,
    id: 40000085
  },
  {
    name: 'Curada Record',
    type: ItemType.Orb,
    id: 40000086
  },
  {
    name: 'Affliction Break Record',
    type: ItemType.Orb,
    id: 40000087
  },
  {
    name: 'Dervish Record',
    type: ItemType.Orb,
    id: 40000088
  },
  {
    name: 'Valigarmanda Record',
    type: ItemType.Orb,
    id: 40000089
  },
  {
    name: 'Omega Drive Record',
    type: ItemType.Orb,
    id: 40000090
  },

  {
    name: 'Minor Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000001
  },
  {
    name: 'Lesser Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000002
  },
  {
    name: 'Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000003
  },
  {
    name: 'Greater Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000004
  },
  {
    name: 'Major Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000005
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
    name: 'Spirit Mote (3★)',
    type: ItemType.Mote,
    id: 130100100
  },
  {
    name: 'Spirit Mote (4★)',
    type: ItemType.Mote,
    id: 130100200
  },
  {
    name: 'Spirit Mote (5★)',
    type: ItemType.Mote,
    id: 130100300
  },
  {
    name: 'Dexterity Mote (3★)',
    type: ItemType.Mote,
    id: 130200100
  },
  {
    name: 'Dexterity Mote (4★)',
    type: ItemType.Mote,
    id: 130200200
  },
  {
    name: 'Dexterity Mote (5★)',
    type: ItemType.Mote,
    id: 130200300
  },
  {
    name: 'Vitality Mote (3★)',
    type: ItemType.Mote,
    id: 130300100
  },
  {
    name: 'Vitality Mote (4★)',
    type: ItemType.Mote,
    id: 130300200
  },
  {
    name: 'Vitality Mote (5★)',
    type: ItemType.Mote,
    id: 130300300
  },
  {
    name: 'Wisdom Mote (3★)',
    type: ItemType.Mote,
    id: 130400100
  },
  {
    name: 'Wisdom Mote (4★)',
    type: ItemType.Mote,
    id: 130400200
  },
  {
    name: 'Wisdom Mote (5★)',
    type: ItemType.Mote,
    id: 130400300
  },
  {
    name: 'Bravery Mote (3★)',
    type: ItemType.Mote,
    id: 130500100
  },
  {
    name: 'Bravery Mote (4★)',
    type: ItemType.Mote,
    id: 130500200
  },
  {
    name: 'Bravery Mote (5★)',
    type: ItemType.Mote,
    id: 130500300
  },
  {
    name: 'Spellblade Mote (5★)',
    type: ItemType.Mote,
    id: 131004300
  },
  {
    name: 'Dragoon Mote (5★)',
    type: ItemType.Mote,
    id: 131008300
  },
  {
    name: 'Monk Mote (5★)',
    type: ItemType.Mote,
    id: 131009300
  },
  {
    name: 'Thief Mote (5★)',
    type: ItemType.Mote,
    id: 131010300
  },
  {
    name: 'Knight Mote (5★)',
    type: ItemType.Mote,
    id: 131011300
  },
  {
    name: 'Samurai Mote (5★)',
    type: ItemType.Mote,
    id: 131012300
  },
  {
    name: 'Ninja Mote (5★)',
    type: ItemType.Mote,
    id: 131013300
  },
  {
    name: 'Bard Mote (5★)',
    type: ItemType.Mote,
    id: 131014300
  },
  {
    name: 'Machinist Mote (5★)',
    type: ItemType.Mote,
    id: 131016300
  },
  {
    name: 'Onion Knight Mote (5★)',
    type: ItemType.Mote,
    id: 132001300
  },
  {
    name: 'Eiko Mote (5★)',
    type: ItemType.Mote,
    id: 132002300
  },
];

export const itemsById = _.zipObject(items.map(i => i.id), items);
