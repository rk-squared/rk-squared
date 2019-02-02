import { TableDefinition } from './RecordMateriaTableDefinitions';

const atkTable: TableDefinition = {
  title: 'ATK Buff',
  headers: ['≥ +15% ATK', '+13% ATK/x', '+10% ATK/x', '+10-13% ATK'],
  contents: [['15'], ['13x'], ['10x'], ['13', '10']],
  rows: [
    {
      header: '(always)',
      items: {
        '13x': [['Vayne', '3'], ['Firion', '3']],
        '10x': [
          ['Ceodore', '3'],
          ['Larsa', '3'],
          ['Marcus', '3'],
          ['Noel', '3'],
          ['Zack', '3'],
          ['Firion', '2'],
          ['Josef', '1a'],
          ['Laguna', '2'],
          ['Irvine', '1a'],
          ['Leo', '1'],
          ['Sephiroth', '1'],
        ],
        '10': [
          ['Firion', '1'],
          ['Zell', '1a'],
          ['Bard', '2'],
          ['Gau', '2'],
          ['Lann', '2'],
          ['Lion', '2'],
          ['Thief (I)', '2'],
        ],
      },
    },
    {
      header: '(downside)',
      items: {
        '15': [['Ricard', '1a'], ['Josef', '3'], ['Sice', '3']],
        '10x': [['Kain', '1b'], ['Irvine', '2'], ['Cid (XIV)', '1'], ['Noctis', '1']],
        '10': [
          ['Berserker', '2'],
          ['Guy', '1'],
          ['Leon', '2'],
          ['Gau', '1'],
          ['Vaan', '1'],
          ['Delita', '1'],
          ['Nine', '1'],
        ],
      },
    },
    {
      header: 'Axe',
      items: {
        '10x': [['Guy', '2']],
      },
    },
    {
      header: 'Dagger',
      items: {
        '13x': [['Thancred', '3'], ['Thief (I)', '3']],
        '10': [['Marcus', '1']],
      },
    },
    {
      header: 'Fist',
      items: {
        '15': [['Elena', '3']],
        '13x': [['Jecht', '3']],
        '13': [['Ursula', '2']],
        '10x': [['Snow', '2']],
      },
    },
    {
      header: 'Gun',
      items: {
        '15': [['Rufus', '3']],
        '13x': [['Cid (XIV)', '3']],
        '10x': [['Sazh', '3']],
        '13': [['Cid (XIV)', '2']],
        '10': [['Prompto', '1']],
      },
    },
    {
      header: 'Hammer',
      items: {
        15: [['Viking', '3']],
        13: [['Umaro', '2']],
      },
    },
    {
      header: 'Katana',
      items: {
        '13x': [['Cyan', '3']],
      },
    },
    {
      header: 'Spear',
      items: {
        '15': [['Nine', '3']],
        '13x': [['Gordon', '3'], ['Wrieg', '3']],
        '13': [['Ward', '2']],
      },
    },
    {
      header: 'Sword',
      items: {
        '13x': [['Warrior of Light', '3']],
        '10': [['Queen', '1']],
      },
    },
    {
      header: 'Thrown',
      items: {
        '13x': [['Lann', '3']],
      },
    },
    {
      header: 'Lt. Armor',
      items: {
        '13x': [['Wol', '3']],
        '10x': [['Freya', '2']],
      },
    },
    {
      header: 'H. Armor',
      items: {
        '13x': [['Leon', '3']],
      },
    },
    {
      header: 'Shield',
      items: {
        '15': [['Gladiolus', '3']],
        '13x': [['Minfilia', '3']],
        '13': [['Minfilia', '2']],
        '10': [['Basch', '1'], ['Minfilia', '1']],
      },
    },
  ],
};

const atkMagTable: TableDefinition = {
  title: 'ATK/MAG Buff',
  headers: ['+13% ATK/MAG', '+10% ATK/MAG', '+10% ATK/MAG (w/ downside)'],
  contents: [['13'], ['10'], ['10-']],
  rows: [
    {
      header: '(always)',
      items: {
        '10': [['Yuffie', '3']],
        '10-': [['Desch', '2']],
      },
    },
    {
      header: 'Fist',
      items: {
        13: [['Rude', '3']],
        10: [['Vayne', '2'], ['Cid Raines', '2']],
      },
    },
  ],
};

const magTable: TableDefinition = {
  title: 'MAG Buff',
  headers: ['≥ +15% MAG', '+13% MAG/x', '+10-13% MAG', '+10% MAG (w/ downside)'],
  contents: [['15'], ['13x'], ['13', '10'], ['10-']],
  rows: [
    {
      header: '(always)',
      items: {
        '15': [['Vivi', '1b'], ['Echo', '3'], ['Serah', '3']],
        '13x': [['Ace', '3'], ['Terra', '3']],
        '10': [['Krile', '2'], ['Montblanc', '2'], ['Reynn', '2']],
        '10-': [
          ['Ashe', '1'],
          ['Echo', '2'],
          ['Serah', '1'],
          ['Braska', '1'],
          ['Eiko', '1'],
          ['Kefka', '1'],
          ['Ysayle', '1'],
          ['Barbariccia', '1'],
          ['Golbez', '1'],
        ],
      },
    },
    {
      header: 'Book',
      items: {
        10: [['Alphinaud', '1']],
      },
    },
    {
      header: 'Bow',
      items: {
        15: [['Maria', '3']],
      },
    },
    {
      header: 'Doll',
      items: {
        15: [['Lulu', '3']],
      },
    },
    {
      header: 'Fists',
      items: {
        15: [['Cid Raines', '3']],
      },
    },
    {
      header: 'Gun',
      items: {
        10: [['Vincent', '1']],
      },
    },
    {
      header: 'Instrument',
      items: {
        15: [['Kefka', '3']],
        10: [['Kefka', '2']],
      },
    },
    {
      header: 'Rod',
      items: {
        '15': [['Palom', '3']],
        '13x': [['Golbez', '3'], ['Papalymo', '3']],
        '10': [['Papalymo', '1'], ['Seymour', '1']],
      },
    },
    {
      header: 'Staff',
      items: {
        '15': [['Braska', '3']],
        '13x': [['Seymour', '3']],
        '10': [['Onion Knight', '1']],
      },
    },
    {
      header: 'Sword',
      items: {
        15: [['Ashe', '3']],
        13: [['Nabaat', '2']],
      },
    },
    {
      header: 'Thrown',
      items: {
        '15': [['Hope', '3']],
        '13x': [['Fujin', '3']],
        '13': [['Ace', '2'], ['Enna', '2']],
        '10': [['Ace', '1'], ['Edea', '2']],
      },
    },
    {
      header: 'Whip',
      items: {
        '15': [['Krile', '3']],
        '13x': [['Rydia', '3']],
        '10': [['Rydia', '2'], ['Seven', '2']],
      },
    },
    {
      header: 'Robe',
      items: {
        15: [['Montblanc', '3']],
      },
    },
    {
      header: 'H. Armor',
      items: {
        '13x': [['Exdeath', '3']],
      },
    },
  ],
};

const magMndTable: TableDefinition = {
  title: 'MAG/MND Buff',
  headers: ['+13% MAG/MND', '+10% MAG/MND'],
  contents: [['13'], ['10']],
  rows: [
    {
      header: '(always)',
      items: {
        10: [['Fusoya', '3']],
      },
    },
    {
      header: 'Book',
      items: {
        13: [['Alphinaud', '3']],
        10: [['Alphinaud', '2'], ['Dr. Mog', '1']],
      },
    },
    {
      header: 'Dagger',
      items: {
        13: [['Garnet', '3']],
      },
    },
    {
      header: 'Instrument',
      items: {
        13: [['Cait Sith', '3']],
      },
    },
    {
      header: 'Rod',
      items: {
        13: [['Aerith', '3']],
        10: [['Tellah', '2']],
      },
    },
    {
      header: 'Staff',
      items: {
        13: [['Onion Knight', '3'], ['Tellah', '3']],
        10: [['Arc', '2']],
      },
    },
    {
      header: 'Hat',
      items: {
        13: [['Gogo', '3']],
      },
    },
    {
      header: 'Robe',
      items: {
        13: [['Arc', '3']],
      },
    },
    {
      header: 'Lt. Armor',
      items: {
        13: [['Rubicante', '3'], ['Tama', '3']],
      },
    },
  ],
};

const mndTable: TableDefinition = {
  title: 'MND Buff',
  headers: ['+25% MND', '+10-13% MND/x', '+20% MND', '+20% MND (w/ downside)', '+10% MND'],
  contents: [['25'], ['13x', '10x'], ['20'], ['20-'], ['10']],
  rows: [
    {
      header: '(always)',
      items: {
        '10x': [['Ceodore', '3'], ['Larsa', '3']],
        '20': [['Gogo (VI)', '2']],
        '10': [['Larsa', '2']],
        '20-': [['Aria', '1'], ['Mog', '2'], ['Penelo', '2'], ['Sarah', '1']],
      },
    },
    {
      header: 'Book',
      items: {
        25: [['Orran', '3']],
        20: [['Orran', '2']],
        10: [['Orran', '1']],
      },
    },
    {
      header: 'Bow',
      items: {
        25: [['Rosa', '3']],
        20: [['Rosa', '2']],
        10: [['Rosa', '1']],
      },
    },
    {
      header: 'Dagger',
      items: {
        10: [['Rem', '1']],
      },
    },
    {
      header: 'Instrument',
      items: {
        25: [['Deuce', '3'], ['Eiko', '3']],
        10: [['Deuce', '2'], ['Hilda', '1']],
      },
    },
    {
      header: 'Rod',
      items: {
        25: [['Aemo', '3'], ['Selphie', '3']],
        20: [['Yuna', '2']],
        10: [['Relm', '1'], ['Tama', '1']],
      },
    },
    {
      header: 'Spear',
      items: {
        25: [['Mog', '3']],
      },
    },
    {
      header: 'Staff',
      items: {
        '25': [['Aphmau', '3'], ['Sarah', '3']],
        '10x': [['Alma', '3']],
        '20': [['Porom', '2']],
        '10': [['Minwu', '1'], ['Aphmau', '1'], ['Penelo', '1']],
      },
    },
    {
      header: 'Hat',
      items: {
        25: [['Porom', '3']],
      },
    },
    {
      header: 'Robe',
      items: {
        '25': [['Relm', '3']],
        '13x': [['Ovelia', '3']],
      },
    },
  ],
};

const defResTable: TableDefinition = {
  title: 'DEF/RES Buff',
  headers: ['+25% DEF', '+20% DEF/RES', '+20% DEF', '+20% RES', '+10% DEF or RES'],
  contents: [['25d'], ['20dr'], ['20d'], ['20r'], ['10dr', '10d']],
  rows: [
    {
      header: '(always)',
      items: {
        '20d': [
          ['Gabranth', '3'],
          ['Scott', '3'],
          ['Gladiolus', '1'],
          ['Leon', '1a'],
          ['Snow', '1b'],
          ['Vayne', '1'],
        ],
        '20r': [['Gordon', '1a']],
        '10dr': [['Edward', '2']],
        '10d': [['Snow', '1a']],
      },
    },
    {
      header: 'Gun',
      items: {
        '20dr': [['Vincent', '3']],
      },
    },
    {
      header: 'Spear',
      items: {
        '10d': [['Wrieg', '1']],
      },
    },
    {
      header: 'Sword',
      items: {
        '20dr': [['Delita', '3']],
        '20d': [['Angeal', '2'], ['Curilla', '2']],
      },
    },
    {
      header: 'Bracer',
      items: {
        '25d': [['Angeal', '3']],
      },
    },
    {
      header: 'Hat',
      items: {
        '20dr': [['Gogo (VI)', '3']],
      },
    },
    {
      header: 'Helm',
      items: {
        '25d': [['Knight', '3']],
        '10d': [['Dark Knight', '1a'], ['Knight', '1']],
      },
    },
    {
      header: 'Lt. Armor',
      items: {
        '25d': [['Snow', '3']],
        '20d': [['Gladiator', '2'], ['Meliadoul', '2']],
        '10d': [['Wol', '1']],
      },
    },
    {
      header: 'H. Armor',
      items: {
        '25d': [['Steiner', '3']],
        '20dr': [['Dorgann', '3'], ['Leo', '3'], ['Ceodore', '2']],
        '20d': [['Garland', '2']],
        '10d': [['Gilgamesh', '1'], ['Steiner', '1a']],
      },
    },
    {
      header: 'Robe',
      items: {
        '20dr': [["Y'shtola", '3']],
      },
    },
    {
      header: 'Shield',
      items: {
        '25d': [['Ingus', '3']],
        '20dr': [['Basch', '3'], ['Haurchefant', '3']],
        '20d': [['Haurchefant', '2'], ['Ingus', '2']],
        '20r': [['Gordon', '2']],
      },
    },
  ],
};

export default [atkTable, atkMagTable, magTable, magMndTable, mndTable, defResTable];
