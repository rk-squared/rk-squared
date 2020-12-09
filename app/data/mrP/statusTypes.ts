import { EnlirElement, EnlirRealm, EnlirSchool, EnlirSkillType, EnlirStat } from '../enlir';
import * as common from './commonTypes';
import * as skillTypes from './skillTypes';

export type StatusEffect = EffectClause[];

export type EffectClause =
  | StatMod
  | StatBuildup
  | StatModDurationUp
  | StatShare
  | CritChance
  | CritDamage
  | HitRate
  | Ko
  | LastStand
  | Raise
  | Reraise
  | StatusChance
  | StatusStacking
  | PreventStatus
  | Speed
  | Instacast
  | CastSpeedBuildup
  | CastSpeed
  | FullAtbRoundStart
  | InstantAtb
  | AtbSpeed
  | PhysicalBlink
  | MagicBlink
  | DualBlink
  | ElementBlink
  | Stoneskin
  | MagiciteStoneskin
  | FixedStoneskin
  | DamageBarrier
  | RadiantShield
  | Reflect
  | Awoken
  | SwitchDraw
  | SwitchDrawStacking
  | ElementAttack
  | ElementResist
  | EnElement
  | EnElementStacking
  | EnElementWithStacking
  | LoseEnElement
  | AbilityBuildup
  | RankBoost
  | DamageUp
  | DamageResist
  | RealmBoost
  | AbilityDouble
  | Multicast
  | MulticastAbility
  | NoAirTime
  | BreakDamageCap
  | DamageCap
  | HpStock
  | Regen
  | FixedHpRegen
  | Poison
  | HealUp
  | Pain
  | DamageTaken
  | BarHeal
  | EmpowerHeal
  | Doom
  | DoomTimer
  | DrainHp
  | Counter
  | Cover
  | TriggeredEffect
  | AutoCure
  | ConditionalStatus
  | DirectGrantStatus
  | GainSb
  | SbGainUp
  | GainLb
  | Taunt
  | Runic
  | ImmuneAttacks
  | ZeroDamage
  | EvadeAll
  | MultiplyDamage
  | Berserk
  | Rage
  | AbilityBerserk
  | TurnDuration
  | RemovedUnlessStatus
  | RemovedAfterTrigger
  | TrackStatusLevel
  | ChangeStatusLevel
  | SetStatusLevel
  | StatusLevelBooster
  | BurstToggle
  | TrackUses
  | ModifiesSkill
  | BurstOnly
  | BurstReset
  | StatusReset
  | DisableAttacks
  | Paralyze
  | Stun
  | GilUp;

// --------------------------------------------------------------------------
// Stat mods

export interface StatMod {
  type: 'statMod';
  stats: common.ValueOrPlaceholder<EnlirStat | EnlirStat[]>;

  // Special case: Alternative status for hybrid effects, merged by mergeSimilarStatuses
  hybridStats: EnlirStat | EnlirStat[];

  value: common.SignedValueOrPlaceholder<number | number[]>;
  ignoreBuffCap?: boolean;

  condition?: common.Condition;
}

export interface StatBuildup {
  type: 'statBuildup';
  stat: EnlirStat | EnlirStat[];

  increment: number;
  max: number;

  damaged?: boolean;
  school?: EnlirSchool;
  element?: EnlirElement;
  skillType?: EnlirSkillType;
  requiresDamage?: boolean;
  jump?: boolean;
}

export interface StatModDurationUp {
  type: 'statModDurationUp';
  what: 'buffs' | 'debuffs';
  value: number;
}

export interface StatShare {
  type: 'statShare';
  src: EnlirStat;
  dest: EnlirStat;
  value: number;
}

export interface CritChance {
  type: 'critChance';
  value: common.ValueOrPlaceholder<number | number[]>;
}

export interface CritDamage {
  type: 'critDamage';
  value: common.ValueOrPlaceholder<number>;
}

export interface HitRate {
  type: 'hitRate';
  value: number;
}

// --------------------------------------------------------------------------
// Status manipulation

export interface StatusChance {
  type: 'statusChance';
  value: common.ValueOrPlaceholder<number>;
  status?: string;
}

export interface StatusStacking {
  type: 'statusStacking';
  status: string;
  level: number;
}

export interface PreventStatus {
  type: 'preventStatus';
  status: string[];
}

// --------------------------------------------------------------------------
// Haste, cast speed

// Haste or slow
interface Speed {
  type: 'speed';
  value: number;
}

interface Instacast extends ForAbilities {
  type: 'instacast';
}

export interface CastSpeed extends ForAbilities {
  type: 'castSpeed';
  value: common.ValueOrPlaceholder<number | number[]>;
}

export interface CastSpeedBuildup {
  type: 'castSpeedBuildup';
  value: number;
  increment: number;
  max: number;
  requiresAttack: boolean;
}

interface FullAtbRoundStart {
  type: 'fullAtbRoundStart';
}

interface InstantAtb {
  type: 'instantAtb';
}

interface AtbSpeed {
  type: 'atbSpeed';
  value: number;
}

interface ForAbilities {
  // As of November 2020, only CastSpeed (SchoolCastSpeed) uses a placeholder.
  school?: common.ValueOrPlaceholder<EnlirSchool | EnlirSchool[]>;
  element?: EnlirElement | EnlirElement[];
  magical?: boolean;
  jump?: boolean;
  skillType?: EnlirSkillType | EnlirSkillType[];
  skill?: string;
}

// --------------------------------------------------------------------------
// Blinks and barriers

interface PhysicalBlink {
  type: 'physicalBlink';
  level: number;
}

interface MagicBlink {
  type: 'magicBlink';
  level: number;
}

interface DualBlink {
  type: 'dualBlink';
  level: number;
}

interface ElementBlink {
  type: 'elementBlink';
  element: EnlirElement;
  level: number;
}

interface Stoneskin {
  type: 'stoneskin';
  element?: EnlirElement;
  value: number | number[]; // percent HP
}

interface MagiciteStoneskin {
  type: 'magiciteStoneskin';
  element: EnlirElement;
  value: number; // percent HP
}

interface FixedStoneskin {
  type: 'fixedStoneskin';
  skillType: EnlirSkillType | EnlirSkillType[];
  damage: number;
}

export interface DamageBarrier {
  type: 'damageBarrier';
  value: number | number[];
  attackCount: number;
}

// --------------------------------------------------------------------------
// Radiant shield, reflect

export interface RadiantShield {
  type: 'radiantShield';
  value: number | number[];
  element?: EnlirElement;
  overflow: boolean;
}

export interface Reflect {
  type: 'reflect';
}

// --------------------------------------------------------------------------
// Awoken modes

export interface Awoken {
  type: 'awoken';
  awoken: AwokenType;
  rankBoost: boolean;
  rankCast: boolean;
  dualcast: boolean;
  instacast: boolean;
  castSpeed?: number;
}

export type AwokenType =
  | { school: EnlirSchool | EnlirSchool[] }
  | { element: EnlirElement | EnlirElement[] };

// --------------------------------------------------------------------------
// Switch draw

interface SwitchDraw {
  type: 'switchDraw';
  elements: EnlirElement[];
}

interface SwitchDrawStacking {
  type: 'switchDrawStacking';
  elements: EnlirElement[];
  level?: number;
}

// --------------------------------------------------------------------------
// Element buffs and debuffs

interface ElementAttack {
  type: 'elementAttack';
  element: EnlirElement | EnlirElement[];
  value: number | number[];
  trigger?: Trigger;
}

interface ElementResist {
  type: 'elementResist';
  element: common.ValueOrPlaceholder<EnlirElement | EnlirElement[]>;
  value: common.SignedValueOrPlaceholder<number | number[]>;
}

interface EnElement {
  type: 'enElement';
  element: EnlirElement | EnlirElement[];
}

interface EnElementStacking {
  type: 'enElementStacking';
  element: EnlirElement | EnlirElement[];
}

interface EnElementWithStacking {
  type: 'enElementWithStacking';
  element: EnlirElement | EnlirElement[];
  level: number;
}

interface LoseEnElement {
  type: 'loseEnElement';
  element?: EnlirElement;
  level: number;
}

// --------------------------------------------------------------------------
// Abilities and elements

export interface AbilityBuildup {
  type: 'abilityBuildup';
  school: EnlirSchool;
  increment: number;
  max: number;
}

// A special case of DamageUp
interface RankBoost extends DamageUpType {
  type: 'rankBoost';
}

interface DamageUp extends DamageUpType {
  type: 'damageUp';
  value: number | number[];
  trigger?: Trigger;
  condition?: common.Condition;
}

interface DamageResist {
  type: 'damageResist';
  chance?: number;
  element?: EnlirElement | EnlirElement[];
  skillType?: EnlirSkillType;
  value: number;
  condition?: common.Condition;
}

interface RealmBoost {
  type: 'realmBoost';
  realm: EnlirRealm;
  value: number;
}

interface AbilityDouble {
  type: 'abilityDouble';
  element: EnlirElement | EnlirElement[];
  school: EnlirSchool | EnlirSchool[];
}

interface Multicast {
  type: 'multicast';
  count: number;
  chance: number;
  chanceIsUncertain?: boolean;
  perUses?: number;
  element?: EnlirElement | EnlirElement[];
  school?: EnlirSchool | EnlirSchool[];
}

interface MulticastAbility {
  type: 'multicastAbility';
  count: number;
  element?: EnlirElement | EnlirElement[];
  school?: EnlirSchool | EnlirSchool[];
}

interface NoAirTime {
  type: 'noAirTime';
}

interface DamageUpType {
  element?: EnlirElement | EnlirElement[];
  school?: EnlirSchool | EnlirSchool[];
  skillType?: EnlirSkillType | EnlirSkillType[];
  magical?: boolean;
  jump?: boolean;
  mimic?: boolean;
  vsWeak?: boolean;
}

// --------------------------------------------------------------------------
// Damage cap

interface BreakDamageCap {
  type: 'breakDamageCap';
  skillType: EnlirSkillType | EnlirSkillType[];
  element: EnlirElement | EnlirElement[];
  school: EnlirSchool | EnlirSchool[];
}

interface DamageCap {
  type: 'damageCap';
  value: number;
}

// --------------------------------------------------------------------------
// Healing up and down; damage and healing over time

interface HpStock {
  type: 'hpStock';
  value: common.ValueOrPlaceholder<number | number[]>;
}

interface Regen {
  type: 'regen';
  percentHp: number;
  interval: number;
}

interface FixedHpRegen {
  type: 'fixedHpRegen';
  value: number;
  interval: number;
}

// Also used for Sap, etc.
interface Poison {
  type: 'poison';
  fractionHp: common.Fraction;
  interval: number;
}

interface HealUp {
  type: 'healUp';
  value: number;
  school?: EnlirSchool | EnlirSchool[];
  skillType?: EnlirSkillType;
}

interface Pain {
  type: 'pain';
  value: number;
}

interface DamageTaken {
  type: 'damageTaken';
  value: number;
}

interface BarHeal {
  type: 'barHeal';
  value: number;
}

interface EmpowerHeal {
  type: 'empowerHeal';
  value: number;
}

// --------------------------------------------------------------------------
// Inflict / resist KO

interface Ko {
  type: 'ko';
}

interface LastStand {
  type: 'lastStand';
}

interface Raise {
  type: 'raise';
  value: number;
}

interface Reraise {
  type: 'reraise';
  value: number;
}

// --------------------------------------------------------------------------
// Doom, drain HP

interface Doom {
  type: 'doom';
  timer: number;
}

interface DoomTimer {
  type: 'doomTimer';
  value: number;
}

interface DrainHp {
  type: 'drainHp';
  value: number;
  element?: EnlirElement | EnlirElement[];
  school?: EnlirSchool | EnlirSchool[];
  chance?: number;
  singleTarget?: boolean;
}

// --------------------------------------------------------------------------
// Counter and cover

export interface Counter {
  type: 'counter';
  skillType: EnlirSkillType | EnlirSkillType[];
  enemyOnly: boolean;
  counter?: CounterResponse;
  chance?: number;

  // Is the user immune to the effects they're countering, as with Retaliate?
  immune?: boolean;
}

type CounterResponse =
  | { type: 'skill'; skill: string }
  | { type: 'attack'; numAttacks: 1; attackMultiplier: number; overrideSkillType: EnlirSkillType }
  | { type: 'simpleSkill'; simpleSkill: SimpleSkill };

interface Cover {
  type: 'cover';
  chance: number;
  needsFront?: boolean;
  skillType: EnlirSkillType | EnlirSkillType[];
  who?: common.Who;
  damageReduce: number;
}

// --------------------------------------------------------------------------
// Abilities and status effects

export interface TriggeredEffect {
  type: 'triggeredEffect';
  effects: TriggerableEffect | TriggerableEffect[];
  trigger: Trigger;
  triggerDetail?: TriggerDetail;
  condition?: common.Condition;
  onceOnly?: boolean | number; // A number indicates twice, 3x, etc.
  chance?: number;
  chanceIsUncertain?: boolean;
}

export type TriggerableEffect =
  | CastSkill
  | RandomCastSkill
  | CastSimpleSkill
  | GainSb
  | GrantStatus
  | Heal
  | common.HealPercent
  | RecoilHp
  | common.SmartEtherStatus
  | common.DispelOrEsuna
  // Beginning of "regular" effects (may also be standalone)
  | CritChance
  | CastSpeed;

export interface CastSkill {
  type: 'castSkill';
  skill: common.OrOptions<string>;
}

export interface RandomCastSkill {
  type: 'randomCastSkill';
  skill: common.OrOptions<string>;
}

export interface CastSimpleSkill {
  type: 'castSimpleSkill';
  skill: SimpleSkill;
}

export interface SimpleSkill {
  skillType: EnlirSkillType;
  isAoE: boolean;
  effects: SimpleSkillEffect[];
}

export type SimpleSkillEffect =
  | skillTypes.Attack
  | skillTypes.Heal
  | skillTypes.StatusEffect
  | skillTypes.DrainHp
  | common.HealPercent
  | common.DamagesUndead
  | StatMod;

// Note: Significant overlap between skillTypes.StatusEffect and statusTypes.GrantStatus
export interface GrantStatus {
  type: 'grantStatus';
  verb: common.StatusVerb;
  status: common.StatusWithPercent | common.StatusWithPercent[];

  who?: common.Who;
  toCharacter?: string | string[];
  ifUndead?: boolean;
  condition?: common.Condition;
}

export interface DirectGrantStatus {
  type: 'directGrantStatus';
  status: common.StatusWithPercent | common.StatusWithPercent[];
  duration?: common.Duration;
}

interface Heal {
  type: 'heal';
  fixedHp: number;
  who?: common.Who;
}

// duplicated in skillTypes.ts
export interface RecoilHp {
  type: 'recoilHp';
  damagePercent: number | number[];
  maxOrCurrent: 'max' | 'curr';
}

interface AutoCure {
  type: 'autoCure';
  chance: number;
  status: string | string[];
}

// --------------------------------------------------------------------------
// Conditional status

export interface ConditionalStatus {
  type: 'conditionalStatus';
  verb: common.StatusVerb;
  status: common.StatusWithPercent | common.StatusWithPercent[];
  who?: common.Who;
  toCharacter?: string | string[];
  condition: common.Condition;
}

// --------------------------------------------------------------------------
// Soul Break points

export interface GainSb {
  type: 'gainSb';
  value: number;
}

interface SbGainUp {
  type: 'sbGainUp';
  value: number;
  element?: EnlirElement | EnlirElement[];
  school?: EnlirSchool | EnlirSchool[];
  vsWeak?: true;
}

export interface GainLb {
  type: 'gainLb';
  value: number;
}

// --------------------------------------------------------------------------
// Taunt, runic, immunities

interface Taunt {
  type: 'taunt';
  skillType: EnlirSkillType | EnlirSkillType[];
}

interface Runic {
  type: 'runic';
  skillType: EnlirSkillType | EnlirSkillType[];
}

interface ImmuneAttacks {
  type: 'immuneAttacks';
  skillType?: EnlirSkillType | EnlirSkillType[];
  ranged?: boolean;
  nonRanged?: boolean;
}

interface ZeroDamage {
  type: 'zeroDamage';
  what: 'physical' | 'magical' | 'all' | EnlirSkillType;
}

// Galuf's status; aka Peerless
interface EvadeAll {
  type: 'evadeAll';
}

interface MultiplyDamage {
  type: 'multiplyDamage';
  value: common.ValueOrPlaceholder<number>;
}

// --------------------------------------------------------------------------
// Berserk and related statuses

// This effect is also used for Confuse.
export interface Berserk {
  type: 'berserk';
}

export interface AbilityBerserk {
  type: 'abilityBerserk';
}

export interface Rage {
  type: 'rage';
}

// --------------------------------------------------------------------------
// Special durations

export interface TurnDuration {
  type: 'turnDuration';
  duration: common.Duration;
}

export interface RemovedUnlessStatus {
  type: 'removedUnlessStatus';
  any: boolean;
  status: string;
}

// onceOnly is merged into TriggeredEffect rather than getting its own type.

export interface RemovedAfterTrigger {
  type: 'removedAfterTrigger';
  trigger: Trigger;
}

// --------------------------------------------------------------------------
// Status levels

interface TrackStatusLevel {
  type: 'trackStatusLevel';
  status: string;
  max?: number;
  current?: common.ValueOrPlaceholder<number>;
}

export interface ChangeStatusLevel {
  type: 'changeStatusLevel';
  status: string;
  value: number;
  trigger?: Trigger;
}

interface SetStatusLevel {
  type: 'setStatusLevel';
  status: string;
  value: number;
  trigger?: Trigger;
}

interface StatusLevelBooster {
  type: 'statusLevelBooster';
  status: string;
  value: number;
}

// --------------------------------------------------------------------------
// Other

interface BurstToggle {
  type: 'burstToggle';
}

interface TrackUses {
  type: 'trackUses';
  skill?: string;
  element?: EnlirElement | EnlirElement[];
}

interface ModifiesSkill {
  type: 'modifiesSkill';
  skill: string;
}

interface BurstOnly {
  type: 'burstOnly';
}

interface BurstReset {
  type: 'burstReset';
}

interface StatusReset {
  type: 'statusReset';
  status: string;
}

interface DisableAttacks {
  type: 'disableAttacks';
  skillType: EnlirSkillType | EnlirSkillType[];
  jump?: boolean;
}

interface Paralyze {
  type: 'paralyze';
}

interface Stun {
  type: 'stun';
}

interface GilUp {
  type: 'gilUp';
  chance: number;
  value: number;
  condition?: common.Condition;
}

// --------------------------------------------------------------------------
// Triggers

export type Trigger =
  | {
      type: 'ability';
      skillType?: EnlirSkillType;
      element?: common.OrOptions<EnlirElement>;
      school?: EnlirSchool | EnlirSchool[];
      count: TriggerCount;
      jump?: boolean;
      mimic?: boolean;
      requiresDamage?: boolean;
      requiresAttack?: boolean;
      allowsSoulBreak?: boolean; // Can this trigger off of soul breaks as well as regular abilities?
    }
  | { type: 'crit' }
  | { type: 'vsWeak' }
  | { type: 'whenRemoved' }
  | { type: 'auto'; interval: number }
  | { type: 'damaged'; skillType?: EnlirSkillType }
  | { type: 'dealDamage' }
  | { type: 'loseStatus'; status: string }
  | { type: 'skill'; skill: string | string[]; count?: number | number[]; plus?: number }
  | { type: 'skillTriggered'; skill: string; count: number; isSelfSkill?: boolean }
  | {
      type: 'damagedByAlly';
      skillType: EnlirSkillType | EnlirSkillType[];
      element: common.OrOptions<EnlirElement>;
    }
  | { type: 'singleHeal'; school?: EnlirSchool }
  | { type: 'lowHp'; value: number }
  | { type: 'damageDuringStatus'; value: number | number[] }
  | {
      type: 'allyAbility';
      skillType?: EnlirSkillType;
      element?: common.OrOptions<EnlirElement>;
      school?: EnlirSchool | EnlirSchool[];
      count: TriggerCount;
      jump?: boolean;
      mimic?: boolean;
      requiresDamage: boolean;
      requiresAttack: boolean;
    };

export type TriggerCount =
  | common.UseCount
  | {
      values: number | number[];
      plus?: boolean;
    };

export interface TriggerDetail {
  element?: EnlirElement | EnlirElement[];
}
