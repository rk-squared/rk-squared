import * as React from 'react';

import * as classNames from 'classnames';
import * as ReactTooltip from 'react-tooltip';

import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir, MAX_ABILITY_RANK } from '../../data/enlir';
import { itemsById, ItemType } from '../../data/items';
import { getOrbCosts, orbCosts } from '../../data/orbDetails';
import * as urls from '../../data/urls';
import { runningTotal } from '../../utils/typeUtils';

const styles = require('./OrbCostsTooltip.scss');

interface Props {
  id: string;
}

export class OrbCostsTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getContent = (abilityId: string) => {
    if (!abilityId) {
      return null;
    }
    const ability = enlir.abilities[abilityId];
    const lang = ability.gl ? (this.context as LangType) : LangType.Jp;
    const costs = getOrbCosts(ability);
    return (
      <table className={classNames(styles.component, 'table table-dark table-bordered')}>
        <thead>
          <tr>
            <th>Orb</th>
            <th colSpan={MAX_ABILITY_RANK} className={styles.rankCost}>
              Cost for Rank 1-{MAX_ABILITY_RANK}
            </th>
            <th colSpan={MAX_ABILITY_RANK} className={styles.totalCost}>
              Total to Rank 1-{MAX_ABILITY_RANK}
            </th>
          </tr>
        </thead>
        <tbody>
          {costs.map(({ cost, id }, i) => (
            <tr key={i}>
              <td>
                {id && (
                  <img
                    src={urls.itemImage(lang, id, ItemType.Orb)}
                    alt=""
                    className={styles.orbIcon}
                  />
                )}
                {id && itemsById[id].name}
              </td>
              {(orbCosts[cost] || []).map((n, j) => (
                <td key={j} className={styles.rankCost}>
                  {n}
                </td>
              ))}
              {runningTotal(orbCosts[cost] || []).map((n, j) => (
                <td key={j} className={styles.totalCost}>
                  {n}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  render() {
    const { id } = this.props;
    return (
      <ReactTooltip
        id={id}
        className={styles.component}
        place="left"
        getContent={this.getContent}
      />
    );
  }
}
