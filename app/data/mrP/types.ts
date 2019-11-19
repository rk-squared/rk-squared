/**
 * @file
 * TypeScript type definitions corresponding to skillParser's output
 */

import { EnlirElement, EnlirSchool, EnlirSkillType, EnlirStat } from '../enlir';

export type SkillEffect = EffectClause[];

export type EffectClause =
  | FixedAttack
  | Attack
  | RandomFixedAttack
  | DrainHp
  | RecoilHp
  | HpAttack
  | GravityAttack
  | Revive
  | Heal
  | HealPercent
  | DamagesUndead
  | DispelOrEsuna
  | RandomEther
  | SmartEther
  | RandomCastAbility
  | RandomCastOther
  | Chain
  | Mimic
  | StatMod
  | StatusEffect
  | SetStatusLevel
  | Entrust
  | GainSBOnSuccess
  | GainSB
  | ResetIfKO
  | ResistViaKO
  | Reset
  | CastTime
  | CastTimePerUse;

// --------------------------------------------------------------------------
// Attacks

export interface Attack extends Partial<AttackMultiplierGroup>, AttackExtras {
  type: 'attack';
  numAttacks: NumAttacks;
  isOverstrike?: boolean;
  scaleType?: AttackScaleType;
  isAoE?: boolean;
  isHybrid?: boolean;
  isJump?: boolean;
  isRanged?: boolean;
}

export interface FixedAttack {
  type: 'fixedAttack';
  fixedDamage: number;
  numAttacks: NumAttacks;
  isAoE?: boolean;
}

export interface RandomFixedAttack {
  type: 'randomFixedAttack';
  fixedDamage: number[];
}

export type NumAttacks = number | number[] | RandomNumAttacks;

export interface RandomNumAttacks {
  type: 'randomNumAttacks';
  value: Array<number | [number, number]>;
}

export interface AttackMultiplierGroup {
  attackMultiplier: number | number[];
  isRandomAttackMultiplier?: boolean;
  hybridMultiplier?: number;
  scaleToMultiplier?: number;
  multiplierScaleType?: MultiplierScaleType;
  overrideSkillType?: EnlirSkillType;
}

export type AttackScaleType = Condition;

export type MultiplierScaleType =
  | { type: 'percentHp' }
  | { type: 'convergent' }
  | { type: 'stat'; stat: EnlirStat }
  | { type: 'hitsTaken' }
  | { type: 'abilitiesUsed'; school: EnlirSchool }
  | { type: 'attacksUsed'; element: EnlirElement }
  | { type: 'doomTimer'; defaultMultiplier: number };

export interface AttackExtras {
  additionalCritDamage?: number | number[];
  additionalCritDamageCondition?: Condition;

  additionalCrit?: number | number[];
  additionalCritCondition?: Condition;

  airTime?: number | number[];
  airTimeCondition?: Condition;

  isOverstrike?: boolean;
  alwaysCrits?: boolean;
  atkUpWithLowHp?: boolean;

  status?: {
    status: StatusName;
    chance: number;
    duration: Duration;
    condition?: Condition;
  };

  damageModifier?: number | number[];
  damageModifierCondition?: Condition;

  finisherPercentDamage?: number;
  finisherPercentCriteria?: EnlirSkillType | EnlirElement | EnlirSchool;

  followedBy?: Attack;

  hitRate?: number;
  minDamage?: number;

  orMultiplier?: number | number[];
  orMultiplierCondition?: Condition;

  orNumAttacks?: NumAttacks;
  orNumAttacksCondition?: Condition;

  overrideElement?: EnlirElement;

  isPiercing?: boolean;
  scalesWithAtkAndDef?: boolean;
  sbMultiplierChange?: number;
}

// --------------------------------------------------------------------------
// Drain HP, recoil HP, HP-based attacks

export interface DrainHp {
  type: 'drainHp';
  healPercent: number;
}

export interface RecoilHp {
  type: 'recoilHp';
  damagePercent: number | number[];
  maxOrCurrent: 'max' | 'curr';
  condition?: Condition;
}

export interface GravityAttack {
  type: 'gravityAttack';
  damagePercent: number;
}

export interface HpAttack {
  type: 'hpAttack';
  multiplier: number;
}

// --------------------------------------------------------------------------
// Healing

export interface Revive {
  type: 'revive';
  percentHp: number;
  who?: Who;
}

export interface Heal {
  type: 'heal';
  amount: HealAmount;
  who?: Who;
  condition?: Condition;
}

export type HealAmount = { healFactor: number | number[] } | { fixedHp: number | number[] };

export interface HealPercent {
  type: 'healPercent';
  healPercent: number;
  who?: Who;
}

export interface DamagesUndead {
  type: 'damagesUndead';
}

export interface DispelOrEsuna {
  type: 'dispelOrEsuna';
  dispelOrEsuna: 'negative' | 'positive';
  who?: Who;
}

export interface RandomEther {
  type: 'randomEther';
  amount: number;
  who?: Who;
}

export interface SmartEther extends SmartEtherStatus {
  who?: Who;
}

export interface SmartEtherStatus {
  type: 'smartEther';
  amount: number | number[];
  school?: EnlirSchool;
}

// --------------------------------------------------------------------------
// "Randomly casts"

export interface RandomCastAbility {
  type: 'randomCastAbility';
  abilities: RandomAbility[];
}

export interface RandomAbility {
  ability: string;
  chance?: number;
}

export interface RandomCastOther {
  type: 'randomCastOther';
  other: string;
}

// --------------------------------------------------------------------------
// Specialty: chains, mimics

export interface Chain {
  type: 'chain';
  chainType: string;
  max: number;
  fieldBonus: number;
}

export interface Mimic {
  type: 'mimic';
  count?: number;
  chance?: number;
  defaultPower: number;
  defaultCritChance?: number;
}

// --------------------------------------------------------------------------
// Status effects

export interface StatusEffect {
  type: 'status';
  verb: StatusVerb;
  statuses: StatusWithPercent[];
}

export type StatusVerb = 'grants' | 'causes' | 'removes' | "doesn't remove";

export interface StatusWithPercent extends StatusClause {
  status: SmartEtherStatus | StatusLevel | StatusName;
  chance?: number;
}

export type StatusName = string;

export interface StatusLevel {
  type: 'statusLevel';
  status: StatusName;
  value: number;
}

export interface StatusClause {
  duration?: Duration;
  who?: Who;
  perUses?: number;
  ifSuccessful?: boolean;
  ifUndead?: boolean;
  condition?: Condition;
}

export interface SetStatusLevel {
  type: 'setStatusLevel';
  status: StatusName;
  value: number;
}

// --------------------------------------------------------------------------
// Stat mods

export interface StatMod extends StatModClause {
  type: 'statMod';
  stats: StatSet;
  percent: number | number[];
}

export type StatSet = HybridStatSet | EnlirStat[];

export type HybridStatSet = [EnlirStat[], EnlirStat[]];

export interface StatModClause {
  duration?: Duration;
  who?: Who;
  condition?: Condition;
}

// --------------------------------------------------------------------------
// Miscellaneous

export interface Entrust {
  type: 'entrust';
}

export interface GainSB {
  type: 'gainSB';
  points: number;
  who?: Who;
}

export interface GainSBOnSuccess {
  type: 'gainSBOnSuccess';
  points: number;
  who?: Who;
}

export interface ResetIfKO {
  type: 'resetIfKO';
}

export interface ResistViaKO {
  type: 'resistViaKO';
}

export interface Reset {
  type: 'reset';
}

export interface CastTime {
  type: 'castTime';
  castTime: number | number[];
  condition: Condition;
}

export interface CastTimePerUse {
  type: 'castTimePerUse';
  castTimePerUse: number;
}

// FIXME: Merge into Attack
export interface StandaloneHitRate {
  type: 'hitRate';
  hitRate: number;
}

// --------------------------------------------------------------------------
// Lower-level game rules

export interface Duration {
  value: number;
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
  | 'allyWithKO';

export type Condition =
  | { type: 'equipped'; article: string; equipped: string }
  | { type: 'scaleWithStatusLevel'; status: StatusName }
  | { type: 'statusLevel'; status: StatusName; value: number | number[] }
  | { type: 'ifDoomed' }
  | { type: 'status'; status: StatusName; who: 'self' | 'target'; any: boolean }
  | { type: 'scaleUseCount'; useCount: number | number[] }
  | { type: 'scaleWithUses' }
  | { type: 'scaleWithSkillUses'; skill: string }
  | { type: 'afterUseCount'; skill: string; useCount: UseCount }
  | { type: 'alliesAlive' }
  | { type: 'characterAlive'; character: string; count?: number | number[] }
  | { type: 'characterInParty'; character: string; count?: number | number[] }
  | { type: 'females'; count: number | number[] }
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
  | { type: 'damageDuringStatus'; value: number | number[] }
  | { type: 'rankBased' }
  | { type: 'statThreshold'; stat: EnlirStat; value: number | number[] };

export interface UseCount {
  x: number | number[];
  y: number;
}
