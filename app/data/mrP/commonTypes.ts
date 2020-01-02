import { EnlirElement, EnlirRealm, EnlirSchool, EnlirSkillType, EnlirStat } from '../enlir';

// --------------------------------------------------------------------------
// Lower-level game rules

export type StatusName = string;

export interface SmartEtherStatus {
  type: 'smartEther';
  amount: number | number[];
  school?: EnlirSchool;
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
  | { type: 'scaleWithStatusLevel'; status: StatusName }
  | { type: 'statusLevel'; status: StatusName; value: number | number[] }
  | { type: 'ifDoomed' }
  | { type: 'status'; status: StatusName; who: 'self' | 'target'; any: boolean }
  | { type: 'scaleUseCount'; useCount: number | number[] }
  | { type: 'scaleWithUses' }
  | { type: 'scaleWithSkillUses'; skill: string }
  | { type: 'afterUseCount'; skill?: string; useCount: UseCount }
  | { type: 'alliesAlive' }
  | { type: 'characterAlive'; character: string; count?: number | number[] }
  | { type: 'characterInParty'; character: string; count?: number | number[] }
  | { type: 'females'; count: number | number[] }
  | { type: 'realmCharactersInParty'; realm: EnlirRealm; count: number | number[] }
  | { type: 'alliesJump'; count: number | number[] }
  | { type: 'doomTimer'; value: number | number[] }
  | { type: 'hpBelowPercent'; value: number | number[] }
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

export type OrOptions<T> = T | { options: T[] };
