import { TableDefinition } from './RecordMateriaTableDefinitions';

const statusTable: TableDefinition = {
  title: 'Status',
  headers: ['Start (RM3)', 'Start (RM1-2)', 'Low HP or Counter'],
  contents: [['3'], ['2', '1'], ['counter', 'low']],
  rows: [
    {
      header: 'Haste',
      items: {
        3: [['Gilgamesh', '3'], ['Marcus', '3'], ['Zack', '3'], ['Noel', '3']],
        2: [['Gau', '2'], ['Lion', '2'], ['Thief (I)', '2'], ['Montblanc', '2'], ['Ranger', '2']],
        1: [
          ['Luneth', '1b'],
          ['Zidane', '1'],
          ['Balthier', '1'],
          ['Orlandeau', '1'],
          ['Eight', '1'],
        ],
        low: [['Tidus', '1a']],
        counter: [['Iris', '3']],
      },
    },
    {
      header: 'Protect',
      items: {
        3: [['Gilgamesh', '3']],
        2: [['Knight', '2'], ['Gladiolus', '2']],
        1: [['Gordon', '1b'], ['Refia', '1b']],
        counter: [['Steiner', '1b'], ['Angeal', '1'], ['Gogo (VI)', '1']],
        low: [['Cecil (Paladin)', '1a'], ['Edgar', '1']],
      },
    },
    {
      header: 'Shell',
      items: {
        3: [['Gilgamesh', '3']],
        2: [['Rude', '2']],
        1: [['Arc', '1b']],
        low: [['Warrior of Light', '1a'], ['Rydia', '1a']],
      },
    },
    {
      header: 'Reflect',
      items: {
        1: [['Gogo (V)', '1'], ['Red XIII', '1a']],
      },
    },
    {
      header: 'Regen (hi)',
      items: {
        2: [['Cait Sith', '2'], ['Lenna', '2']],
        low: [['Red XIII', '1b'], ['Wakka', '2']],
      },
    },
    {
      header: 'Regen (mid)',
      items: {
        1: [['Ingus', '1b']],
      },
    },
    {
      header: 'Regen (lo)',
      items: {
        2: [['Rude', '2'], ['Gogo (V)', '2']],
        1: [['Sabin', '1'], ['Prishe', '1'], ['Noel', '1'], ['Lann', '1']],
        low: [['Garnet', '1a'], ['Sazh', '1']],
      },
    },
    {
      header: 'Retaliate',
      items: {
        2: [['Gogo (V)', '2']],
        low: [['Cyan', '1b']],
      },
    },
    {
      header: 'Draw Fire',
      items: {
        2: [['Amarant', '2'], ['Delita', '2']],
      },
    },
    {
      header: 'Sentinel',
      items: {
        3: [['Curilla', '3'], ['Marche', '3']],
      },
    },
    {
      header: 'P. Blink',
      items: {
        3: [['Ace', '3'], ['Yuffie', '3']],
        low: [['Ninja', '1b']],
      },
    },
    {
      header: 'M. Blink',
      items: {
        3: [['Vayne', '3']],
        1: [['Ovelia', '1'], ['Reynn', '1'], ['Seven', '1']],
        low: [['Kimahri', '1b']],
      },
    },
    {
      header: 'Doom',
      items: {
        3: [['Kuja', '3']],
      },
    },
    {
      header: 'Hi Fastcast',
      items: {
        3: [['Orlandeau', '3']],
      },
    },
    {
      header: 'Last Stand',
      items: {
        3: [['Amarant', '3']],
      },
    },
    {
      header: 'Reraise',
      items: {
        3: [['Scott', '3']],
      },
    },
    {
      header: 'Berserk',
      items: {
        1: [['Galuf', '1a'], ['Umaro', '1'], ['Cid (VII)', '1a'], ['Fran', '1a']],
      },
    },
  ],
};

const expTable: TableDefinition = {
  title: 'Exp. Up',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['1', '2']],
  rows: [
    {
      header: '40% chance',
      items: {
        3: [['Luneth', '3'], ['Elarra', '3']],
      },
    },
    {
      header: '20% chance',
      items: {
        2: [['Onion Knight', '2'], ['Palom', '2'], ['Relm', '2']],
        1: [['Cid (VII)', '1b']],
      },
    },
  ],
};

const selfHealTable: TableDefinition = {
  title: 'Self Heal',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'Counter',
      items: {
        3: [['Gaffgarion', '3'], ['Monk', '3']],
        2: [['Cecil (Paladin)', '2'], ['Monk', '2'], ['Gaffgarion', '2']],
        1: [['Vanille', '1']],
      },
    },
    {
      header: 'Drain Attack',
      items: {
        3: [['Emperor', '3']],
        2: [['Prishe', '2'], ['Thief (Core)', '2'], ['Dark Knight', '2']],
        1: [['Dark Knight', '1b'], ['Rinoa', '1'], ['Quina', '1a']],
      },
    },
    {
      header: 'Heal',
      items: {
        2: [['Noctis', '2']],
        1: [['Cecil (Paladin)', '1b']],
      },
    },
  ],
};

const counterTable: TableDefinition = {
  title: 'Counter',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'PHY',
      items: {
        3: [['Gaffgarion', '3']],
        2: [['Samurai', '2'], ['Ignis', '2'], ['Gaffgarion', '2']],
        1: [['Galuf', '1b'], ['Cloud', '1b']],
      },
    },
    {
      header: 'MAG',
      items: {
        1: [['Emperor', '1'], ['Strago', '1b']],
      },
    },
    {
      header: 'Self heal',
      items: {
        3: [['Gaffgarion', '3'], ['Monk', '3']],
        2: [['Monk', '2'], ['Cecil (Paladin)', '2'], ['Gaffgarion', '2']],
        1: [['Vanille', '1']],
      },
    },
    {
      header: 'Reduce dmg.',
      items: {
        2: [['Zack', '2']],
      },
    },
    {
      header: 'Gain status',
      items: {
        3: [['Iris', '3']],
        1: [['Steiner', '1b'], ['Angeal', '1'], ['Gogo (VI)', '1']],
      },
    },
  ],
};

const sbTable: TableDefinition = {
  title: 'SB Gauge',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: '500 points',
      items: {
        2: [['Tyro', '2'], ['Cloud', '2']],
      },
    },
    {
      header: '1.5x abilities',
      items: {
        2: [['Ramza', '2'], ['Tidus', '2']],
      },
    },
    {
      header: '1.25x all',
      items: {
        2: [['Steiner', '2']],
      },
    },
    {
      header: '1.5x on dmg.',
      items: {
        2: [['Squall', '2']],
      },
    },
  ],
};

const atbTable: TableDefinition = {
  title: 'ATB Gauge',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: '50% chance',
      items: {
        2: [['Kelger', '2']],
        1: [['Zell', '1b']],
      },
    },
    {
      header: '15% chance',
      items: {
        1: [['Elena', '1'], ['Lightning', '1'], ['Wakka', '1a']],
      },
    },
  ],
};

const abilityRefillTable: TableDefinition = {
  title: 'Ability Refill',
  headers: ['100% chance', '≤50% chance'],
  contents: [['100'], ['50', '40']],
  rows: [
    {
      header: 'Black Magic',
      items: {
        100: [['Black Mage', '1b']],
        50: [['Matoya', '1'], ['Terra', '1'], ['Black Mage', '1a']],
      },
    },
    {
      header: 'Black or White Magic',
      items: {
        100: [['Fusoya', '1b'], ['Tama', '2']],
        40: [['Fusoya', '1a']],
      },
    },
    {
      header: 'White Magic',
      items: {
        100: [['Aria', '2'], ['White Mage', '1b']],
        50: [['Larsa', '1'], ['White Mage', '1a']],
      },
    },
    {
      header: 'Summoning',
      items: {
        100: [['Summoner', '1b']],
        50: [['Summoner', '1a']],
      },
    },
    {
      header: 'White Magic or Summoning',
      items: {
        40: [['Aemo', '1']],
      },
    },
    {
      header: 'Combat',
      items: {
        100: [['Warrior', '2']],
        50: [['Setzer', '1']],
      },
    },
    {
      header: 'Celerity',
      items: {
        50: [['Kelger', '1'], ['Locke', '1'], ['Shelke', '1']],
      },
    },
    {
      header: 'Support',
      items: {
        100: [['Morrow', '2'], ['Red XIII', '2']],
        50: [['Faris', '1'], ['Barret', '1']],
      },
    },
    {
      header: 'Bard',
      items: {
        100: [['Edward', '1b']],
        50: [['Edward', '1a']],
      },
    },
    {
      header: 'Dancer',
      items: {
        100: [['Mog', '1b'], ['Lilisette', '2']],
        50: [['Mog', '1a'], ['Lilisette', '1']],
      },
    },
    {
      header: 'Dragoon',
      items: {
        100: [['Dragoon', '1b']],
        50: [['Dragoon', '1a']],
      },
    },
    {
      header: 'Knight',
      items: {
        100: [['Gilgamesh', '2']],
        50: [['Beatrix', '1']],
      },
    },
    {
      header: 'Machinist',
      items: {
        100: [['King', '2'], ['Cater', '2']],
      },
    },
    {
      header: 'Monk',
      items: {
        50: [['Yang', '1']],
      },
    },
    {
      header: 'Ninja',
      items: {
        50: [['Edge', '1']],
      },
    },
    {
      header: 'Samurai',
      items: {
        100: [['Samurai', '1b']],
        50: [['Samurai', '1a'], ['Jack', '1']],
      },
    },
    {
      header: 'Spellblade',
      items: {
        100: [['Spellblade', '1b']],
        50: [['Xezat', '1'], ['Spellblade', '1a']],
      },
    },
    {
      header: 'Thief',
      items: {
        100: [['Thief (Core)', '1b']],
        50: [['Rikku', '1'], ['Thief (Core)', '1a']],
      },
    },
  ],
};

export default [
  statusTable,
  expTable,
  selfHealTable,
  counterTable,
  sbTable,
  atbTable,
  abilityRefillTable,
];
