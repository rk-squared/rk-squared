import * as React from 'react';
import { connect } from 'react-redux';
import { Page } from './Page';
import { IState } from '../reducers';
import { LabyrinthState } from '../reducers/labyrinth';
import { LabyrinthChests } from '../components/labyrinth/LabyrinthChests';
import { LabyrinthPaintingsList } from '../components/labyrinth/LabyrinthPaintingsList';
import { LabyrinthCombatDisplay } from '../components/labyrinth/LabyrinthCombatDisplay';
import ReactTooltip = require('react-tooltip');
const styles = require('../components/labyrinth/LabyrinthPaintingCard.module.scss');
import { LabyrinthCombat } from '../actions/labyrinth';

function CombatTooltip({ id, combat }: { id: string; combat: LabyrinthCombat }) {
  return (
    <ReactTooltip place="bottom" id={id}>
      <LabyrinthCombatDisplay combat={combat} className={styles.tooltip} />
    </ReactTooltip>
  );
}

export class LabyrinthPage extends React.Component<LabyrinthState> {
  render() {
    const { combat, chests, paintings, remaining } = this.props;
    const tooltipId = combat && `labyrinth-battle`;
    return (
      <Page title="Labyrinth">
        {combat && (
          <>
            <div data-tip={tooltipId} data-for={tooltipId}>
              <h5>Combat</h5> 
              <h6>{`${combat.name} (D${combat.difficulty})`}</h6>
              {tooltipId && <CombatTooltip id={tooltipId} combat={combat} />}
            </div>
          </>
        )}
        {chests && (
          <>
            <h5>Treasure Chests</h5>
            <LabyrinthChests chests={chests} />
          </>
        )}

        <h5>Paintings ({remaining}) </h5>
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
