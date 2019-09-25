import * as React from 'react';

import * as classNames from 'classnames';
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

interface GroupedEnlirAbility extends EnlirAbility {
  groupWithNext: boolean;
}

const forcedGroups: Array<Set<string>> = [
  new Set<string>(["Goddess's Paean", "Mage's Hymn", "Warrior's Hymn"]),
];

export function groupAbilities(abilities: EnlirAbility[]): GroupedEnlirAbility[] {
  const result: GroupedEnlirAbility[] = [];
  const handled = new Set<string>();

  function addGroup(startAt: number, predicate: (ability: EnlirAbility) => boolean) {
    result.push({
      ...abilities[startAt],
      groupWithNext: true,
    });
    for (let i = startAt + 1; i < abilities.length; i++) {
      if (!handled.has(abilities[i].name) && predicate(abilities[i])) {
        handled.add(abilities[i].name);
        result.push({
          ...abilities[i],
          groupWithNext: true,
        });
      }
    }
    result[result.length - 1].groupWithNext = false;
  }

  for (let i = 0; i < abilities.length; i++) {
    const ability = abilities[i];
    if (handled.has(ability.name)) {
      continue;
    }

    const found = forcedGroups.find(group => group.has(ability.name));
    if (found) {
      addGroup(i, ab => found.has(ab.name));
      continue;
    }

    if (ability.multiplier) {
      addGroup(i, ab => ab.multiplier === ability.multiplier);
      continue;
    }

    result.push({
      ...ability,
      groupWithNext: false,
    });
  }
  return result;
}

export class AbilitiesTable extends React.PureComponent<Props> {
  renderRow(ability: GroupedEnlirAbility, key: number) {
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
      <tr
        key={key}
        className={classNames({
          [styles.grouped]: ability.groupWithNext,
          [styles.jp]: !ability.gl,
        })}
      >
        <td data-tip={id} data-for={abilitiesTooltipId} className={styles.name}>
          {name}
        </td>
        <td className={styles.effects}>
          {/* Omit tooltip here - it's too big of an area to have a big distracting text box */}
          {formatMrP(mrP)}
        </td>
        <td data-tip={id} data-for={orbCostsTooltipId} className={styles.orbCosts}>
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
                {groupAbilities(abilities[school]!).map((ability, j) => this.renderRow(ability, j))}
              </React.Fragment>
            ))}
        </tbody>
      </table>
    );
  }
}
