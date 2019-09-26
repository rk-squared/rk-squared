import * as React from 'react';

import * as _ from 'lodash';

import { enlir, EnlirAbility, EnlirSchool } from '../../data/enlir';
import { AbilitiesTable } from './AbilitiesTable';
import { AbilityTooltip } from './AbilityTooltip';
import { OrbCostsTooltip } from './OrbCostsTooltip';

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
  showRecordBoard?: boolean;
}

export function getAbilitiesBySchool(rarity: number, showRecordBoard?: boolean) {
  const bySchool: { [s in EnlirSchool]?: EnlirAbility[] } = {};
  showRecordBoard = !!showRecordBoard;
  _.forEach(enlir.abilities, i => {
    if (i.rarity === rarity && !!i.recordBoardCharacter === showRecordBoard) {
      bySchool[i.school] = bySchool[i.school] || [];
      bySchool[i.school]!.push(i);
    }
  });
  return _.mapValues(bySchool, i => _.sortBy(i, 'name'));
}

export class AbilitiesList extends React.PureComponent<Props> {
  render() {
    const { rarity, showRecordBoard } = this.props;
    const abilities = getAbilitiesBySchool(rarity, showRecordBoard);
    const abilitiesTooltipId = `abilities-${rarity}-tooltips`;
    const orbCostsTooltipId = `orbCosts-${rarity}-tooltips`;
    return (
      <div className="container">
        <div className="row">
          <AbilitiesTable
            abilities={abilities}
            schools={_.flatten(sortedSchools)}
            showRecordBoard={showRecordBoard}
            abilitiesTooltipId={abilitiesTooltipId}
            orbCostsTooltipId={orbCostsTooltipId}
          />
          <AbilityTooltip id={abilitiesTooltipId} />
          <OrbCostsTooltip id={orbCostsTooltipId} />
        </div>
      </div>
    );
  }
}
