import * as _ from 'lodash';

export interface DressRecord {
  id: number;
  characterId: number;
  name: string;
}

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
    name: 'Show of Resolve',
    id: 120900100,
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
    name: 'Seeker of Truth',
    id: 125000100,
    characterId: 15000100,
  },
];

export const dressRecordsById = _.zipObject(dressRecords.map(i => i.id), dressRecords);
