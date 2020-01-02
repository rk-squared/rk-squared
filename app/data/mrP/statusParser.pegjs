{
  let parsedNumberString = null;

  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;

  function getX() {
    return options.xValue != null ? options.xValue : NaN;
  }
  function getElementPlaceholder() {
    // HACK: EnlirElement requires *something*, and we don't want to complicate
    // callers by making them deal with absence, so fall back to NE.
    return options.element || 'NE';
  }
  function getStatsPlaceholder() {
    return options.stat || '???';
  }
  function getSchoolPlaceholder() {
    return options.school;
  }
}

StatusEffect
  = head:EffectClause tail:((',' / '.') _ EffectClause)* {
    return util.pegList(head, tail, 2).filter(i => i != null);
  }
  / "" { return []; }

EffectClause
  = StatMod / CritChance / CritDamage / HitRate
  / Ko / LastStand / Reraise
  / StatusChance / StatusStacking / PreventStatus
  / Speed / Instacast / SchoolCastSpeed / CastSpeedBuildup / CastSpeed / InstantAtb / AtbSpeed
  / PhysicalBlink / MagicBlink / DualBlink / ElementBlink / Stoneskin / MagiciteStoneskin / FixedStoneskin / DamageBarrier
  / RadiantShield / Reflect
  / Awoken
  / SwitchDraw / SwitchDrawAlt / SwitchDrawStacking
  / ElementAttack / ElementResist / EnElement / EnElementStacking / EnElementWithStacking / LoseEnElement / LoseAnyEnElement
  / AbilityBuildup / RankBoost / DamageUp / AltDamageUp / AbilityDouble / Dualcast / Dualcast100 / NoAirTime
  / BreakDamageCapAll / BreakDamageCap / DamageCap
  / HpStock / Regen / FixedHpRegen / Poison / HealUp / Pain / DamageTaken / BarHeal
  / Doom / DoomTimer / DrainHp
  / Counter / RowCover
  / TriggeredEffect
  / GainSb / SbGainUp
  / Taunt / Runic / ImmuneAttackSkills / ImmuneAttacks / ZeroDamage / EvadeAll / MultiplyDamage
  / Berserk / Rage / AbilityBerserk
  / TurnDuration / RemovedUnlessStatus / OnceOnly / RemovedAfterTrigger
  / TrackStatusLevel / ChangeStatusLevel / SetStatusLevel / StatusLevelBooster
  / BurstToggle / TrackUses / BurstOnly / BurstReset / StatusReset / ReplaceAttack / ReplaceAttackDefend / DisableAttacks / Ai / Paralyze / NoEffect / Persists / GameOver


// --------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatListOrPlaceholder _ value:SignedIntegerOrX "%" ignoreBuffCaps:(_ "(ignoring the buff stacking caps)")? {
    const result = { type: 'statMod', stats, value };
    if (ignoreBuffCaps) {
      result.ignoreBuffCaps = true;
    }
    return result;
  }

CritChance
  = "Critical chance =" value:(IntegerSlashList / IntegerOrX)  "%" _ trigger:Trigger? { return { type: 'critChance', value, trigger }; }

CritDamage
  = "Critical hits deal" _ value:IntegerOrX "% more damage (additive with the base critical coefficient)" { return { type: 'critDamage', value }; }

HitRate
  = sign:IncreasesOrReduces _ "hit rate by" _ value:Integer "%" { return { type: 'hitRate', value: sign * value }; }


// --------------------------------------------------------------------------
// Status manipulation

StatusChance
  = "Increases the chance of inflicting Status by" _ value:IntegerOrX "%" { return { type: 'statusChance', value }; }
  / "Increases the chance of being inflicted with" _ status:StatusName _ "by" _ value:Integer "%"? { return { type: 'statusChance', value, status }; }

StatusStacking
  = "Allows"i _ "to stack" _ status:StatusName ", up to" _ statusWithLevel:StatusName
  & { return statusWithLevel.startsWith(status) && statusWithLevel.substring(status.length).match(/^ \d+$/); }
    { return { type: 'statusStacking', status, level: +statusWithLevel.substring(status.length) }; }

PreventStatus
  = "Prevents" _ head:StatusName _ tail:(AndList StatusName)* _ "once" { return { type: 'preventStatus', status: util.pegList(head, tail, 1) }; }


// --------------------------------------------------------------------------
// Haste, cast speed

// Haste or slow
Speed
  = "Wait"i _ "speed x" value:DecimalNumber { return { type: 'speed', value }; }

Instacast
  = "Cast"i _ "speed x999" "9"* _ forAbilities:ForAbilities? { return Object.assign({ type: 'instacast' }, forAbilities); }

SchoolCastSpeed
  = "Cast speed x" value:IntegerOrX _ "for [School] attacks, or any attack if no [School] is specified" {
    return { type: 'castSpeed', value, school: getSchoolPlaceholder() };
  }

CastSpeed
  = "Cast"i _ "speed x" value:DecimalNumberSlashList _ forAbilities:ForAbilities? _ trigger:Trigger? { return Object.assign({ type: 'castSpeed', value, trigger }, forAbilities); }
  / what:ElementOrSchoolList _ "cast speed x" value:DecimalNumberSlashList { return Object.assign({ type: 'castSpeed', value }, what); }

CastSpeedBuildup
  = "Cast"i _ "speed x" value:DecimalNumber _ "plus x" increment:DecimalNumber _ "for each" _ requiresAttack:AbilityOrAttack _ "used for the duration of the status, up to x" max:DecimalNumber {
    return { type: 'castSpeedBuildup', value, increment, max, requiresAttack };
  }

InstantAtb
  = "Increase"i _ "ATB charge speed by x999" "9"* { return { type: 'instantAtb' }; }

AtbSpeed
  = "Increase"i _ "ATB charge speed by" _ value:DecimalNumber { return { type: 'atbSpeed', value }; }

ForAbilities
  = "for" _ what:ElementOrSchoolList _ AbilityOrAttack { return what; }
  / "for BLK, WHT, BLU, SUM or NAT attacks that deal magical damage" { return { magical: true }; }
  / "for" _ skillType:SkillTypeList _ "attacks" { return { skillType }; }
  / "for abilities that deal" _ element:ElementList _ "damage" { return { element }; }
  / "for Jump attacks" { return { jump: true }; }
  / "for magical damage" { return { magical: true }; }
  / "for" _ skill:AnySkillName { return { skill }; }


// --------------------------------------------------------------------------
// Blinks and barriers

PhysicalBlink
  = "Evades"i _ "the next" _ level:Integer? _ "PHY" _ AttacksThatDeal _ "physical, missing HP or fixed damage or NAT" _ AttacksThatDeal _ "physical or fractional damage" { return { type: 'magicBlink', level: level || 1 }; }

MagicBlink
  = "Evades"i _ "the next" _ level:Integer? _ "non-PHY, non-NIN" _ AttacksThatDeal _ "magical, fractional or missing HP damage" { return { type: 'magicBlink', level: level || 1 }; }

DualBlink
  = "Evades"i _ "the next" _ level:NumberString? _ "attack" "s"? _ "that could be evaded with Physical or Magical Blink, lower priority" { return { type: 'dualBlink', level: level || 1 }; }

ElementBlink
  = "Reduces"i _ "the damage of the next" _ AttacksThatDeal _ element:Element _ "damage to 0" { return { type: 'elementBlink', element, level: 1 }; }

AttacksThatDeal
  = "attack" "s"? _ "that deal" "s"?

Stoneskin
  = "Reduces" _ element:Element? _ "damage taken to 0, up to an amount" _ ("of damage")? _ "equal to" _ percentHp:Integer "% of the character's maximum HP" {
    return { type: 'stoneskin', element, percentHp };
  }

MagiciteStoneskin
  = "Reduces" _ element:Element _ "damage taken to 0, up to an amount" _ ("of damage")? _ "equal to" _ percentHp:Integer "% of the Magicite's maximum HP" {
    return { type: 'magiciteStoneskin', element, percentHp };
  }

FixedStoneskin
  = "Reduces damage taken from" _ skillType:SkillTypeAndList _ "attacks to 0, up to" _ damage:Integer _ "damage" {
    return { type: 'fixedStoneskin', skillType, damage };
  }

DamageBarrier
  = "Reduces damage taken by" _ value:Integer "% for the next" _
    attackCount:(
      count:Integer _ "attack" "s"? { return count; }
      / "attack" { return 1; }
    ) { return { type: 'damageBarrier', value, attackCount }; }


// --------------------------------------------------------------------------
// Radiant shield, reflect

RadiantShield
  = "Returns"i _ value:RadiantShieldValue _ "the damage taken to the attacker" element:(_ "as" _ e:Element _ "damage" { return e; })? overflow:(_ "capped at 99999") ? {
    return { type: 'radiantShield', value, element, overflow: !!overflow };
  }

RadiantShieldValue
  = "all" _ "of"? { return 100; }
  / value:Integer "% of" { return value; }

Reflect
  = "Redirect single-target BLK and WHT attacks to a random member of the opposite group" { return { type: 'reflect' }; }


// --------------------------------------------------------------------------
// Awoken modes - These are mostly broken down within Enlir, but we treat them
// specially both because of their frequency and to handle their multiple
// references to individual schools or elements.

Awoken
  = awoken:AwokenType _ ("abilities" / "attacks") _ "don't consume uses" _ rankBoost:AwokenRankBoost? rankCast:AwokenRankCast? dualcast:AwokenDualcast?
  & { return !rankCast || util.isEqual(type, rankCast); }
  & { return !dualcast || util.isEqual(type, dualcast); }
  { return { type: 'awoken', awoken, rankBoost: !!rankBoost, rankCast: !!rankCast, dualcast: !!dualcast }; }

AwokenType
  = school:SchoolAndOrList { return { school }; }
  / element:ElementAndOrList { return { element }; }

AwokenRankBoost
  = "and deal 5/10/15/20/30% more damage at ability rank 1/2/3/4/5"

AwokenRankCast
  = ", cast speed x2.00/2.25/2.50/2.75/3.00 for" _ type:AwokenType _ "abilities at ability rank 1/2/3/4/5" { return type; }

AwokenDualcast
  = ", dualcasts" _ type:AwokenType _ "abilities" { return type; }


// --------------------------------------------------------------------------
// Switch draw - These are described as broken down within Enlir, but we treat
// them specially because of how common they are.

SwitchDraw
  = head:SwitchDrawPart tail:("," _ SwitchDrawPart)+ ", lasts 1 turn" { return { type: 'switchDraw', elements: util.pegList(head, tail, 2) }; }

SwitchDrawPart
  = "Grants"i _ "Attach" _ element1:Element _ "after using a" "n"? _ element2:Element _ "ability"
  & { return element1 === element2; } { return element1; }

SwitchDrawAlt
  = "Grants"i _ "Attach" _ elements1:ElementSlashList _ "after using a" "n"? _ elements2:ElementSlashList _ "ability, lasts 1 turn"
  & { return elements1.length > 1 && util.isEqual(elements1, elements2); }
    { return { type: 'switchDraw', elements: elements1 }; }

SwitchDrawStacking
  = "Grants Attach" _ elements1:ElementSlashList _ level:Integer? _ "with Stacking after using a"
    _ elements2:ElementSlashList _ "ability, lasts 1 turn"
    & { return elements1.length > 1 && util.isEqual(elements1, elements2); }
    { return { type: 'switchDrawStacking', elements: elements1, level }; }


// --------------------------------------------------------------------------
// Element buffs and debuffs

ElementAttack
  = sign:IncreasesOrReduces _ element:Element _ "damage dealt by" _ value:Integer _ "%, cumulable" { return { type: 'elementAttack', element, value: value * sign }; }

ElementResist
  = element:ElementOrPlaceholder _ "Resistance"i _ value:SignedIntegerOrX "%" ", cumulable"? { return { type: 'elementResist', element, value }; }

EnElement
  = "Replaces Attack command, increases" _ element:Element _ "damage dealt by 50/80/120% (abilities) or 80/100/120% (Soul Breaks)," _ element2:Element _ "resistance +20%" {
    return { type: 'enElement', element };
  }

EnElementStacking
  = "Allow to stack Attach" _ element:Element _ ", up to Attach" _ element2:Element _ "3" {
    return { type: 'enElementStacking', element };
  }

EnElementWithStacking
  = "Increase Attach" _ element:Element _ "Level by" _ level:Integer _ "and increase Max Attach Element Level by 2, up to Attach" _ element2:Element _ "3" {
    return { type: 'enElementWithStacking', element, level };
  }

LoseEnElement
  = "Decrease Attach" _ element:Element _ "Level by" _ level:Integer { return { type: 'loseEnElement', element, level }; }

LoseAnyEnElement
  = "Decrease any attached element's level by" _ level:Integer { return { type: 'loseEnElement', level }; }


// --------------------------------------------------------------------------
// Abilities and elements

AbilityBuildup
  = school:School _ "abilities deal" _ increment:Integer "% more damage for each" _ schoolUsed:School _ "ability used, up to +" max:Integer "%"
  & { return school === schoolUsed; }
    { return { type: 'abilityBuildup', school, schoolUsed, increment, max }; }

// A special case of DamageUp
RankBoost
  = what:DamageUpType _ ("attacks" / "abilities") _ "deal 5/10/15/20/30% more damage at ability rank 1/2/3/4/5" { return Object.assign({ type: 'rankBoost' }, what); }

DamageUp
  = what:DamageUpType _ ("attacks" / "abilities") _ "deal" _ value:IntegerSlashList "% more damage" _ trigger:Trigger? {
    return Object.assign({ type: 'damageUp', value, trigger }, what);
  }

AltDamageUp
  = "Increases"i _ skillType:SkillType _ "damage dealt by" _ value:Integer "%" { return { type: 'damageUp', skillType, value }; }
  / "Increases"i _ element:ElementAndList _ "damage dealt by" _ value:Integer "%" { return { type: 'damageUp', element, value }; }
  / "Increases"i _ "damage dealt by" _ value:Integer "% when exploiting elemental weaknesses" { return { type: 'damageUp', vsWeak: true, value }; }
  / "Increases"i _ "damage dealt by" _ value:Integer "%" { return { type: 'damageUp', value }; }

AbilityDouble
  = "dualcasts"i _ what:ElementOrSchoolList _ ("abilities" / "attacks") _ "consuming an extra ability use" { return Object.assign({ type: 'abilityDouble' }, what); }

Dualcast100
  = "dualcasts"i _ what:ElementOrSchoolList _ ("abilities" / "attacks") { return Object.assign({ type: 'dualcast', chance: 100 }, what); }

Dualcast
  = chance:Integer "% chance to dualcast" _ what:ElementOrSchoolList _ ("abilities" / "attacks") { return Object.assign({ type: 'dualcast', chance }, what); }

NoAirTime
  = "Changes"i _ "the air time of Jump attacks to 0.01 seconds" { return { type: 'noAirTime' }; }

DamageUpType
  = ElementSchoolOrSkillTypeList
  / "magical"i { return { magical: true }; }
  / "jump"i { return { jump: true }; }


// --------------------------------------------------------------------------
// Damage cap

BreakDamageCapAll
  = "Sets"i _ "damage cap to 99999 for all attacks" { return { type: 'breakDamageCap' }; }

BreakDamageCap
  = "Sets"i _ "the damage cap for" _ skillType:SkillTypeAndList? _ what:ElementOrSchoolList? _ "attacks to 99999" { return Object.assign({ type: 'breakDamageCap', skillType }, what); }

DamageCap
  = "Increases the damage cap by" _ value:Integer { return { type: 'damageCap', value }; }


// --------------------------------------------------------------------------
// Healing up and down; damage and healing over time

HpStock
  = "Automatically"i _ "restores HP, up to" _ value:IntegerOrX _ "HP" { return { type: 'hpStock', value }; }

Regen
  = "Heals"i _ "for" _ percentHp:Integer "% max HP every" _ interval:SecondsInterval { return { type: 'regen', percentHp, interval }; }

FixedHpRegen
  = "Heals"i _ "for" _ value:Integer _ "HP every" _ interval:SecondsInterval { return { type: 'fixedHpRegen', value, interval }; }

// Also used for Sap, etc.
Poison
  = "Damages for" _ fractionHp:Fraction _ "max HP every" _ interval:SecondsInterval { return { type: 'poison', fractionHp, interval }; }

HealUp
  = "Abilities"i _ "restore" _ value:Integer "% more HP" { return { type: 'healUp', value }; }

Pain
  = "Take" _ value:Integer "% more damage" { return { type: 'pain', value }; }

DamageTaken
  = sign:IncreasesOrReduces _ "damage taken by" _ value:Integer "%" { return { type: 'damageTaken', value: sign * value }; }

BarHeal
  = "Healing restores" _ value:Integer "% less HP" { return { type: 'barHeal', value }; }

SecondsInterval
  = "second" { return 1; }
  / interval:DecimalNumber _ "seconds" { return interval; }


// --------------------------------------------------------------------------
// Inflict / resist KO

Ko
  = "HP = 0 when set" { return { type: 'ko' }; }

LastStand
  = "Prevents KO once, restoring HP for 1% maximum HP" { return { type: 'lastStand' }; }

Reraise
  = "Automatically removes KO (" value:Integer "% HP) once" { return { type: 'reraise', value }; }


// --------------------------------------------------------------------------
// Doom, drain HP

Doom
  = "Causes Doom with a" _ timer:Integer _ "seconds timer" { return { type: 'doom', timer }; }

DoomTimer
  = sign:IncreasesOrReduces _ "the character's Doom timer by" _ value:Integer _ "when set" { return { type: 'doomTimer', value: value * sign }; }

DrainHp
  = "Restores"i _ "HP for" _ value:Integer _ "% of the damage dealt with" _ what:ElementOrSchoolList _ ("abilities" / "attacks") { return Object.assign({type: 'drainHp', value }, what); }


// --------------------------------------------------------------------------
// Counter and cover

Counter
  = when:CounterWhen _ enemy:"enemy"? _ skillType:SkillTypeAndList _ "attacks with" _ counter:CounterResponse {
    return Object.assign({ type: 'counter', skillType, enemyOnly: !!enemy, counter }, when);
  }

CounterWhen
  = "counters"i { return {}; }
  // Statuses use "chance of countering", legend materia use "chance to counter"
  / chance:Integer ("% chance of countering" / "% chance to counter") { return { chance }; }

CounterResponse
  = "Attack" { return undefined; }
  / skill:AnySkillName { return { skill }; }
  / "an ability (single," _ attackMultiplier:DecimalNumber _ damageType:("physical" / "magical") _ ")" {
    const overrideSkillType = damageType === 'physical' ? 'PHY' : 'BLK';
    return { attack: { type: 'attack', numAttacks: 1, attackMultiplier, overrideSkillType } };
  }

// Haurchefant Cover
RowCover
  = "While front row," _ chance:Integer "% chance to cover" _ skillType:SkillTypeAndList _ "attacks that target back row allies, reducing damage taken by" _ damageReduce:Integer "%" {
    return { type: 'rowCover', chance, skillType, damageReduce };
  }


// --------------------------------------------------------------------------
// Abilities and status effects

TriggeredEffect
  = head:TriggerableEffect _ tail:("and" _ TriggerableEffect)* _ trigger:Trigger? _ condition:Condition? {
    return util.addCondition({ type: 'triggeredEffect', effects: util.pegList(head, tail, 2, true), trigger }, condition);
  }

TriggerableEffect
  = CastSkill / RandomCastSkill / GainSb / GrantStatus / Heal / HealChance / SmartEtherStatus

CastSkill
  = "casts"i _ skill:AnySkillOrOptions  { return { type: 'castSkill', skill }; }

RandomCastSkill
  = "randomly"i _ "casts" _ skill:AnySkillOrOptions  { return { type: 'castSkill', skill }; }

GrantStatus
  = verb:StatusVerb _ head:StatusItem _ tail:(("," / "and") _ StatusItem)* _ condition:Condition? _ who:Who? _ duration:Duration? {
    return util.addCondition({ type: 'grantsStatus', status: util.pegList(head, tail, 2, true), who, duration }, condition);
  }

Heal
  = "restores"i _ fixedHp:Integer _ "HP" _ who:Who { return { type: 'heal', fixedHp, who }; }

HealChance
  = chance:Integer "% chance to restore"i _ fixedHp:Integer _ "HP" _ who:Who { return { type: 'triggerChance', chance, effect: { type: 'heal', fixedHp, who } }; }

StatusItem
  = status:StatusName _ chance:("(" n:Integer "%)" { return n; })? {
    if (!chance || chance === 100) {
      return status;
    } else {
      return { status, chance };
    }
  }
  / value:Integer _ "SB points"{ return { type: 'gainSB', value }; }


// --------------------------------------------------------------------------
// Soul Break points

GainSb
  = "Grants"i _ value:Integer _ "SB points" _ "when set"? { return { type: 'gainSb', value }; }

SbGainUp
  = what:ElementOrSchoolList _ ("abilities" / "attacks") _ "grant" _ value:Integer _ "% more SB points" { return Object.assign({ type: 'sbGainUp', value }, what); }


// --------------------------------------------------------------------------
// Taunt, runic, immunities

Taunt
  = "Taunts"i _ "single-target" _ skillType:SkillTypeAndList _ "attacks" { return { type: 'taunt', skillType }; }

Runic
  = "Absorbs"i _ skillType:SkillTypeAndList _ "attacks to restore 1 consumed ability use" { return { type: 'runic', skillType }; }

ImmuneAttackSkills
  = "Can't"i _ "be hit by" _ ranged:("ranged")? _ nonRanged:("non-ranged")? _ skillType:SkillTypeList _ "attacks" {
    return {
      type: 'immune',
      attacks: true,
      skillType,
      ranged: !!ranged,
      nonRanged: !!nonRanged,
    }
  }

ImmuneAttacks
  = "Can't be hit by any attack" {
    return {
      type: 'immune',
      attacks: true,
    }
  }

ZeroDamage
  = "Reduces"i _ what:("physical" / "magical" / "all") _ "damage received to 0" { return { type: 'zeroDamage', what }; }
  / "Reduces to 0 all damage received from non-NIN attacks that deal magical damage and all damage received from BLK, WHT, BLU or SUM attacks" { return { type: 'zeroDamage', what: 'magical' }; }
  / "Reduces to 0 all damage received from non-NIN attacks that deal physical damage and all damage received from PHY attacks" { return { type: 'zeroDamage', what: 'physical' }; }
  / "Reduces to 0 all damage received from NIN attacks" { return { type: 'zeroDamage', what: 'NIN' }; }

// Galuf's status; aka Peerless
EvadeAll
  = "Evades"i _ "all attacks" { return { type: 'evadeAll' }; }

MultiplyDamage
  = "Multiplies all damage received by" _ value:IntegerOrX { return { type: 'multipleDamage', value }; }


// --------------------------------------------------------------------------
// Berserk and related statuses.  These are unique enough that we'll fully
// special case them.

// This effect is also used for Confuse.
Berserk
  = "Forces"i _ "default action, affects targeting, resets ATB when set or removed" { return { type: 'berserk' }; }

AbilityBerserk
  = "Forces a random available action, excluding Defend, affects targeting, Berserk, Confuse, Paralyze, Stop are prioritized" { return { type: 'abilityBerserk' }; }

Rage  // aka "auto" elsewhere in our code
  = "Forces"i _ "a specified action, affects targeting, resets ATB when removed" { return { type: 'rage' }; }


// --------------------------------------------------------------------------
// Special durations

TurnDuration
  = "lasts" _ "for"? _ value:Integer _ "turn" "s"? { return { type: 'duration', duration: { value, units: 'turns' } }; }

RemovedUnlessStatus
  = "Removed"i _ "if" _ "the"? _ "user" _ ("hasn't" / "doesn't have") _ any:"any"? _ status:StatusName { return { type: 'removedUnlessStatus', any: !!any, status }; }

OnceOnly
  = "Removed"i _ "after triggering" { return { type: 'onceOnly' }; }

RemovedAfterTrigger
  = "Removed"i _ trigger:Trigger { return { type: 'removedAfterTrigger', trigger }; }


// --------------------------------------------------------------------------
// Status levels

TrackStatusLevel
  = "Keeps"i _ "track of the" _ status:StatusName _ "level, up to level" _ max:Integer { return { type: 'trackStatusLevel', status, max }; }

ChangeStatusLevel
  = sign:IncreasesOrReduces _ "the"? _ status:StatusName _ "level by" _ value:Integer _ trigger:TriggerOrWhenSet {
    return { type: 'changeStatusLevel', status, value: value * sign, trigger };
  }

SetStatusLevel
  = "Sets"i _ "the" _ status:StatusName _ "level to" _ value:Integer _ "when set" { return { type: 'setStatusLevel', status, value }; }

StatusLevelBooster
  = "Increases"i _ "the" _ status:StatusName _ "level by" _ value:Integer _ "when the" _ status2:StatusName _ "level is increased"
  & { return status === status2; }
    { return { type: 'statusLevelBooster', status, value }; }


// --------------------------------------------------------------------------
// Other

BurstToggle
  = "Affects"i _ "certain Burst Commands" { return { type: 'burstToggle' }; }

TrackUses
  = "Keeps"i _ "track of the" _ ("number of")? _ "uses of" _ skill:AnySkillName { return { type: 'trackUses', skill }; }
  / "Used to determine the effect of" _ skill:AnySkillName { return { type: 'trackUses', skill }; }

BurstOnly
  = "removed if the user hasn't Burst Mode" { return { type: 'burstOnly' }; }

BurstReset
  = "reset upon refreshing Burst Mode" { return { type: 'burstReset' }; }

StatusReset
  = "reset upon refreshing" _ status:StatusName { return { type: 'statusReset', status }; }

ReplaceAttack
  = "Replaces"i _ "the Attack command" { return null; }

ReplaceAttackDefend
  = "Replaces"i _ "the Attack and Defend commands" { return null; }

DisableAttacks
  = "Disables"i _ skillType:(SkillTypeAndList / "Jump") _ "attacks" { return { type: 'disableAttacks', skillType }; }

Ai
  = "Affects"i _ GenericName _ "behaviour" { return null; }

Paralyze
  = "Arrests"i _ "ATB charge rate, can't act" ", resets ATB when set"? { return { type: 'paralyze' }; }
  / "Can't"i _ "act, resets ATB when set or removed" { return { type: 'paralyze' }; }

NoEffect
  = "No gameplay effects" { return null; }

Persists
  = "Persists"i _ "after battle" { return null; }

GameOver
  = "Counts"i _ "towards Game Over" { return null; }


// --------------------------------------------------------------------------
// Triggers

Trigger
  = "after" _ requiresDamage1:("using" / "dealing damage with") _ count:TriggerCount _ requiresDamage2:"damaging"?
    _ element:ElementListOrOptions? _ school:SchoolList? _ jump:"jump"? _ requiresAttack:AbilityOrAttack {
      return { type: 'ability', element, school, count, jump: !!jump, requiresDamage: requiresDamage1 === 'dealing damage with' || !!requiresDamage2, requiresAttack };
    }
  / "after dealing a critical hit" { return { type: 'crit' }; }
  / "after exploiting elemental weakness" { return { type: 'vsWeak' }; }
  / "when removed" { return { type: 'whenRemoved' }; }
  / "every" _ interval:DecimalNumber _ "seconds" { return { type: 'auto', interval }; }
  / "upon taking damage" skillType:(_ "by" _ s:SkillType _ "attack" { return s; })? { return { type: 'damaged', skillType }; }
  / "by" _ skillType:SkillType _ "attacks" { return { type: 'damaged', skillType }; }
  / "upon dealing damage" { return { type: 'dealDamage' }; }
  / "when" _ "any"? _ status:StatusName _ "is removed" { return { type: 'loseStatus', status }; }
  / ("when using" / "after using") _ skill:AnySkillName _ count:Occurrence? { return { type: 'skill', skill, count }; }
  / "when" _ skill:AnySkillName _ "is triggered" _ count:Integer _ "times" { return { type: 'skillTriggered', skill, count }; }
  / "after using" _ count:NumberString _ "of" _ skill1:AnySkillName _ "and/or" _ skill2:AnySkillName { return { type: 'skill', skill: [skill1, skill2], count }; }
  / "after taking" _ element:ElementListOrOptions _ "damage from a" _ skillType:SkillTypeList _ "attack used by another ally" { return { type: 'damagedByAlly', skillType, element }; }
  / "after using a single-target heal" { return { type: 'singleHeal' }; }

AbilityOrAttack
  = ("ability" / "abilities") { return false; }
  / "attack" "s"? { return true; }

TriggerCount
  = ArticleOrNumberString
  / UseCount
  / values:IntegerSlashList "+"? { return values; }
  / Integer
  / "" { return 1; }

TriggerOrWhenSet
  = Trigger
  / "when set" { return undefined; }


// --------------------------------------------------------------------------
// Conditions

Condition
  = "when" _ "equipping" _ article:("a" "n"? { return text(); }) _ equipped:[a-z- ]+ { return { type: 'equipped', article, equipped: equipped.join('') }; }

  // "Level-like" or "counter-like" statuses, as seen on newer moves like
  // Thief (I)'s glint or some SASBs.  These are more specialized, so they need
  // to go before general statuses.
  / "scaling" _ "with" _ status:StatusName _ "level" { return { type: 'scaleWithStatusLevel', status }; }
  / "at" _ status:StatusName _ "levels" _ value:IntegerAndList { return { type: 'statusLevel', status, value }; }
  / "if" _ "the"? _ "user" _ "has" _ status:StatusName _ "level" _ value:IntegerSlashList { return { type: 'statusLevel', status, value }; }
  / "if" _ "the"? _ "user" _ "has" _ "at" _ "least" _ value:Integer _ status:StatusName { return { type: 'statusLevel', status, value }; }

  // If Doomed - overlaps with the general status support below
  / ("if" _ "the" _ "user" _ "has" _ "any" _ "Doom" / "with" _ "any" _ "Doom") { return { type: 'ifDoomed' }; }

  // General status
  / "if" _ "the"? _ who:("user" / "target") _ "has" _ any:"any"? _ status:(StatusName (OrList StatusName)* { return text(); }) {
    return {
      type: 'status',
      status,  // In string form - callers must separate by comma, "or", etc.
      who: who === 'user' ? 'self' : 'target',
      any: !!any
    };
  }

  // Beginning of attacks and skills (like Passionate Salsa)

  // Scaling with uses - both specific counts and generically
  / ("at" / "scaling" _ "with") _ useCount:IntegerSlashList _ "uses" { return { type: 'scaleUseCount', useCount }; }
  / "scaling" _ "with" _ "uses" { return { type: 'scaleWithUses' }; }
  / ("scaling" / "scal.") _ "with" _ skill:AnySkillName _ "uses" { return { type: 'scaleWithSkillUses', skill }; }

  / "after" _ useCount:UseCount _ skill:AnySkillName _ "uses" { return { type: 'afterUseCount', skill, useCount }; }
  / "on" _ "first" _ "use" { return { type: 'afterUseCount', useCount: { from: 1, to: 1 } }; }
  / "on" _ first:Integer "+" _ "use" "s"? { return { type: 'afterUseCount', useCount: { from: first } }; }

  // Beginning of attack-specific conditions
  / "if" _ "all" _ "allies" _ "are" _ "alive" { return { type: 'alliesAlive' }; }
  / "if" _ character:CharacterNameList _ ("is" / "are") _ "alive" { return { type: 'characterAlive', character }; }
  / "if" _ count:IntegerSlashList _ "of" _ character:CharacterNameList _ "are" _ "alive" { return { type: 'characterAlive', character, count }; }
  / "if" _ count:IntegerSlashList? _ character:CharacterNameList _ ("is" / "are") _ "in" _ "the" _ "party" { return { type: 'characterInParty', character, count }; }
  / "if" _ count:IntegerSlashList _ "females" _ "are" _ "in" _ "the" _ "party" { return { type: 'females', count }; }
  / "if" _ "there" _ "are" _ count:IntegerSlashList "+"? _ realm:Realm _ "characters" _ "in" _ "the" _ "party" { return { type: 'realmCharactersInParty', realm, count }; }
  / "if" _ count:Integer _ "or" _ "more" _ "females" _ "are" _ "in" _ "the" _ "party" { return { type: 'females', count }; }

  / "if" _ count:IntegerSlashList _ "allies" _ "in" _ "air" { return { type: 'alliesJump', count }; }

  / "if" _ "the" _ "user's" _ "Doom" _ "timer" _ "is" _ "below" _ value:IntegerSlashList { return { type: 'doomTimer', value }; }
  / "if" _ "the" _ "user's" _ "HP" _ ("is" / "are") _ "below" _ value:IntegerSlashList "%" { return { type: 'hpBelowPercent', value }; }
  / "if" _ "the" _ "user" _ "has" _ value:IntegerSlashList _ SB _ "points" { return { type: 'soulBreakPoints', value }; }

  / "if" _ count:IntegerSlashList _ "of" _ "the" _ "target's" _ "stats" _ "are" _ "lowered" { return { type: 'targetStatBreaks', count }; }
  / "if" _ "the" _ "target" _ "has" _ count:IntegerSlashList _ "ailments" { return { type: 'targetStatusAilments', count }; }

  / "if" _ "exploiting" _ "elemental" _ "weakness" { return { type: 'vsWeak' }; }
  / "if" _ "the"? _ "user" _ "is" _ "in" _ "the"? _ "front" _ "row" { return { type: 'inFrontRow' }; }

  / "if" _ "the" _ "user" _ ("took" / "has" _ "taken") _ count:IntegerSlashList _ skillType:SkillTypeList _ "hits" { return { type: 'hitsTaken', count, skillType }; }
  / "if" _ "the" _ "user" _ ("took" / "has" _ "taken") _ count:IntegerSlashList _ "attacks" { return { type: 'attacksTaken', count }; }

  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ "damaging" _ "actions" { return { type: 'damagingActions', count }; }
  / "with" _ count:IntegerSlashList _ "other" _ school:School _ "users" { return { type: 'otherAbilityUsers', count, school }; }
  / "at" _ count:IntegerSlashList _ "different" _ school:School _ "abilities" _ "used" { return { type: 'differentAbilityUses', count, school }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ school:SchoolList _ "abilities" _ "during" _ "the" _ "status" { return { type: 'abilitiesUsedDuringStatus', count, school }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ school:SchoolList _ "abilities" { return { type: 'abilitiesUsed', count, school }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ element:ElementList _ "attacks" _ "during" _ "the" _ "status" { return { type: 'attacksDuringStatus', count, element }; }
  / "if" _ value:IntegerSlashList _ "damage" _ "was" _ "dealt" _ "during" _ "the" _ "status" {
    lastDamageDuringStatus = util.lastValue(value);
    lastDamageDuringStatusElement = undefined;
    return { type: 'damageDuringStatus', value };
  }
  / "if" _ "the" _ "user" _ "dealt" _ value:IntegerSlashList _ "damage" _ "during" _ "the" _ "status" {
    lastDamageDuringStatus = util.lastValue(value);
    lastDamageDuringStatusElement = undefined;
    return { type: 'damageDuringStatus', value };
  }
  / "if" _ "the" _ "user" _ "dealt" _ value:IntegerSlashList _ "damage" _ "with" _ element:ElementList _ "attacks" _ "during" _ "the" _ "status" {
    lastDamageDuringStatus = util.lastValue(value);
    lastDamageDuringStatusElement = element;
    return { type: 'damageDuringStatus', value, element };
  }
  / "if" _ "the" _ "final" _ "damage" _ "threshold" _ "was" _ "met" { return { type: 'damageDuringStatus', value: lastDamageDuringStatus, element: lastDamageDuringStatusElement }; }
  // Alternate phrasing - this appears to be an error, so we smooth it out. TODO: Fix upstream.
  / "scaling" _ "with" _ school:School _ "attacks" _ "used" _ "(" _ count:IntegerSlashList _ ")" { return { type: 'abilitiesUsed', count, school }; }

  / "at" _ "rank" _ "1/2/3/4/5" (_ "of" _ "the" _ "triggering" _ "ability")? { return { type: 'rankBased' }; }
  / "at" _ "ability" _ "rank" _ "1/2/3/4/5" { return { type: 'rankBased' }; }

  // Alternate status phrasing.  For example, Stone Press:
  // "One single attack (3.00/4.00/7.00) capped at 99999 at Heavy Charge 0/1/2")
  / "at" _ status:StatusName { return { type: 'status', status, who: 'self' }; }

  // Stat thresholds (e.g., Tiamat, Guardbringer)
  / "at" _ value:IntegerSlashList _ stat:Stat { return { type: 'statThreshold', stat, value }; }


// --------------------------------------------------------------------------
// Lower-level game rules

SmartEtherStatus
  = school:School? _ "smart"i _ "ether" _ amount:IntegerSlashList {
    const result = { type: 'smartEther', amount };
    if (school) {
      result.school = school;
    }
    return result;
  }

StatusVerb
  = ("grants"i / "causes"i / "removes"i / "doesn't"i _ "remove") {
    return text().toLowerCase().replace(/\s+/g, ' ');
  }

StatusName "status effect"
  = (
    // Stat mods in particular have a distinctive format.
    ([A-Z] [a-z]+ _)? StatList _ SignedInteger '%'
  / GenericName
  / "?"
  ) {
    return text();
  }

// These probably don't cover all abilities and characters, but it works for now.
AbilityName
  = UppercaseWord (_ UppercaseWord)* { return text(); }
CharacterName
  = UppercaseWord (_ (UppercaseWord / "of"))* (_ "(" [A-Z] [A-Za-z0-9-]+ ")")? { return text(); }

// Character names, for "if X are in the party."  Return these as text so that
// higher-level code can process them.
CharacterNameList
  = CharacterName ((_ "&" _ / "/" / _ "or" _) CharacterName)* { return text(); }

// Any skill - burst commands, etc. ??? is referenced in one particular status.
AnySkillName
  = GenericName / '???'

AnySkillOrOptions
  = head:AnySkillName tail:(_ "/" _ AnySkillName)+ { return { options: util.pegList(head, tail, 3) }; }
  / skill:AnySkillName ! (_ "/") { return skill; }

// Generic names.  Somewhat complex expression to match these.  Developed for
// statuses, so the rules may need revision for other uses.
GenericName
  = (
    (GenericNameWord
      // Names can start with numbers, but require a word after that, so that
      // "100%" doesn't get parsed as a status name by itself.
      / IntegerSlashList '%' !(_ "hit" _ "rate") _ GenericNameWord
      / SignedIntegerSlashList [%+]? _ GenericNameWord
    )
    (_
      (
        GenericNameWord

        // Articles, etc., are okay, but use &' ' to make sure they're at a
        // word bounary.
        / (('in' / 'or' / 'of' / 'the' / 'with' / '&' / 'a') & ' ')
        // "for" and "to" in particular needs extra logic to ensure that
        // they're part of status words instead of part of later clauses.
        / ("for" / "to") _ GenericNameWord

        / SignedIntegerSlashList [%+]?
        / [=*]? IntegerSlashList [%+]?
        / '(' ("Black Magic" / "White Magic" / [A-Za-z-0-9/]+) ')'
      )
    )*
  ) {
    return text();
  }
GenericNameWord = ([A-Z] [a-zA-Z-'/]* (':' / '...' / '!' / '+')?)

Duration
  = "for" _ value:Integer _ valueIsUncertain:("?")? _ units:DurationUnits {
    const result = { value, units };
    if (valueIsUncertain) {
      result.valueIsUncertain = true;
    }
    return result;
  }

DurationUnits
  = (("second" / "turn") "s"? / "sec.") {
    let result = text();
    if (result === 'sec.') {
      return 'seconds';
    }
    if (!result.endsWith('s')) {
      result += 's';
    }
    return result;
  }

Stat "stat"
  = ("ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA") {
    return text().toLowerCase();
  }

StatList "stat list"
  = head:Stat tail:(AndList Stat)* { return util.pegList(head, tail, 1, true); }

StatListOrPlaceholder
  = StatList / "[Stats]" { return getStatsPlaceholder(); }

Who
  = "to" _ "the"? _ "user" { return 'self'; }
  / "to" _ "the" _ "target" { return 'target'; }
  / "to" _ "all" _ "enemies" { return 'enemies'; }
  / "to" _ "all" _ "allies" row:(_ "in" _ "the" _ row:("front" / "back" / "character's") _ "row" { return row === "character's" ? 'sameRow' : row + 'Row'; })? {
    return row || 'party';
  }
  / "to" _ "the" _ "lowest" _ "HP%" _ "ally" { return 'lowestHpAlly'; }
  / "to" _ "a" _ "random" _ "ally" _ "without" _ "status" { return 'allyWithoutStatus'; }
  / "to" _ "a" _ "random" _ "ally" _ "with" _ "negative" _ "status"? _ "effects" { return 'allyWithNegativeStatus'; }
  / "to" _ "a" _ "random" _ "ally" _ "with" _ "KO" { return 'allyWithKO'; }

SkillType "skill type"
  = "PHY"
  / "WHT"
  / "BLK"
  / "BLU"
  / "SUM"
  / "NAT"
  / "NIN"
  // Used for EX: Soldier
  / "physical" { return "PHY"; }

SkillTypeList "skill type list"
  = head:SkillType tail:(OrList SkillType)* { return util.pegList(head, tail, 1, true); }

SkillTypeAndList "skill type list"
  = head:SkillType tail:(AndList SkillType)* { return util.pegList(head, tail, 1, true); }

Element "element"
  = "Fire"
  / "Ice"
  / "Lightning"
  / "Earth"
  / "Wind"
  / "Water"
  / "Holy"
  / "Dark" ! "ness" { return "Dark"; }
  / "Poison"
  / "NE"
  / "Non-Elemental" { return "NE"; }

ElementOrPlaceholder
  = Element
  / "[Element]" { return getElementPlaceholder(); }

ElementList "element list"
  = head:Element tail:(OrList Element)* { return util.pegList(head, tail, 1, true); }

ElementAndList "element list"
  = head:Element tail:(AndList Element)* { return util.pegList(head, tail, 1, true); }

ElementAndOrList "element list"
  = head:Element tail:(AndOrList Element)* { return util.pegList(head, tail, 1, true); }

ElementSlashList "element list"
  = head:Element tail:("/" Element)* { return util.pegList(head, tail, 1, true); }

ElementListOrOptions "element list or slash-separated alternatives"
  = elements:ElementList ! "/" { return elements; }
  / elements:ElementSlashList { return { options: elements }; }

School "ability school"
  = "Bard"
  / "Black Magic"
  / "Celerity"
  / "Combat"
  / "Dancer"
  / "Darkness"
  / "Dragoon"
  / "Heavy"
  / "Knight"
  / "Machinist"
  / "Monk"
  / "Ninja"
  / "Samurai"
  / "Sharpshooter"
  / "Special"
  / "Spellblade"
  / "Summoning"
  / "Support"
  / "Thief"
  / "White Magic"
  / "Witch"

SchoolList "school list"
  = head:School tail:(OrList School)* { return util.pegList(head, tail, 1, true); }

SchoolAndList "school list"
  = head:School tail:(AndList School)* { return util.pegList(head, tail, 1, true); }

SchoolAndOrList "school list"
  = head:School tail:(AndOrList School)* { return util.pegList(head, tail, 1, true); }

SB = "Soul" _ "Break" / "SB"
Maximum = "maximum" / "max" "."?

// "x + yn"
UseCount = x:IntegerSlashList y:(_ "+" _ y:Integer _ "n" { return y; }) { return { x, y }; }

ElementOrSchoolList
  = school:SchoolAndOrList { return { school }; }
  / element:ElementAndOrList { return { element }; }

ElementSchoolOrSkillTypeList
  = school:SchoolAndOrList { return { school }; }
  / element:ElementAndOrList { return { element }; }
  / skillType:SkillTypeList { return { skillType }; }

Realm "realm"
  = "Beyond"
  / "Core"
  / "IX"
  / "IV"
  / "FFT"
  / "III"
  / "II"
  / "I"
  / "VIII"
  / "VII"
  / "VI"
  / "V"
  / "XV"
  / "XIV"
  / "XIII"
  / "XII"
  / "XI"
  / "X"
  / "KH"
  / "Type-0"


// --------------------------------------------------------------------------
// Primitive types

IncreasesOrReduces
  = "increases"i { return 1; }
  / "reduces"i { return -1; }
  / "decreases"i { return -1; }

AndList
  = (',' _ 'and'? _) / (_ 'and' _)

OrList
  = (',' _ 'or'? _) / (_ 'or' _)

AndOrList
  = (',' _ ('and' / 'or')? _) / (_ ('and' / 'or') _)

NumberString "numeric text"
  = numberString:[a-zA-Z\-]+
  & { parsedNumberString = util.parseNumberString(numberString.join('')); return parsedNumberString != null; }
  { return parsedNumberString; }

ArticleOrNumberString
  = NumberString
  / ("a" "n"?) { return 1; }


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

IntegerOrX "integer or X"
  = Integer / "X" { return getX(); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }

SignedIntegerOrX "signed integer or X"
  = sign:[+-] _ value:([0-9]+ / "X") {
    if (value === 'X') {
      return getX();
    } else {
      return parseInt(sign + value.join(''), 10);
    }
  }

DecimalNumberSlashList "slash-separated decimal numbers"
  = head:DecimalNumber tail:('/' DecimalNumber)* { return util.pegSlashList(head, tail); }

IntegerSlashList "slash-separated integers"
  = head:Integer tail:('/' Integer)* { return util.pegSlashList(head, tail); }

SignedIntegerSlashList "slash-separated signed integers"
  = sign:[+-] _ values:IntegerSlashList {
    const applySign = (i) => sign === '-' ? -i : i;
    if (Array.isArray(values)) {
      return values.map(applySign);
    } else {
      return applySign(values);
    }
  }


IntegerAndList "integers separated with commas and 'and'"
  = head:Integer tail:((','? _ 'and' _ /',' _) Integer)* { return util.pegSlashList(head, tail); }


Occurrence
  = "once" { return 1; }
  / "twice" { return 2; }
  / count:NumberString _ "time" "s"? { return count; }


Fraction
  = numerator:Integer "/" denominator:Integer { return { numerator, denominator }; }


UppercaseWord
  = [A-Z] [A-Za-z]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
