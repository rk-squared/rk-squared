import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import { getRecordMateriaDetail, RecordMateriaDetail } from '../actions/recordMateria';
import { IState } from '../reducers';
import { Page } from './Page';
import { RecordMateriaRoutes } from './RecordMateriaRoutes';

import * as _ from 'lodash';

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
  hasInventory: boolean;
}

export class RecordMateriaPage extends React.Component<Props & RouteComponentProps> {
  renderContents() {
    const { recordMateria, hasInventory, match, location, history } = this.props;
    if (_.isEmpty(recordMateria)) {
      return (
        <>
          <p>Record materia information has not been loaded.</p>
          <p>
            Within FFRK, please go under the Annex, under the Library, and choose Record Materia.
          </p>
        </>
      );
    } else if (!hasInventory) {
      return (
        <>
          <p>Record materia inventory has not been loaded.</p>
          <p>Please restart FFRK then go under Party, or go under the Annex, under the Library.</p>
        </>
      );
    } else {
      return (
        <RecordMateriaRoutes
          recordMateria={recordMateria}
          match={match}
          location={location}
          history={history}
        />
      );
    }
  }

  render() {
    return <Page title="Record Materia">{this.renderContents()}</Page>;
  }
}

// FIXME: Use reselect
export default connect((state: IState) => ({
  recordMateria: getRecordMateriaDetail(
    state.recordMateria.recordMateria,
    state.characters.characters,
    state.recordMateria.inventory,
    state.recordMateria.favorites,
  ),
  hasInventory: state.recordMateria.inventory != null,
}))(RecordMateriaPage);
