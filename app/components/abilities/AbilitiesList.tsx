import * as React from 'react';

import * as _ from 'lodash';

import * as ReactTooltip from 'react-tooltip';
import { AbilitySortType } from '../../actions/prefs';
import { allEnlirRealms, enlir, EnlirAbility, EnlirRealm, EnlirSchool } from '../../data/enlir';
import { schoolIcons } from '../../data/localData';
import { enlirRealmLongName } from '../../data/series';
import { AbilitiesTable } from './AbilitiesTable';
import { AbilityTooltip } from './AbilityTooltip';
import { OrbCostsTooltip } from './OrbCostsTooltip';
import RecordBoardNav from './RecordBoardNav';

const styles = require('./AbilitiesList.scss');

const sortedSchools: EnlirSchool[] = [
  // Predominantly physical
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

  // Predominantly magical
  'White Magic',
  'Black Magic',
  'Summoning',
  'Witch',
  'Bard',
  'Dancer',
  'Darkness',
  'Ninja',
];

interface Props {
  rarity: number;
  showRecordBoard?: boolean;
  sort?: AbilitySortType;
}

function getAbilities(rarity: number, showRecordBoard?: boolean) {
  showRecordBoard = !!showRecordBoard;
  return Object.values(enlir.abilities).filter(
    i => i.rarity === rarity && !!i.recordBoardCharacter === showRecordBoard,
  );
}

export function getAbilitiesBySchool(rarity: number, showRecordBoard?: boolean) {
  const bySchool: { [s in EnlirSchool]?: EnlirAbility[] } = {};
  for (const i of getAbilities(rarity, showRecordBoard)) {
    bySchool[i.school] = bySchool[i.school] || [];
    bySchool[i.school]!.push(i);
  }
  return _.mapValues(bySchool, abilities => _.sortBy(abilities, 'name'));
}

export function getAbilitiesByRealm(rarity: number, showRecordBoard?: boolean) {
  if (!showRecordBoard) {
    return {};
  }
  const byRealm: { [s in EnlirRealm]?: EnlirAbility[] } = {};
  for (const i of getAbilities(rarity, true)) {
    const character = enlir.charactersByName[i.recordBoardCharacter!];
    byRealm[character.realm] = byRealm[character.realm] || [];
    byRealm[character.realm]!.push(i);
  }
  return _.mapValues(byRealm, abilities =>
    _.sortBy(abilities, i => enlir.charactersByName[i.recordBoardCharacter!].id),
  );
}

export function getAbilitiesByCharacter(rarity: number, showRecordBoard?: boolean) {
  if (!showRecordBoard) {
    return [];
  }
  return _.sortBy(getAbilities(rarity, true), 'recordBoardCharacter');
}

function getJpDate(ability: EnlirAbility) {
  const event = enlir.events[ability.introducingEvent];
  return event && event.jpDate ? event.jpDate : '9999-99-99';
}

export function getAbilitiesByRelease(rarity: number, showRecordBoard?: boolean) {
  return _.sortBy(getAbilities(rarity, showRecordBoard), getJpDate);
}

type AbilitySortHandler =
  | {
      getter: (rarity: number, showRecordBoard?: boolean) => EnlirAbility[];
    }
  | {
      getter: (rarity: number, showRecordBoard?: boolean) => { [s: string]: EnlirAbility[] };
      categories: string[];
      categoryRenderer: (key: string) => React.ReactNode;
    };

const abilitySortHandlers: { [s in AbilitySortType]: AbilitySortHandler } = {
  [AbilitySortType.BySchool]: {
    getter: getAbilitiesBySchool,
    categories: sortedSchools,
    categoryRenderer(school: string) {
      return (
        <>
          <img src={schoolIcons[school as EnlirSchool]} alt="" className={styles.schoolIcon} />
          {school}
        </>
      );
    },
  },
  [AbilitySortType.ByRealm]: {
    getter: getAbilitiesByRealm,
    categories: allEnlirRealms,
    categoryRenderer: (realm: string) => enlirRealmLongName(realm as EnlirRealm),
  },
  [AbilitySortType.ByCharacter]: {
    getter: getAbilitiesByCharacter,
  },
  [AbilitySortType.ByRelease]: {
    getter: getAbilitiesByRelease,
  },
};

export class AbilitiesList extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (prevProps.sort !== this.props.sort) {
      ReactTooltip.rebuild();
    }
  }

  render() {
    const { rarity, showRecordBoard, sort } = this.props;
    const abilitiesTooltipId = `abilities-${rarity}-tooltips`;
    const orbCostsTooltipId = `orbCosts-${rarity}-tooltips`;
    const handler = abilitySortHandlers[sort || AbilitySortType.BySchool];
    const abilities = handler.getter(rarity, showRecordBoard);
    return (
      <>
        {showRecordBoard && <RecordBoardNav />}
        <AbilitiesTable
          abilities={abilities}
          categories={'categories' in handler ? handler.categories : undefined}
          categoryRenderer={'categoryRenderer' in handler ? handler.categoryRenderer : undefined}
          showRecordBoard={showRecordBoard}
          abilitiesTooltipId={abilitiesTooltipId}
          orbCostsTooltipId={orbCostsTooltipId}
        />
        <AbilityTooltip id={abilitiesTooltipId} />
        <OrbCostsTooltip id={orbCostsTooltipId} />
      </>
    );
  }
}
