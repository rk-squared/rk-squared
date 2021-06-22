import * as _ from 'lodash';
import * as React from 'react';
import { LabyrinthPainting } from '../../actions/labyrinth';
import { LabyrinthPaintingCard } from './LabyrinthPaintingCard';

interface Props {
  paintings: LabyrinthPainting[];
}

class LabyrinthPaintingsRow extends React.Component<Props> {
  render() {
    const { paintings } = this.props;
    return (
      <div className="row">
        {paintings.map((painting, i) => (
          <LabyrinthPaintingCard key={i} painting={painting} />
        ))}
      </div>
    );
  }
}

export class LabyrinthPaintingsList extends React.Component<Props> {
  render() {
    const { paintings } = this.props;
    const perRow = 3;
    const rowCount = Math.ceil(paintings.length / perRow);
    const startAt = Math.floor((paintings.length - 1) / perRow) * 3;
    return (
      <div>
        {_.times(rowCount, (i) => (
          <LabyrinthPaintingsRow
            key={i}
            paintings={paintings.slice(startAt - i * perRow, startAt + perRow - i * perRow)}
          />
        ))}
      </div>
    );
  }
}
