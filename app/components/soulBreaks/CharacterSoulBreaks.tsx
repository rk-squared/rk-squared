import * as React from 'react';

import * as _ from 'lodash';

import { enlir, EnlirSoulBreak } from '../../data/enlir';
import { tierOrder } from '../../data/mrP';
import { SoulBreakListItem } from './SoulBreakListItem';

const styles = require('./CharacterSoulBreaks.scss');

interface Props {
  character: string;
  ownedSoulBreaks?: Set<number>;
}

export class CharacterSoulBreaks extends React.Component<Props> {
  render() {
    const { character, ownedSoulBreaks } = this.props;
    // Class name to use, indexed by the boolean value of whether we have this
    // soul break.
    const owned = [ownedSoulBreaks ? styles.unowned : undefined, undefined];

    // TODO: Show default tier someplace, like MrP does?
    const soulBreaks = _.sortBy(enlir.soulBreaksByCharacter[character], [
      (i: EnlirSoulBreak) => -tierOrder[i.tier],
      (i: EnlirSoulBreak) => -i.id,
    ]).filter(i => i.tier !== 'RW' && i.tier !== 'Default');

    return (
      <div className={'card ' + styles.component}>
        <div className="card-body">
          <table className="table table-sm">
            <thead className="thead-dark">
              <tr>
                <th colSpan={3}>{character}</th>
              </tr>
            </thead>
            <tbody>
              {soulBreaks.map((sb, i) => (
                <SoulBreakListItem
                  soulBreak={sb}
                  className={owned[ownedSoulBreaks ? +ownedSoulBreaks.has(sb.id) : 1]}
                  key={i}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
