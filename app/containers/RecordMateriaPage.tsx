import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import { getRecordMateriaDetail, RecordMateriaDetail } from '../actions/recordMateria';
import { IState } from '../reducers';
import { Page } from './Page';
import { RecordMateriaRoutes } from './RecordMateriaRoutes';

interface Props {
  recordMateria: RecordMateriaDetail[];
}

export class RecordMateriaPage extends React.Component<Props & RouteComponentProps<Props>> {
  render() {
    const { recordMateria, match, location, history} = this.props;
    return (
      <Page title="Record Materia">
        {recordMateria.length === 0
          ? <div>
              <p>Record materia information has not been loaded.</p>
              <p>Within FFRK, please go under the Annex, under the Library, and choose Record Materia.</p>
            </div>
          : <RecordMateriaRoutes recordMateria={recordMateria} match={match} location={location} history={history}/>
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
