import { TableDefinition } from './RecordMateriaTableDefinitions';

const physicalNonElementalTable: TableDefinition = {
  title: 'PHY Non-Elemental',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'AoE',
      items: {
        3: [['Yang', '3'], ['Yda', '3']],
        2: [['Leo', '2'], ['Machina', '2'], ['Orlandeau', '2'], ['Yda', '2'], ['Yang', '2']],
        1: [['Bard', '1b']],
      },
    },
    {
      header: 'Instant',
      items: {
        3: [['Kelger', '3'], ['Noctis', '3']],
        2: [['Lightning', '2'], ['Queen', '2'], ['Yuffie', '2']],
      },
    },
    {
      header: 'Single',
      items: {
        3: [['Kimahri', '3'], ['Prishe', '3'], ['Master', '3'], ['Gladiator', '3']],
        2: [['Sazh', '2'], ['Ranger', '2'], ['Noel', '2']],
        1: [
          ['Josef', '1b'],
          ['Lion', '1'],
          ['Cecil (Dark Knight)', '1b'],
          ['Shadow', '1'],
          ['Squall', '1a'],
          ['Wakka', '1b'],
          ['Viking', '1b'],
          ['Cecil (Dark Knight)', '1a'],
        ],
      },
    },
  ],
};

const physicalPercentNonElementalTable: TableDefinition = {
  title: '% PHY Non-Elemental',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: '% AoE',
      items: {
        3: [['Ricard', '3'], ['Shadow', '3'], ['Samurai', '3']],
        2: [['Ayame', '2']],
      },
    },
    {
      header: '% p3.0+',
      items: {
        3: [['Dragoon', '3'], ['Setzer', '3'], ['Leila', '3'], ['Raijin', '3']],
        2: [['Jecht', '2']],
      },
    },
    {
      header: '% p2.0+',
      items: {
        3: [
          ['Ranger', '3'],
          ['Ward', '3'],
          ['Lion', '3'],
          ['Rikku', '3'],
          ['Freya', '3'],
          ['Gau', '3'],
        ],
        2: [['Fran', '2'], ['Wol', '2'], ['Kiros', '2'], ['Kimahri', '2']],
        1: [
          ['Ranger', '1b'],
          ['Gladiator', '1b'],
          ['Master', '1'],
          ['Ricard', '1b'],
          ['Squall', '1b'],
          ['Cinque', '1'],
        ],
      },
    },
    {
      header: '% p1.0+',
      items: {
        3: [['Queen', '3'], ['Shelke', '3'], ['Quina', '3'], ['Dark Knight', '3']],
        2: [['Prishe', '2'], ['Thief (Core)', '2'], ['Dark Knight', '2']],
        1: [['Mustadio', '1'], ['Meliadoul', '1'], ['Quina', '1a'], ['Tidus', '1b']],
      },
    },
    {
      header: '% p1.0-',
      items: {
        1: [['Dark Knight', '1b'], ['Cecil (Paladin)', '1b'], ['Rinoa', '1']],
      },
    },
  ],
};

const physicalElementalTable: TableDefinition = {
  title: 'PHY Elemental and % PHY Elemental',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'Bio',
      items: {
        3: [['Thief (Core)', '3']],
      },
    },
    {
      header: 'Dark',
      items: {
        3: [['Kiros', '3']],
        1: [['Leon', '1b'], ['Garland', '1']],
      },
    },
    {
      header: 'Earth',
      items: {
        3: [['Seifer', '3'], ['Ursula', '3'], ['Spellblade', '3']],
      },
    },
    {
      header: 'Fire',
      items: {
        3: [['Galuf', '3']],
        2: [['Scott', '2'], ['Spellblade', '2']],
        1: [['Seifer', '1']],
      },
    },
    {
      header: 'Holy',
      items: {
        3: [['Beatrix', '3']],
        1: [['Warrior of Light', '1b'], ['Agrias', '1']],
      },
    },
    {
      header: 'Ice',
      items: {
        3: [['Ayame', '3'], ['Xezat', '3'], ['Umaro', '3']],
        2: [['Spellblade', '2']],
        1: [['Celes', '1']],
      },
    },
    {
      header: 'Lightning',
      items: {
        3: [['Reno', '3'], ['Reks', '3'], ['King', '3'], ['Ramza', '3']],
        2: [['Spellblade', '2']],
      },
    },
    {
      header: 'Water',
      items: {
        3: [['Paine', '3']],
      },
    },
    {
      header: 'Wind',
      items: {},
    },
  ],
};

const blackNonElementalTable: TableDefinition = {
  title: 'BLK Non-Elemental',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'AoE',
      items: {
        3: [['Nabaat', '3'], ['Strago', '3']],
      },
    },
    {
      header: 'Single',
      items: {
        3: [['Cloud of Darkness', '3'], ['Bard', '3'], ['Hilda', '3']],
        2: [['Vivi', '2']],
      },
    },
    {
      header: '% Single',
      items: {
        1: [['Cloud of Darkness', '1'], ['Cait Sith', '1']],
      },
    },
  ],
};

const blackElementalTable: TableDefinition = {
  title: 'BLK Elemental',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'Bio',
      items: {},
    },
    {
      header: 'Dark',
      items: {
        3: [['Emperor', '3']],
        2: [['Cloud of Darkness', '2']],
      },
    },
    {
      header: 'Earth',
      items: {
        3: [['Enna Kros', '3']],
      },
    },
    {
      header: 'Fire',
      items: {
        3: [['Black Mage', '3'], ['Magus', '3'], ['Red Mage', '3']],
        2: [['Black Mage', '2'], ['Magus', '2'], ['Maria', '2'], ['Rubicante', '2']],
        1: [['Red Mage', '1'], ['Selphie', '1']],
      },
    },
    {
      header: 'Holy',
      items: {},
    },
    {
      header: 'Ice',
      items: {
        3: [['Magus', '3'], ['Red Mage', '3'], ['Ysayle', '3']],
        2: [['Magus', '2']],
        1: [['Tellah', '1'], ['Edea', '1'], ['Selphie', '1']],
      },
    },
    {
      header: 'Lightning',
      items: {
        3: [['Magus', '3'], ['Red Mage', '3'], ['Marach', '3'], ['Rapha', '3'], ['Desch', '3']],
        2: [['Magus', '2'], ['Marach', '2'], ['Selphie', '1']],
        1: [['Marach', '1']],
      },
    },
    {
      header: 'Water',
      items: {
        3: [['Meia', '3']],
      },
    },
    {
      header: 'Wind',
      items: {
        3: [['Barbariccia', '3']],
        2: [['Emperor', '2']],
      },
    },
    {
      header: '(various)',
      items: {
        3: [['Summoner', '3']],
        2: [['Seymour', '2']],
      },
    },
  ],
};

const ninjaElementalTable: TableDefinition = {
  title: 'NIN Elemental',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'Fire',
      items: {
        3: [['Ninja', '3']],
      },
    },
  ],
};

const whiteDamageTable: TableDefinition = {
  title: 'WHT Damage',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: '(non-elemental)',
      items: {
        3: [['Vanille', '3']],
        2: [['Aphmau', '2'], ['Ovelia', '2']],
      },
    },
    {
      header: 'Holy',
      items: {
        2: [['Selphie', '2']],
      },
    },
  ],
};

const healTable: TableDefinition = {
  title: 'Heal Allies',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'Cure',
      items: {
        3: [['White Mage', '3'], ['Red Mage', '3']],
        2: [['Iris', '2'], ['Sarah', '2'], ['Vanille', '2'], ['White Mage', '2']],
        1: [['Raijin', '1'], ['Garnet', '1b']],
      },
    },
    {
      header: 'Esuna',
      items: {
        3: [['Devout', '3']],
        2: [['Devout', '2']],
        1: [['Ceodore', '1'], ['Ramza', '1'], ['Fujin', '1']],
      },
    },
  ],
};

const inflictStatusTable: TableDefinition = {
  title: 'Inflict Status',
  headers: ['RM3', 'RM1-2'],
  contents: [['3'], ['2', '1']],
  rows: [
    {
      header: 'KO',
      items: {
        1: [['Exdeath', '1']],
      },
    },
    {
      header: 'Petrify',
      items: {
        3: [['Cid (IV)', '3']],
      },
    },
    {
      header: 'Silence',
      items: {
        3: [['Mustadio', '3']],
      },
    },
    {
      header: 'Sleep',
      items: {
        3: [['Bard', '3']],
      },
    },
    {
      header: 'Stop',
      items: {
        2: [['Mustadio', '2']],
        1: [['Reno', '1']],
      },
    },
  ],
};

export default [
  physicalNonElementalTable,
  physicalPercentNonElementalTable,
  physicalElementalTable,
  blackNonElementalTable,
  blackElementalTable,
  ninjaElementalTable,
  whiteDamageTable,
  healTable,
  inflictStatusTable,
];
