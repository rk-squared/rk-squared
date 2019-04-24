import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import * as _ from 'lodash';

import { RelicDrawProbabilities, wantRelic } from '../../actions/relicDraws';
import { enlir, EnlirLegendMateria, EnlirRealm, EnlirSoulBreak, SbOrLm } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../../data/mrP';
import { describeMrPLegendMateria } from '../../data/mrP/legendMateria';
import { describeRelicEffect } from '../../data/mrP/relics';
import { enlirRealmLongName } from '../../data/series';
import { IState } from '../../reducers';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from '../../selectors/characters';
import { pluralize } from '../../utils/textUtils';
import { getAllSameValue } from '../../utils/typeUtils';
import { RelicTypeIcon } from '../shared/RelicTypeIcon';
import {
  getBraveColumns,
  getBurstColumns,
  legendMateriaAliases,
  soulBreakAliases,
  styles as soulBreakStyles,
  tierClass,
} from '../shared/SoulBreakShared';

const styles = require('./RelicDrawBannerTable.scss');

interface Props {
  title: string;
  relics: number[] | number[][];
  probabilities?: RelicDrawProbabilities;
  getStatusAndCss?: (id: number, which: SbOrLm) => [string, string];

  groupBySeries?: boolean;
  allowCollapse?: boolean;

  allowSelect?: boolean;
  getSelected?: (relicId: number) => boolean;
  onSelect?: (relicId: number, want: boolean) => void;
}

interface State {
  collapsed: boolean;
}

/**
 * A table of relics for a relic draw banner.
 */
export class RelicDrawBannerTable extends React.Component<Props, State> {
  lastRealm: EnlirRealm | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      collapsed: true,
    };
  }

  toggleCollapsed = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.setState({ collapsed: !this.state.collapsed });
  };

  handleClick = (e: React.SyntheticEvent, relicId: number) => {
    e.preventDefault();
    const { getSelected, onSelect } = this.props;
    if (getSelected && onSelect) {
      onSelect(relicId, !getSelected(relicId));
    }
  };

  renderAlias(sb?: EnlirSoulBreak, lm?: EnlirLegendMateria) {
    if (sb) {
      return soulBreakAliases[sb.id];
    } else if (lm) {
      return (
        <span className={soulBreakStyles.legendMateriaTier}>{legendMateriaAliases[lm.id]}</span>
      );
    } else {
      return undefined;
    }
  }

  renderRow(relicId: number, key: number, showProbability: boolean, colCount: number) {
    const { probabilities, groupBySeries, getStatusAndCss, allowSelect, getSelected } = this.props;
    const relic = enlir.relics[relicId];
    const { character, name, type, effect } = relic;
    const sb = enlir.relicSoulBreaks[relicId];
    const lm = enlir.relicLegendMateria[relicId];

    const tierClassName = sb ? tierClass[sb.tier] : lm ? soulBreakStyles.legendMateria : undefined;
    const [status, rowClassName] = getStatusAndCss
      ? sb
        ? getStatusAndCss(sb.id, SbOrLm.SoulBreak)
        : lm
        ? getStatusAndCss(lm.id, SbOrLm.LegendMateria)
        : ['', '']
      : ['', ''];
    const mrP = sb ? describeEnlirSoulBreak(sb) : null;

    const commandColumns: Array<[string, string]> = [];
    if (mrP && mrP.braveCommands) {
      commandColumns.push(getBraveColumns(mrP, mrP.braveCommands));
    }
    if (mrP && mrP.burstCommands) {
      commandColumns.push(...getBurstColumns(mrP.burstCommands));
    }
    const rowSpan = commandColumns.length ? commandColumns.length + 1 : undefined;

    const className = classNames(tierClassName, rowClassName);
    const showSeries = groupBySeries && relic.realm != null && relic.realm !== this.lastRealm;
    this.lastRealm = relic.realm;
    const handleClick = allowSelect
      ? (e: React.SyntheticEvent) => this.handleClick(e, relic.id)
      : undefined;
    return (
      <React.Fragment key={key}>
        {showSeries && relic.realm && (
          <tr className={styles.seriesGroup + ' thead-light'}>
            <th colSpan={colCount}>{enlirRealmLongName(relic.realm) || relic.realm}</th>
          </tr>
        )}
        <tr className={className} onClick={handleClick}>
          <td rowSpan={rowSpan}>{character}</td>
          <td rowSpan={rowSpan}>
            <RelicTypeIcon type={type} className={styles.relicType} /> {name}
            {effect && <div className={styles.relicEffect}>{describeRelicEffect(effect)}</div>}
          </td>
          <td rowSpan={rowSpan} className={soulBreakStyles.tier}>
            {this.renderAlias(sb, lm)}
          </td>
          <td className={soulBreakStyles.name}>{sb ? sb.name : lm ? lm.name : undefined}</td>
          <td>{mrP ? formatMrP(mrP) : lm ? describeMrPLegendMateria(lm) : undefined}</td>
          {showProbability && <td rowSpan={rowSpan}>{probabilities!.byRelic[relicId]}%</td>}
          {allowSelect && (
            <td rowSpan={rowSpan}>
              <input
                type="checkbox"
                title="Mark this relic as wanted"
                onChange={handleClick}
                checked={getSelected ? getSelected(relic.id) : false}
              />
            </td>
          )}
          {getStatusAndCss && <td className="sr-only">{status}</td>}
        </tr>
        {commandColumns.map((columns, i) => (
          <tr
            key={i}
            className={classNames(className, styles.command, {
              [styles.lastCommand]: i === commandColumns.length - 1,
            })}
            onClick={handleClick}
          >
            <td>{columns[0]}</td>
            <td>{columns[1]}</td>
          </tr>
        ))}
      </React.Fragment>
    );
  }

  renderColumnGroup(showProbability: boolean) {
    return (
      <colgroup>
        <col className={styles.characterColumn} />
        <col className={styles.relicColumn} />
        <col className={styles.tierColumn} />
        <col className={styles.soulBreakColumn} />
        <col className={styles.effectsColumn} />
        {showProbability && <col className={styles.probabilityColumn} />}
        {this.props.allowSelect && <col className={styles.selectedColumn} />}
        {this.props.getStatusAndCss && <col className={styles.statusColumn} />}
      </colgroup>
    );
  }

  renderColumnHeaders(showProbability: boolean) {
    return (
      <tr>
        <th scope="col">Character</th>
        <th scope="col">Relic</th>
        <th scope="col" colSpan={2}>
          Soul Break / Materia
        </th>
        <th scope="col">Effects</th>
        {showProbability && <th scope="col">Chance</th>}
        {this.props.allowSelect && (
          <th scope="col">
            <FontAwesomeIcon icon={['fal', 'dice-d20']} title="Want" />
          </th>
        )}
        {this.props.getStatusAndCss && (
          <th scope="col" className="sr-only">
            Status
          </th>
        )}
      </tr>
    );
  }

  renderShowHideLink() {
    let caption: string;
    if (this.state.collapsed) {
      const relicCount = _.flatten(this.props.relics).length;
      caption = `show all ${relicCount} ${pluralize(relicCount, 'relic')}`;
    } else {
      caption = 'hide';
    }
    return (
      <span>
        {' '}
        (
        <a href="#" onClick={this.toggleCollapsed}>
          {caption}
        </a>
        )
      </span>
    );
  }

  render() {
    const { title, relics, probabilities, allowCollapse, allowSelect } = this.props;

    let showProbability: boolean;
    let commonProbability: number | null;
    let totalProbability: number | null;
    if (!probabilities || _.isEmpty(probabilities.byRelic)) {
      commonProbability = null;
      totalProbability = null;
      showProbability = false;
    } else {
      commonProbability = getAllSameValue(_.flatten(relics).map(i => probabilities.byRelic[i]));
      totalProbability = _.sum(_.flatten(relics).map(i => probabilities.byRelic[i]));
      showProbability = commonProbability == null;
    }

    const colCount = 7 + +showProbability + +!!allowSelect;

    let relicsArray = (relics.length > 0 && Array.isArray(relics[0])
      ? relics
      : [relics]) as number[][];
    if (probabilities && showProbability) {
      relicsArray = relicsArray.map(i => _.sortBy(i, j => -probabilities.byRelic[j]));
    }

    const collapsed = allowCollapse && this.state.collapsed;
    const grouped = relicsArray.length > 1 && _.some(relicsArray, i => i.length > 1);
    this.lastRealm = null;
    return (
      <div className="table-responsive">
        <table className={classNames('table', styles.component, { [styles.grouped]: grouped })}>
          {this.renderColumnGroup(showProbability)}
          <thead>
            <tr className="thead-dark">
              <th colSpan={colCount}>
                {title}
                {allowCollapse && this.renderShowHideLink()}
                {commonProbability && (
                  <span className="float-right">Chance of drawing: {commonProbability}% each</span>
                )}
                {!commonProbability && totalProbability && (
                  <span className="float-right">
                    Chance of drawing: {totalProbability.toFixed(2)}% total
                  </span>
                )}
              </th>
            </tr>
            {!collapsed && this.renderColumnHeaders(showProbability)}
          </thead>
          {!collapsed &&
            relicsArray.map((theseRelics, i) => (
              <tbody key={i}>
                {theseRelics.map((relicId, j) =>
                  this.renderRow(relicId, j, showProbability, colCount),
                )}
              </tbody>
            ))}
        </table>
      </div>
    );
  }
}

interface OwnProps {
  isAnonymous?: boolean;
}

export default connect(
  (state: IState, ownProps: OwnProps) => {
    let getStatusAndCss: Props['getStatusAndCss'];
    if (!ownProps.isAnonymous) {
      const ownedSoulBreaks = getOwnedSoulBreaks(state);
      const ownedLegendMateria = getOwnedLegendMateria(state);
      getStatusAndCss = (id: number, which: SbOrLm) => {
        const isDupe =
          which === SbOrLm.SoulBreak
            ? ownedSoulBreaks && ownedSoulBreaks.has(id)
            : ownedLegendMateria && ownedLegendMateria.has(id);
        return [isDupe ? 'Dupe' : '', isDupe ? styles.dupe : ''] as [string, string];
      };
    }
    return {
      getStatusAndCss,
      getSelected: (relicId: number) =>
        state.relicDraws.want ? !!state.relicDraws.want[relicId] : false,
    };
  },
  {
    onSelect: wantRelic,
  },
)(RelicDrawBannerTable);
