import * as React from 'react';
import { connect } from 'react-redux';

import { getRecordMateriaDetail, RecordMateriaDetail } from '../actions/recordMateria';
import { RecordMateriaGrid } from '../components/recordMateria/RecordMateriaGrid';
import { IState } from '../reducers';
import { Page } from './Page';
import { StatBuffs } from '../components/recordMateria/StatBuffs';

interface Props {
  recordMateria: RecordMateriaDetail[];
}

export class RecordMateriaPage extends React.Component<Props> {
  render() {
    const { recordMateria } = this.props;
    return (
      <Page title="Record Materia">
        {recordMateria.length === 0
          ? <div>
              <p>Record materia information has not been loaded.</p>
              <p>Within FFRK, please go under the Annex, under the Library, and choose Record Materia.</p>
            </div>
          : <div><StatBuffs recordMateria={recordMateria}/><RecordMateriaGrid recordMateria={recordMateria}/></div>
        }
      </Page>
    );
  }
}

// FIXME: Use reselect
export default connect(
  (state: IState) => ({
    recordMateria: getRecordMateriaDetail(
      state.recordMateria.recordMateria, state.characters.characters,
      state.recordMateria.inventory, state.recordMateria.favorites
    ),
  })
)(RecordMateriaPage);
