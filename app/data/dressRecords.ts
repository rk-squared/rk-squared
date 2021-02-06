import * as _ from 'lodash';

export interface DressRecord {
  id: number;
  characterId: number;
  name: string;
}

// TODO: Implement a way to handle previously unknown dress records

export const dressRecords: DressRecord[] = [
  {
    name: 'Black-Robed Keeper',
    id: 120000100,
    characterId: 10000200,
  },

  {
    name: 'Classic Crimson',
    id: 120100100,
    characterId: 10100100,
  },
  {
    name: 'Discord Incarnate',
    id: 120100200,
    characterId: 10100200,
  },

  {
    name: 'Cosmic Retainer',
    id: 120200100,
    characterId: 10200100,
  },

  {
    name: 'Cosmic Onion Knight',
    id: 120300100,
    characterId: 10300600,
  },

  {
    name: 'Chosen of Feymarch',
    id: 120400100,
    characterId: 10400400,
  },
  {
    name: 'Holy Dragoon',
    id: 120400200,
    characterId: 10400300,
  },
  {
    name: 'Cosmic Paladin',
    id: 120400300,
    characterId: 10400200,
  },
  {
    name: 'Grown-Up Palom',
    id: 120400400,
    characterId: 10400900,
  },
  {
    name: 'Grown-Up Porom',
    id: 120400500,
    characterId: 10401000,
  },
  {
    name: 'Golbez: The After Years',
    id: 120400600,
    characterId: 10401400,
  },

  {
    name: 'Freelancer Lenna',
    id: 120500100,
    characterId: 10500200,
  },
  {
    name: 'Freelancer Galuf',
    id: 120500200,
    characterId: 10500500,
  },
  {
    name: 'Beastmaster Krile',
    id: 120500300,
    characterId: 10501200,
  },
  {
    name: 'Princess Sarisa',
    id: 120500400,
    characterId: 10500900,
  },
  {
    name: 'Knight Bartz',
    id: 120500500,
    characterId: 10500800,
  },
  {
    name: 'Lenna the Dancer',
    id: 120500600,
    characterId: 10500200,
  },

  {
    name: 'Opera Star',
    id: 120600100,
    characterId: 10600400,
  },
  {
    name: 'Cosmic Elite',
    id: 120600300,
    characterId: 10600100,
  },
  {
    name: 'Gerad',
    id: 120600500,
    characterId: 10600600,
  },

  {
    name: 'Cloudy Wolf',
    id: 120700100,
    characterId: 10700100,
  },
  {
    name: 'Executioner',
    id: 120700200,
    characterId: 10701000,
  },
  {
    name: 'Leather Suit',
    id: 120700300,
    characterId: 10700300,
  },
  {
    name: 'KINGDOM HEARTS Cloud',
    id: 120700600,
    characterId: 10700100,
  },
  {
    name: 'Dressed to Impress',
    id: 120700700,
    characterId: 10700400,
  },
  {
    name: 'Glamorous Tifa',
    id: 120700800,
    characterId: 10700300,
  },

  {
    name: 'SeeD Uniform',
    id: 120800100,
    characterId: 10800100,
  },
  {
    name: 'Waltz for the Moon',
    id: 120800200,
    characterId: 10800200,
  },
  {
    name: 'KINGDOM HEARTS Leon',
    id: 120800300,
    characterId: 10800100,
  },
  {
    name: 'SeeD Zell',
    id: 120801000,
    characterId: 10800400,
  },

  {
    name: 'Show of Resolve',
    id: 120900100,
    characterId: 10900200,
  },
  {
    name: 'White-Hooded Escape',
    id: 120900500,
    characterId: 10900200,
  },

  {
    name: 'Gunner Garb',
    id: 121000100,
    characterId: 11000200,
  },
  {
    name: 'Young Auron',
    id: 121000200,
    characterId: 11000700,
  },
  {
    name: 'Thief',
    id: 121000300,
    characterId: 11000600,
  },
  {
    name: 'False Bride',
    id: 121000400,
    characterId: 11000200,
  },
  {
    name: 'Dreams of Glory',
    id: 121000500,
    characterId: 11000100,
  },
  {
    name: 'Diving Suit',
    id: 121000800,
    characterId: 11000600,
  },

  {
    name: 'Ministerial Vestiture',
    id: 121100100,
    characterId: 11100100,
  },

  {
    name: 'Knight of Etro',
    id: 121300100,
    characterId: 11300100,
  },
  {
    name: 'Academy Uniform',
    id: 121300200,
    characterId: 11300500,
  },
  {
    name: 'Equilibrium',
    id: 121300300,
    characterId: 11300100,
  },

  {
    name: "Sorceress Y'shtola",
    id: 121400100,
    characterId: 11400100,
  },
  {
    name: 'Academician Alphinaud',
    id: 121400200,
    characterId: 11400600,
  },
  {
    name: 'Iceheart',
    id: 121400300,
    characterId: 11401100,
  },

  {
    name: 'Kingly Raiment',
    id: 121500100,
    characterId: 11500100,
  },

  {
    name: 'Seeker of Truth',
    id: 125000100,
    characterId: 15000100,
  },
  {
    name: 'Knight Delita',
    id: 125000200,
    characterId: 15000300,
  },

  {
    name: 'Combat Overcoat',
    id: 126000100,
    characterId: 16000100,
  },

  {
    name: 'KINGDOM HEARTS III Sora',
    id: 127000100,
    characterId: 17000100,
  },
  {
    name: 'KINGDOM HEARTS III Riku',
    id: 127000200,
    characterId: 17000200,
  },
];

export const dressRecordsById = _.zipObject(dressRecords.map(i => i.id), dressRecords);
