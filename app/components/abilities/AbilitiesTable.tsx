import * as React from 'react';

import classNames from 'classnames';
import * as _ from 'lodash';

import { EnlirAbility, EnlirSchool } from '../../data/enlir';
import { schoolIcons } from '../../data/localData';
import { describeEnlirSoulBreak, formatMrP, MrPSoulBreak } from '../../data/mrP';
import { getOrbCosts } from '../../data/orbDetails';
import { OrbCostsDisplay } from './OrbCostsDisplay';

const styles = require('./AbilitiesTable.scss');

const mrPAbilities: { [id: number]: MrPSoulBreak } = {};

interface Props {
  abilities: { [s in EnlirSchool]?: EnlirAbility[] };
  schools: EnlirSchool[];
  className?: string;
  abilitiesTooltipId?: string;
  orbCostsTooltipId?: string;
}

export class AbilitiesTable extends React.PureComponent<Props> {
  renderRow(ability: EnlirAbility, key: number) {
    const { abilitiesTooltipId, orbCostsTooltipId } = this.props;
    const { id, name, rarity } = ability;

    if (!mrPAbilities[id]) {
      mrPAbilities[id] = describeEnlirSoulBreak(ability, {
        abbreviateDamageType: true,
        includeSchool: false,
      });
    }
    const mrP = mrPAbilities[id];

    return (
      <tr key={key}>
        <td data-tip={id} data-for={abilitiesTooltipId}>
          {name}
        </td>
        <td>
          {/* Omit tooltip here - it's too big of an area to have a big distracting text box */}
          {formatMrP(mrP)}
        </td>
        <td data-tip={id} data-for={orbCostsTooltipId}>
          <OrbCostsDisplay costs={getOrbCosts(ability)} baseRarity={rarity} />
        </td>
      </tr>
    );
  }

  render() {
    const { abilities, schools, className } = this.props;

    return (
      <table className={classNames('table table-sm table-bordered', styles.component, className)}>
        <colgroup>
          <col className={styles.name} />
          <col className={styles.effects} />
          <col className={styles.orbCosts} />
        </colgroup>
        <tbody>
          {schools
            .filter(school => abilities[school] != null)
            .map((school, i) => (
              <React.Fragment key={i}>
                <tr>
                  <th colSpan={3}>
                    <img src={schoolIcons[school]} alt="" className={styles.schoolIcon} />
                    {school}
                  </th>
                </tr>
                {abilities[school]!.map((ability, j) => this.renderRow(ability, j))}
              </React.Fragment>
            ))}
        </tbody>
      </table>
    );
  }
}
