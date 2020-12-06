{
  let parsedNumberResult = null;
  let statusLevelMatch = null;
  let wantInfinitive = false;

  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;
}

StatusEffect
  = head:EffectClause tail:((',' / '.') _ EffectClause)* {
    const result = util.pegList(head, tail, 2).filter(i => i != null);
    util.separateStatusAndSb(result);
    util.checkSelfSkillTrigger(result);
    return result;
  }
  / "" { return []; }

LegendMateriaEffect
  = head:LmEffectClause tail:((',' / '.') _ LmEffectClause)* {
    const result = util.pegList(head, tail, 2).filter(i => i != null);
    util.separateStatusAndSb(result);
    util.checkSelfSkillTrigger(result);
    return result;
  }
  / "" { return []; }

// Note: We have to list "composite" statuses like SwitchDraw, then TriggeredEffect
// (to make sure that it can pick up effects like CritChance that may or may not be
// triggered - otherwise, the regular effect's rule will eagerly parse the text then
// prevent the trigger from being parsed), then regular effects.
EffectClause
  = SwitchDraw / SwitchDrawAlt / SwitchDrawStacking

  / TriggeredEffect

  / CommonEffectClause

  / TurnDuration / RemovedUnlessStatus / RemovedAfterTrigger
  / TrackStatusLevel / ChangeStatusLevel / SetStatusLevel / StatusLevelBooster
  / BurstToggle / TrackUses / SharedCount / ModifiesSkill / BurstOnly / BurstReset / StatusReset / ReplaceAttack / ReplaceAttackDefend / DisableAttacks / Ai / Paralyze / Stun
  / ResetTarget / NoEffect / Persists / GameOver / Unknown

LmEffectClause
  = TriggeredEffect
  / CommonEffectClause
  // Additional legend materia-specific variations and wording.  We keep these
  // separate to try and keep the status effects section of the database a bit
  // cleaner.
  / StatShareLm / MulticastLm / HealUpLm / DrainHpLm

// Effects common to statuses and legend materia.  Legend materia use very few
// of these, but to simplify maintenance and keep things flexible, we'll only
// omit status-only stuff if it obviously doesn't apply or otherwise causes
// problems.
CommonEffectClause
  = StatMod / CritChance / CritDamage / HitRate
  / Ko / LastStand / Raise / Reraise
  / StatusChance / StatusStacking / PreventStatus
  / Speed / Instacast / SchoolCastSpeed / CastSpeedBuildup / CastSpeed / InstantAtb / AtbSpeed
  / PhysicalBlink / MagicBlink / DualBlink / ElementBlink / Stoneskin / MagiciteStoneskin / FixedStoneskin / DamageBarrier
  / RadiantShield / Reflect
  / Awoken
  / ElementAttack / ElementResist / EnElement / EnElementStacking / EnElementWithStacking / LoseEnElement / LoseAnyEnElement
  / AbilityBuildup / RankBoost / DamageUp / AltDamageUp / RealmBoost / AbilityDouble / Multicast / MulticastAbility / NoAirTime
  / BreakDamageCapAll / BreakDamageCap / DamageCap
  / HpStock / Regen / FixedHpRegen / Poison / HealUp / Pain / DamageTaken / BarHeal / EmpowerHeal
  / Doom / DoomTimer / DrainHp
  / CounterWithImmune / Counter / RowCover
  / ConditionalStatus
  / GainSb / SbGainUp / GainLb
  / DirectGrantStatus
  / Runic / Taunt / ImmuneAttackSkills / ImmuneAttacks / ZeroDamage / EvadeAll / MultiplyDamage
  / Berserk / Rage / AbilityBerserk


// --------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatListOrPlaceholder _ value:(SignedIntegerOrX / [+-]? "?" { return NaN; }) "%" ignoreBuffCaps:(_ "(ignoring the buff stacking caps)")? {
    const result = { type: 'statMod', stats, value };
    if (ignoreBuffCaps) {
      result.ignoreBuffCaps = true;
    }
    return result;
  }

StatShareLm
  = "Increases base" _ dest:Stat _ "by" _ value:Integer "% base" _ src:Stat { return { type: 'statShare', src, dest, value }; }

CritChance
  = "Critical chance =" value:(PercentSlashList / PercentOrX) {
    const result = { type: 'critChance' };
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, value);
    } else {
      result.value = value;
    }
    return result;
  }

CritDamage
  = "Critical hits deal" _ value:IntegerOrX "% more damage (additive with the base critical coefficient)" { return Object.assign({ type: 'critDamage' }, value); }

HitRate
  = sign:IncreasesOrReduces _ "hit rate by" _ value:Integer "%" { return { type: 'hitRate', value: sign * value }; }


// --------------------------------------------------------------------------
// Status manipulation

StatusChance
  = "Increases the chance of inflicting Status by" _ value:IntegerOrX "%" { return { type: 'statusChance' , value }; }
  / "Increases the chance of being inflicted with" _ status:StatusName _ "by" _ value:Integer "%"? { return { type: 'statusChance', value, status }; }

StatusStacking
  = "Allows"i _ "to stack" _ status:StatusNameNoBrackets ", up to" _ statusWithLevel:StatusNameNoBrackets
  & { return statusWithLevel.startsWith(status) && statusWithLevel.substring(status.length).match(/^ \d+$/); }
    { return { type: 'statusStacking', status, level: +statusWithLevel.substring(status.length) }; }

PreventStatus
  = "Prevents" _ head:StatusNameNoBrackets _ tail:(AndList StatusNameNoBrackets)* _ "once" { return { type: 'preventStatus', status: util.pegList(head, tail, 1) }; }


// --------------------------------------------------------------------------
// Haste, cast speed

// Haste or slow
Speed
  = "Wait"i _ "speed x" value:DecimalNumber { return { type: 'speed', value }; }

Instacast
  = "Cast"i _ "speed x999" "9"* _ forAbilities:ForAbilities? { return Object.assign({ type: 'instacast' }, forAbilities); }

SchoolCastSpeed
  = "Cast speed x" value:IntegerOrX _ "for [School] attacks, or any attack if no [School] is specified" {
    return { type: 'castSpeed', school: util.placeholder, value };
  }

CastSpeed
  = "Cast"i _ "speed" _ value:MultiplierSlashList _ forAbilities:ForAbilities? { return Object.assign({ type: 'castSpeed', value }, forAbilities); }
  / what:ElementOrSchoolList _ "cast speed" _ value:MultiplierSlashList { return Object.assign({ type: 'castSpeed', value }, what); }

CastSpeedBuildup
  = "Cast"i _ "speed x" value:DecimalNumber _ "plus x" increment:DecimalNumber _ "for each" _ requiresAttack:AbilityOrAttack _ "used for the duration of the status, up to x" max:DecimalNumber {
    return { type: 'castSpeedBuildup', value, increment, max, requiresAttack };
  }

InstantAtb
  = "Increase"i _ "ATB charge speed by x999" "9"* { return { type: 'instantAtb' }; }

AtbSpeed
  = "Increase"i _ "ATB charge speed by x" _ value:DecimalNumber { return { type: 'atbSpeed', value }; }

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
  = "Evades"i _ "the next" _ level:Integer? _ "PHY" _ AttacksThatDeal _ "physical, missing HP or fixed damage or NAT" _ AttacksThatDeal _ "physical or fractional damage" { return { type: 'physicalBlink', level: level || 1 }; }

MagicBlink
  = "Evades"i _ "the next" _ level:Integer? _ "non-PHY, non-NIN" _ AttacksThatDeal _ "magical, fractional or missing HP damage" { return { type: 'magicBlink', level: level || 1 }; }

DualBlink
  = "Evades"i _ "the next" _ level:NumberString? _ "attack" "s"? _ "that could be evaded with Physical or Magical Blink, lower priority" { return { type: 'dualBlink', level: level || 1 }; }

ElementBlink
  = "Reduces"i _ "the damage of the next" _ AttacksThatDeal _ element:Element _ "damage to 0" { return { type: 'elementBlink', element, level: 1 }; }

AttacksThatDeal
  = "attack" "s"? _ "that deal" "s"?

Stoneskin
  = "Reduces" _ element:Element? _ "damage taken to 0, up to an amount" _ ("of damage")? _ "equal to" _ value:Integer "% of the character's maximum HP" {
    return { type: 'stoneskin', element, value };
  }

MagiciteStoneskin
  = "Reduces" _ element:Element _ "damage taken to 0, up to an amount" _ ("of damage")? _ "equal to" _ value:Integer "% of the Magicite's maximum HP" {
    return { type: 'magiciteStoneskin', element, value };
  }

FixedStoneskin
  = "Reduces damage taken from" _ skillType:SkillTypeAndList _ "attacks to 0, up to" _ damage:Integer _ "damage" {
    return { type: 'fixedStoneskin', skillType, damage };
  }

DamageBarrier
  = "Reduces damage taken by" _ value:Integer "% for the next" _
    attackCount:(
      count:(Integer / NumberString) _ "attack" "s"? { return count; }
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
  = awoken:AwokenType _ ("abilities" / "attacks") _ "don't consume uses" _ rankBoost:AwokenRankBoost? rankCast:AwokenRankCast? dualcast:AwokenDualcast? instacast:AwokenInstacast? castSpeed:AwokenCastSpeed?
  & { return !rankCast || util.isEqual(awoken, rankCast); }
  & { return !dualcast || util.isEqual(awoken, dualcast); }
  & { return !instacast || util.isEqual(awoken, instacast); }
  & { return !castSpeed || util.isEqual(awoken, castSpeed.type); }
  { return { type: 'awoken', awoken, rankBoost: !!rankBoost, rankCast: !!rankCast, dualcast: !!dualcast, instacast: !!instacast, castSpeed: castSpeed ? castSpeed.value : undefined }; }

AwokenType
  = school:SchoolAndOrList { return { school }; }
  / element:ElementAndOrList { return { element }; }

AwokenRankBoost
  = "and deal 5/10/15/20/30% more damage at ability rank 1/2/3/4/5"

AwokenRankCast
  = ", cast speed x2.00/2.25/2.50/2.75/3.00 for" _ type:AwokenType _ "abilities at ability rank 1/2/3/4/5" { return type; }

AwokenDualcast
  = ", dualcasts" _ type:AwokenType _ ("abilities" / "attacks") { return type; }

AwokenInstacast
  = ", cast speed x999" "9"* _ "for" _ type:AwokenType _ ("abilities" / "attacks") { return type; }

AwokenCastSpeed
  = ", cast speed x" value:DecimalNumber _ "for" _ type:AwokenType _ ("abilities" / "attacks") { return { type, value }; }


// --------------------------------------------------------------------------
// Switch draw - These are described as broken down within Enlir, but we treat
// them specially because of how common they are.

// Note that we could also include (and thus special-case) the 1-turn duration
// here as well by matching on ", lasts 1 turn"
SwitchDraw
  = head:SwitchDrawPart tail:("," _ SwitchDrawPart)+ { return { type: 'switchDraw', elements: util.pegList(head, tail, 2) }; }

SwitchDrawPart
  = "Grants"i _ "[Attach" _ element1:Element "] after using a" "n"? _ element2:Element _ "ability"
  & { return element1 === element2; } { return element1; }

SwitchDrawAlt
  = "Grants"i _ elements1:EnElementSlashList _ "after using a" "n"? _ elements2:ElementSlashList _ "ability"
  & { return elements1.length > 1 && util.isEqual(elements1, elements2); }
    { return { type: 'switchDraw', elements: elements1 }; }

SwitchDrawStacking
  = "Grants"i _ elements1:EnElementStackingSlashList _ "after using a"
    _ elements2:ElementSlashList _ "ability"
    & { return elements1.elements.length > 1 && util.isEqual(elements1.elements, elements2); }
    { return { type: 'switchDrawStacking', elements: elements1.elements, level: elements1.level }; }


// --------------------------------------------------------------------------
// Element buffs and debuffs

// "cumulable" indicates that this is for stackable levels of elemental damage.
// Contrast with DamageUp / AltDamageUp.
ElementAttack
  = sign:IncreasesOrReduces _ element:Element _ "damage dealt by" _ value:PercentSlashList _ ", cumulable" _ trigger:Trigger? {
    return { type: 'elementAttack', element, value: util.scalarify(util.arrayify(value).map(i => i * sign)), trigger };
  }

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
  = what:DamageUpType _ ("attacks" / "abilities") _ "deal" _ value:PercentSlashList _ "more damage" _ trigger:Trigger? _ condition:Condition? {
    return Object.assign({ type: 'damageUp', value, trigger, condition }, what);
  }

AltDamageUp
  = "Increases"i _ skillType:SkillType _ "damage dealt by" _ value:Integer "%" { return { type: 'damageUp', skillType, value }; }
  / "Increases"i _ element:ElementAndList _ "damage dealt by" _ value:PercentSlashList _ trigger:Trigger? _ condition:Condition?  { return { type: 'damageUp', element, value, trigger, condition }; }
  / "Increases"i _ "damage dealt by" _ value:Integer "% when exploiting elemental weaknesses" { return { type: 'damageUp', vsWeak: true, value }; }
  / "Increases"i _ "damage dealt by" _ value:PercentSlashList _ condition:Condition? { return { type: 'damageUp', value, condition }; }

RealmBoost
  = "Attacks dealt by" _ realm:Realm _ "realm members deal" _ value:Integer "% more damage" { return { type: 'realmBoost', realm, value }; }

AbilityDouble
  = "dualcasts"i _ what:ElementOrSchoolList _ ("abilities" / "attacks") _ "consuming an extra ability use" { return Object.assign({ type: 'abilityDouble' }, what); }

Multicast
  = count:MulticastVerb "s" _ what:ElementOrSchoolList _ ("abilities" / "attacks") { return Object.assign({ type: 'multicast', count, chance: 100 }, what); }
  / chance:Integer "% chance to" _ count:MulticastVerb _ what:ElementOrSchoolList _ ("abilities" / "attacks") { return Object.assign({ type: 'multicast', count, chance }, what); }

MulticastAbility
  = count:MulticastVerb "s" _ "the next" _ what:ElementOrSchoolList _ ("ability" / "abilities") {
    return Object.assign({ type: 'multicastAbility', count }, what);
  }

MulticastVerb
  = count:Tuple "cast" { return count; }

MulticastLm
  = chance:Integer "% chance to" _ count:MulticastVerb _ "abilities that deal" _ element:ElementList _ ("damage") { return { type: 'multicast', count, chance, element }; }

NoAirTime
  = "Changes"i _ "the air time of Jump attacks to 0.01 seconds" { return { type: 'noAirTime' }; }

DamageUpType
  = ElementSchoolOrSkillTypeList
  / "physical"i { return { skillType: 'PHY' }; }
  / "magical"i { return { magical: true }; }
  / "jump"i { return { jump: true }; }


// --------------------------------------------------------------------------
// Damage cap

BreakDamageCapAll
  = "Sets"i _ "damage cap to 99999 for all attacks" { return { type: 'breakDamageCap' }; }

BreakDamageCap
  = "Sets"i _ "the damage cap for" _ skillType:SkillTypeAndList? _ what:ElementOrSchoolList? _ "attacks to 99999" { return Object.assign({ type: 'breakDamageCap', skillType }, what); }

DamageCap
  = "Increases the damage" "/healing"? _ "cap by" _ value:Integer { return { type: 'damageCap', value }; }


// --------------------------------------------------------------------------
// Healing up and down; damage and healing over time

HpStock
  = "Automatically"i _ "restores HP, up to" _ value:IntegerOrX _ "HP" { return Object.assign({ type: 'hpStock' }, value); }

Regen
  = "Heals"i _ "for" _ percentHp:Integer "% max HP every" _ interval:SecondsInterval { return { type: 'regen', percentHp, interval }; }

FixedHpRegen
  = "Heals"i _ "for" _ value:Integer _ "HP every" _ interval:SecondsInterval { return { type: 'fixedHpRegen', value, interval }; }

// Also used for Sap, etc.
Poison
  = "Damages for" _ fractionHp:Fraction _ "max HP every" _ interval:SecondsInterval { return { type: 'poison', fractionHp, interval }; }

HealUp
  = "Abilities"i _ "restore" _ value:Integer "% more HP" { return { type: 'healUp', value }; }
  / "Increases"i _ "healing done by" _ school:(s:SchoolAndOrList _ "abilities by" { return s; })? _ value:Integer "%" { return { type: 'healUp', value, school }; }
  / "Increases"i _ "healing done by" _ skillType:SkillType _ "abilities and soulbreaks by" _ value:Integer "%" { return { type: 'healUp', value, skillType }; }

HealUpLm
  = skillType:SkillType _ "abilities restore" _ value:Integer "% more HP" { return { type: 'healUp', value, skillType }; }

Pain
  = "Take" _ value:Integer "% more damage" { return { type: 'pain', value }; }

DamageTaken
  = sign:IncreasesOrReduces _ "damage taken by" _ value:Integer "%" { return { type: 'damageTaken', value: sign * value }; }

BarHeal
  = "Healing restores" _ value:Integer "% less HP" { return { type: 'barHeal', value }; }

EmpowerHeal
  = "Increases"i _ "healing received by" _ value:Integer "%" { return { type: 'empowerHeal', value }; }

SecondsInterval
  = "second" { return 1; }
  / interval:DecimalNumber _ "seconds" { return interval; }


// --------------------------------------------------------------------------
// Inflict / resist KO

Ko
  = "HP = 0 when set" { return { type: 'ko' }; } // "Instant KO" status (ID 214)
  / "KO'd, can't act, persists after battle" { return { type: 'ko' }; } // "KO" (ID 999)

LastStand
  = "Prevents KO once, restoring HP for 1% maximum HP" { return { type: 'lastStand' }; }

Raise
  = "Removes KO (" value:Integer "% HP)" { return { type: 'raise', value }; }

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

DrainHpLm
  = chance:Integer "% chance of restoring HP to the user for" _ value:Integer _ "% of the damage dealt with" _ singleTarget:"single-target"? _ what:ElementOrSchoolList _ ("abilities" / "attacks") {
    return Object.assign({type: 'drainHp', value, chance, singleTarget: !!singleTarget }, what);
  }


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
  / skill:AnySkillName { return { type: 'skill', skill }; }
  / "an ability (single," _ attackMultiplier:DecimalNumber _ damageType:("physical" / "magical") _ ")" {
    const overrideSkillType = damageType === 'physical' ? 'PHY' : 'BLK';
    return { type: 'attack', numAttacks: 1, attackMultiplier, overrideSkillType };
  }

// Haurchefant Cover
RowCover
  = "While front row," _ chance:Integer "% chance to cover" _ skillType:SkillTypeAndList _ "attacks that target back row allies, reducing damage taken by" _ damageReduce:Integer "%" {
    return { type: 'rowCover', chance, skillType, damageReduce };
  }

CounterWithImmune
  = immune:ImmuneAttackSkills "," _ counter:Counter
  & { return util.isEqual(immune.skillType, counter.skillType) && !immune.ranged && !immune.nonRanged; }
    { return Object.assign(counter, { immune: true }); }


// --------------------------------------------------------------------------
// Abilities and status effects

// Note that we allow triggerable effects to appear after the trigger, to
// accommodate statuses like Cyan's AASB.
TriggeredEffect
  = chance:TriggerChance? head:TriggerableEffect _ tail:("and" _ TriggerableEffect)* _ trigger:Trigger _ triggerDetail:TriggerDetail? _ condition:Condition? tail2:("," _ BareTriggerableEffect)*
    onceOnly:("," _ o:OnceOnly { return o; })?
  & {
    wantInfinitive = false;

    // Validate that what we think is a "once only" effect actually is - if it refers to a
    // different skill, then it's not actually "once only."
    if (!onceOnly || !onceOnly.skill) {
      return true;
    }
    const castSkill = head.type === 'castSkill' ? head : tail.find(i => i.type === 'castSkill');
    return castSkill && castSkill.type === 'castSkill' && castSkill.skill === onceOnly.skill;
  }
  {
    return util.addCondition({ type: 'triggeredEffect', chance, effects: util.pegMultiList(head, [[tail, 2], [tail2, 2]], true), trigger, onceOnly: onceOnly == null ? undefined : onceOnly.onceOnly, triggerDetail }, condition);
  }
  // Alternate form for complex effects - used by, e.g., Orlandeau's SASB
  / trigger:Trigger "," _ head:TriggerableEffect _ tail:(("," / "and") _ TriggerableEffect)* _ triggerDetail:TriggerDetail? {
    return { type: 'triggeredEffect', trigger, effects: util.pegList(head, tail, 2), triggerDetail };
  }

TriggerChance
  = chance:Integer "% chance to" _ {
    wantInfinitive = true;
    return chance;
  }

TriggerableEffect
  = CastSkill / RandomCastSkill / CastSimpleSkill/ GainSb / SimpleRemoveStatus / GrantStatus / Heal / HealPercent / RecoilHp / SmartEtherStatus / DispelOrEsuna
  // Normal status effects that may also be triggered
  / CritChance / CastSpeed

BareTriggerableEffect
  = effect:TriggerableEffect ! (_ (Trigger / "and")) { return effect; }

CastSkill
  = "cast"i S _ skill:AnySkillOrOptions { return { type: 'castSkill', skill }; }

RandomCastSkill
  = "randomly"i _ "casts" _ skill:AnySkillOrOptions  { return { type: 'randomCastSkill', skill }; }

CastSimpleSkill
  = "cast"i S _ "an ability (" skill:SimpleSkill ")" { return { type: 'castSimpleSkill', skill }; }

SimpleRemoveStatus
  = "removes"i _ status:StatusNameNoBrackets _ "from the user"? {
    return { type: 'grantStatus', status: { status: { type: 'standardStatus', name: status } }, verb: 'removes' };
  }

GrantStatus
  = verb:StatusVerb _ statuses:StatusList statusClauses:StatusClause* {
    const result = { type: 'grantStatus', status: statuses, verb };
    for (const i of statusClauses) {
      Object.assign(result, i);
    }
    if (result.duration) {
      util.applyDuration(result.status, result.duration);
    }
    return result;
  }

// Some statuses are listed as directly granting other statuses.  To avoid parser
// ambiguities, this should go after TriggeredEffect and GainSb.
DirectGrantStatus
  = "Grants"i _ statuses:StatusList _ duration:Duration? {
    const result = { type: 'directGrantStatus', status: statuses };
    if (duration) {
      util.applyDuration(result.status, duration);
    }
    return result;
  }

Heal
  = "restore"i S _ fixedHp:Integer _ "HP" _ who:Who? { return { type: 'heal', fixedHp, who }; }

HealPercent
  = "restore"i S _ "HP" _ who:Who? _ "for" _ healPercent:Integer "% of" _ ("the user's" / "the target's" / "their") _ Maximum _ "HP" {
    return {
      type: 'healPercent',
      healPercent,
      who,
    }
  }

RecoilHp
  = "damages" _ "the" _ "user" _ "for" _ damagePercent:DecimalNumberSlashList "%"
  _ maxOrCurrent:((Maximum / "current") { return text().startsWith('max') ? 'max' : 'curr'; })
  _ "HP" {
    return {
      type: 'recoilHp',
      damagePercent,
      maxOrCurrent,
    };
  }

DispelOrEsuna
  = 'remove'i S _ dispelOrEsuna:('negative' / 'positive') _ 'status'? _ 'effects' _ who:Who? _ perUses:PerUses? {
    return { type: 'dispelOrEsuna', dispelOrEsuna, who, perUses };
  }


// --------------------------------------------------------------------------
// Conditional status - like Conditional Attach Element.  These aren't "real"
// effects.

ConditionalStatus
  = status:GrantStatus
  & { return status.condition != null }
    { return Object.assign(status, { type: 'conditionalStatus' } ); }


// --------------------------------------------------------------------------
// Soul Break and Limit Break points

GainSb
  = "Grants"i _ value:Integer _ "SB points" _ "when set"? { return { type: 'gainSb', value }; }
  / "Removes"i _ value:Integer _ "SB points" _ "when set"? { return { type: 'gainSb', value: -value }; }

SbGainUp
  = what:ElementOrSchoolList _ ("abilities" / "attacks") _ "grant" _ value:Integer _ "% more SB points" { return Object.assign({ type: 'sbGainUp', value }, what); }
  / "Attacks"i _ "that exploit an elemental weakness grant" _ value:Integer _ "% more SB points" { return { type: 'sbGainUp', value, vsWeak: true }; }
  / "Abilities"i _ "grant" _ value:Integer _ "% more SB points" { return { type: 'sbGainUp', value }; }

GainLb
  = "Grants"i _ value:Integer _ "LB points" _ "when set"? { return { type: 'gainLb', value }; }
  / "Removes"i _ value:Integer _ "LB points" _ "when set"? { return { type: 'gainLb', value: -value }; }


// --------------------------------------------------------------------------
// Taunt, runic, immunities

Taunt
  = "Taunts"i _ "single-target" _ skillType:SkillTypeAndList _ "attacks" { return { type: 'taunt', skillType }; }

// A special case of taunt
Runic
  = taunt:Taunt ", absorbs"i _ skillType:SkillTypeAndList _ "attacks to restore 1 consumed ability use"
  & { return util.isEqual(taunt.skillType, skillType); }
    { return { type: 'runic', skillType }; }

ImmuneAttackSkills
  = "Can't"i _ "be hit by" _ ranged:("ranged")? _ nonRanged:("non-ranged")? _ skillType:SkillTypeList _ "attacks" {
    return {
      type: 'immuneAttacks',
      skillType,
      ranged: !!ranged,
      nonRanged: !!nonRanged,
    }
  }

ImmuneAttacks
  = "Can't be hit by any attack" {
    return {
      type: 'immuneAttacks',
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
  = "Multiplies all damage received by" _ value:IntegerOrX { return Object.assign({ type: 'multiplyDamage' }, value); }


// --------------------------------------------------------------------------
// Berserk and related statuses.  These are unique enough that we'll fully
// special case them.

// This effect is also used for Confuse.
Berserk
  = "Forces"i _ "default action, affects targeting" ", resets ATB when set or removed"? { return { type: 'berserk' }; }

AbilityBerserk
  = "Forces a random available action, excluding Defend, affects targeting, Berserk, Confuse, Paralyze, Stop are prioritized" { return { type: 'abilityBerserk' }; }

Rage  // aka "auto" elsewhere in our code
  = "Forces"i _ "a specified action, affects targeting, resets ATB when removed" { return { type: 'rage' }; }


// --------------------------------------------------------------------------
// Special durations

TurnDuration
  = "lasts" _ "for"? _ value:Integer _ "turn" "s"? { return { type: 'turnDuration', duration: { value, units: 'turns' } }; }

RemovedUnlessStatus
  = "Removed"i _ ("if" / "when") _ "the"? _ "user" _ ("hasn't" / "doesn't have") _ any:"any"? _ status:StatusNameNoBrackets { return { type: 'removedUnlessStatus', any: !!any, status }; }

// This is only processed as part of a TriggeredEffect, since it arguably
// applies to the trigger itself.  As such, it does not get its own type.
// Hack: "or if the user hasn't Synchro Mode" is omitted from our higher-level
// code, so we'll drop it here rather than further complicating the parser.
OnceOnly
  = "Removed"i _ "after triggering" _ count:Occurrence? _ "or if user hasn't Synchro Mode"? { return { onceOnly: count || true }; }
  / "Removed"i _ ("after" / "when") _ skill:AnySkillName _ "is cast" _ count:Occurrence? _ "or if user hasn't Synchro Mode"? { return { onceOnly: count || true, skill }; }
  / "Removed"i _ "after casting" _ skill:AnySkillName _ count:Occurrence? _ "or if user hasn't Synchro Mode"? { return { onceOnly: count || true, skill }; }
  / "Removed"i _ "when effect is triggered" _ count:Occurrence? _ "or if user hasn't Synchro Mode"? { return { onceOnly: count || true }; }

RemovedAfterTrigger
  = "Removed"i _ trigger:Trigger { return { type: 'removedAfterTrigger', trigger }; }


// --------------------------------------------------------------------------
// Status levels

TrackStatusLevel
  = "Keeps"i _ "track of the" _ status:StatusNameNoBrackets _ "level, up to level" _ max:Integer { return { type: 'trackStatusLevel', status, max, current: util.placeholder }; }
  / "Used"i _ "for tracking" _ status:StatusNameNoBrackets _ "level" { return { type: 'trackStatusLevel', status }; }
  // The first variation is used for Heavy Charge and is used to set a level.
  // The second is used for tracking stacking effects of 6* healer HAs and is
  // mostly internal.  It may be better to treat these as distinct types.
  //
  // TASB variant:
  / "Keeps"i _ "track of" _ status:StatusNameNoBrackets _ "level, initially set at level" _ current:Integer _ "with a maximum level of" _ max:Integer { return { type: 'trackStatusLevel', status, max, current }; }

ChangeStatusLevel
  = sign:IncreasesOrReduces _ "the"? _ status:StatusNameNoBrackets _ "level by" _ value:Integer _ trigger:TriggerOrWhenSet {
    return { type: 'changeStatusLevel', status, value: value * sign, trigger };
  }

SetStatusLevel
  = "Sets"i _ "the"? _ status:StatusNameNoBrackets _ "level to" _ value:Integer _ trigger:TriggerOrWhenSet {
    return { type: 'setStatusLevel', status, value, trigger };
  }

StatusLevelBooster
  = "Increases"i _ "the" _ status:StatusNameNoBrackets _ "level by" _ value:Integer _ "when the" _ status2:StatusNameNoBrackets _ "level is increased"
  & { return status === status2; }
    { return { type: 'statusLevelBooster', status, value }; }


// --------------------------------------------------------------------------
// Other

BurstToggle
  = "Affects"i _ "certain Burst Commands" { return { type: 'burstToggle' }; }

TrackUses
  = "Keeps"i _ "track of the" _ ("number of")? _ ("uses of" / "casts of") _ skill:AnySkillName { return { type: 'trackUses', skill }; }
  / "Used to determine the effect of" _ skill:AnySkillName { return { type: 'trackUses', skill }; }
  / "Used"i _ "for tracking" _ skill:AnySkillName _ "usage" { return { type: 'trackUses', skill }; }
  / "Tracks"i _ skill:AnySkillName _ "casts" { return { type: 'trackUses', skill }; }
  / "Keeps"i _ "track of the number of" _ element:ElementAndList _ AbilityOrAttack _ "used" { return { type: 'trackUses', element }; }
  // TASB variant.  `skill` gives the TASB name.
  / "Keeps"i _ "track of" _ skill:AnySkillName _ "uses" { return { type: 'trackUses', skill }; }

SharedCount
  = "count is shared between" _ elements:ElementAndList _ "elements" { return null; }

ModifiesSkill
  = "Modifies"i _ "behavior of" _ skill:AnySkillName { return { type: 'modifiesSkill', skill }; }

BurstOnly
  = "removed if the user hasn't Burst Mode" { return { type: 'burstOnly' }; }

BurstReset
  = "reset upon refreshing Burst Mode" { return { type: 'burstReset' }; }

StatusReset
  = "reset upon refreshing" _ status:StatusNameNoBrackets { return { type: 'statusReset', status }; }

ReplaceAttack
  = "Replaces"i _ "the Attack command" { return null; }

ReplaceAttackDefend
  = "Replaces"i _ "the Attack and Defend commands" { return null; }

DisableAttacks
  = "Disables"i _ skillType:SkillTypeAndList? _ jump:"jump"i? _ "attacks" { return { type: 'disableAttacks', skillType, jump: !!jump }; }

Ai
  = "Affects"i _ GenericName _ "behaviour" { return null; }

Paralyze
  = "Arrests"i _ "ATB charge rate, can't act" ", resets ATB when set"? { return { type: 'paralyze' }; }
  / "Can't"i _ "act" ", resets ATB when set or removed"? { return { type: 'paralyze' }; }

Stun
  = "Resets"i _ "ATB when set"? { return { type: 'stun' }; }

ResetTarget
  = "Will"i _ "remove any" _ "Active Targeting"i _ "upon selecting the random action" { return null; }

NoEffect
  = "No gameplay effects" { return null; }

Persists
  = "Persists"i _ "after battle" { return null; }

GameOver
  = "Counts"i _ "towards Game Over" { return null; }

Unknown
  = "?" { return null; }


// --------------------------------------------------------------------------
// Triggers

Trigger
  = "after"i _ requiresDamage1:("using" / "casting" / "dealing damage with" / "the user uses") _ count:TriggerCount _ requiresDamage2:"damaging"?
    _ element:ElementListOrOptions? _ school:SchoolAndOrList? _ jump:"jump"? _ requiresAttack:AbilityOrAttack _ "on an enemy"? {
      // "on an enemy" has only been observed in legend materia.
      return { type: 'ability', element, school, count, jump: !!jump, requiresDamage: requiresDamage1 === 'dealing damage with' || !!requiresDamage2, requiresAttack };
    }
  / "if"i _ "the granting user has used" _ count:TriggerCount _ requiresDamage2:"damaging"?
    _ element:ElementListOrOptions? _ school:SchoolAndOrList? _ jump:"jump"? _ requiresAttack:AbilityOrAttack {
      // Tyro AASB variant
      return { type: 'ability', element, school, count, jump: !!jump, requiresDamage: !!requiresDamage2, requiresAttack };
    }
  / "when"i _ "user triggers" _ count:TriggerCount _ element:ElementListOrOptions? _ school:SchoolAndOrList? _ jump:"jump"? _ requiresAttack:AbilityOrAttack _ "during the status" {
      // TASB variant
      return { type: 'ability', element, school, count, jump: !!jump, requiresAttack };
    }
  / "every"i _ count:Ordinal _ element:ElementListOrOptions? _ school:SchoolAndOrList? _ jump:"jump"? _ requiresAttack:AbilityOrAttack {
      return { type: 'ability', element, school, count: { values: count }, jump: !!jump, requiresAttack };
    }
  / "after"i _ "dealing a critical hit" { return { type: 'crit' }; }
  / "after"i _ "exploiting elemental weakness" { return { type: 'vsWeak' }; }
  / "when"i _ "removed" { return { type: 'whenRemoved' }; }
  / "every"i _ interval:DecimalNumber _ "seconds" { return { type: 'auto', interval }; }
  / "upon"i _ "taking damage" skillType:(_ "by" _ s:SkillType _ "attack" { return s; })? { return { type: 'damaged', skillType }; }
  / "by"i _ skillType:SkillType _ "attacks" { return { type: 'damaged', skillType }; }
  / "upon"i _ "dealing damage" { return { type: 'dealDamage' }; }
  / "when"i _ "any"? _ status:StatusName _ "is removed" { return { type: 'loseStatus', status }; }
  / ("when"i / "after"i) _ "any"? _ status:StatusNameNoBrackets _ "is removed" { return { type: 'loseStatus', status }; }

  / "after" _ ("using" / "casting") _ skill:AnySkillName _ "times"
  & {
    // Hack: Generic skill names have to include number slash lists, so manually extract the number
    // slash list.
    parsedNumberResult = util.removeTrailingNumberSlashList(skill);
    return parsedNumberResult != null;
  }
  {
    // Hack: "or" is a valid skill name, but in this context, assume it's separating synchro commands.
    skill = parsedNumberResult.skill;
    if (skill.match(/ or /)) {
      skill = skill.split(/ or /);
    }
    return { type: 'skill', skill, count: parsedNumberResult.count, plus: parsedNumberResult.plus };
  }

  / ("when"i / "after"i) _ ("using" / "casting") _ skill:AnySkillName _ count:Occurrence? {
    // Hack: "or" is a valid skill name, but in this context, assume it's separating synchro commands.
    if (skill.match(/ or /)) {
      skill = skill.split(/ or /);
    }
    return { type: 'skill', skill, count };
  }

  / "when" _ skill:AnySkillName _ "is triggered" _ count:Integer _ "times" { return { type: 'skillTriggered', skill, count }; }
  / "if user has triggered" _ skill:AnySkillName _ count:NumberString _ "times" { return { type: 'skillTriggered', skill, count }; } // TASB variant
  / "after"i _ ("using" / "casting") _ count:NumberString _ "of" _ "either"? _ skill:Skill1Or2 { return { type: 'skill', skill, count }; }
  / "after casting" _ skill:Skill1Or2 _ count:NumberString _ "times" { return { type: 'skill', skill, count }; }
  / "after"i _ "taking" _ element:ElementListOrOptions _ "damage from a" _ skillType:SkillTypeList _ "attack used by another ally" { return { type: 'damagedByAlly', skillType, element }; }
  / "after"i _ "using a single-target heal" { return { type: 'singleHeal' }; }
  / "when"i _ "the user's"? _ "HP fall" "s"? _ "below" _ value:Integer "%" { return { type: 'lowHp', value }; }
  / "when"i _ "user crosses" _ value1:Integer _ "and" _ value2:Integer _ "damage dealt during the status" {
      // For TASBs
      return { type: 'damageDuringStatus', value: [value1, value2] };
    }
  / "after"i _ "an ally uses" _ count:TriggerCount _ requiresDamage:"damaging"?
    _ element:ElementListOrOptions? _ school:SchoolAndOrList? _ jump:"jump"? _ requiresAttack:AbilityOrAttack {
      return { type: 'allyAbility', element, school, count, jump: !!jump, requiresDamage, requiresAttack };
    }
  // For legend materia
  / "after using a single-target" _ school:School _ "ability that restores HP on an ally" { return { type: 'singleHeal', school }; }
  // These should go last to avoid parse conflicts.
  / "after casting" _ skill:(Skill1Or2 / AnySkillName) { return { type: 'skill', skill }; }

AbilityOrAttack
  = ("ability" / "abilities") { return false; }
  / "attack" "s"? { return true; }

TriggerCount
  = useCount:UseCount { return useCount; }
  / value1:Integer _ "or" _ value2:Integer { return { values: [value1, value2] }; }  // TASB variant. We may someday generalize.
  / values:(ArticleOrNumberString / Integer) ! "/" { return { values }; }
  / values:IntegerSlashList plus:"+"? { return { values, plus: !!plus }; }
  / "" { return { values: 1 }; }

TriggerOrWhenSet
  = Trigger
  / "when set" { return undefined; }

// Trigger details.  These seem redundant, so they're only added to rules where
// we know they're needed, and most are not included in the final result.
TriggerDetail
  = "while under" _ status:StatusNameNoBrackets { return null; }
  / "if the triggering ability is" _ element:ElementSlashList { return { element }; }
  / "if the triggering ability is" _ skill1or2:Skill1Or2 { return null; } // Squall SASB.  Adequately covered by trigger and slash cast handling.
  / ("that deals" / "if the triggering ability deals") _ element:ElementSlashList _ "damage" { return { element }; }

Skill1Or2
  = skill1:AnySkillName _ "and/or" _ skill2:AnySkillName { return [skill1, skill2]; }
  / skill1or2:AnySkillName
    & {
        // Variation for "or" instead of "and/or" - these may be part of a skill name themselves.
        return (skill1or2.match(/ or |\//g) || []).length === 1;
      }
      { return skill1or2.split(/ or |\//); }


// --------------------------------------------------------------------------
// "Simple skills" - inline effects used by legend materia

SimpleSkill
  = skillType:SkillType ": single," _ attackMultiplier:DecimalNumber _ "physical" _ element:Element {
    return { type: 'attack', numAttacks: 1, attackMultiplier, overrideSkillType: skillType, overrideElement: element }
  }
  / skillType:SkillType ": group, restores HP (" _ value:Integer _ ")" {
    return { type: 'heal', amount: { healFactor: value }, who: 'party', overrideSkillType: skillType };
  }


// --------------------------------------------------------------------------
// Common status logic (shared between skillParser and statusParser)

StatusClause
  = _ clause:(
    duration:Duration { return { duration }; }
    / who:Who ("," _ / _ "and") _ toCharacter:CharacterNameAndList ", if in the party," ? { return { who, toCharacter }; } // See, e.g., Ward SASB
    / who:Who { return { who }; }
    / "to" _ toCharacter:CharacterNameAndList { return { toCharacter }; }
    // / perUses:PerUses { return { perUses }; } // Unimplemented for statusParser
    // / "if successful" { return { ifSuccessful: true }; } // Does not apply for statusParser
    / "to undeads" { return { ifUndead: true }; }
    / condition:Condition { return { condition }; }
    / ConditionDetail { return {}; }
  ) {
    return clause;
  }

StatusList
  = head:StatusWithPercent tail:(conj:StatusListConjunction status:StatusWithPercent { return { ...status, conj }; })* {
    return [head, ...tail];
  }

StatusWithPercent
  = status:StatusItem _ chance:("(" n:Integer "%)" { return n; })? _ duration:Duration? {
    const result = {
      status
    };
    if (chance) {
      result.chance = chance;
    }
    if (duration) {
      result.duration = duration;
    }
    return result;
  }
  // Note: This alternative is pulled out by separateStatusAndSb, so
  // higher-level code can ignore it.
  / value:Integer _ "SB points" { return { type: 'gainSb', value }; }

StatusLevel "status with level"
  = name:StatusNameNoBrackets _ "level" _ value:Integer {
    return { type:'statusLevel', name, value, set: true };
  }
  / name:StatusNameNoBrackets _ "level" _ value:SignedInteger _ max:StatusLevelMax? {
    return { type:'statusLevel', name, value, max };
  }
  / value:SignedInteger _ name:StatusNameNoBrackets _ max:StatusLevelMax?
      { return { type:'statusLevel', name, value, max }; }
  / name:StatusNameNoBrackets
    & {
        statusLevelMatch = name.match(/(.*) ((?:[+-]?\d+)(?:\/[+-]?\d+)*)$/);
        return statusLevelMatch;
      }
      _ max:StatusLevelMax?
      { return { type:'statusLevel', name: statusLevelMatch[1], value: util.scalarify(statusLevelMatch[2].split('/').map(i => +i)), max }; }
  / name:StatusNameNoBrackets
      { return { type:'statusLevel', name, value: 1, set: true }; }

StatusLevelMax
  = "(max" _ value:Integer _ ")" { return value; }

StandardStatus
  = name:StatusName { return { type: 'standardStatus', name }; }

StatusItem
  = SmartEtherStatus / StatusLevel / StandardStatus


// --------------------------------------------------------------------------
// Conditions

Condition
  = "when" _ "equipping" _ article:("a" "n"? { return text(); }) _ equipped:[a-z- ]+ { return { type: 'equipped', article, equipped: equipped.join('') }; }

  // "Level-like" or "counter-like" statuses, as seen on newer moves like
  // Thief (I)'s glint or some SASBs.  These are more specialized, so they need
  // to go before general statuses.
  / "scaling with" _ status:StatusNameNoBrackets _ "level" { return { type: 'scaleWithStatusLevel', status }; }
  // TODO: These two should be standardized
  / "at" _ status:StatusNameNoBrackets _ "levels" _ value:IntegerAndList { return { type: 'statusLevel', status, value }; }
  / "at" _ status:StatusNameNoBrackets _ "level" _ value:IntegerSlashList { return { type: 'statusLevel', status, value }; }
  / "if" _ "the"? _ "user" _ "has" _ status:StatusNameNoBrackets _ "level" _ value:IntegerSlashList plus:"+"? { return { type: 'statusLevel', status, value, plus: !!plus }; }
  / "if" _ "the"? _ "user" _ "has" _ status:StatusNameNoBrackets _ "level"? _ ">" _ value:Integer { return { type: 'statusLevel', status, value: value + 1, plus: true }; }
  / "if" _ "the"? _ "user" _ "has" _ "at" _ "least" _ value:Integer _ status:StatusNameNoBrackets { return { type: 'statusLevel', status, value }; }

  // If Doomed - overlaps with the general status support below
  / ("if" _ "the" _ "user" _ "has" _ "any" _ ("[Doom]" / "Doom") / "with" _ "any" _ ("[Doom]" / "Doom")) { return { type: 'ifDoomed' }; }

  // Specific processing for slash-separated named statuses
  / "if" _ "the"? _ who:("user" / "target") _ "has" _ status:(head:StandardStatus tail:('/' StandardStatus)+ { return util.pegList(head, tail, 1); }) {
    return {
      type: 'statusList',
      status: status.map(i => ({ status: i })), // Convert to StatusWithPercent[]
      who: who === 'user' ? 'self' : 'target',
    };
  }

  // General status.
  // TODO: I think the database is trying to standardize on brackets?
  / "if" _ "the"? _ who:("user" / "target") _ withoutWith:WithoutWith _ any:"any"? _ status:(head:StatusNameNoBrackets tail:(OrList StatusNameNoBrackets)* { return util.pegList(head, tail, 1, true); }) {
    return {
      type: 'status',
      status,  // In string form - callers must separate by comma, "or", etc.
      who: who === 'user' ? 'self' : 'target',
      any: !!any,
      withoutWith,
    };
  }
  / "if" _ "the"? _ who:("user" / "target") _ withoutWith:WithoutWith _ any:"any"? _ status:(head:StatusName tail:(OrList StatusName)* { return util.pegList(head, tail, 1, true); }) {
    return {
      type: 'status',
      status,  // In string form - callers must separate by comma, "or", etc.
      who: who === 'user' ? 'self' : 'target',
      any: !!any,
      withoutWith,
    };
  }

  / "if current number of combined Attach Element statuses on party members are a majority Attach" _ element:ElementSlashList _ (
    ", in the case of ties the prior listed order is used to determine status granted"
    / ". Considers number of stacks on a character as well (Attach Fire at level 2 counts as 2). In the case of ties the prior listed order is used to determine status granted"
  ) {
    return { type: 'conditionalEnElement', element };
  }

  // Beginning of attacks and skills (like Passionate Salsa)

  // Scaling with uses - both specific counts and generically
  / ("at" / "scaling with" / "after") _ useCount:IntegerSlashList "+"? _ ("uses" / "casts") { return { type: 'scaleUseCount', useCount }; }
  / "scaling" _ "with" _ "uses" { return { type: 'scaleWithUses' }; }
  / ("scaling" / "scal.") _ "with" _ skill:AnySkillName _ "uses" { return { type: 'scaleWithSkillUses', skill }; }

  / ("after" / "every") _ useCount:UseCount _ skill:AnySkillName? _ ("uses" / "activations") { return { type: 'afterUseCount', skill, useCount }; }
  / "after" _ count:NumberString _ "uses" { return { type: 'afterUseCount', useCount: { from: count, to: count } }; }
  / "on" _ "first" _ "use" { return { type: 'afterUseCount', useCount: { from: 1, to: 1 } }; }
  / "on" _ first:Integer "+" _ "use" "s"? { return { type: 'afterUseCount', useCount: { from: first } }; }

  // Beginning of attack-specific conditions
  / "if" _ "all" _ "allies" _ "are" _ "alive" { return { type: 'alliesAlive' }; }
  / "if" _ character:CharacterNameListOrPronoun _ ("is" / "are") _ "alive" { return { type: 'characterAlive', character }; }
  / "if" _ character:CharacterNameAndList _ ("is" / "are") _ "alive" { return { type: 'characterAlive', character, all: true }; }
  / "if" _ character:CharacterNameListOrPronoun _ ("is" / "are") _ "not alive/alive" { return { type: 'characterAlive', character, withoutWith: 'withoutWith' }; }
  / "if" _ count:IntegerSlashList "+"? _ "of" _ character:CharacterNameList _ "are" _ "alive" { return { type: 'characterAlive', character, count }; }
  / "if" _ count:IntegerSlashList? _ character:CharacterNameList _ ("is" / "are") _ "in" _ "the" _ "party" { return { type: 'characterInParty', character, count }; }
  / "if" _ count:IntegerSlashList? _ character:CharacterNameAndList _ ("is" / "are") _ "in" _ "the" _ "party" { return { type: 'characterInParty', character, count, all: true }; }
  / "if" _ count:IntegerSlashList _ "females are in the party" { return { type: 'femalesInParty', count }; }
  / "if" _ count:IntegerSlashList "+"? _ "females are alive" { return { type: 'femalesAlive', count }; }
  / "if" _ "there" _ "are" _ count:IntegerSlashList "+"? _ realm:Realm _ "characters" _ "in" _ "the" _ "party" { return { type: 'realmCharactersInParty', realm, count }; }
  / "if" _ count:IntegerRangeSlashList plus:"+"? _ realm:Realm _ ("characters are alive" / "character is alive" / "allies are alive" / "members are alive") { return { type: 'realmCharactersAlive', realm, count, plus: !!plus }; }
  / "if" _ count:Integer _ "or more females are in the party" { return { type: 'femalesInParty', count }; }
  / "if" _ count:IntegerSlashList "+"? _ "party" _ "members" _ "are" _ "alive" { return { type: 'charactersAlive', count }; }

  / "if" _ count:IntegerSlashList _ "allies" _ "in" _ "air" { return { type: 'alliesJump', count }; }

  / "if" _ "the" _ "user's" _ ("[Doom]" / "Doom") _ "timer" _ "is" _ "below" _ value:IntegerSlashList { return { type: 'doomTimer', value }; }
  / "if" _ "the" _ "user's" _ "HP" _ ("is" / "are") _ "below" _ value:IntegerSlashList "%" { return { type: 'hpBelowPercent', value }; }
  / "if" _ "the" _ "user's" _ "HP" _ ("is" / "are") _ "at" _ "least" _ value:IntegerSlashList "%" { return { type: 'hpAtLeastPercent', value }; }
  / "if" _ "the"? _ "user" _ "has" _ value:IntegerSlashList plus:"+"? _ SB _ "points" { return { type: 'soulBreakPoints', value, plus: !!plus }; }

  / "if" _ count:IntegerSlashList _ "of the target's stats are lowered" { return { type: 'targetStatBreaks', count }; }
  / "if target has" _ count:IntegerSlashList _ "of ATK, DEF, MAG, RES or MND reduced" { return { type: 'targetStatBreaks', count }; }
  / "if" _ "the" _ "target" _ "has" _ count:IntegerSlashList _ "ailments" { return { type: 'targetStatusAilments', count }; }

  / "if exploiting elemental weakness" { return { type: 'vsWeak' }; }
  / "if exploiting" _ element:ElementList _ "weakness" { return { type: 'vsWeak', element }; }
  / "if" _ "the"? _ "user" _ "is" _ "in" _ "the"? _ "front" _ "row" { return { type: 'inFrontRow' }; }

  / "if" _ "the" _ "user" _ ("took" / "has" _ "taken") _ count:IntegerSlashList _ skillType:SkillTypeList _ "hits" { return { type: 'hitsTaken', count, skillType }; }
  / "if" _ "the" _ "user" _ ("took" / "has" _ "taken") _ count:IntegerSlashList _ "attacks" { return { type: 'attacksTaken', count }; }

  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ "damaging" _ "actions" { return { type: 'damagingActions', count }; }
  / "with" _ count:IntegerSlashList _ "other" _ school:School _ "users" { return { type: 'otherAbilityUsers', count, school }; }
  / "at" _ count:IntegerSlashList _ "different" _ school:School _ "abilities" _ "used" { return { type: 'differentAbilityUses', count, school }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ school:SchoolList _ "abilities" _ "during" _ "the" _ "status" { return { type: 'abilitiesUsedDuringStatus', count, school }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ school:SchoolList _ "abilities" { return { type: 'abilitiesUsed', count, school }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ element:ElementList _ "attacks" _ "during" _ "the" _ "status" { return { type: 'attacksDuringStatus', count, element }; }
  / "if" _ value:IntegerSlashList _ "damage was dealt during the status" {
    lastDamageDuringStatus = util.lastValue(value);
    lastDamageDuringStatusElement = undefined;
    return { type: 'damageDuringStatus', value };
  }
  / "if" _ "the"? _ "user dealt" _ value:IntegerSlashList _ "damage during the status" {
    lastDamageDuringStatus = util.lastValue(value);
    lastDamageDuringStatusElement = undefined;
    return { type: 'damageDuringStatus', value };
  }
  / "if" _ "the"? _ "user dealt" _ value:IntegerSlashList _ "damage with" _ element:ElementList _ "attacks during the status" {
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
  / "at" _ status:StatusNameNoBrackets { return { type: 'status', status, who: 'self' }; }

  // Stat thresholds (e.g., Tiamat, Guardbringer)
  / "at" _ value:IntegerSlashList _ stat:Stat { return { type: 'statThreshold', stat, value }; }

  // Legend materia
  / "at the beginning of the battle" { return { type: 'battleStart' }; }

WithoutWith
  = "hasn't/has" { return 'withoutWith'; }
  / "hasn't" { return 'without'; }
  / "has" { return undefined; } // default

// Condition details.  These seem redundant, so they're only added to rules where
// we know they're needed, and most are not included in the final result.
ConditionDetail
  = "based on triggering ability's element"


// --------------------------------------------------------------------------
// Lower-level game rules

// Verbs should end in S under normal use and should not if we want an infinitive.
S = "s" & { return !wantInfinitive; }
  / "" & { return wantInfinitive; }

SmartEtherStatus
  = school:School? _ "smart"i _ "ether" _ amount:IntegerSlashList {
    const result = { type: 'smartEther', amount };
    if (school) {
      result.school = school;
    }
    return result;
  }

StatusVerb
  = ("grant"i S / "cause"i S / "remove"i S / "doesn't"i _ "remove") {
    let result = text().toLowerCase().replace(/\s+/g, ' ');
    if (result !== 'doesn\'t remove' && !result.endsWith('s')) {
      result += 's';
    }
    return result;
  }

StatusName "status effect"
  = "[" name:[^\]]+ "]" { return name.join(''); }
  / "?" { return text(); }

StatusNameNoBrackets = GenericName

StatModDuration
  = _ "(" Integer "s)"

// These probably don't cover all abilities and characters, but it works for now.
AbilityName
  = UppercaseWord (_ UppercaseWord)* { return text(); }
CharacterName
  = UppercaseWord (_ (UppercaseWord / "of"))* (_ "(" [A-Z] [A-Za-z0-9-]+ ")")? { return text(); }

// Character names, for "if X are in the party."
CharacterNameList
  = head:CharacterName tail:(("/" / "," _ / _ "or" _) CharacterName)* { return util.pegList(head, tail, 1, true); }
CharacterNameAndList
  = head:CharacterName tail:(("/" / "," _ / _ "and" _) CharacterName)* { return util.pegList(head, tail, 1, true); }
CharacterNameListOrPronoun
  = CharacterNameList
  / ("he" / "she" / "they") { return undefined; }

// Any skill - burst commands, etc. ??? is referenced in one particular status.
AnySkillName
  = GenericName / '???'

AnySkillOrOptions
  = head:AnySkillName tail:(_ ("/" / ",") _ AnySkillName)+ {
    // Hack: Allow both slash-separated lists and comma-separated lists.  Assume
    // that "or" is a separator, not part of the skill name.
    return { options: util.flatten(util.pegList(head, tail, 3).map(i => i.split(/ or /))) };
  }
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
      / "..." GenericNameWord // Rude AASB. Sigh.
    )
    (_
      (
        GenericNameWord

        // Articles, etc., are okay, but use &' ' to make sure they're at a
        // word bounary.
        / (('in' / 'or' / 'of' / 'the' / 'with' / '&' / 'a') & ' ')
        // "for" and "to" in particular needs extra logic to ensure that
        // they're part of status words instead of part of later clauses.
        / ("for" / "to" / "and" / "by") _ ("an" / "a")? _ GenericNameWord

        / [=*+-]? Integer ([%]? '/' [+-]? Integer)* [%+]?
        / '(' ("Black Magic" / "White Magic" / [A-Za-z-0-9/]+) _ "Only"? ')'
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
  = StatList / "[Stats]" { return util.placeholder; }

Who
  = ("to" / "from") _ who:WhoClause { return who; }

WhoClause
  = "the"? _ "user" { return 'self'; }
  / "the"? _ "user" { return 'self'; }
  / "the" _ "target" { return 'target'; }
  / "all" _ "enemies" { return 'enemies'; }
  / "a single ally" { return 'ally'; }
  / "all allies" row:(_ "in" _ "the" _ row:("front" / "back" / "character's") _ "row" { return row === "character's" ? 'sameRow' : row + 'Row'; })? {
    return row || 'party';
  }
  / "allies in the same row" { return 'sameRow'; }
  / "the" _ "lowest" _ "HP%" _ "ally" { return 'lowestHpAlly'; }
  / "a" _ "random" _ "ally" _ "without" _ "status" { return 'allyWithoutStatus'; }
  / "a" _ "random" _ "ally" _ "with" _ "negative" _ "status"? _ "effects" { return 'allyWithNegativeStatus'; }
  / "a" _ "random" _ "ally" _ "with" _ "KO" { return 'allyWithKO'; }

WhoList
  = ("to" / "from") _ head:WhoClause _ tail:("/" WhoClause)+ { return util.pegList(head, tail, 1); }

// Flexibility: Support both "two uses" and "second use"
PerUses
  = "on"? _ "every" _ perUses:NumberString _ ("uses" / "activations" / "cast") { return perUses; }
  / "on"? _ "every" _ perUses:Ordinal _ ("use" / "activation" / "cast") { return perUses; }

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
  / "[Element]" { return util.placeholder; }

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

EnElementSlashList
  = "[Attach" _ head:Element _ "]" tail:("/[Attach" _ Element _ "]")*
    { return util.pegList(head, tail, 2, true); }

EnElementStackingSlashList
  = "[Attach" _ head:Element _ level:Integer? _ "with Stacking]" tail:("/[Attach" _ Element _ Integer? _ "with Stacking]")*
    { return { elements: util.pegList(head, tail, 2, true), level }; }

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

// "x1+yn/x2+yn/x3+yn"
UseCount
  = head:UseCountTerm tail:('/' UseCountTerm)*
  & { for (const i of tail) { if (i[1].y !== head.y) { return false; } }; return true; }
  {
    const list = util.pegList(head, tail, 1, false);
    return { x: util.scalarify(list.map(i => i.x)), y: list[0].y };
  }
  / head:Integer tail:('/' Integer)* _? "+" _? y:Integer "n" {
    return { x: util.pegList(head, tail, 1, true), y };
  }

UseCountTerm
  = x:Integer "+" y:Integer "n" { return { x, y }; }

ElementOrSchoolList
  = school:SchoolAndOrList { return { school }; }
  / element:ElementAndOrList { return { element }; }

ElementSchoolOrSkillTypeList
  = school:SchoolAndOrList { return { school }; }
  / element:ElementAndOrList { return { element }; }
  / skillType:SkillTypeList { return { skillType }; }

Realm "realm"
  // Added pseudorealms.
  = "Core/Beyond"
  // Normal realms
  / "Beyond"
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
  // Newer Enlir data writes realms this way.  TODO: Standardize?
  / "FF10" { return 'X'; }
  / "FF11" { return 'XI'; }
  / "FF12" { return 'XII'; }
  / "FF13" { return 'XIII'; }
  / "FF14" { return 'XIV'; }
  / "FF15" { return 'XV'; }
  / "FF1" { return 'I'; }
  / "FF2" { return 'II'; }
  / "FF3" { return 'III'; }
  / "FF4" { return 'IV'; }
  / "FF5" { return 'V'; }
  / "FF6" { return 'VI'; }
  / "FF7" { return 'VII'; }
  / "FF8" { return 'VIII'; }
  / "FF9" { return 'IX'; }
  // Even newer data, seen in realmBoost.  TODO: Standardize!
  / "FF IX" { return "IX"; }
  / "FF IV" { return "IV"; }
  / "FF FFT" { return "FFT"; }
  / "FF III" { return "III"; }
  / "FF II" { return "II"; }
  / "FF I" { return "I"; }
  / "FF VIII" { return "VIII"; }
  / "FF VII" { return "VII"; }
  / "FF VI" { return "VI"; }
  / "FF V" { return "V"; }
  / "FF XV" { return "XV"; }
  / "FF XIV" { return "XIV"; }
  / "FF XIII" { return "XIII"; }
  / "FF XII" { return "XII"; }
  / "FF XI" { return "XI"; }
  / "FF X" { return "X"; }
  / "Tactics" { return "FFT"; }

DamageCapValue = ('9999' / [1-9] '9999') { return parseInt(text()); }


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

StatusListConjunction
  = ', and' _ { return 'and'; }
  / _ 'and' _ { return 'and'; }
  / _ 'or' _ { return 'or'; }
  / ',' _ { return ','; }
  / '/' { return '/'; }

NumberString "numeric text"
  = numberString:[a-zA-Z\-]+
  & { parsedNumberResult = util.parseNumberString(numberString.join('')); return parsedNumberResult != null; }
  { return parsedNumberResult; }

ArticleOrNumberString
  = NumberString
  / ("a" "n"?) { return 1; }


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

IntegerOrX "integer or X"
  = value:Integer { return { value }; }
  / "X" { return util.placeholder; }

PercentInteger "percentage"
  = ([0-9]+ '%' / '?') { return parseInt(text(), 10); }

PercentOrX "integer or X"
  = value:PercentInteger { return { value }; }
  / "X%" { return util.placeholder; }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }

SignedIntegerOrX "signed integer or X"
  = SignedInteger
  / "+"? "X" { return util.placeholder }
  / "-X" { return util.negativePlaceholder }

IntegerWithNegatives "integer (optionally negative)"
  = sign:'-'? value:[0-9]+ { return parseInt(text(), 10); }

DecimalNumberSlashList "slash-separated decimal numbers"
  = head:DecimalNumber tail:('/' DecimalNumber)* { return util.pegSlashList(head, tail); }

MultiplierSlashList "slash-separated list of multipliers"
  = 'x' head:DecimalNumber tail:(('/' 'x'?) DecimalNumber)* { return util.pegSlashList(head, tail); }

IntegerSlashList "slash-separated integers"
  = head:Integer tail:('/' Integer)* { return util.pegSlashList(head, tail); }

PercentSlashList "slash-separated percent integers"
  = head:PercentInteger tail:('/' PercentInteger)* { return util.pegSlashList(head, tail); }
  / list:IntegerSlashList "%" { return list; }

// An IntegerSlashList with support for ranges like 1/2-3/4
IntegerRangeSlashList "slash-separated integer ranges"
  = head:IntegerOrRange tail:('/' IntegerOrRange)* { return util.pegSlashList(head, tail); }

IntegerOrRange
  = from:Integer "-" to:Integer { return from; }
  / Integer

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
  / count:(NumberString / Integer) _ "time" "s"? { return count; }


Ordinal
  = "first" { return 1; }
  / "second" { return 2; }
  / "third" { return 3; }
  / "fourth" { return 4; }
  / "fifth" { return 5; }


Tuple
  = "dual"i { return 2; }
  / "triple"i { return 3; }
  / "quad"i { return 4; }
  / "quint"i { return 5; }
  / "sext"i { return 6; }


Fraction
  = numerator:Integer "/" denominator:Integer { return { numerator, denominator }; }


UppercaseWord
  = [A-Z] [A-Za-z]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
