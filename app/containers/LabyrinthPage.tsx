import * as React from 'react';
import { connect } from 'react-redux';
import { Page } from './Page';
import { IState } from '../reducers';
import { LabyrinthState } from '../reducers/labyrinth';
import { LabyrinthPaintingsList } from '../components/labyrinth/LabyrinthPaintingsList';

export class LabyrinthPage extends React.Component<LabyrinthState> {
  render() {
    const { paintings } = this.props;
    return (
      <Page title="Labyrinth">
        {!paintings ? (
          <p>No labyrinth paintings have been loaded.</p>
        ) : (
          <LabyrinthPaintingsList paintings={paintings} />
        )}
      </Page>
    );
  }
}

export default connect((state: IState) => state.labyrinth)(LabyrinthPage);
