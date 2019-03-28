import * as React from 'react';

import * as _ from 'lodash';

import { enlir } from '../../data/enlir';
import { LegendMateriaListItem } from './LegendMateriaListItem';
import { SoulBreakListItem } from './SoulBreakListItem';

const styles = require('./CharacterSoulBreaks.scss');

interface Props {
  character: string;
  ownedSoulBreaks?: Set<number>;
  ownedLegendMateria?: Set<number>;
}

export class CharacterSoulBreaks extends React.PureComponent<Props> {
  render() {
    const { character, ownedSoulBreaks, ownedLegendMateria } = this.props;
    // Class name to use, indexed by the boolean value of whether we have this
    // soul break or legend materia.
    const ownedSB = [ownedSoulBreaks ? styles.unowned : undefined, undefined];
    const ownedLM = [ownedLegendMateria ? styles.unowned : undefined, undefined];

    // TODO: Show default tier someplace, like MrP does?
    const soulBreaks = _.reverse(
      enlir.soulBreaksByCharacter[character].filter(i => i.tier !== 'RW' && i.tier !== 'Default'),
    );
    const legendMateria = _.reverse(enlir.legendMateriaByCharacter[character] || []);

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
                  className={ownedSB[ownedSoulBreaks ? +ownedSoulBreaks.has(sb.id) : 1]}
                  key={i}
                />
              ))}
              {legendMateria.map((lm, i) => (
                <LegendMateriaListItem
                  legendMateria={lm}
                  className={ownedLM[ownedLegendMateria ? +ownedLegendMateria.has(lm.id) : 1]}
                  tierClassName={styles.legendMateriaTier}
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
