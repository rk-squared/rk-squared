import * as React from 'react';
import { connect } from 'react-redux';

import { RecordMateria } from '../actions/recordMateria';
import { RecordMateriaGrid } from '../components/RecordMateriaGrid';
import { IState } from '../reducers';
import { Page } from './Page';

import * as _ from 'lodash';

interface Props {
  recordMateria: RecordMateria[];
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
          : <RecordMateriaGrid recordMateria={recordMateria}/>
        }
      </Page>
    );
  }
}

export default connect(
  (state: IState) => ({
    recordMateria: _.values(state.recordMateria.recordMateria)
  })
)(RecordMateriaPage);
