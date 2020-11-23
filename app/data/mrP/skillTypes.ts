/**
 * @file
 * TypeScript type definitions corresponding to skillParser's output
 */

import { EnlirElement, EnlirSchool, EnlirSkillType, EnlirStat } from '../enlir';

import * as common from './commonTypes';

export { Condition, Duration, Who } from './commonTypes';

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
  | RandomStatusEffect
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

export type AttackScaleType = common.Condition;

export type MultiplierScaleType =
  | { type: 'percentHp' }
  | { type: 'convergent' }
  | { type: 'stat'; stat: EnlirStat }
  | { type: 'hitsTaken' }
  | { type: 'abilitiesUsed'; school: EnlirSchool }
  | { type: 'attacksUsed'; element: EnlirElement }
  | { type: 'doomTimer'; defaultMultiplier: number }
  | { type: 'limitBreak' };

export interface AttackExtras {
  additionalCritDamage?: number | number[];
  additionalCritDamageCondition?: common.Condition;

  additionalCrit?: number | number[];
  additionalCritCondition?: common.Condition;

  airTime?: number | number[];
  airTimeCondition?: common.Condition;

  isOverstrike?: boolean;
  alwaysCrits?: boolean;
  atkUpWithLowHp?: boolean;

  status?: {
    status: common.StatusName;
    chance: number | number[];
    duration?: common.Duration;
    condition?: common.Condition;
  };

  damageModifier?: number | number[];
  damageModifierCondition?: common.Condition;

  finisherPercentDamage?: number;
  finisherPercentCriteria?: EnlirSkillType | EnlirElement | EnlirSchool;

  followedBy?: Attack;

  hitRate?: number;
  minDamage?: number;

  orMultiplier?: number | number[];
  orMultiplierCondition?: common.Condition;

  orNumAttacks?: NumAttacks;
  orNumAttacksCondition?: common.Condition;

  overrideElement?: EnlirElement;

  isPiercingDef?: boolean;
  isPiercingRes?: boolean;
  scalesWithAtkAndDef?: boolean;
  sbMultiplierChange?: number;
}

// --------------------------------------------------------------------------
// Drain HP, recoil HP, HP-based attacks

export interface DrainHp {
  type: 'drainHp';
  healPercent: number;
  condition?: common.Condition;
}

// duplicated in statusTypes.ts
export interface RecoilHp {
  type: 'recoilHp';
  damagePercent: number | number[];
  maxOrCurrent: 'max' | 'curr';
  condition?: common.Condition;
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
  who?: common.Who;
}

export interface Heal {
  type: 'heal';
  amount: HealAmount;
  who?: common.Who;
  condition?: common.Condition;
}

export type HealAmount = { healFactor: number | number[] } | { fixedHp: number | number[] };

export interface HealPercent {
  type: 'healPercent';
  healPercent: number;
  who?: common.Who;
}

export interface DamagesUndead {
  type: 'damagesUndead';
}

export interface DispelOrEsuna {
  type: 'dispelOrEsuna';
  dispelOrEsuna: 'negative' | 'positive';
  who?: common.Who;
}

export interface RandomEther {
  type: 'randomEther';
  amount: number;
  who?: common.Who;
  perUses?: number;
}

export interface SmartEther extends common.SmartEtherStatus {
  who?: common.Who;
  perUses?: number;
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
  verb: common.StatusVerb;
  statuses: StatusWithPercent[];
}

// Note: Compatible with, but more complex than, skillTypes.StatusWithPercent
export interface StatusWithPercent extends StatusClause {
  status: common.StatusItem;
  chance?: number;
}

export interface StatusClause {
  duration?: common.Duration;
  who?: common.Who;
  whoAllowsLookahead?: boolean;
  perUses?: number;
  ifSuccessful?: boolean;
  ifUndead?: boolean;
  condition?: common.Condition;
}

export interface SetStatusLevel {
  type: 'setStatusLevel';
  status: common.StatusName;
  value: number;
}

export interface RandomStatusEffect {
  type: 'randomStatus';
  verb: common.StatusVerb;
  statuses: Array<{ status: common.StatusItem[]; chance: number }>;
  who?: common.Who;
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
  duration?: common.Duration;
  who?: common.Who;
  condition?: common.Condition;
}

// --------------------------------------------------------------------------
// Miscellaneous

export interface Entrust {
  type: 'entrust';
}

export interface GainSB {
  type: 'gainSB';
  points: number;
  who?: common.Who;
}

export interface GainSBOnSuccess {
  type: 'gainSBOnSuccess';
  points: number;
  who?: common.Who;
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
  condition: common.Condition;
}

export interface CastTimePerUse {
  type: 'castTimePerUse';
  castTimePerUse: number;
}

// Special case: This exists during parsing but is merged by mergeAttackExtras, so
// higher-level code never sees it as part of EffectClause
export interface StandaloneAttackExtra {
  type: 'attackExtra';
  extra: AttackExtras;
}
