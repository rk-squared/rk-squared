import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaTable, TableDefinition } from './RecordMateriaTable';

const elementalTable: TableDefinition = {
  title: 'Elemental',
  headers: ['1.3x', '1.2x'],
  contents: [['13'], ['12']],
  rows: [
    {
      header: '(always)',
      items: {
        13: [['Tyro', '3']],
        12: [['Luneth', '2'], ['Reks', '2'], ['Tyro', '1b']],
      }
    },
    {
      header: 'Bio',
      items: {
        13: [['Edgar', '3'], ['Quistis', '3']],
      }
    },
    {
      header: 'Dark',
      items: {
        13: [['Garland', '3'], ['Riku', '3']],
        12: [['Gabranth', '2'], ['Golbez', '2'], ['Kuja', '2'], ['Riku', '2']],
      }
    },
    {
      header: 'Earth',
      items: {
        13: [['Tifa', '3']],
      }
    },
    {
      header: 'Fire',
      items: {
        13: [['Vivi', '3']],
        12: [['Edge', '2']],
      }
    },
    {
      header: 'Holy',
      items: {
        13: [['Cecil (Paladin)', '3']],
        12: [['Warrior of Light', '2']],
      }
    },
    {
      header: 'Ice',
      items: {
        13: [['Squall', '3']],
        12: [['Josef', '2'], ['Lulu', '2'], ['Ysayle', '2']],
      }
    },
    {
      header: 'Lightning',
      items: {
        13: [['Lightning', '3']],
        12: [['Ashe', '2'], ['Raijin', '2']],
      }
    },
    {
      header: 'Water',
      items: {
        13: [['Tidus', '3']],
        12: [['Strago', '2']],
      }
    },
    {
      header: 'Wind',
      items: {
        13: [['Bartz', '3']],
        12: [['Barbariccia', '2'], ['Cid (VII)', '2'], ['Fujin', '2'], ['Thancred', '2']],
      }
    },
  ]
};

const abilityTable: TableDefinition = {
  title: 'Abilities',
  headers: ['~1.4x', '~1.3x', '13% Dualcast'],
  contents: [['1_4', '1_35'], ['1_3', '1_25', '1_2', '1_15'], ['w']],
  rows: [
    {
      header: 'Celerity',
      items: {
        '1_35': [['Locke', '3']],
        '1_25': [['Shelke', '2']],
        'w': [['Vaan', '2']],
      }
    },
    {
      header: 'Darkness',
      items: {
        '1_4': [['Cecil (Dark Knight)', '3'], ['Zeid', '3']],
        '1_3': [['Seifer', '2']],
        'w': [['Exdeath', '2'], ['Zeid', '2']],
      }
    },
    {
      header: 'Dragoon',
      items: {
        '1_35': [['Cid (VII)', '3'], ['Estinien', '3']],
        '1_3': [['Aranea', '2'], ['Fang', '2'], ['Ricard', '2'], ['Wrieg', '2']],
        '1_15': [['Freya', '1']],
      }
    },
    {
      header: '(any jump ability or SB)',
      items: {
        '1_35': [['Kain', '3']],
        '1_3': [['Kain', '2']],
        '1_25': [['Dragoon', '2'], ['Estinien', '2']],
        '1_2': [['Kain', '1a']],
      }
    },
    {
      header: 'Heavy Physical',
      items: {
        '1_4': [['Cinque', '3']],
      }
    },
    {
      header: 'Knight',
      items: {
        '1_4': [['Agrias', '3']],
        '1_3': [['Agrias', '2'], ['Dorgann', '2'], ['Marche', '2']],
        'w': [['Basch', '2']],
      }
    },
    {
      header: 'Machinist',
      items: {
        '1_35': [['Laguna', '3']],
        '1_3': [['Setzer', '2']],
        'w': [['Balthier', '2'], ['Prompto', '2']],
      }
    },
    {
      header: 'Monk',
      items: {
        '1_4': [['Sabin', '3']],
        '1_3': [['Zell', '2']],
        '1_15': [['Monk', '1a'], ['Yda', '1']],
        'w': [['Master', '2'], ['Sabin', '2']],
      }
    },
    {
      header: 'Ninja',
      items: {
        '1_4': [['Edge', '3']],
        '1_3': [['Shadow', '2']],
      }
    },
    {
      header: 'Samurai',
      items: {
        '1_4': [['Auron', '3']],
        '1_3': [['Cyan', '2']],
        'w': [['Auron', '2']],
      }
    },
    {
      header: 'Sharpshooter',
      items: {
        '1_4': [['Irvine', '3']],
        '1_3': [['Rufus', '2']],
      }
    },
    {
      header: 'Spellblade',
      items: {
        '1_4': [['Celes', '3'], ['Machina', '3'], ['Sora', '3']],
        '1_3': [['Celes', '2'], ['Paine', '2'], ['Sora', '2'], ['Xezat', '2']],
        'w': [['Bartz', '2']],
      }
    },
    {
      header: 'Support',
      items: {
        '1_4': [['Faris', '3'], ['Meliadoul', '3'], ['Morrow', '3']],
        '1_3': [['Quina', '1b']],
      }
    },
    {
      header: 'Thief',
      items: {
        '1_4': [['Zidane', '3']],
        '1_3': [['Rikku', '2']],
        'w': [['Zidane', '2']],
      }
    },
    {
      header: 'Witch',
      items: {
        '1_35': [['Edea', '3']],
        '1_3': [['Rapha', '2']],
      }
    },
  ]
};

const physicalTable: TableDefinition = {
  title: 'Physical Damage',
  headers: ['1.3x', '1.2x'],
  contents: [['1_3'], ['1_2']],
  rows: [
    {
      header: 'PHY Axe',
      items: {
        '1_3': [['Berserker', '3'], ['Guy', '3']],
        '1_2': [['Berserker', '1b']],
      }
    },
    {
      header: 'PHY Blitzball',
      items: {
        '1_3': [['Wakka', '3']]
      }
    },
    {
      header: 'PHY Bow',
      items: {
        '1_3': [['Fran', '3']],
        '1_2': [['Faris', '2'], ['Fran', '1b']],
      }
    },
    {
      header: 'PHY Dagger',
      items: {
        '1_3': [['Ignis', '3'], ['Vaan', '3']],
        '1_2': [['Leila', '2'], ['Locke', '2'], ['Marcus', '2']],
      }
    },
    {
      header: 'PHY Fists',
      items: {
        '1_3': [['Zell', '3']],
        '1_2': [['Galuf', '2'], ['Tifa', '2']],
      }
    },
    {
      header: 'PHY Gun',
      items: {
        '1_3': [['Balthier', '3'], ['Prompto', '3']],
        '1_2': [['Elena', '2'], ['Irvine', '1b'], ['Vincent', '2']],
      }
    },
    {
      header: 'PHY Gun-Arm',
      items: {
        '1_3': [['Barret', '3']],
        '1_2': [['Barret', '2']],
      }
    },
    {
      header: 'PHY Hairpin',
      items: {
        '1_3': [['Red XIII', '3']],
      }
    },
    {
      header: 'PHY Hammer',
      items: {
        '1_2': [['Cid (IV)', '2']],
      }
    },
    {
      header: 'PHY Instrument',
      items: {
        '1_3': [['Edward', '3']],
        '1_2': [['Eiko', '2']],
      }
    },
    {
      header: 'PHY Katana',
      items: {
        '1_3': [['Sephiroth', '3']],
        '1_2': [['Sephiroth', '2']],
      }
    },
    {
      header: 'PHY Spear',
      items: {
        '1_3': [['Fang', '3']],
        '1_2': [['Edgar', '2'], ['Nine', '2'], ['Quina', '2']],
      }
    },
    {
      header: 'PHY Sword',
      items: {
        '1_3': [['Cloud', '3'], ['Warrior', '3']],
        '1_2': [['Beatrix', '2'], ['Cecil (Dark Knight)', '2']],
      }
    },
    {
      header: 'PHY Thrown',
      items: {
        '1_3': [['Refia', '3']],
        '1_2': [['Ninja', '2'], ['Refia', '2']],
      }
    },
    {
      header: 'PHY Whip',
      items: {
        '1_2': [['Quistis', '2']],
      }
    },
    {
      header: 'PHY Helm',
      items: {
        '1_3': [['Aranea', '3']],
        '1_2': [['Viking', '2']],
      }
    },
  ]
};

const magicalTable: TableDefinition = {
  title: 'Magic Damage and Healing',
  headers: ['~1.3x', '1.2x'],
  contents: [['1_3', '1_25'], ['1_2']],
  rows: [
    {
      header: 'BLK (always)',
      items: {
        '1_25': [['Rinoa', '3']],
      }
    },
    {
      header: 'BLK Bow',
      items: {
        '1_2': [['Serah', '2']],
      }
    },
    {
      header: 'BLK Rod',
      items: {
        '1_2': [['Papalymo', '2'], ['Reno', '2']],
      }
    },
    {
      header: 'BLK Staff',
      items: {
        '1_3': [['Matoya', '3'], ['Shantotto', '3']],
        '1_2': [['Shantotto', '2']],
      }
    },
    {
      header: 'BLK Thrown',
      items: {
        '1_3': [['Reynn', '3']],
        '1_2': [['Hope', '2']],
      }
    },
    {
      header: 'SUM (always)',
      items: {
        '1_3': [['Yuna', '3']],
        '1_2': [['Braska', '2'], ['Rydia', '1b'], ['Summoner', '2']],
      }
    },
    {
      header: 'WHT Damage',
      items: {
        '1_3': [['Penelo', '3'], ['Rem', '3']],
        '1_2': [['Rem', '2'], ['Y\'shtola', '2']],
      }
    },
    {
      header: 'WHT Healing',
      items: {
        '1_3': [['Aria', '3'], ['Lenna', '3'], ['Minwu', '3']],
        '1_2': [['Aemo', '2'], ['Aerith', '2'], ['Elarra', '2'], ['Minwu', '2']],
      }
    },
  ]
};

const magicDualcastTable: TableDefinition = {
  title: 'Black, Summon, White Dualcast',
  headers: ['20%', '15%', '13%'],
  contents: [['20w'], ['15w'], ['13w']],
  rows: [
    {
      header: 'Black Magic',
      items: {
        '15w': [['Magus', '1b'], ['Matoya', '2']],
        '13w': [['Red Mage', '2'], ['Terra', '2']],
      }
    },
    {
      header: 'Summoner',
      items: {
        '20w': [['Garnet', '2']],
      }
    },
    {
      header: 'White Magic',
      items: {
        '15w': [['Alma', '2'], ['Devout', '1b']]
      }
    }
  ]
};

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
}

export class DamageHealing extends React.Component<Props> {
  render() {
    const { recordMateria } = this.props;
    return (
      <div>
        <RecordMateriaTable id="damageHealingElemental" table={elementalTable} recordMateria={recordMateria}/>
        <RecordMateriaTable id="damageHealingAbility" table={abilityTable} recordMateria={recordMateria}/>
        <RecordMateriaTable id="damageHealingPhysical" table={physicalTable} recordMateria={recordMateria}/>
        <RecordMateriaTable id="damageHealingMagical" table={magicalTable} recordMateria={recordMateria}/>
        <RecordMateriaTable id="damageHealingMagicDualcast" table={magicDualcastTable} recordMateria={recordMateria}/>
      </div>
    );
  }
}
