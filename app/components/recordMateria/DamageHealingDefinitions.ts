import { TableDefinition } from './RecordMateriaTableDefinitions';

const elementalTable: TableDefinition = {
  title: 'Elemental',
  headers: ['1.3x', '1.2x', '1.1x'],
  contents: [['13'], ['12'], ['11']],
  rows: [
    {
      header: '(vs. weakness)',
      items: {
        13: [['Tyro', '3']],
        12: [['Luneth', '2'], ['Reks', '2'], ['Tyro', '1b'], ['Dr. Mog', '2']],
        11: [['Tyro', '1a'], ['Quistis', '1'], ['Nabaat', '1']],
      },
    },
    {
      header: 'Bio',
      items: {
        13: [['Edgar', '3'], ['Quistis', '3']],
      },
    },
    {
      header: 'Dark',
      items: {
        13: [['Garland', '3'], ['Riku', '3']],
        12: [['Gabranth', '2'], ['Golbez', '2'], ['Kuja', '2'], ['Riku', '2']],
        11: [['Kuja', '1'], ['Riku', '1'], ['Gabranth', '1']],
      },
    },
    {
      header: 'Earth',
      items: {
        13: [['Tifa', '3']],
        12: [['Cinque', '2']],
        11: [['Ingus', '1a'], ['Rude', '1'], ['Enna', '1']],
      },
    },
    {
      header: 'Fire',
      items: {
        13: [['Vivi', '3'], ['Axel', '3']],
        12: [['Edge', '2'], ['Axel', '2']],
        11: [['Refia', '1a'], ['Rubicante', '1'], ['Lulu', '1'], ['Axel', '1']],
      },
    },
    {
      header: 'Holy',
      items: {
        13: [['Cecil (Paladin)', '3'], ['Roxas', '3']],
        12: [['Warrior of Light', '2'], ['Roxas', '2']],
        11: [['Dorgann', '1'], ['Aerith', '1'], ['Roxas', '1']],
      },
    },
    {
      header: 'Ice',
      items: {
        13: [['Squall', '3']],
        12: [['Josef', '2'], ['Lulu', '2'], ['Ysayle', '2']],
      },
    },
    {
      header: 'Lightning',
      items: {
        13: [['Lightning', '3']],
        12: [['Ashe', '2'], ['Raijin', '2']],
        11: [['Echo', '1']],
      },
    },
    {
      header: 'Water',
      items: {
        13: [['Tidus', '3']],
        12: [['Strago', '2']],
        11: [['Arc', '1a'], ['Strago', '1a']],
      },
    },
    {
      header: 'Wind',
      items: {
        13: [['Bartz', '3'], ['Wedge', '3']],
        12: [
          ['Barbariccia', '2'],
          ['Cid (VII)', '2'],
          ['Fujin', '2'],
          ['Thancred', '2'],
          ['Ultimecia', '2'],
        ],
        11: [['Luneth', '1a'], ['Bartz', '1'], ['Serafie', '1']],
      },
    },
  ],
};

const abilityTable: TableDefinition = {
  title: 'Abilities',
  headers: ['~1.4x', '~1.3x', '~1.15x', '13% Dualcast', '8% Dualcast'],
  contents: [['1_4', '1_35'], ['1_3', '1_25'], ['1_2', '1_15'], ['13w'], ['8w']],
  rows: [
    {
      header: 'Celerity',
      items: {
        '1_35': [['Locke', '3']],
        '1_25': [['Shelke', '2']],
        '13w': [['Vaan', '2']],
      },
    },
    {
      header: 'Darkness',
      items: {
        '1_4': [['Cecil (Dark Knight)', '3'], ['Zeid', '3']],
        '1_3': [['Seifer', '2']],
        '1_15': [['Zeid', '1'], ['Gaffgarion', '1'], ['Sice', '1']],
        '13w': [['Exdeath', '2'], ['Zeid', '2'], ['Sice', '2']],
      },
    },
    {
      header: 'Dragoon',
      items: {
        '1_35': [['Cid (VII)', '3'], ['Estinien', '3']],
        '1_3': [['Aranea', '2'], ['Fang', '2'], ['Ricard', '2'], ['Wrieg', '2']],
        '1_15': [['Freya', '1'], ['Ward', '1']],
      },
    },
    {
      header: '(any jump ability or SB)',
      items: {
        '1_35': [['Kain', '3']],
        '1_3': [['Kain', '2']],
        '1_25': [['Dragoon', '2'], ['Estinien', '2']],
        '1_2': [['Kain', '1a']],
      },
    },
    {
      header: 'Heavy Physical',
      items: {
        '1_4': [['Cinque', '3']],
      },
    },
    {
      header: 'Knight',
      items: {
        '1_4': [['Agrias', '3'], ['Biggs', '3']],
        '1_3': [['Agrias', '2'], ['Dorgann', '2'], ['Marche', '2']],
        '1_15': [['Curilla', '1'], ['Haurchefant', '1']],
        '13w': [['Basch', '2']],
      },
    },
    {
      header: 'Machinist',
      items: {
        '1_35': [['Laguna', '3']],
        '1_3': [['Setzer', '2']],
        '1_15': [['Cid (IV)', '1']],
        '13w': [['Balthier', '2'], ['Prompto', '2']],
      },
    },
    {
      header: 'Monk',
      items: {
        '1_4': [['Sabin', '3'], ['Eight', '3']],
        '1_3': [['Zell', '2']],
        '1_15': [['Monk', '1a'], ['Yda', '1']],
        '13w': [['Master', '2'], ['Sabin', '2'], ['Eight', '2']],
        '8w': [['Monk', '1b']],
      },
    },
    {
      header: 'Ninja',
      items: {
        '1_4': [['Edge', '3']],
        '1_3': [['Shadow', '2']],
        '1_15': [['Kiros', '1']],
      },
    },
    {
      header: 'Samurai',
      items: {
        '1_4': [['Auron', '3'], ['Jack', '3']],
        '1_3': [['Cyan', '2'], ['Cor', '2']],
        '1_15': [['Ayame', '1'], ['Cor', '1']],
        '13w': [['Auron', '2'], ['Jack', '2']],
      },
    },
    {
      header: 'Sharpshooter',
      items: {
        '1_4': [['Irvine', '3']],
        '1_3': [['Rufus', '2'], ['Trey', '2']],
        '1_15': [['Rufus', '1']],
        '13w': [['Trey', '3']],
      },
    },
    {
      header: 'Spellblade',
      items: {
        '1_4': [['Celes', '3'], ['Machina', '3'], ['Sora', '3']],
        '1_3': [['Celes', '2'], ['Paine', '2'], ['Sora', '2'], ['Xezat', '2']],
        '1_15': [['Scott', '1'], ['Paine', '1'], ['Reks', '1'], ['Machina', '1'], ['Sora', '1']],
        '13w': [['Bartz', '2']],
      },
    },
    {
      header: 'Support',
      items: {
        '1_4': [['Faris', '3'], ['Meliadoul', '3'], ['Morrow', '3']],
        '1_3': [['Quina', '1b']],
      },
    },
    {
      header: 'Thief',
      items: {
        '1_4': [['Zidane', '3']],
        '1_3': [['Rikku', '2']],
        '1_15': [['Thief (I)', '1']],
        '13w': [['Zidane', '2']],
      },
    },
    {
      header: 'Witch',
      items: {
        '1_35': [['Edea', '3']],
        '1_3': [['Rapha', '2']],
        '8w': [['Rapha', '1']],
      },
    },
  ],
};

const physicalTable: TableDefinition = {
  title: 'Physical Damage',
  headers: ['1.3x', '1.2x', '1.1x'],
  contents: [['1_3'], ['1_2'], ['1_1']],
  rows: [
    {
      header: 'PHY Axe',
      items: {
        '1_3': [['Berserker', '3'], ['Guy', '3']],
        '1_2': [['Berserker', '1b']],
        '1_1': [['Berserker', '1a'], ['Gladiator', '1a']],
      },
    },
    {
      header: 'PHY Blitzball',
      items: {
        '1_3': [['Wakka', '3']],
        '1_1': [['Jecht', '1']],
      },
    },
    {
      header: 'PHY Bow',
      items: {
        '1_3': [['Fran', '3']],
        '1_2': [['Faris', '2'], ['Fran', '1b']],
        '1_1': [['Ranger', '1a'], ['Maria', '1b'], ['Trey', '1']],
      },
    },
    {
      header: 'PHY Dagger',
      items: {
        '1_3': [['Ignis', '3'], ['Vaan', '3'], ['Lilisette', '3']],
        '1_2': [['Leila', '2'], ['Locke', '2'], ['Marcus', '2']],
        '1_1': [['Leila', '1'], ['Thancred', '1'], ['Ignis', '1']],
      },
    },
    {
      header: 'PHY Fist',
      items: {
        '1_3': [['Zell', '3']],
        '1_2': [['Galuf', '2'], ['Tifa', '2']],
        '1_1': [['Tifa', '1'], ['Amarant', '1']],
      },
    },
    {
      header: 'PHY Gun',
      items: {
        '1_3': [['Balthier', '3'], ['Prompto', '3'], ['Cater', '3']],
        '1_2': [['Elena', '2'], ['Irvine', '1b'], ['Vincent', '2']],
        '1_1': [['Laguna', '1'], ['King', '1'], ['Cater', '1']],
      },
    },
    {
      header: 'PHY Gun-Arm',
      items: {
        '1_3': [['Barret', '3']],
        '1_2': [['Barret', '2']],
      },
    },
    {
      header: 'PHY Hairpin',
      items: {
        '1_3': [['Red XIII', '3']],
      },
    },
    {
      header: 'PHY Hammer',
      items: {
        '1_2': [['Cid (IV)', '2']],
        '1_1': [['Viking', '1a']],
      },
    },
    {
      header: 'PHY Instrument',
      items: {
        '1_3': [['Edward', '3']],
        '1_2': [['Eiko', '2']],
        '1_1': [['Bard', '1a']],
      },
    },
    {
      header: 'PHY Katana',
      items: {
        '1_3': [['Sephiroth', '3']],
        '1_2': [['Sephiroth', '2']],
        '1_1': [['Cyan', '1a'], ['Auron', '1']],
      },
    },
    {
      header: 'PHY Spear',
      items: {
        '1_3': [['Fang', '3']],
        '1_2': [['Edgar', '2'], ['Nine', '2'], ['Quina', '2']],
        '1_1': [['Kimahri', '1a'], ['Fang', '1'], ['Estinien', '1'], ['Aranea', '1']],
      },
    },
    {
      header: 'PHY Sword',
      items: {
        '1_3': [['Cloud', '3'], ['Warrior', '3']],
        '1_2': [['Beatrix', '2'], ['Cecil (Dark Knight)', '2'], ['Biggs', '2']],
        '1_1': [
          ['Warrior', '1'],
          ['Cloud', '1a'],
          ['Zack', '1'],
          ['Marche', '1'],
          ['Morrow', '1'],
          ['Biggs', '1'],
        ],
      },
    },
    {
      header: 'PHY Thrown',
      items: {
        '1_3': [['Refia', '3']],
        '1_2': [['Ninja', '2'], ['Refia', '2']],
        '1_1': [['Ninja', '1a'], ['Yuffie', '1']],
      },
    },
    {
      header: 'PHY Whip',
      items: {
        '1_2': [['Quistis', '2']],
      },
    },
    {
      header: 'PHY Hat',
      items: {
        '1_1': [['Wedge', '1']],
      },
    },
    {
      header: 'PHY Helm',
      items: {
        '1_3': [['Aranea', '3']],
        '1_2': [['Viking', '2']],
      },
    },
    {
      header: 'PHY Lt. Armor',
      items: {
        '1_1': [['Ursula', '1']],
      },
    },
  ],
};

const magicTable: TableDefinition = {
  title: 'Magic Damage and Healing',
  headers: ['~1.3x', '~1.2x', '~1.1x'],
  contents: [['1_3', '1_25'], ['1_2', '1_15'], ['1_1']],
  rows: [
    {
      header: 'BLK (always)',
      items: {
        '1_25': [['Rinoa', '3']],
        '1_2': [['Dr. Mog', '3']],
        '1_15': [['Rinoa', '2']],
      },
    },
    {
      header: 'BLK Dagger',
      items: {
        '1_1': [['Palom', '1']],
      },
    },
    {
      header: 'BLK Bow',
      items: {
        '1_2': [['Serah', '2']],
        '1_1': [['Maria', '1a'], ['Maria', '1b']],
      },
    },
    {
      header: 'BLK Instrument',
      items: {
        '1_2': [['Serafie', '2']],
      },
    },
    {
      header: 'BLK Rod',
      items: {
        '1_3': [['Ultimecia', '3']],
        '1_2': [['Papalymo', '2'], ['Reno', '2']],
        '1_1': [['Meia', '1'], ['Fusoya', '2'], ['Vivi', '1a']],
      },
    },
    {
      header: 'BLK Staff',
      items: {
        '1_3': [['Matoya', '3'], ['Shantotto', '3']],
        '1_2': [['Shantotto', '2']],
        '1_1': [['Shantotto', '1'], ['Montblanc', '1']],
      },
    },
    {
      header: 'BLK Sword',
      items: {
        '1_1': [['Desch', '1']],
      },
    },
    {
      header: 'BLK Thrown',
      items: {
        '1_3': [['Reynn', '3']],
        '1_2': [['Hope', '2']],
        '1_1': [['Hope', '1']],
      },
    },
    {
      header: 'BLK Whip',
      items: {
        '1_3': [['Seven', '3']],
      },
    },
    {
      header: 'BLK Hat',
      items: {
        '1_2': [['Wedge', '2']],
      },
    },
    {
      header: 'BLK Lt. Armor',
      items: {
        '1_1': [['Cid Raines', '1']],
      },
    },
    {
      header: 'SUM (always)',
      items: {
        '1_3': [['Yuna', '3']],
        '1_2': [['Braska', '2'], ['Rydia', '1b'], ['Summoner', '2']],
        '1_1': [['Meia', '1'], ['Krile', '1']],
      },
    },
    {
      header: 'SUM Rod',
      items: {
        '1_1': [['Meia', '2']],
      },
    },
    {
      header: 'WHT Damage',
      items: {
        '1_3': [['Penelo', '3'], ['Rem', '3']],
        '1_2': [['Rem', '2'], ["Y'shtola", '2']],
      },
    },
    {
      header: 'BLK/WHT Damage',
      items: {
        '1_1': [['Fusoya', '2']],
      },
    },
    {
      header: 'WHT Healing',
      items: {
        '1_3': [['Aria', '3'], ['Lenna', '3'], ['Minwu', '3']],
        '1_2': [['Aemo', '2'], ['Aerith', '2'], ['Elarra', '2'], ['Minwu', '2'], ['Dr. Mog', '3']],
        '1_1': [
          ['Elarra', '1'],
          ['Lenna', '1'],
          ['Yuna', '1'],
          ["Y'shtola", '1'],
          ['Iris', '1'],
          ['Alma', '1'],
          ['Deuce', '1'],
        ],
      },
    },
  ],
};

const magicDualcastTable: TableDefinition = {
  title: 'Magic Dualcast',
  headers: ['20%', '15%', '13%', '8%'],
  contents: [['20w'], ['15w'], ['13w'], ['8w']],
  rows: [
    {
      header: 'Black Magic',
      items: {
        '15w': [['Magus', '1b'], ['Matoya', '2']],
        '13w': [['Red Mage', '2'], ['Terra', '2']],
        '8w': [['Magus', '1a']],
      },
    },
    {
      header: 'Summoner',
      items: {
        '20w': [['Garnet', '2']],
      },
    },
    {
      header: 'White Magic',
      items: {
        '15w': [['Alma', '2'], ['Devout', '1b']],
        '8w': [['Devout', '1a'], ['Porom', '1']],
      },
    },
    {
      header: 'Bard',
      items: {
        '13w': [['Hilda', '2']],
      },
    },
  ],
};

export default [elementalTable, abilityTable, physicalTable, magicTable, magicDualcastTable];
