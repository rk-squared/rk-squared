import * as React from 'react';

import * as _ from 'lodash';

import { enlir, EnlirSoulBreakOrLegendMateria } from '../../data/enlir';
import { LegendMateriaListItem } from './LegendMateriaListItem';
import { LimitBreakListItem } from './LimitBreakListItem';
import { SoulBreakListItem } from './SoulBreakListItem';

const styles = require('./CharacterSoulBreaks.module.scss');

interface Props {
  character: string;
  ownedSoulBreaks?: Set<number>;
  ownedLegendMateria?: Set<number>;
  ownedLimitBreaks?: Set<number>;
  soulBreaksFilter?: (item: EnlirSoulBreakOrLegendMateria) => boolean;
  legendMateriaFilter?: (item: EnlirSoulBreakOrLegendMateria) => boolean;
  limitBreaksFilter?: (item: EnlirSoulBreakOrLegendMateria) => boolean;
}

export class CharacterSoulBreaks extends React.PureComponent<Props> {
  getSoulBreaks() {
    const { character, soulBreaksFilter } = this.props;
    const characterSoulBreaks = enlir.soulBreaksByCharacter[character].filter(
      (i) => i.tier !== 'RW' && i.tier !== 'Default',
    );
    return _.reverse(
      soulBreaksFilter ? characterSoulBreaks.filter(soulBreaksFilter) : characterSoulBreaks,
    );
  }

  getLimitBreaks() {
    const { character, limitBreaksFilter } = this.props;
    const characterLimitBreaks = enlir.limitBreaksByCharacter[character] || [];
    return _.reverse(
      limitBreaksFilter ? characterLimitBreaks.filter(limitBreaksFilter) : characterLimitBreaks,
    );
  }

  getLegendMateria() {
    const { character, legendMateriaFilter } = this.props;
    const characterLegendMateria = enlir.legendMateriaByCharacter[character] || [];
    return _.reverse(
      legendMateriaFilter
        ? characterLegendMateria.filter(legendMateriaFilter)
        : characterLegendMateria.slice(),
    );
  }

  render() {
    const { character, ownedSoulBreaks, ownedLegendMateria, ownedLimitBreaks } = this.props;
    // Class name to use, indexed by the boolean value of whether we have this
    // soul break or legend materia.
    const ownedSB = [ownedSoulBreaks ? styles.unowned : undefined, undefined];
    const ownedLB = [ownedLimitBreaks ? styles.unowned : undefined, undefined];
    const ownedLM = [ownedLegendMateria ? styles.unowned : undefined, undefined];

    // TODO: Show default tier someplace, like MrP does?

    const soulBreaks = this.getSoulBreaks();
    const limitBreaks = this.getLimitBreaks();
    const legendMateria = this.getLegendMateria();
    if (!soulBreaks.length && !limitBreaks.length && !legendMateria.length) {
      return null;
    }

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
              {limitBreaks.map((lb, i) => (
                <LimitBreakListItem
                  limitBreak={lb}
                  className={ownedLB[ownedLimitBreaks ? +ownedLimitBreaks.has(lb.id) : 1]}
                  key={i}
                />
              ))}
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
