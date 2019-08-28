import * as React from 'react';

import * as _ from 'lodash';

import { enlir, EnlirAbility, EnlirSchool } from '../../data/enlir';
import { AbilitiesTable } from './AbilitiesTable';

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
    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-6">
            <AbilitiesTable abilities={abilities} schools={sortedSchools[0]} />
          </div>
          <div className="col-sm-6">
            <AbilitiesTable abilities={abilities} schools={sortedSchools[1]} />
          </div>
        </div>
      </div>
    );
  }
}
