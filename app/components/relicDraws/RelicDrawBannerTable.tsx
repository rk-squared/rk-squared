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

// HACK: FIXME: Better sharing of code
import {
  soulBreakAliases,
  styles as soulBreakStyles,
  tierClass,
} from '../soulBreaks/SoulBreakListItem';

const styles = require('./RelicDrawBannerTable.scss');

interface Props {
  title: string;
  relics: number[];
  probabilities?: RelicDrawProbabilities;
  ownedSoulBreaks: Set<number> | undefined;
  ownedLegendMateria: Set<number> | undefined;
}

const legendMateriaAliases = makeLegendMateriaAliases(enlir.legendMateria);

export class RelicDrawBannerTable extends React.Component<Props> {
  renderRow(relicId: number, key: number, showProbability: boolean) {
    const { probabilities, ownedSoulBreaks, ownedLegendMateria } = this.props;
    const relic = enlir.relics[relicId];
    const { character, name, type, effect } = relic;
    const sb = enlir.relicSoulBreaks[relicId];
    const lm = enlir.relicLegendMateria[relicId];

    const tierClassName = sb ? tierClass[sb.tier] : lm ? soulBreakStyles.legendMateria : undefined;
    const isDupe = sb
      ? ownedSoulBreaks && ownedSoulBreaks.has(sb.id)
      : lm
      ? ownedLegendMateria && ownedLegendMateria.has(lm.id)
      : false;
    // FIXME: Icons for relic types; abbreviate relic effects; add secondary rows
    return (
      <tr key={key} className={classNames(tierClassName, { [styles.dupe]: isDupe })}>
        <td>{character}</td>
        <td>{name}</td>
        <td>{type}</td>
        <td>{effect}</td>
        <td className={soulBreakStyles.tier}>
          {sb ? soulBreakAliases[sb.id] : lm ? legendMateriaAliases[lm.id] : undefined}
        </td>
        <td className={soulBreakStyles.name}>{sb ? sb.name : lm ? lm.name : undefined}</td>
        <td>
          {sb
            ? formatMrP(describeEnlirSoulBreak(sb))
            : lm
            ? describeMrPLegendMateria(lm)
            : undefined}
        </td>
        {showProbability && <td>{probabilities!.byRelic[relicId]}%</td>}
      </tr>
    );
  }

  render() {
    const { title, relics, probabilities } = this.props;
    const showProbability = probabilities != null;
    const colCount = showProbability ? 8 : 7;
    return (
      <table className="table table-small">
        <thead>
          <tr className="thead-dark">
            <th colSpan={colCount}>{title}</th>
          </tr>
          <tr>
            <th>Character</th>
            <th>Relic</th>
            <th>Type</th>
            <th>Effects</th>
            <th>Tier</th>
            <th>Name</th>
            <th>Effects</th>
            {showProbability && <th>Probability</th>}
          </tr>
        </thead>
        <tbody>{relics.map((relicId, i) => this.renderRow(relicId, i, showProbability))}</tbody>
      </table>
    );
  }
}

export default connect((state: IState) => ({
  ownedSoulBreaks: getOwnedSoulBreaks(state),
  ownedLegendMateria: getOwnedLegendMateria(state),
}))(RelicDrawBannerTable);
