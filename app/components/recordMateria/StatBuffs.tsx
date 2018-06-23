import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaTable, TableDefinition } from './RecordMateriaTable';

const atkTable: TableDefinition = {
  title: 'ATK Buff',
  headers: ['≥ +15% ATK', '+13% ATK/x', '+10% ATK/x', '+10-13% ATK'],
  contents: [['15'], ['13x'], ['10x'], ['13', '10']],
  rows: [
    {
      header: '(always)',
      items: {
        '15': [['Ricard', '1a'], ['Firion', '3'], ['Josef', '3']],
        '13x': [['Vayne', '3']],
        '10x': [['Ceodore', '3'], ['Larsa', '3'], ['Marcus', '3'], ['Noel', '3'], ['Zack', '3'],
          ['Firion', '2'], ['Josef', '1a'], ['Laguna', '2'], ['Irvine', '1a'], ['Leo', '1'], ['Sephiroth', '1']],
        '10': [['Firion', '1'], ['Zell', '1a'], ['Bard', '2'], ['Gau', '2'], ['Lann', '2'], ['Lion', '2'],
          ['Thief (I)', '2'], ['Berserker', '3']],
      }
    },
    {
      header: 'Axe',
      items: {
        '10x': [['Guy', '2']],
      }
    },
    {
      header: 'Dagger',
      items: {
        '13x': [['Thancred', '3'], ['Thief (I)', '3']],
      }
    },
    {
      header: 'Fists',
      items: {
        '15': [['Elena', '3']],
        '13x': [['Jecht', '3']],
      }
    },
    {
      header: 'Gun',
      items: {
        '15': [['Rufus', '3']],
        '13x': [['Cid (XIV)', '3']],
        '10x': [['Sazh', '3']],
        '13': [['Cid (XIV)', '3']],
        '10': [['Prompto', '1']],
      }
    },
    {
      header: 'Hammer',
      items: {
        15: [['Viking', '3']],
        13: [['Umaro', '2']],
      }
    },
    {
      header: 'Katana',
      items: {
        '13x': [['Cyan', '3']]
      }
    },
    {
      header: 'Spear',
      items: {
        '15': [['Nine', '3']],
        '13x': [['Gordon', '3'], ['Wrieg', '3']],
        '13': [['Ward', '2']],
      }
    },
    {
      header: 'Sword',
      items: {
        '13x': [['Warrior of Light', '3']],
      }
    },
    {
      header: 'Thrown',
      items: {
        '13x': [['Lann', '3']],
      }
    },
    {
      header: 'Lt. Armor',
      items: {
        '13x': [['Wol', '3']],
        '10x': [['Freya', '2']],
      }
    },
    {
      header: 'H. Armor',
      items: {
        '13x': [['Leon', '3']],
      }
    },
    {
      header: 'Shield',
      items: {
        '15': [['Gladiolus', '3']],
        '13x': [['Minfilia', '3']],
        '13': [['Minfilia', '2']],
        '10': [['Basch', '1'], ['Minfilia', '1']],
      }
    }
  ]
};

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
}

export class StatBuffs extends React.Component<Props> {
  render() {
    const { recordMateria } = this.props;
    return (
      <div>
        <RecordMateriaTable id="statBuffAtk" table={atkTable} recordMateria={recordMateria}/>
      </div>
    );
  }
}
