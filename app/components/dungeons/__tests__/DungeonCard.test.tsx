import * as React from 'react';
import * as renderer from 'react-test-renderer';

import { DungeonListItem } from '../DungeonCard';

import { Dungeon } from '../../../actions/dungeons';
import { ItemType } from '../../../data/items';

const dungeon: Dungeon = {
  closedAt: 2145938400,
  difficulty: 240,
  id: 15048601,
  isComplete: false,
  isMaster: false,
  isUnlocked: true,
  name: 'Tyranny of the Impure, Part 1',
  openedAt: 1531357200,
  prizes: {
    claimedGrade: [],
    completion: [
      {
        amount: 1500,
        id: 92000000,
        name: 'Gil',
        type: ItemType.Common,
      },
    ],
    firstTime: [
      {
        amount: 1,
        id: 95001020,
        name: 'Memory Crystal III Lode',
        type: ItemType.Common,
      },
      {
        amount: 100000,
        id: 92000000,
        name: 'Gil',
        type: ItemType.Common,
      },
      {
        amount: 1,
        id: 91000000,
        name: 'Mythril',
        type: ItemType.Common,
      },
    ],
    mastery: [
      {
        amount: 1,
        id: 95001020,
        name: 'Memory Crystal III Lode',
        type: ItemType.Common,
      },
      {
        amount: 2,
        id: 40000066,
        name: 'Power Crystal',
        type: ItemType.Orb,
      },
      {
        amount: 100000,
        id: 92000000,
        name: 'Gil',
        type: ItemType.Common,
      },
    ],
    unclaimedGrade: [
      {
        amount: 20,
        id: 95001080,
        name: 'Record Rubies',
        type: ItemType.Common,
      },
      {
        amount: 100000,
        id: 92000000,
        name: 'Gil',
        type: ItemType.Common,
      },
      {
        amount: 30,
        id: 130300300,
        name: 'Vitality Mote (5★)',
        type: ItemType.Mote,
      },
      {
        amount: 100000,
        id: 92000000,
        name: 'Gil',
        type: ItemType.Common,
      },
      {
        amount: 30,
        id: 130300300,
        name: 'Vitality Mote (5★)',
        type: ItemType.Mote,
      },
      {
        amount: 20,
        id: 95001080,
        name: 'Record Rubies',
        type: ItemType.Common,
      },
      {
        amount: 7,
        id: 40000060,
        name: 'Major Holy Orb',
        type: ItemType.Orb,
      },
      {
        amount: 30,
        id: 130300300,
        name: 'Vitality Mote (5★)',
        type: ItemType.Mote,
      },
      {
        amount: 2,
        id: 40000060,
        name: 'Major Holy Orb',
        type: ItemType.Orb,
      },
      {
        amount: 30,
        id: 130400200,
        name: 'Wisdom Mote (4★)',
        type: ItemType.Mote,
      },
      {
        amount: 5,
        id: 130300300,
        name: 'Vitality Mote (5★)',
        type: ItemType.Mote,
      },
    ],
  },
  seriesId: 150001,
  staminaList: [0],
  totalStamina: 1,
};

describe('DungeonCard', () => {
  describe('DungeonListItem', () => {
    it('renders complex prize lists', () => {
      const tree = renderer.create(<DungeonListItem dungeon={dungeon} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('renders complex prize lists in anonymous view', () => {
      const tree = renderer
        .create(<DungeonListItem dungeon={dungeon} isAnonymous={true} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
