import * as React from 'react';
import { LabyrinthPainting } from '../../actions/labyrinth';
import { labyrinthIcons } from '../../data/localData';

interface Props {
  painting: LabyrinthPainting;
}

export class LabyrinthPaintingCard extends React.Component<Props> {
  render() {
    const { painting } = this.props;
    const icon = labyrinthIcons[painting.id];
    return (
      <div className="card col-sm-3">
        {icon && <img className="card-img-top" src={icon} />}
        <div className="card-body">
          <h5 className="card-title">
            {painting.name.replace(/ Painting/, '') +
              (painting.combat ? ' - ' + painting.combat.name : '')}
          </h5>
        </div>
      </div>
    );
  }
}
