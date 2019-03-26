import * as React from 'react';
import { connect } from 'react-redux';

import classNames from 'classnames';
import * as _ from 'lodash';

import { RelicDrawProbabilities } from '../../actions/relicDraws';
import { enlir, makeLegendMateriaAliases } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../../data/mrP';
import { describeMrPLegendMateria } from '../../data/mrP/legendMateria';
import { IState } from '../../reducers';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from '../../selectors/characters';
import { getAllSameValue } from '../../utils/typeUtils';
import { RelicTypeIcon } from '../shared/RelicTypeIcon';

// FIXME: Better styling - table widths are bad, because SB effects are way too narrow

// HACK: FIXME: Better sharing of code
import {
  getBraveColumns,
  getBurstColumns,
  soulBreakAliases,
  styles as soulBreakStyles,
  tierClass,
} from '../soulBreaks/SoulBreakListItem';

const styles = require('./RelicDrawBannerTable.scss');

interface Props {
  title: string;
  relics: number[] | number[][];
  probabilities?: RelicDrawProbabilities;
  isAnonymous?: boolean;
  ownedSoulBreaks: Set<number> | undefined;
  ownedLegendMateria: Set<number> | undefined;
}

const legendMateriaAliases = makeLegendMateriaAliases(enlir.legendMateria);

export class RelicDrawBannerTable extends React.Component<Props> {
  renderRow(relicId: number, key: number, showProbability: boolean) {
    const { probabilities, isAnonymous, ownedSoulBreaks, ownedLegendMateria } = this.props;
    const relic = enlir.relics[relicId];
    const { character, name, type, effect } = relic;
    const sb = enlir.relicSoulBreaks[relicId];
    const lm = enlir.relicLegendMateria[relicId];

    const tierClassName = sb ? tierClass[sb.tier] : lm ? soulBreakStyles.legendMateria : undefined;
    const isDupe = isAnonymous
      ? false
      : sb
      ? ownedSoulBreaks && ownedSoulBreaks.has(sb.id)
      : lm
      ? ownedLegendMateria && ownedLegendMateria.has(lm.id)
      : false;
    const mrP = sb ? describeEnlirSoulBreak(sb) : null;
    // FIXME: abbreviate relic effects

    const commandColumns: Array<[string, string]> = [];
    if (mrP && mrP.braveCommands) {
      commandColumns.push(getBraveColumns(mrP, mrP.braveCommands));
    }
    if (mrP && mrP.burstCommands) {
      commandColumns.push(...getBurstColumns(mrP.burstCommands));
    }
    const rowSpan = commandColumns.length ? commandColumns.length + 1 : undefined;

    const className = classNames(tierClassName, { [styles.dupe]: isDupe });
    return (
      <React.Fragment key={key}>
        <tr className={className} title={isDupe ? 'Dupe' : undefined}>
          <td rowSpan={rowSpan}>{character}</td>
          <td rowSpan={rowSpan}>
            <RelicTypeIcon type={type} className={styles.relicType} /> {name}
            {effect && <div className={styles.relicEffect}>{effect}</div>}
          </td>
          <td rowSpan={rowSpan} className={soulBreakStyles.tier}>
            {sb ? soulBreakAliases[sb.id] : lm ? legendMateriaAliases[lm.id] : undefined}
          </td>
          <td className={soulBreakStyles.name}>{sb ? sb.name : lm ? lm.name : undefined}</td>
          <td>{mrP ? formatMrP(mrP) : lm ? describeMrPLegendMateria(lm) : undefined}</td>
          {showProbability && <td rowSpan={rowSpan}>{probabilities!.byRelic[relicId]}%</td>}
        </tr>
        {commandColumns.map((columns, i) => (
          <tr
            key={i}
            className={classNames(className, styles.command, {
              [styles.lastCommand]: i === commandColumns.length - 1,
            })}
          >
            <td>{columns[0]}</td>
            <td>{columns[1]}</td>
          </tr>
        ))}
      </React.Fragment>
    );
  }

  render() {
    const { title, relics, probabilities } = this.props;

    let showProbability: boolean;
    let commonProbability: number | null;
    if (!probabilities || _.isEmpty(probabilities.byRelic)) {
      commonProbability = null;
      showProbability = false;
    } else {
      commonProbability = getAllSameValue(_.flatten(relics).map(i => probabilities.byRelic[i]));
      showProbability = commonProbability == null;
    }

    const colCount = showProbability ? 8 : 7;

    let relicsArray = (relics.length > 0 && Array.isArray(relics[0])
      ? relics
      : [relics]) as number[][];
    if (probabilities && showProbability) {
      relicsArray = relicsArray.map(i => _.sortBy(i, j => -probabilities.byRelic[j]));
    }

    const grouped = relicsArray.length > 1 && _.some(relicsArray, i => i.length > 1);
    return (
      <div className="table-responsive">
        <table className={classNames('table', { [styles.grouped]: grouped })}>
          <thead>
            <tr className="thead-dark">
              <th colSpan={colCount}>
                {title}
                {commonProbability && (
                  <span className="float-right">Chance of drawing: {commonProbability}% each</span>
                )}
              </th>
            </tr>
            <tr>
              <th>Character</th>
              <th>Relic</th>
              <th colSpan={2}>Soul Break / Materia</th>
              <th>Effects</th>
              {showProbability && <th>Probability</th>}
            </tr>
          </thead>
          {relicsArray.map((theseRelics, i) => (
            <tbody key={i}>
              {theseRelics.map((relicId, j) => this.renderRow(relicId, j, showProbability))}
            </tbody>
          ))}
        </table>
      </div>
    );
  }
}

export default connect((state: IState) => ({
  ownedSoulBreaks: getOwnedSoulBreaks(state),
  ownedLegendMateria: getOwnedLegendMateria(state),
}))(RelicDrawBannerTable);
