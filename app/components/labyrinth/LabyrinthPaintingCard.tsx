import * as React from 'react';
import { LabyrinthPainting, LabyrinthCombat } from '../../actions/labyrinth';
import { labyrinthIcons } from '../../data/localData';
import ReactTooltip = require('react-tooltip');
import { LabyrinthCombatDisplay } from './LabyrinthCombatDisplay';

const styles = require('./LabyrinthPaintingCard.module.scss');

interface Props {
  painting: LabyrinthPainting;
}

function CombatTooltip({ id, combat }: { id: string; combat: LabyrinthCombat }) {
  return (
    <ReactTooltip place="right" id={id}>
      <LabyrinthCombatDisplay combat={combat} className={styles.tooltip} />
    </ReactTooltip>
  );
}

export class LabyrinthPaintingCard extends React.Component<Props> {
  render() {
    const { painting } = this.props;
    const icon = labyrinthIcons[painting.id];
    const tooltipId = painting.combat && `labyrinth-card-${painting.number}`;
    return (
      <>
        <div className={`card ${styles.component}`} data-tip={tooltipId} data-for={tooltipId}>
          {icon && <img className="card-img-top" src={icon} />}
          <div className="card-body">
            <h6 className="card-title">
              {painting.number + '. ' + painting.name.replace(/ Painting/, '') } 
            </h6>
            {painting.combat && <h6 className="card-subtitle">{`${painting.combat.name} (D${painting.combat.difficulty})`}</h6>}
          </div>
        </div>
        {painting.combat && tooltipId && <CombatTooltip id={tooltipId} combat={painting.combat} />}
      </>
    );
  }
}
