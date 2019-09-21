import * as React from 'react';

import * as _ from 'lodash';

import { enlir, EnlirAbility, EnlirSchool } from '../../data/enlir';
import { AbilitiesTable } from './AbilitiesTable';
import { AbilityTooltip } from './AbilityTooltip';

const sortedSchools: EnlirSchool[][] = [
  [
    'Combat',
    'Celerity',
    'Spellblade',
    'Support',
    'Dragoon',
    'Heavy',
    'Knight',
    'Machinist',
    'Monk',
    'Samurai',
    'Sharpshooter',
    'Thief',
  ],
  ['White Magic', 'Black Magic', 'Summoning', 'Witch', 'Bard', 'Dancer', 'Darkness', 'Ninja'],
];

interface Props {
  rarity: number;
}

export function getAbilitiesBySchool(rarity: number) {
  const bySchool: { [s in EnlirSchool]?: EnlirAbility[] } = {};
  _.forEach(enlir.abilities, i => {
    if (i.rarity === rarity) {
      bySchool[i.school] = bySchool[i.school] || [];
      bySchool[i.school]!.push(i);
    }
  });
  return _.mapValues(bySchool, i => _.sortBy(i, 'name'));
}

export class AbilitiesList extends React.PureComponent<Props> {
  render() {
    const { rarity } = this.props;
    const abilities = getAbilitiesBySchool(rarity);
    const tooltipId = `abilities-${rarity}-tooltips`;
    return (
      <div className="container">
        <div className="row">
          <AbilitiesTable
            abilities={abilities}
            schools={_.flatten(sortedSchools)}
            tooltipId={tooltipId}
          />
          <AbilityTooltip id={tooltipId} />
        </div>
      </div>
    );
  }
}
