import * as React from 'react';

import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as moment from 'moment';

import {
  enlir,
  EnlirAbility,
  EnlirAbilityUnlockType,
  getAbilityUnlockType,
} from '../../data/enlir';
import { schoolIcons } from '../../data/localData';
import { formatMrPSkill } from '../../data/mrP/skill';
import { getOrbCosts } from '../../data/orbDetails';
import { formatIsoDate } from '../../utils/timeUtils';
import { getMrPAbility } from './AbilitiesTable';
import { EventTooltip } from './EventTooltip';
import { OrbCostsDisplay } from './OrbCostsDisplay';

const styles = require('./FutureAbilitiesTable.scss');

interface Props {
  className?: string;
  abilitiesTooltipId?: string;
  orbCostsTooltipId?: string;
}

function compareByDate(a: EnlirAbility, b: EnlirAbility) {
  const eventA = enlir.events[a.introducingEvent];
  const eventB = enlir.events[b.introducingEvent];
  if (eventA && eventB && eventA.jpDate && eventB.jpDate) {
    if (eventA.jpDate === eventB.jpDate) {
      return a.name < b.name ? -1 : 1;
    } else {
      return eventA.jpDate < eventB.jpDate ? -1 : 1;
    }
  } else if (eventA && eventA.jpDate) {
    // If an event is missing, assume it's far future.
    return -1;
  } else if (eventB && eventB.jpDate) {
    return 1;
  } else {
    return a.name < b.name ? -1 : 1;
  }
}

function getUnreleasedAbilities(abilities: EnlirAbility[], rarity: number): EnlirAbility[] {
  return abilities
    .filter(
      i =>
        i.rarity === rarity &&
        !i.gl &&
        getAbilityUnlockType(i) !== EnlirAbilityUnlockType.RecordBoard,
    )
    .sort(compareByDate);
}

function getReleaseDate(ability: EnlirAbility): string {
  if (!ability.introducingEvent) {
    return '';
  }
  const event = enlir.events[ability.introducingEvent];
  if (!event) {
    return ability.introducingEvent;
  } else if (event.glDate) {
    return formatIsoDate(event.glDate);
  } else if (event.jpDate) {
    const date = moment(event.jpDate).add(6, 'months');
    const when = date.date() > 15 ? 'late' : 'early';
    return when + date.format(' MMM YYYY');
  } else {
    return '';
  }
}

export class FutureAbilitiesTable extends React.PureComponent<Props> {
  static releaseDateTooltipId = 'future-abilities-release-date';

  renderRarity(rarity: number) {
    const { abilitiesTooltipId, orbCostsTooltipId } = this.props;
    const abilities = getUnreleasedAbilities(_.values(enlir.abilities), rarity);
    if (!abilities.length) {
      return null;
    }
    return (
      <>
        <tr className="thead-dark">
          <th colSpan={5}>{rarity}★ Abilities</th>
        </tr>
        {abilities.map((ability, i) => (
          <tr className={styles.jp} key={i}>
            <td data-tip={ability.id} data-for={abilitiesTooltipId} className={styles.name}>
              {ability.name}
            </td>
            <td className={styles.school}>
              <img src={schoolIcons[ability.school]} title={ability.school} />
            </td>
            <td className={styles.effects}>{formatMrPSkill(getMrPAbility(ability))}</td>
            <td data-tip={ability.id} data-for={orbCostsTooltipId} className={styles.orbCosts}>
              <OrbCostsDisplay costs={getOrbCosts(ability)} baseRarity={rarity} />
            </td>
            <td
              className={styles.releaseDate}
              data-tip={ability.introducingEvent}
              data-for={FutureAbilitiesTable.releaseDateTooltipId}
            >
              {getReleaseDate(ability)}
            </td>
          </tr>
        ))}
      </>
    );
  }

  render() {
    const { className } = this.props;

    const allClassNames = classNames('table table-sm table-bordered', styles.component, className);

    return (
      <>
        <table className={allClassNames}>
          <colgroup>
            <col className={styles.name} />
            <col className={styles.school} />
            <col className={styles.effects} />
            <col className={styles.orbCosts} />
            <col className={styles.releaseDate} />
          </colgroup>
          <thead>
            <tr>
              <th>Ability</th>
              <th>School</th>
              <th>Effects</th>
              <th>Orb Costs</th>
              <th>Est. Date</th>
            </tr>
          </thead>
          <tbody>
            {this.renderRarity(5)}
            {this.renderRarity(6)}
          </tbody>
        </table>

        <EventTooltip id={FutureAbilitiesTable.releaseDateTooltipId} description="Released in" />
      </>
    );
  }
}
