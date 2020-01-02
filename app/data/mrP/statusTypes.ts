import { EnlirElement, EnlirSchool, EnlirSkillType, EnlirStat } from '../enlir';
import * as common from './commonTypes';

export type StatusEffect = EffectClause[];

export type EffectClause =
  | StatMod
  | CritChance
  | CritDamage
  | HitRate
  | Ko
  | LastStand
  | Reraise
  | StatusChance
  | StatusStacking
  | PreventStatus
  | Speed
  | Instacast
  | CastSpeedBuildup
  | CastSpeed
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
  | AbilityDouble
  | Dualcast
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
  | Doom
  | DoomTimer
  | DrainHp
  | Counter
  | RowCover
  | TriggeredEffect
  | GainSb
  | SbGainUp
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
  | OnceOnly
  | RemovedAfterTrigger
  | TrackStatusLevel
  | ChangeStatusLevel
  | SetStatusLevel
  | StatusLevelBooster
  | BurstToggle
  | TrackUses
  | BurstOnly
  | BurstReset
  | StatusReset
  | DisableAttacks
  | Paralyze;

// --------------------------------------------------------------------------
// Stat mods

export interface StatMod {
  type: 'statMod';
  stats: EnlirStat | EnlirStat[];
  value: number;
  ignoreBuffCap?: boolean;
}

export interface CritChance {
  type: 'critChance';
  value: number | number[];
  trigger?: Trigger;
}

export interface CritDamage {
  type: 'critDamage';
  value: number;
}

export interface HitRate {
  type: 'hitRate';
  value: number;
}

// --------------------------------------------------------------------------
// Status manipulation

export interface StatusChance {
  type: 'statusChance';
  value: number;
  status?: common.StatusName;
}

export interface StatusStacking {
  type: 'statusStacking';
  status: common.StatusName;
  level: number;
}

export interface PreventStatus {
  type: 'preventStatus';
  status: common.StatusName[];
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

interface CastSpeed extends ForAbilities {
  type: 'castSpeed';
  value: number | number[];
  trigger?: Trigger;
}

interface CastSpeedBuildup {
  type: 'castSpeedBuildup';
  value: number;
  increment: number;
  max: number;
  requiresAttack: boolean;
}

interface InstantAtb {
  type: 'instantAtb';
}

interface AtbSpeed {
  type: 'atbSpeed';
  value: number;
}

interface ForAbilities {
  school?: EnlirSchool | EnlirSchool[];
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
  percentHp: number;
}

interface MagiciteStoneskin {
  type: 'magiciteStoneskin';
  element: EnlirElement;
  percentHp: number;
}

interface FixedStoneskin {
  type: 'fixedStoneskin';
  skillType: EnlirSkillType | EnlirSkillType[];
  damage: number;
}

interface DamageBarrier {
  type: 'damageBarrier';
  value: number;
  attackCount: number;
}

// --------------------------------------------------------------------------
// Radiant shield, reflect

interface RadiantShield {
  type: 'radiantShield';
  value: number;
  element?: EnlirElement;
  overflow: boolean;
}

interface Reflect {
  type: 'reflect';
}

// --------------------------------------------------------------------------
// Awoken modes

interface Awoken {
  type: 'awoken';
  awoken: AwokenType;
  rankBoost: boolean;
  rankCast: boolean;
  dualcast: boolean;
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
  element: EnlirElement;
  value: number;
}

interface ElementResist {
  type: 'elementResist';
  element: EnlirElement;
  value: number;
}

interface EnElement {
  type: 'enElement';
  element: EnlirElement;
}

interface EnElementStacking {
  type: 'enElementStacking';
  element: EnlirElement;
}

interface EnElementWithStacking {
  type: 'enElementWithStacking';
  element: EnlirElement;
  level: number;
}

interface LoseEnElement {
  type: 'loseEnElement';
  element?: EnlirElement;
  level: number;
}

// --------------------------------------------------------------------------
// Abilities and elements

interface AbilityBuildup {
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
}

interface AbilityDouble {
  type: 'abilityDouble';
  element: EnlirElement | EnlirElement[];
  school: EnlirSchool | EnlirSchool[];
}

interface Dualcast {
  type: 'dualcast';
  chance: number;
  element: EnlirElement | EnlirElement[];
  school: EnlirSchool | EnlirSchool[];
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
  value: number;
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

// --------------------------------------------------------------------------
// Inflict / resist KO

interface Ko {
  type: 'ko';
}

interface LastStand {
  type: 'lastStand';
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
  element: EnlirElement | EnlirElement[];
  school: EnlirSchool | EnlirSchool[];
}

// --------------------------------------------------------------------------
// Counter and cover

interface Counter {
  type: 'counter';
  skillType: EnlirSkillType | EnlirSkillType[];
  enemyOnly: boolean;
  counter?: CounterResponse;
  chance?: number;
}

type CounterResponse =
  | { skill: string }
  | {
      attack: {
        type: 'attack';
        numAttacks: 1;
        attackMultiplier: number;
        overrideSkillType: EnlirSkillType;
      };
    };

// Haurchefant Cover
interface RowCover {
  type: 'rowCover';
  chance: number;
  skillType: EnlirSkillType | EnlirSkillType[];
  damageReduce: number;
}

// --------------------------------------------------------------------------
// Abilities and status effects

interface TriggeredEffect {
  type: 'triggeredEffect';
  effects: TriggerableEffect | TriggerableEffect[];
  trigger?: Trigger;
  condition?: common.Condition;
}

type TriggerableEffect =
  | CastSkill
  | RandomCastSkill
  | GainSb
  | GrantStatus
  | Heal
  | TriggerChance
  | common.SmartEtherStatus;

interface CastSkill {
  type: 'castSkill';
  skill: common.OrOptions<string>;
}

interface RandomCastSkill {
  type: 'castSkill';
  skill: common.OrOptions<string>;
}

interface GrantStatus {
  type: 'grantsStatus';
  status: StatusItem | StatusItem[];
  who?: common.Who;
  duration?: common.Duration;
  condition?: common.Condition;
}

interface Heal {
  type: 'heal';
  fixedHp: number;
  who: common.Who;
}

interface TriggerChance {
  type: 'triggerChance';
  chance: number;
  effect: TriggerableEffect;
}

type StatusItem =
  | common.StatusName
  | { status: common.StatusName; chance: number }
  | { type: 'gainSB'; value: number };

// --------------------------------------------------------------------------
// Soul Break points

interface GainSb {
  type: 'gainSb';
  value: number;
}

interface SbGainUp {
  type: 'sbGainUp';
  value: number;
  element: EnlirElement | EnlirElement[];
  school: EnlirSchool | EnlirSchool[];
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
  attacks: boolean;
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
  value: number;
}

// --------------------------------------------------------------------------
// Berserk and related statuses

// This effect is also used for Confuse.
interface Berserk {
  type: 'berserk';
}

interface AbilityBerserk {
  type: 'abilityBerserk';
}

interface Rage {
  type: 'rage';
}

// --------------------------------------------------------------------------
// Special durations

interface TurnDuration {
  type: 'turnDuration';
  duration: common.Duration;
}

interface RemovedUnlessStatus {
  type: 'removedUnlessStatus';
  any: boolean;
  status: common.StatusName;
}

interface OnceOnly {
  type: 'onceOnly';
}

interface RemovedAfterTrigger {
  type: 'removedAfterTrigger';
  trigger: Trigger;
}

// --------------------------------------------------------------------------
// Status levels

interface TrackStatusLevel {
  type: 'trackStatusLevel';
  status: common.StatusName;
  max: number;
}

interface ChangeStatusLevel {
  type: 'changeStatusLevel';
  status: common.StatusName;
  value: number;
  trigger?: Trigger;
}

interface SetStatusLevel {
  type: 'setStatusLevel';
  status: common.StatusName;
  value: number;
}

interface StatusLevelBooster {
  type: 'statusLevelBooster';
  status: common.StatusName;
  value: number;
}

// --------------------------------------------------------------------------
// Other

interface BurstToggle {
  type: 'burstToggle';
}

interface TrackUses {
  type: 'trackUses';
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
  status: common.StatusName;
}

interface DisableAttacks {
  type: 'disableAttacks';
  skillType: EnlirSkillType | EnlirSkillType[] | 'jump';
}

interface Paralyze {
  type: 'paralyze';
}

// --------------------------------------------------------------------------
// Triggers

type Trigger =
  | {
      type: 'ability';
      element?: EnlirElement | EnlirElement[];
      school?: EnlirSchool | EnlirSchool[];
      count: number | number[];
      jump: boolean;
      requiresDamage: boolean;
      requiresAttack: boolean;
    }
  | { type: 'crit' }
  | { type: 'vsWeak' }
  | { type: 'whenRemoved' }
  | { type: 'auto'; interval: number }
  | { type: 'damaged'; skillType?: EnlirSkillType }
  | { type: 'dealDamage' }
  | { type: 'loseStatus'; status: common.StatusName }
  | { type: 'skill'; skill: string | string[]; count?: number }
  | { type: 'skillTriggered'; skill: string; count: number }
  | {
      type: 'damagedByAlly';
      skillType: EnlirSkillType | EnlirSkillType[];
      element: EnlirElement | EnlirElement[];
    }
  | { type: 'singleHeal' };
