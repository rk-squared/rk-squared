import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import * as _ from 'lodash';

import { RecordMateriaDetail } from '../actions/recordMateria';
import { IState } from '../reducers';
import { getRecordMateriaDetail } from '../selectors/recordMateriaDetail';
import { Page } from './Page';
import { RecordMateriaRoutes } from './RecordMateriaRoutes';

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
          isAnonymous={!process.env.IS_ELECTRON}
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

export default connect((state: IState) => ({
  recordMateria: getRecordMateriaDetail(state),
  hasInventory: state.recordMateria.inventory != null,
}))(RecordMateriaPage);
