import * as React from 'react';

import classNames from 'classnames';
import * as _ from 'lodash';

import { EnlirAbility, EnlirSchool } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP, MrPSoulBreak } from '../../data/mrP';
import { getOrbCosts } from '../../data/orbDetails';
import { OrbCostsDisplay } from './OrbCostsDisplay';

const styles = require('./AbilitiesTable.scss');

const mrPAbilities: { [id: number]: MrPSoulBreak } = {};

interface Props {
  abilities: { [s in EnlirSchool]?: EnlirAbility[] };
  schools: EnlirSchool[];
  className?: string;
}

export class AbilitiesTable extends React.PureComponent<Props> {
  renderRow(ability: EnlirAbility, key: number) {
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
        <td>{name}</td>
        <td>{formatMrP(mrP)}</td>
        <td>
          <OrbCostsDisplay costs={getOrbCosts(ability)} baseRarity={rarity} />
        </td>
      </tr>
    );
  }

  render() {
    const { abilities, schools, className } = this.props;

    return (
      <table className={classNames('table table-sm table-bordered', styles.component, className)}>
        <tbody>
          {schools
            .filter(school => abilities[school] != null)
            .map((school, i) => (
              <React.Fragment key={i}>
                <tr>
                  <th>{school}</th>
                </tr>
                {abilities[school]!.map((ability, j) => this.renderRow(ability, j))}
              </React.Fragment>
            ))}
        </tbody>
      </table>
    );
  }
}
