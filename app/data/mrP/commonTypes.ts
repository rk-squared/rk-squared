import {
  EnlirElement,
  EnlirRealm,
  EnlirSchool,
  EnlirSkillType,
  EnlirStat,
  EnlirStatusPlaceholders,
} from '../enlir';
import * as statusTypes from './statusTypes';

export type Placeholder = 'X';
export type SignedPlaceholder = 'X' | '-X';
export const placeholder: Placeholder = 'X';
export const negativePlaceholder: SignedPlaceholder = '-X';

export type ValueOrPlaceholder<T> = T | Placeholder;
export type SignedValueOrPlaceholder<T> = T | SignedPlaceholder;

// --------------------------------------------------------------------------
// Lower-level game rules

export type StatusVerb = 'grants' | 'causes' | 'removes' | "doesn't remove";

export interface StatusLevel {
  type: 'statusLevel';
  name: string;
  value: number;
  // If true, setting to value; if false, modifying by value.
  set?: boolean;
}

export interface SmartEtherStatus {
  type: 'smartEther';
  amount: number | number[];
  school?: EnlirSchool;
}

export interface StandardStatus {
  type: 'standardStatus';
  name: string;

  // Added by resolveStatuses
  id?: number;
  isUncertain?: boolean;
  placeholders?: EnlirStatusPlaceholders;
  effects?: statusTypes.StatusEffect | null;
  // Added by mergeSimilarStatuses
  /**
   * The number of statuses that have been merged to create this.  Minimum 2.
   */
  mergeCount?: number;
}

export type StatusItem = SmartEtherStatus | StatusLevel | StandardStatus;

export type Conjunction = 'and' | '/' | ',' | '[/]';

export interface StatusWithPercent {
  status: StatusItem;
  chance?: number;
  duration?: Duration;
  conj?: Conjunction;
}

export interface Duration {
  value: number;
  valueIsUncertain?: number;
  units: DurationUnits;
}

export type DurationUnits = 'seconds' | 'turns';

export type Who =
  | 'self'
  | 'target'
  | 'enemies'
  | 'sameRow'
  | 'frontRow'
  | 'backRow'
  | 'party'
  | 'lowestHpAlly'
  | 'allyWithoutStatus'
  | 'allyWithNegativeStatus'
  | 'allyWithKO'
  // Note: As of November 2019, 'ally' is used only for compatibility with
  // EnlirTarget.  The parser doesn't output it directly.
  | 'ally';

export type Condition =
  | { type: 'equipped'; article: string; equipped: string }
  | { type: 'scaleWithStatusLevel'; status: string }
  | { type: 'statusLevel'; status: string; value: number | number[] }
  | { type: 'ifDoomed' }
  | { type: 'status'; status: string; who: 'self' | 'target'; any: boolean }
  | { type: 'conditionalEnElement'; element: EnlirElement | EnlirElement[] }
  | { type: 'scaleUseCount'; useCount: number | number[] }
  | { type: 'scaleWithUses' }
  | { type: 'scaleWithSkillUses'; skill: string }
  | { type: 'afterUseCount'; skill?: string; useCount: UseCount }
  | { type: 'alliesAlive' }
  | { type: 'characterAlive'; character: string; count?: number | number[] }
  | { type: 'characterInParty'; character: string; count?: number | number[] }
  | { type: 'females'; count: number | number[] }
  | { type: 'realmCharactersInParty'; realm: EnlirRealm; count: number | number[] }
  | { type: 'realmCharactersAlive'; realm: EnlirRealm; count: number | number[]; plus: boolean }
  | { type: 'charactersAlive'; count: number | number[] }
  | { type: 'alliesJump'; count: number | number[] }
  | { type: 'doomTimer'; value: number | number[] }
  | { type: 'hpBelowPercent'; value: number | number[] }
  | { type: 'hpAtLeastPercent'; value: number | number[] }
  | { type: 'soulBreakPoints'; value: number | number[] }
  | { type: 'targetStatBreaks'; count: number | number[] }
  | { type: 'targetStatusAilments'; count: number | number[] }
  | { type: 'vsWeak' }
  | { type: 'inFrontRow' }
  | { type: 'hitsTaken'; count: number | number[]; skillType: EnlirSkillType | EnlirSkillType[] }
  | { type: 'attacksTaken'; count: number | number[] }
  | { type: 'damagingActions'; count: number | number[] }
  | { type: 'otherAbilityUsers'; count: number | number[]; school: EnlirSchool }
  | { type: 'differentAbilityUses'; count: number | number[]; school: EnlirSchool }
  | {
      type: 'abilitiesUsedDuringStatus';
      count: number | number[];
      school: EnlirSchool | EnlirSchool[];
    }
  | { type: 'abilitiesUsed'; count: number | number[]; school: EnlirSchool | EnlirSchool[] }
  | {
      type: 'attacksDuringStatus';
      count: number | number[];
      element: EnlirElement | EnlirElement[];
    }
  | {
      type: 'damageDuringStatus';
      value: number | number[];
      element?: EnlirElement | EnlirElement[];
    }
  | { type: 'rankBased' }
  | { type: 'statThreshold'; stat: EnlirStat; value: number | number[] };

export type UseCount =
  | {
      x: number | number[];
      y: number;
    }
  | {
      from: number;
    }
  | {
      to: number;
    }
  | {
      from: number;
      to: number;
    };

export interface Fraction {
  numerator: number;
  denominator: number;
}

export type OrOptions<T> = T | T[] | { options: T[] };

export function isOptions<T>(items: OrOptions<T>): items is { options: T[] } {
  return typeof items === 'object' && 'options' in items;
}
