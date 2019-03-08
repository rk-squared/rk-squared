import * as React from 'react';

import * as _ from 'lodash';

import { enlir, EnlirSoulBreak } from '../../data/enlir';
import { tierOrder } from '../../data/mrP';
import { SoulBreakListItem } from './SoulBreakListItem';

interface Props {
  character: string;
}

export class CharacterSoulBreaks extends React.Component<Props> {
  render() {
    const { character } = this.props;

    const soulBreaks = _.sortBy(enlir.soulBreaksByCharacter[character], [
      (i: EnlirSoulBreak) => tierOrder[i.tier],
      'id',
    ]).filter(i => i.tier !== 'RW');

    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{character}</h5>
          <ul className="list-group list-group-flush">
            {soulBreaks.map((sb, i) => (
              <SoulBreakListItem soulBreak={sb} key={i} />
            ))}
          </ul>
        </div>{' '}
      </div>
    );
  }
}
