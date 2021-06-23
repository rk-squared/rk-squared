import * as React from 'react';
import { connect } from 'react-redux';
import { Page } from './Page';
import { IState } from '../reducers';
import { LabyrinthState } from '../reducers/labyrinth';
import { LabyrinthChests } from '../components/labyrinth/LabyrinthChests';
import { LabyrinthPaintingsList } from '../components/labyrinth/LabyrinthPaintingsList';
import { LabyrinthCombatDisplay } from '../components/labyrinth/LabyrinthCombatDisplay';

export class LabyrinthPage extends React.Component<LabyrinthState> {
  render() {
    const { combat, chests, paintings } = this.props;
    return (
      <Page title="Labyrinth">
        {combat && (
          <>
            <h4>Current Combat</h4>
            <LabyrinthCombatDisplay combat={combat} />
          </>
        )}
        {chests && (
          <>
            <h4>Treasure Chests</h4>
            <LabyrinthChests chests={chests} />
          </>
        )}

        <h4>Paintings</h4>
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
