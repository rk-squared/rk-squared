import * as React from 'react';
import { LabyrinthPainting } from '../../actions/labyrinth';
import { labyrinthIcons } from '../../data/localData';

const styles = require('./LabyrinthPaintingCard.module.scss');

interface Props {
  painting: LabyrinthPainting;
}

export class LabyrinthPaintingCard extends React.Component<Props> {
  render() {
    const { painting } = this.props;
    const icon = labyrinthIcons[painting.id];
    return (
      <div className={`card ${styles.component}`}>
        {icon && <img className="card-img-top" src={icon} />}
        <div className="card-body">
          <h5 className="card-title">
            {painting.number + '. ' + painting.name.replace(/ Painting/, '')}
          </h5>
          {painting.combat && <p>{`${painting.combat.name} (D${painting.combat.difficulty})`}</p>}
        </div>
      </div>
    );
  }
}
