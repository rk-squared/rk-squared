/**
 * @file
 * Text processing logic for splitting up Enlir strings into lists
 */

import { andList } from './util';

/**
 *
 * Stats are 3-letter uppercase.  We also handle cases like
 * "Different DEF and RES +X%".
 */
const isStat = (effect: string) => !!effect.match(/^(?:Different )?[A-Z]{3}$/);

const isStatMod = (effect: string) => !!effect.match(/\b[A-Z]{3} [+-]?\d+%/);

function isSameEffect(prev: string, next: string) {
  // General case: lists of comma-separated items, with each item being one or
  // two words.  But don't include stat mods - those are small but should be
  // kept separate.
  if (prev.match(/^(\S+ )?\S+$/) && !isStatMod(prev)) {
    return true;
  }
  return false;
}

/**
 *
 * Split a list of effects from an EnlirStatus into their component parts.
 *
 * This is mostly just splitting on commas, but embedded commas complicate
 * things.
 */
export function splitStatusEffects(effects: string): string[] {
  const result: string[] = [];

  // Process the list in reverse order, because we look for the "or" or "and"
  // at the end of an embedded list then work backwards to add strings that we
  // think should be included.
  const parts = effects.split(/, /).reverse();

  for (let i = 0; i < parts.length; i++) {
    let thisPart = parts[i];

    // Handle conditionals like Haurchefant Cover.
    if (parts[i].startsWith('While ')) {
      result[result.length - 1] = parts[i] + ', ' + result[result.length - 1];
      continue;
    }

    // Stoneskin, for example, is described as ", up to 30%".  That should be
    // part of the previous clause.
    if (parts[i].startsWith('up to ') && i + 1 < parts.length) {
      thisPart = parts[i + 1] + ', ' + thisPart;
      i++;
    }

    // Handle comma-separated lists.  See isSameEffect.
    if (parts[i].match(/^\S+,? +(and|or)/)) {
      while (i + 1 < parts.length && isSameEffect(parts[i + 1], thisPart)) {
        thisPart = parts[i + 1] + ', ' + thisPart;
        i++;
      }

      if (
        i + 1 < parts.length &&
        !isStatMod(parts[i + 1]) &&
        // This keeps Burst Mode's bonuses separate from the rest of its
        // effects.
        !isStatMod(thisPart) &&
        // Special case - separate Awoken Lucis King's rank boost separate from
        // its dualcast list.
        !parts[i + 1].match(/\d+$/)
      ) {
        thisPart = parts[i + 1] + ', ' + thisPart;
        i++;
      }
    }

    result.push(thisPart);
  }
  return result.reverse();
}

/**
 * Splits the status effects section of a skill's effects string
 */
export function splitSkillStatuses(effects: string): string[] {
  const parts = effects.split(andList).reverse();
  const result: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    let thisPart = parts[i];

    let join = ' and ';
    while (i + 1 < parts.length && isStat(parts[i + 1])) {
      thisPart = parts[i + 1] + join + thisPart;
      i++;
      join = ', ';
    }

    result.push(thisPart);
  }

  return result.reverse();
}
