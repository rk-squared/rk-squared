import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaList } from './RecordMateriaList';
import { RecordMateriaTable } from './RecordMateriaTable';

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
}

export class StatBuffs extends React.Component<Props> {
  render() {
    const { recordMateria } = this.props;
    return (
      <div>
        <RecordMateriaTable>
          <tbody>
            <tr>
              <th>ATK Buff</th>
              <th>&ge; +15% ATK</th>
              <th>+13% ATK/x</th>
              <th>+10% ATK/x</th>
              <th>+10-13% ATK</th>
            </tr>

            <tr>
              <th scope="row">(always)</th>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Ricard', '1a'], ['Firion', '3'], ['Josef', '3'], ['Vayne', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Ceodore', '3'], ['Larsa', '3'], ['Marcus', '3'], ['Noel', '3'], ['Zack', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Firion', '2'], ['Josef', '1a'], ['Laguna', '2'], ['Irvine', '1a'], ['Leo', '1'],
                    ['Sephiroth', '1']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Firion', '1'], ['Zell', '1a'], ['Bard', '2'], ['Gau', '2'], ['Lann', '2'], ['Lion', '2'],
                    ['Thief (I)', '2'], ['Berserker', '3']]
                }/>
              </td>
            </tr>

            <tr>
              <th scope="row">Axe</th>
              <td></td>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Guy', '2']]
                }/>
              </td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Dagger</th>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Thancred', '3'], ['Thief (I)', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Fists</th>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Elena', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Jecht', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Gun</th>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Rufus', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Cid (XIV)', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Sazh', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Cid (XIV)', '3'], ['Prompto', '1']]
                }/>
              </td>
            </tr>

            <tr>
              <th scope="row">Hammer</th>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Viking', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Umaro', '2']]
                }/>
              </td>
            </tr>

            <tr>
              <th scope="row">Katana</th>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Cyan', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Spear</th>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Nine', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Gordon', '3'], ['Wrieg', '3']]
                }/>
              </td>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Ward', '2']]
                }/>
              </td>
            </tr>

            <tr>
              <th scope="row">Sword</th>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Warrior of Light', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Thrown</th>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Lann', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Lt. Armor</th>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Wol', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Freya', '2']]
                }/>
              </td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">H. Armor</th>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Leon', '3']]
                }/>
              </td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <th scope="row">Shield</th>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Gladiolus', '3']]
                }/>
              </td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Minfilia', '3']]
                }/>
              </td>
              <td></td>
              <td>
                <RecordMateriaList recordMateria={recordMateria} show={
                  [['Basch', '1'], ['Minfilia', '1'], ['Minfilia', '2']]
                }/>
              </td>
            </tr>
          </tbody>
        </RecordMateriaTable>
      </div>
    );
  }
}
