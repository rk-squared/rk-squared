import * as _ from 'lodash';

export enum ItemType {
  Ability = 'ability',
  Arcana = 'beast_food',
  BattleTicket = 'battle_ticket',
  Character = 'buddy',
  Common = 'common',
  CrystalWater = 'record_tear',
  DarkMatter = 'equipment_hyper_evolve_material',
  DressRecord = 'dress_record',
  GrowthEgg = 'grow_egg',
  HistoriaTail = 'historia_crystal_enhancement_material',
  HistoriaSoul = 'historia_crystal_evolution_material',
  Orb = 'ability_material',
  Magicite = 'beast',
  MemoryCrystal = 'memory_crystal',
  Mote = 'sphere_material',
  Music = 'music_ticket',
  RecordMateria = 'record_materia',
  Relic = 'equipment',
  UpgradeMaterial = 'equipment_sp_material',

  // Special case: Not a normal item, but useful for cases like dungeon chests
  DropItem = 'drop_item',
}

export enum DropItemId {
  Chest1Star = 100007,
}

export const itemTypeDescription: { [t in ItemType]: string } = {
  [ItemType.Ability]: 'Abilities',
  [ItemType.Arcana]: 'Arcana',
  [ItemType.BattleTicket]: 'Battle Tickets',
  [ItemType.Character]: 'Characters',
  [ItemType.Common]: 'Mythril, MC Nodes, etc.',
  [ItemType.CrystalWater]: 'Crystal Water',
  [ItemType.DarkMatter]: 'Dark Matter',
  [ItemType.DressRecord]: 'Dress Records',
  [ItemType.DropItem]: 'Item Drops',
  [ItemType.GrowthEgg]: 'Growth Eggs',
  [ItemType.HistoriaTail]: 'Historia',
  [ItemType.HistoriaSoul]: 'Historia Souls',
  [ItemType.Orb]: 'Orbs',
  [ItemType.Magicite]: 'Magicite',
  [ItemType.MemoryCrystal]: 'Memory Crystals',
  [ItemType.Mote]: 'Motes',
  [ItemType.Music]: 'Music Records',
  [ItemType.RecordMateria]: 'Record Materia',
  [ItemType.Relic]: 'Relics',
  [ItemType.UpgradeMaterial]: 'Upgrades',
};

// Looks up from internal type names to ItemType enum values
function makeItemTypeLookup() {
  const result: { [s: string]: ItemType } = {};
  for (const i of Object.keys(ItemType)) {
    result[(ItemType as any)[i]] = i as ItemType;
    result[(ItemType as any)[i].toUpperCase()] = i as ItemType;
  }
  return result;
}
export const ItemTypeLookup = makeItemTypeLookup();

export function formatRelicName({ name, realm }: { name: string; realm: string | null }): string {
  return realm && realm !== '-' ? `${name} (${realm})` : name;
}

export interface Item {
  name: string;
  type: ItemType;
  id: number;
}

/**
 * A few select item IDs are important enough to duplicate as enums.
 */
export enum ItemId {
  Mythril = 91000000,
}

export const items: Item[] = [
  {
    // "A Shocking Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9630871,
  },
  {
    // "A Chilling Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9631221,
  },
  {
    // "A Soggy Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9631351,
  },
  {
    // "A Howling Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9631571,
  },
  {
    // "A Stony Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9631741,
  },
  {
    // "A Radiant Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9631961,
  },
  {
    // "A Shadowy Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9632211,
  },
  {
    // "A Heated Request"
    name: 'Rush Ticket',
    type: ItemType.BattleTicket,
    id: 9632241,
  },

  {
    name: "Large Rat's Tail",
    type: ItemType.HistoriaTail,
    id: 24098027,
  },
  {
    name: "Huge Rat's Tail",
    type: ItemType.HistoriaTail,
    id: 24098028,
  },
  {
    name: 'Historia Soul 1 (FFT)',
    type: ItemType.HistoriaSoul,
    id: 24099022,
  },
  {
    name: 'Historia Soul 1 (FF Type-0)',
    type: ItemType.HistoriaSoul,
    id: 24099023,
  },
  {
    name: 'Historia Soul 2 (FFT)',
    type: ItemType.HistoriaSoul,
    id: 24099040,
  },
  {
    name: 'Historia Soul 2 (FF Type-0)',
    type: ItemType.HistoriaSoul,
    id: 24099041,
  },
  {
    name: 'Historia Soul 3 (FFT)',
    type: ItemType.HistoriaSoul,
    id: 24099058,
  },
  {
    name: 'Historia Soul 3 (FF Type-0)',
    type: ItemType.HistoriaSoul,
    id: 24099059,
  },

  {
    name: 'Dark Matter (1★)',
    type: ItemType.DarkMatter,
    id: 25096001,
  },
  {
    name: 'Dark Matter (2★)',
    type: ItemType.DarkMatter,
    id: 25096002,
  },
  {
    name: 'Dark Matter (3★)',
    type: ItemType.DarkMatter,
    id: 25096003,
  },
  {
    name: 'Dark Matter (4★)',
    type: ItemType.DarkMatter,
    id: 25096004,
  },
  {
    name: 'Dark Matter (5★)',
    type: ItemType.DarkMatter,
    id: 25096005,
  },
  {
    name: 'Dark Matter (6★)',
    type: ItemType.DarkMatter,
    id: 25096006,
  },

  {
    name: 'Rosetta Stone',
    type: ItemType.UpgradeMaterial,
    id: 25097001,
  },
  {
    name: 'Rainbow Crystal',
    type: ItemType.UpgradeMaterial,
    id: 25097002,
  },
  {
    name: 'Tiny Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098001,
  },
  {
    name: 'Small Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098002,
  },
  {
    name: 'Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098003,
  },
  {
    name: 'Large Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098004,
  },
  {
    name: 'Giant Scarletite',
    type: ItemType.UpgradeMaterial,
    id: 25098005,
  },
  {
    name: 'Tiny Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099001,
  },
  {
    name: 'Small Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099002,
  },
  {
    name: 'Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099003,
  },
  {
    name: 'Large Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099004,
  },
  {
    name: 'Giant Adamantite',
    type: ItemType.UpgradeMaterial,
    id: 25099005,
  },

  {
    name: 'Minor Power Orb',
    type: ItemType.Orb,
    id: 40000001,
  },
  {
    name: 'Lesser Power Orb',
    type: ItemType.Orb,
    id: 40000002,
  },
  {
    name: 'Power Orb',
    type: ItemType.Orb,
    id: 40000003,
  },
  {
    name: 'Greater Power Orb',
    type: ItemType.Orb,
    id: 40000004,
  },
  {
    name: 'Major Power Orb',
    type: ItemType.Orb,
    id: 40000005,
  },
  {
    name: 'Minor White Orb',
    type: ItemType.Orb,
    id: 40000006,
  },
  {
    name: 'Lesser White Orb',
    type: ItemType.Orb,
    id: 40000007,
  },
  {
    name: 'White Orb',
    type: ItemType.Orb,
    id: 40000008,
  },
  {
    name: 'Greater White Orb',
    type: ItemType.Orb,
    id: 40000009,
  },
  {
    name: 'Major White Orb',
    type: ItemType.Orb,
    id: 40000010,
  },
  {
    name: 'Minor Black Orb',
    type: ItemType.Orb,
    id: 40000011,
  },
  {
    name: 'Lesser Black Orb',
    type: ItemType.Orb,
    id: 40000012,
  },
  {
    name: 'Black Orb',
    type: ItemType.Orb,
    id: 40000013,
  },
  {
    name: 'Greater Black Orb',
    type: ItemType.Orb,
    id: 40000014,
  },
  {
    name: 'Major Black Orb',
    type: ItemType.Orb,
    id: 40000015,
  },
  {
    name: 'Minor Blue Orb',
    type: ItemType.Orb,
    id: 40000016,
  },
  {
    name: 'Lesser Blue Orb',
    type: ItemType.Orb,
    id: 40000017,
  },
  {
    name: 'Blue Orb',
    type: ItemType.Orb,
    id: 40000018,
  },
  {
    name: 'Greater Blue Orb',
    type: ItemType.Orb,
    id: 40000019,
  },
  {
    name: 'Major Blue Orb',
    type: ItemType.Orb,
    id: 40000020,
  },
  {
    name: 'Minor Summon Orb',
    type: ItemType.Orb,
    id: 40000021,
  },
  {
    name: 'Lesser Summon Orb',
    type: ItemType.Orb,
    id: 40000022,
  },
  {
    name: 'Summon Orb',
    type: ItemType.Orb,
    id: 40000023,
  },
  {
    name: 'Greater Summon Orb',
    type: ItemType.Orb,
    id: 40000024,
  },
  {
    name: 'Major Summon Orb',
    type: ItemType.Orb,
    id: 40000025,
  },
  {
    name: 'Minor Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000026,
  },
  {
    name: 'Lesser Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000027,
  },
  {
    name: 'Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000028,
  },
  {
    name: 'Greater Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000029,
  },
  {
    name: 'Major Non-Elemental Orb',
    type: ItemType.Orb,
    id: 40000030,
  },
  {
    name: 'Minor Fire Orb',
    type: ItemType.Orb,
    id: 40000031,
  },
  {
    name: 'Lesser Fire Orb',
    type: ItemType.Orb,
    id: 40000032,
  },
  {
    name: 'Fire Orb',
    type: ItemType.Orb,
    id: 40000033,
  },
  {
    name: 'Greater Fire Orb',
    type: ItemType.Orb,
    id: 40000034,
  },
  {
    name: 'Major Fire Orb',
    type: ItemType.Orb,
    id: 40000035,
  },
  {
    name: 'Minor Ice Orb',
    type: ItemType.Orb,
    id: 40000036,
  },
  {
    name: 'Lesser Ice Orb',
    type: ItemType.Orb,
    id: 40000037,
  },
  {
    name: 'Ice Orb',
    type: ItemType.Orb,
    id: 40000038,
  },
  {
    name: 'Greater Ice Orb',
    type: ItemType.Orb,
    id: 40000039,
  },
  {
    name: 'Major Ice Orb',
    type: ItemType.Orb,
    id: 40000040,
  },
  {
    name: 'Minor Lightning Orb',
    type: ItemType.Orb,
    id: 40000041,
  },
  {
    name: 'Lesser Lightning Orb',
    type: ItemType.Orb,
    id: 40000042,
  },
  {
    name: 'Lightning Orb',
    type: ItemType.Orb,
    id: 40000043,
  },
  {
    name: 'Greater Lightning Orb',
    type: ItemType.Orb,
    id: 40000044,
  },
  {
    name: 'Major Lightning Orb',
    type: ItemType.Orb,
    id: 40000045,
  },
  {
    name: 'Minor Earth Orb',
    type: ItemType.Orb,
    id: 40000046,
  },
  {
    name: 'Lesser Earth Orb',
    type: ItemType.Orb,
    id: 40000047,
  },
  {
    name: 'Earth Orb',
    type: ItemType.Orb,
    id: 40000048,
  },
  {
    name: 'Greater Earth Orb',
    type: ItemType.Orb,
    id: 40000049,
  },
  {
    name: 'Major Earth Orb',
    type: ItemType.Orb,
    id: 40000050,
  },
  {
    name: 'Minor Wind Orb',
    type: ItemType.Orb,
    id: 40000051,
  },
  {
    name: 'Lesser Wind Orb',
    type: ItemType.Orb,
    id: 40000052,
  },
  {
    name: 'Wind Orb',
    type: ItemType.Orb,
    id: 40000053,
  },
  {
    name: 'Greater Wind Orb',
    type: ItemType.Orb,
    id: 40000054,
  },
  {
    name: 'Major Wind Orb',
    type: ItemType.Orb,
    id: 40000055,
  },
  {
    name: 'Minor Holy Orb',
    type: ItemType.Orb,
    id: 40000056,
  },
  {
    name: 'Lesser Holy Orb',
    type: ItemType.Orb,
    id: 40000057,
  },
  {
    name: 'Holy Orb',
    type: ItemType.Orb,
    id: 40000058,
  },
  {
    name: 'Greater Holy Orb',
    type: ItemType.Orb,
    id: 40000059,
  },
  {
    name: 'Major Holy Orb',
    type: ItemType.Orb,
    id: 40000060,
  },
  {
    name: 'Minor Dark Orb',
    type: ItemType.Orb,
    id: 40000061,
  },
  {
    name: 'Lesser Dark Orb',
    type: ItemType.Orb,
    id: 40000062,
  },
  {
    name: 'Dark Orb',
    type: ItemType.Orb,
    id: 40000063,
  },
  {
    name: 'Greater Dark Orb',
    type: ItemType.Orb,
    id: 40000064,
  },
  {
    name: 'Major Dark Orb',
    type: ItemType.Orb,
    id: 40000065,
  },
  {
    name: 'Power Crystal',
    type: ItemType.Orb,
    id: 40000066,
  },
  {
    name: 'White Crystal',
    type: ItemType.Orb,
    id: 40000067,
  },
  {
    name: 'Black Crystal',
    type: ItemType.Orb,
    id: 40000068,
  },
  {
    name: 'Blue Crystal',
    type: ItemType.Orb,
    id: 40000069,
  },
  {
    name: 'Summoning Crystal',
    type: ItemType.Orb,
    id: 40000070,
  },
  {
    name: 'Non-Elemental Crystal',
    type: ItemType.Orb,
    id: 40000071,
  },
  {
    name: 'Fire Crystal',
    type: ItemType.Orb,
    id: 40000072,
  },
  {
    name: 'Ice Crystal',
    type: ItemType.Orb,
    id: 40000073,
  },
  {
    name: 'Lightning Crystal',
    type: ItemType.Orb,
    id: 40000074,
  },
  {
    name: 'Earth Crystal',
    type: ItemType.Orb,
    id: 40000075,
  },
  {
    name: 'Wind Crystal',
    type: ItemType.Orb,
    id: 40000076,
  },
  {
    name: 'Holy Crystal',
    type: ItemType.Orb,
    id: 40000077,
  },
  {
    name: 'Dark Crystal',
    type: ItemType.Orb,
    id: 40000078,
  },

  {
    name: 'Ultima Record',
    type: ItemType.Orb,
    id: 40000079,
  },
  {
    name: 'Crushdown Record',
    type: ItemType.Orb,
    id: 40000080,
  },
  {
    name: 'Reraise Record',
    type: ItemType.Orb,
    id: 40000081,
  },
  {
    name: 'Neo Bahamut Record',
    type: ItemType.Orb,
    id: 40000082,
  },
  {
    name: 'Quadruple Foul Record',
    type: ItemType.Orb,
    id: 40000083,
  },
  {
    name: 'Northern Cross Record',
    type: ItemType.Orb,
    id: 40000084,
  },
  {
    name: 'Meltdown Record',
    type: ItemType.Orb,
    id: 40000085,
  },
  {
    name: 'Curada Record',
    type: ItemType.Orb,
    id: 40000086,
  },
  {
    name: 'Affliction Break Record',
    type: ItemType.Orb,
    id: 40000087,
  },
  {
    name: 'Dervish Record',
    type: ItemType.Orb,
    id: 40000088,
  },
  {
    name: 'Valigarmanda Record',
    type: ItemType.Orb,
    id: 40000089,
  },
  {
    name: 'Omega Drive Record',
    type: ItemType.Orb,
    id: 40000090,
  },
  {
    name: 'Blastspell Strike Record',
    type: ItemType.Orb,
    id: 40000099,
  },
  {
    name: 'Stormspell Strike Record',
    type: ItemType.Orb,
    id: 40000100,
  },
  {
    name: 'Inferno Assault Record',
    type: ItemType.Orb,
    id: 40000101,
  },
  {
    name: 'Voltech Record',
    type: ItemType.Orb,
    id: 40000102,
  },
  {
    name: 'Chain Firaja Record',
    type: ItemType.Orb,
    id: 40000103,
  },
  {
    name: 'Chain Thundaja Record',
    type: ItemType.Orb,
    id: 40000104,
  },
  {
    name: 'Chain Stoneja Record',
    type: ItemType.Orb,
    id: 40000105,
  },
  {
    name: 'Ironfist Earth Record',
    type: ItemType.Orb,
    id: 40000106,
  },
  {
    name: 'Ironfist Fire Record',
    type: ItemType.Orb,
    id: 40000107,
  },
  {
    name: 'Flash Disaster Record',
    type: ItemType.Orb,
    id: 40000108,
  },
  {
    name: 'Fire Assault Record',
    type: ItemType.Orb,
    id: 40000109,
  },
  {
    name: 'Storm Assault Record',
    type: ItemType.Orb,
    id: 40000110,
  },
  {
    name: 'Lunar Leviathan Record',
    type: ItemType.Orb,
    id: 40000111,
  },
  {
    name: 'Sapphire Bullet Record',
    type: ItemType.Orb,
    id: 40000112,
  },
  {
    name: 'Chain Waterja Record',
    type: ItemType.Orb,
    id: 40000113,
  },
  {
    name: 'Dark Valefor Record',
    type: ItemType.Orb,
    id: 40000114,
  },
  {
    name: 'Lunatic Thunder Record',
    type: ItemType.Orb,
    id: 40000115,
  },
  {
    name: 'Tremor Assault Record',
    type: ItemType.Orb,
    id: 40000116,
  },
  {
    name: 'Healing Smite Record',
    type: ItemType.Orb,
    id: 40000117,
  },
  {
    name: 'Fire-Touched Blade Record',
    type: ItemType.Orb,
    id: 40000118,
  },
  {
    name: 'Burnt Offering Record',
    type: ItemType.Orb,
    id: 40000119,
  },
  {
    name: 'Lunar Ifrit Record',
    type: ItemType.Orb,
    id: 40000120,
  },
  {
    name: 'Frost-Touched Blade Record',
    type: ItemType.Orb,
    id: 40000121,
  },
  {
    name: 'Icy Offering Record',
    type: ItemType.Orb,
    id: 40000122,
  },
  {
    name: 'Chilling Blizzard Record',
    type: ItemType.Orb,
    id: 40000123,
  },
  {
    name: "Demon's Cross Record",
    type: ItemType.Orb,
    id: 40000124,
  },
  {
    name: 'Necro Countdown Record',
    type: ItemType.Orb,
    id: 40000125,
  },
  {
    name: 'Holyja Record',
    type: ItemType.Orb,
    id: 40000126,
  },
  {
    name: 'Chain Tornado Record',
    type: ItemType.Orb,
    id: 40000127,
  },
  {
    name: 'Lunar Dragon Record',
    type: ItemType.Orb,
    id: 40000128,
  },
  {
    name: 'Chain Blizzaja Record',
    type: ItemType.Orb,
    id: 40000129,
  },
  {
    name: 'Impulse Dive Record',
    type: ItemType.Orb,
    id: 40000130,
  },
  {
    name: 'Ironfist Ice Record',
    type: ItemType.Orb,
    id: 40000131,
  },
  {
    name: 'Plasma Shock Record',
    type: ItemType.Orb,
    id: 40000132,
  },
  {
    name: 'Ripping Plasma Record',
    type: ItemType.Orb,
    id: 40000133,
  },
  {
    name: 'Icicle Bullet Record',
    type: ItemType.Orb,
    id: 40000134,
  },
  {
    name: 'Touched by Darkness Record',
    type: ItemType.Orb,
    id: 40000135,
  },
  {
    name: 'Azure Unending Record',
    type: ItemType.Orb,
    id: 40000136,
  },
  {
    name: 'Gaia Force Record',
    type: ItemType.Orb,
    id: 40000137,
  },
  {
    name: 'Quake Swing Record',
    type: ItemType.Orb,
    id: 40000138,
  },
  {
    name: 'Hurricane Bolt Record',
    type: ItemType.Orb,
    id: 40000139,
  },
  {
    name: 'Brothers Record',
    type: ItemType.Orb,
    id: 40000140,
  },
  {
    name: 'Passionate Salsa Record',
    type: ItemType.Orb,
    id: 40000141,
  },
  {
    name: 'Dark Ixion Record',
    type: ItemType.Orb,
    id: 40000142,
  },
  {
    name: 'Spirited Dispatch Record',
    type: ItemType.Orb,
    id: 40000143,
  },
  {
    name: 'Running Start Record',
    type: ItemType.Orb,
    id: 40000144,
  },
  {
    name: 'Grind to Dust Record',
    type: ItemType.Orb,
    id: 40000145,
  },
  {
    name: 'Aquatic Weakness Record',
    type: ItemType.Orb,
    id: 40000146,
  },
  {
    name: 'Darkness Swing Record',
    type: ItemType.Orb,
    id: 40000147,
  },
  {
    name: 'Flashfist Lightning Record',
    type: ItemType.Orb,
    id: 40000148,
  },
  {
    name: 'Taboo Raid Record',
    type: ItemType.Orb,
    id: 40000149,
  },
  {
    name: 'Trinity Bombshell Record',
    type: ItemType.Orb,
    id: 40000150,
  },
  {
    name: 'Anima Record',
    type: ItemType.Orb,
    id: 40000151,
  },
  {
    name: 'Frostfire Carnage Record',
    type: ItemType.Orb,
    id: 40000152,
  },
  {
    name: 'Ruby Bombshell Record',
    type: ItemType.Orb,
    id: 40000153,
  },
  {
    name: 'Serpent Dive Record',
    type: ItemType.Orb,
    id: 40000154,
  },
  {
    name: 'Iceclaw Assault Record',
    type: ItemType.Orb,
    id: 40000155,
  },
  {
    name: 'Dark Shiva Record',
    type: ItemType.Orb,
    id: 40000156,
  },
  {
    name: 'Icebound Record',
    type: ItemType.Orb,
    id: 40000157,
  },
  {
    name: 'Howling Flames Record',
    type: ItemType.Orb,
    id: 40000158,
  },
  {
    name: 'Midnight Bullet Record',
    type: ItemType.Orb,
    id: 40000159,
  },
  {
    name: 'Ripping Storm Record',
    type: ItemType.Orb,
    id: 40000160,
  },
  {
    name: 'Forbidden Cross Record',
    type: ItemType.Orb,
    id: 40000161,
  },
  {
    name: 'Fleeting Fragrance Record',
    type: ItemType.Orb,
    id: 40000162,
  },
  {
    name: "De'Diaja Record",
    type: ItemType.Orb,
    id: 40000163,
  },
  {
    name: 'Divine Dirge Record',
    type: ItemType.Orb,
    id: 40000164,
  },
  {
    name: 'Great Form Record',
    type: ItemType.Orb,
    id: 40000165,
  },
  {
    name: 'Chillblaze Stance Record',
    type: ItemType.Orb,
    id: 40000166,
  },
  {
    name: 'Torrential Assault Record',
    type: ItemType.Orb,
    id: 40000167,
  },
  {
    name: 'Kaleidoshift Record',
    type: ItemType.Orb,
    id: 40000168,
  },
  {
    name: 'Meditative Palm Record',
    type: ItemType.Orb,
    id: 40000169,
  },
  {
    name: 'Trinity Grenade Record',
    type: ItemType.Orb,
    id: 40000170,
  },
  {
    name: 'Dark Side Dive Record',
    type: ItemType.Orb,
    id: 40000171,
  },

  {
    name: 'Minor Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000001,
  },
  {
    name: 'Lesser Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000002,
  },
  {
    name: 'Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000003,
  },
  {
    name: 'Greater Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000004,
  },
  {
    name: 'Major Growth Egg',
    type: ItemType.GrowthEgg,
    id: 70000005,
  },

  {
    name: 'Life Crystal Water',
    type: ItemType.CrystalWater,
    id: 71000101,
  },
  {
    name: 'Power Crystal Water',
    type: ItemType.CrystalWater,
    id: 71000201,
  },
  {
    name: 'Aegis Crystal Water',
    type: ItemType.CrystalWater,
    id: 71000301,
  },
  {
    name: 'Magic Crystal Water',
    type: ItemType.CrystalWater,
    id: 71000401,
  },
  {
    name: 'Null Crystal Water',
    type: ItemType.CrystalWater,
    id: 71000501,
  },
  {
    name: 'Spirit Crystal Water',
    type: ItemType.CrystalWater,
    id: 71000601,
  },

  {
    name: 'Mythril',
    type: ItemType.Common,
    id: 91000000,
  },
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
    name: 'Soul of a Hero',
    type: ItemType.Common,
    id: 95001011,
  },
  {
    name: 'Memory Crystal Lode',
    type: ItemType.Common,
    id: 95001012,
  },
  {
    name: 'Memory Crystal II Lode',
    type: ItemType.Common,
    id: 95001013,
  },
  {
    name: 'Gysahl Greens',
    type: ItemType.Common,
    id: 95001014,
  },
  {
    name: 'Memory Crystal III Lode',
    type: ItemType.Common,
    id: 95001020,
  },
  {
    name: 'Prismatic Seed',
    type: ItemType.Common,
    id: 95001029,
  },
  {
    name: 'Present',
    type: ItemType.Common,
    id: 95001075,
  },
  {
    name: 'Record Rubies',
    type: ItemType.Common,
    id: 95001080,
  },
  {
    // "A Shocking Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001148,
  },
  {
    name: 'BP',
    type: ItemType.Common,
    id: 95001149,
  },
  {
    // "A Chilling Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001151,
  },
  {
    // "A Soggy Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001157,
  },
  {
    // "A Howling Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001174,
  },
  {
    // "A Stony Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001175,
  },
  {
    // "A Radiant Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001182,
  },
  {
    // 5th Anniversary Fantastic Feast
    name: 'Feast Coin',
    type: ItemType.Common,
    id: 95001189,
  },
  {
    // "A Shadowy Request"
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001190,
  },
  {
    name: 'Krakka Greens',
    type: ItemType.Common,
    id: 95001208,
  },
  {
    // Golden Fest 2020 Fantastic Feast
    name: 'Feast Coin',
    type: ItemType.Common,
    id: 95001268,
  },
  {
    name: 'Magicite Shard',
    type: ItemType.Common,
    id: 95001298,
  },

  // Items 95003001 through 95003009 are apparently internal virtual items used
  // to track whether Acolyte Archive relic draws are available.

  {
    name: 'Anima Lens Lv 1',
    type: ItemType.Common,
    id: 95004001,
  },
  {
    name: 'Anima Lens Lv 2',
    type: ItemType.Common,
    id: 95004002,
  },
  {
    name: 'Anima Lens Lv 3',
    type: ItemType.Common,
    id: 95004003,
  },
  {
    name: 'Anima Lens +',
    type: ItemType.Common,
    id: 95004090,
  },
  {
    name: 'Feast Ticket',
    type: ItemType.BattleTicket,
    id: 96003851,
  },
  {
    name: 'Artifact Stone',
    type: ItemType.Common,
    id: 98000000,
  },

  {
    name: 'Record Sapphire',
    type: ItemType.Mote,
    id: 130000000,
  },
  {
    name: 'Spirit Mote (3★)',
    type: ItemType.Mote,
    id: 130100100,
  },
  {
    name: 'Spirit Mote (4★)',
    type: ItemType.Mote,
    id: 130100200,
  },
  {
    name: 'Spirit Mote (5★)',
    type: ItemType.Mote,
    id: 130100300,
  },
  {
    name: '6★ Spirit Mote',
    type: ItemType.Mote,
    id: 130100400,
  },
  {
    name: 'Dexterity Mote (3★)',
    type: ItemType.Mote,
    id: 130200100,
  },
  {
    name: 'Dexterity Mote (4★)',
    type: ItemType.Mote,
    id: 130200200,
  },
  {
    name: 'Dexterity Mote (5★)',
    type: ItemType.Mote,
    id: 130200300,
  },
  {
    name: '6★ Dexterity Mote',
    type: ItemType.Mote,
    id: 130200400,
  },
  {
    name: 'Vitality Mote (3★)',
    type: ItemType.Mote,
    id: 130300100,
  },
  {
    name: 'Vitality Mote (4★)',
    type: ItemType.Mote,
    id: 130300200,
  },
  {
    name: 'Vitality Mote (5★)',
    type: ItemType.Mote,
    id: 130300300,
  },
  {
    name: '6★ Vitality Mote',
    type: ItemType.Mote,
    id: 130300400,
  },
  {
    name: 'Wisdom Mote (3★)',
    type: ItemType.Mote,
    id: 130400100,
  },
  {
    name: 'Wisdom Mote (4★)',
    type: ItemType.Mote,
    id: 130400200,
  },
  {
    name: 'Wisdom Mote (5★)',
    type: ItemType.Mote,
    id: 130400300,
  },
  {
    name: 'Bravery Mote (3★)',
    type: ItemType.Mote,
    id: 130500100,
  },
  {
    name: 'Bravery Mote (4★)',
    type: ItemType.Mote,
    id: 130500200,
  },
  {
    name: 'Bravery Mote (5★)',
    type: ItemType.Mote,
    id: 130500300,
  },
  {
    name: 'Spellblade Mote (5★)',
    type: ItemType.Mote,
    id: 131004300,
  },
  {
    name: 'Dragoon Mote (5★)',
    type: ItemType.Mote,
    id: 131008300,
  },
  {
    name: 'Monk Mote (5★)',
    type: ItemType.Mote,
    id: 131009300,
  },
  {
    name: 'Thief Mote (5★)',
    type: ItemType.Mote,
    id: 131010300,
  },
  {
    name: 'Knight Mote (5★)',
    type: ItemType.Mote,
    id: 131011300,
  },
  {
    name: 'Samurai Mote (5★)',
    type: ItemType.Mote,
    id: 131012300,
  },
  {
    name: 'Ninja Mote (5★)',
    type: ItemType.Mote,
    id: 131013300,
  },
  {
    name: 'Bard Mote (5★)',
    type: ItemType.Mote,
    id: 131014300,
  },
  {
    name: 'Machinist Mote (5★)',
    type: ItemType.Mote,
    id: 131016300,
  },
  {
    name: 'Onion Knight Mote (5★)',
    type: ItemType.Mote,
    id: 132001300,
  },
  {
    name: 'Eiko Mote (5★)',
    type: ItemType.Mote,
    id: 132002300,
  },
  {
    name: '5★ Shifting Mote',
    type: ItemType.Mote,
    id: 133001300,
  },

  {
    name: 'Lesser Arcana',
    type: ItemType.Arcana,
    id: 190000002,
  },
  {
    name: 'Arcana',
    type: ItemType.Arcana,
    id: 190000003,
  },
  {
    name: 'Greater Arcana',
    type: ItemType.Arcana,
    id: 190000004,
  },
  {
    name: 'Major Arcana',
    type: ItemType.Arcana,
    id: 190000005,
  },
];

export const itemsById = _.keyBy(items, 'id');
export const itemsByName = _.keyBy(items, 'name');
