import * as moment from 'moment';

import { enlir, EnlirAbility } from './enlir';

import { formatIsoDate } from '../utils/timeUtils';

import { andJoin } from './mrP/util';

export function getReleaseDate(ability: EnlirAbility): string {
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

export function getEventText(eventName: string): string {
  let result: string;
  const event = enlir.events[eventName];
  if (event && event.type === 'Festival' && !event.glDate) {
    result = "JP's " + eventName;
  } else {
    result = eventName;
  }
  if (event && event.realm) {
    const realmSuffix = ` (${event.realm})`;
    // Check for Confounded Memories / Chaotic Memories that already have a
    // realm description as part of the name.
    if (!result.endsWith(realmSuffix)) {
      result += realmSuffix;
    }
  }
  if (event && event.heroRecords) {
    result += ', with ' + andJoin(event.heroRecords, true);
  }
  return result;
}
