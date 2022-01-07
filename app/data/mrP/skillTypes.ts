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
  | RecoilSetHp
  | FixedRecoilHp
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
  | Summon
  | StatusEffect
  | SetStatusLevel
  | RandomStatusEffect
  | RandomSkillEffect
  | Entrust
  | GainSBOnSuccess
  | GainSB
  | ResetIfKO
  | ResistViaKO
  | Reset
  | CastTime
  | CastTimePerUse
  | Fallback;

// --------------------------------------------------------------------------
// Attacks

export interface Attack extends Partial<AttackMultiplierGroup>, AttackExtras {
  type: 'attack';
  numAttacks: NumAttacks;
  overstrikeCap?: number;
  scalingOverstrike?: number[]; // For ADSB.  Separate from isOverstrike.
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
  hybridMultiplier?: number | number[];
  scaleToMultiplier?: number;
  multiplierScaleType?: MultiplierScaleType;
  overrideSkillType?: EnlirSkillType;
  overrideSkillTypeDetails?: EnlirSkillType[];
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

  overstrikeCap?: number;
  alwaysCrits?: boolean;
  atkUpWithLowHp?: boolean;

  status?: {
    status: string;
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
  orHybridMultiplier?: number | number[];
  orMultiplierCondition?: common.Condition;

  orNumAttacks?: NumAttacks;
  orNumAttacksCondition?: common.Condition;

  overrideElement?: EnlirElement | EnlirElement[];

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

export interface RecoilSetHp {
  type: 'recoilSetHp';
  hp: number;
  condition?: common.Condition;
}

export interface FixedRecoilHp {
  type: 'fixedRecoilHp';
  value: number;
  skillType: EnlirSkillType;
  who?: common.Who;
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
  overrideSkillType?: EnlirSkillType;
  perUses?: number;
}

export type HealAmount = { healFactor: number | number[] } | { fixedHp: number | number[] };

export type HealPercent = common.HealPercent;

export type DamagesUndead = common.DamagesUndead;

export interface RandomEther {
  type: 'randomEther';
  amount: number;
  who?: common.Who;
  perUses?: number;
}

export type DispelOrEsuna = common.DispelOrEsuna;

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

export type Mimic = common.Mimic;

export interface Summon {
  type: 'summon';
  name: string;
  duration: common.Duration;
}

// --------------------------------------------------------------------------
// Status effects

// Note: Significant overlap between skillTypes.StatusEffect and statusTypes.GrantStatus
export interface StatusEffect {
  type: 'status';
  verb?: common.StatusVerb;
  statuses: common.StatusWithPercent[];

  who?: common.Who | common.Who[];
  toCharacter?: string | string[];
  perUses?: number;
  ifSuccessful?: boolean;
  ifUndead?: boolean;
  condition?: common.Condition;
}

export interface SetStatusLevel {
  type: 'setStatusLevel';
  status: string;
  value: number;
}

export interface RandomStatusEffect {
  type: 'randomStatus';
  verb: common.StatusVerb;
  statuses: Array<{ status: common.StatusItem[]; chance: number }>;
  who?: common.Who;
}

// --------------------------------------------------------------------------
// Miscellaneous

export interface Entrust {
  type: 'entrust';
  max?: number;
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

export interface Fallback {
  type: 'fallback';  
}

// Special case: These exist during parsing but is merged by
// mergeAttackExtrasAndClauses, so higher-level code never sees it as part of
// EffectClause.
export interface StandaloneAttackExtra {
  type: 'attackExtra';
  extra: AttackExtras;
}

export type AndEffectClause = EffectClause & {
  andEffect: true;
};

export interface RandomSkillEffect {
  type: 'randomSkillEffect';
  effects: Array<{ effect: Heal; chance: number }>;
}
