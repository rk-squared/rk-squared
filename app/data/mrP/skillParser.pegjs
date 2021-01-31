{
  let parsedNumberResult = null;
  let lastDamageDuringStatus = NaN;
  let lastDamageDuringStatusElement = undefined;
  let statusLevelMatch = null;

  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;
}

SkillEffect
  = head:EffectClause tail:((',' / '.' _ ('Also' / 'Additional')) _ EffectClause)* {
    return util.mergeAttackExtras(util.pegList(head, tail, 2));
  }
  / "" { return []; }

EffectClause = FixedAttack / Attack / RandomFixedAttack
  / DrainHp / RecoilHp / RecoilSetHp / FixedRecoilHp / HpAttack / GravityAttack
  / Revive / Heal / HealPercent / DamagesUndead / DispelOrEsuna / RandomEther / SmartEther
  / RandomCastAbility / RandomCastOther / Chain / Mimic
  / StatusEffect / ImplicitStatusEffect / SetStatusLevel / RandomStatusEffect
  / Entrust / GainSBOnSuccess / GainSB / ResetIfKO / ResistViaKO / Reset
  / CastTime / CastTimePerUse / StandaloneAttackExtra
  / RandomSkillEffect

// --------------------------------------------------------------------------
// Attacks

Attack
  = attack:SimpleAttack
    extras:AttackExtras {
    return Object.assign({}, attack, extras);
  }

SimpleAttack
  = numAttacks:NumAttacks _ attackType:AttackType modifiers:AttackModifiers _ "attack" "s"?
    _ attackMultiplierGroup:("(" group:AttackMultiplierGroup ")" { return group; })?
    _ additionalCritDamage:('with additional' _ value:Integer '% critical damage' { return value; })?
    _ overstrike:(","? _ "capped at 99999")?
    _ scalingOverstrike:(","? _ value:ScalingOverstrike { return value })?
    _ isPiercingDef:(_ "that ignores DEF")?
    _ isPiercingRes:(_ "that ignores RES")? {
    const result = Object.assign({
      type: 'attack',
      numAttacks,
    }, attackMultiplierGroup || {}, scalingOverstrike || {});
    if (additionalCritDamage) {
      result.additionalCritDamage = additionalCritDamage;
    }
    if (overstrike) {
      result.isOverstrike = true;
    }

    // Alternate isPiercingDef / isPiercingRes format that's only used for
    // "followed by" attacks.  These are normally handled within AttackExtras.
    if (isPiercingDef) {
      result.isPiercingDef = true;
    }
    if (isPiercingRes) {
      result.isPiercingRes = true;
    }

    if (attackType === 'group') {
      result.isAoE = true;
    }
    if (modifiers.hybrid) {
      result.isHybrid = true;
    }
    if (modifiers.jump) {
      result.isJump = true;
    }
    if (modifiers.ranged) {
      result.isRanged = true;
    }
    return result;
  }

FixedAttack
  = numAttacks:NumAttacks _ attackType:AttackType? _ "attack" "s"?
    _ "that" _ "deal" "s"? _ fixedDamage:Integer _ "damage" _ "each"? {
    const result = {
      type: 'fixedAttack',
      fixedDamage,
      numAttacks,
    };
    if (attackType === 'group') {
      result.isAoE = true;
    }
    return result;
  }

RandomFixedAttack
  = "Randomly"i _ "deals" _ head:Integer tail:(OrList Integer)* _ "damage" {
    return {
      type: 'randomFixedAttack',
      fixedDamage: util.pegList(head, tail, 1),
    };
  }

NumAttacks
  = NumberString / IntegerSlashList
  / value:RandomNumAttacks { return { type: 'randomNumAttacks', value }; }

RandomNumAttacks
  = "Randomly"i _ "deals" _ head:RandomOneAttack tail:(OrList RandomOneAttack)* {
    // Returns Array<number | [number, number]>, giving either numbers of attacks
    // with identical chances, or tuples of number of attacks with percent chance.
    return util.pegList(head, tail, 1);
  }
  / "Randomly"i _ "deals" _ value:IntegerSlashList _ "(" chance:PercentSlashList ")"
  & { return value.length === chance.length; }
    { return value.map((v, i) => [v, chance[i]]); }

RandomOneAttack
  = value:NumberString _ chance:("(" c:Integer "%)" { return c; }) { return [value, chance]; }
  / NumberString

AttackMultiplierGroup
  = randomAttackMultiplier:("randomly" _)?
    attackMultiplier:DecimalNumberSlashList
    hybridMultiplier:(_ "or" _ n:DecimalNumberSlashList { return n; })?
    scaleToMultiplier:('~' n:DecimalNumber { return n; })?
    _ "each"?
    _ multiplierScaleType:MultiplierScaleType?
    _ damageType:("physical" / "magical")? {
    const result = {
      attackMultiplier,
    };
    if (randomAttackMultiplier) {
      result.isRandomAttackMultiplier = true;
    }
    if (hybridMultiplier != null) {
      result.hybridMultiplier = hybridMultiplier;
    }
    if (scaleToMultiplier != null) {
      result.scaleToMultiplier = scaleToMultiplier;
    }
    if (multiplierScaleType) {
      result.multiplierScaleType = multiplierScaleType;
    }
    if (damageType) {
      // Skill types are only overridden for Dirty Trick.  That's very niche.
      // Assume PHY and BLK.
      result.overrideSkillType = damageType === 'physical' ? 'PHY' : 'BLK';
    }
    return result;
  }

AttackType
  = "group" / "random" / "single"

AttackModifiers
  = modifiers:(_ modifier:("hybrid" / "rang." / "ranged" / "jump") { return modifier; })* {
    return {
      hybrid: modifiers.indexOf('hybrid') !== -1,
      ranged: modifiers.indexOf('ranged') !== -1 || modifiers.indexOf('rang.') !== -1,
      jump: modifiers.indexOf('jump') !== -1,
    };
  }


MultiplierScaleType
  = "scaling" _ "with" _ "current"? _ "HP%" { return { type: 'percentHp' }; }
  / "scaling" _ "with" _ "targets" { return { type: 'convergent' }; }
  / "scaling" _ "with" _ stat:Stat { return { type: 'stat', stat }; }
  / "scaling" _ "with" _ "hits" _ "taken" { return { type: 'hitsTaken' }; }
  / "scaling" _ "with" _ school:School _ "abilities" _ "used" { return { type: 'abilitiesUsed', school }; }
  / "scaling" _ "with" _ element:Element _ "attacks" _ "used" { return { type: 'attacksUsed', element }; }
  / "scaling" _ "with" _ ("[Doom]" / "Doom") _ "timer," _ defaultMultiplier:DecimalNumber _ "default" { return { type: 'doomTimer', defaultMultiplier }; }
  / "scaling with LB gauge and LB honing level" { return { type: 'limitBreak' }; }


AttackExtras
  = extras:(("," / _ "and")? _ AttackExtra)* {
    // "and" likely means two clauses (e.g., AdditionalCrit and AdditionalCritDamage)
    // that share a condition clause.  We do not currently attempt to capture this;
    // our generated text makes it clear enough to a human.
    return extras.reduce((result, element) => Object.assign(result, element[2]), {});
  }

AttackExtra
  = AdditionalCritDamage
  / AdditionalCrit
  / AirTime
  / AlternateOverstrike
  / AlwaysCrits
  / AtkUpWithLowHp
  / AttackScaleType
  / AttackStatusChance
  / DamageModifier
  / FinisherPercent
  / FollowedByAttack
  / HitRate
  / MinDamage
  / OrMultiplier
  / OrNumAttacks
  / OverrideElement
  / PiercingDefRes
  / PiercingDef
  / PiercingRes
  / ScaleWithAtkAndDef
  / SBMultiplier

// Note: This goes before AdditionalCrit so that it can be greedy with matching "damage"
AdditionalCritDamage
  = additionalCritDamage:PercentSlashList _ ('additional' / 'add.') _ ('critical' / 'crit.') _ 'damage' condition:(_ Condition)? {
    return util.addCondition({ additionalCritDamage }, condition, 'additionalCritDamageCondition');
  }

AdditionalCrit
  = additionalCrit:PercentSlashList _ ('additional' / 'add.') _ ('critical' / 'crit.') _ 'chance'? condition:(_ Condition)? {
    return util.addCondition({ additionalCrit }, condition, 'additionalCritCondition');
  }

AirTime
  = "air" _ "time" _ "(" airTime:DecimalNumberSlashList _ "sec."? ")" _ condition:Condition? { return util.addCondition({ airTime }, condition, 'airTimeCondition'); }

// Alternate overstrike - appears within extras instead of immediately after
// attacks.  Seen in Cloud's SASB.
AlternateOverstrike
  = "capped" _ "at" _ "99999" { return { isOverstrike: true }; }

AlwaysCrits
  = "always" _ "deals" _ "a" _ "critical" _ "hit" { return { alwaysCrits: true }; }

AtkUpWithLowHp
  = "ATK" _ "increases" _ "as" _ "HP" _ "decrease" "s"? { return { atkUpWithLowHp: true }; }

AttackScaleType
  = scaleType:Condition { return { scaleType } };

AttackStatusChance
  // NOTE: This assumes that each skill only inflicts one status via its attack
  = chance:IntegerSlashList '%' _ "chance" _ "to" _ "cause" _ status:StatusName _ duration:Duration? _ condition:Condition? {
    return { status: util.addCondition({ status, chance, duration }, condition) };
  }

DamageModifier
  = damageModifier:IntegerWithNegativesSlashList "%" _ "more" _ "damage" _ condition:Condition { return { damageModifier, damageModifierCondition: condition }; }

FinisherPercent
  = "for" _ value:DecimalNumber "%" _ "of" _ "the" _ "damage" _ "dealt" _ "with" _ criteria:(SkillType / Element / School) _ ("attacks" / "abilities") _ "during" _ "the" _ "status" {
    return { finisherPercentDamage: value, finisherPercentCriteria: criteria };
  }

FollowedByAttack
  = "followed" _ "by" _ followedBy:SimpleAttack { return { followedBy }; }

HitRate
  = hitRate:Integer "%" _ "hit" _ "rate" { return { hitRate }; }
  // This variant is used for conditionally triggered follow-up attacks like Thief (I)'s AASB's Sneak
  / "(" hitRate:Integer "%" _ "hit" _ "rate" _ "if" _ "triggered)" { return { hitRate }; }

MinDamage
  // "SUM only" may be added for hybrid WHT/SUM skills, but it can be assumed, so we don't track it.
  = ("minimum" _ "damage" / "min.") _ minDamage:Integer (_ "(SUM only)")? { return { minDamage }; }

OrMultiplier
  = orMultiplier:DecimalNumberSlashList _ ("multiplier" / "mult." / "each") _ orMultiplierCondition:Condition {
    return { orMultiplier, orMultiplierCondition };
  }

OrNumAttacks
  = orNumAttacks:NumAttacks _ ("attacks") _ orNumAttacksCondition:Condition {
    return { orNumAttacks, orNumAttacksCondition };
  }

OverrideElement
  = "that" _ "deals" _ overrideElement:Element _ "damage" {
    return { overrideElement };
  }

PiercingDef
  = "ignores DEF" { return { isPiercingDef: true }; }

PiercingRes
  = "ignores RES" { return { isPiercingRes: true }; }

PiercingDefRes
  = ("ignores DEF/RES" / "ignores DEF and RES") { return { isPiercingDef: true, isPiercingRes: true }; }

ScaleWithAtkAndDef
  = "damage" _ "scales" _ "with" _ "both" _ "ATK" _ "and" _ "DEF" { return { scalesWithAtkAndDef: true }; }

ScalingOverstrike
  = "capped at" _ head:DamageCapValue tail:("/" DamageCapValue)+ { return { scalingOverstrike: util.pegList(head, tail, 1) }; }

SBMultiplier
  = "multiplier" _ verb:("increased" / "decreased") _ "by" _ value:DecimalNumber _ "for" _ "every" _ "SB" _ "point" {
    return { sbMultiplierChange: value * (verb === 'increased' ? 1 : -1) };
  }


// --------------------------------------------------------------------------
// Drain HP, recoil HP, HP-based attacks

DrainHp
  = ("heals" _ "to"? / "restores HP to") _ "the user for" _ healPercent:Integer "% of the damage dealt" _ condition:Condition? {
    return util.addCondition({
      type: 'drainHp',
      healPercent,
    }, condition);
  }

RecoilHp
  = "damages the user for" _ damagePercent:DecimalNumberPercentSlashList
  _ maxOrCurrent:((Maximum / "current") { return text().startsWith('max') ? 'max' : 'curr'; })
  _ "HP"
  _ condition:Condition? {
    return util.addCondition({
      type: 'recoilHp',
      damagePercent,
      maxOrCurrent,
    }, condition);
  }

RecoilSetHp
  = "sets the user's HP to" _ hp:Integer _ condition:Condition? {
    return util.addCondition({ type: 'recoilSetHp', hp }, condition);
  }

// New effect in December 2020 - make it strict until we've seen more use.
FixedRecoilHp
  = "deals" _ value:Integer _ skillType:SkillType _ ("physical" / "magical") _ "damage" _ who:Who {
    return {
      type: 'fixedRecoilHp',
      value,
      skillType,
      who,
    };
  }

GravityAttack
  = "damages"i _ "for"_ damagePercent:Integer "%" _ "of" _ "the" _ "target's" _ "current" _ "HP" {
    return { type: 'gravityAttack', damagePercent };
  }

// Minus Strike
HpAttack
  = "damages"i _ "for" _ multiplier:Integer _ "*" _ "(user's" _ Maximum _ "HP" _ "-" _ "user's" _ "current" _ "HP)" {
    return {
      type: 'hpAttack',
      multiplier
    }
  }


// --------------------------------------------------------------------------
// Healing

Revive
  = "removes"i _ "KO" _ "[Raise:" _ percentHp:Integer "%]" _ who:Who? {
    const result = {
      type: 'revive',
      percentHp,
    };
    if (who) {
      result.who = who;
    }
    return result;
  }

Heal
  = "restores"i _ amount:(
      "HP" _ "(" healFactor:DecimalNumberSlashList ")" { return { healFactor }; }
      / fixedHp:IntegerSlashList _ "HP" { return { fixedHp }; }
    ) _ who:Who? _ condition:Condition? _ perUses:PerUses? {
    return util.addCondition({
      type: 'heal',
      amount,
      who,
      perUses,
    }, condition);
  }

HealPercent
  = "restores"i _ "HP" _ who:Who? _ "for" _ healPercent:Integer "% of" _ ("the user's" / "the target's" / "their") _ Maximum _ "HP" {
    return {
      type: 'healPercent',
      healPercent,
      who,
    }
  }

DamagesUndead
  // Flexibility: Support both "undead" and "undeads"
  = 'damages' _ 'undead' 's'? {
    return { type: 'damagesUndead' };
  }

DispelOrEsuna
  = 'removes'i _ dispelOrEsuna:('negative' / 'positive') _ 'status'? _ 'effects' _ who:Who? _ perUses:PerUses? {
    return { type: 'dispelOrEsuna', dispelOrEsuna, who, perUses };
  }

RandomEther
  = "restores"i _ amount:Integer _ "consumed" _ "ability" _ "use" _ who:Who? _ perUses:PerUses? {
    return { type: 'randomEther', amount, who, perUses };
  }

SmartEther
  = status:SmartEtherStatus _ who:Who? _ perUses:PerUses? { return Object.assign({}, status, { who, perUses }); }


// --------------------------------------------------------------------------
// "Randomly casts"

// Cast a random spell / skill from a short list
RandomCastAbility
  = "randomly"i _ "casts" _ abilities:RandomAbilityList { return { type: 'randomCastAbility', abilities }; }

RandomAbilityList
  = head:RandomAbility tail:(OrList RandomAbility)* { return util.pegList(head, tail, 1); }

RandomAbility
  = ability:AbilityName _ chance:("(" Integer "%)")? {
    return {
      ability,
      chance: chance ? chance[1] : undefined
    };
  }

// Gau's Rage - use a random Other skill
RandomCastOther
  = "casts"i _ "a" _ "random" _ other:AnySkillName _ "attack" { return { type: 'randomCastOther', other }; }


// --------------------------------------------------------------------------
// Specialty: chains, mimics

Chain
  = "activates"i _ chainType:[a-zA-Z0-9-]+ _ "Chain" _ "(max" _ max:Integer "," _ "field" _ fieldBonus:SignedInteger "%)" {
    return {
      type: 'chain',
      chainType: chainType.join(''),
      max,
      fieldBonus,
    }
  }

Mimic
  = chance:(c:Integer "%" _ "chance" _ "to" _ { return c; })? "cast"i "s"? _ "the" _ "last" _ "ability" _ "used" _ "by" _ "an" _ "ally" _ occurrence:Occurrence?
  "," _ "default" _ "ability" _ "(PHY:" _ "single," _ defaultPower:DecimalNumber _ "physical" defaultCritChance:("," _ c:Integer _ "%" _ "critical" _ "chance" { return c; })? ")" {
    const result = {
      type: 'mimic',
      count: occurrence,
      defaultPower
    };
    if (chance) {
      result.chance = chance;
    }
    if (defaultCritChance) {
      result.defaultCritChance = defaultCritChance;
    }
    return result;
  }


// --------------------------------------------------------------------------
// Status effects

StatusEffect
  = verb:StatusVerb _ all:"all"? _ statuses:StatusList statusClauses:StatusClause* {
    const result = { type: 'status', verb, statuses };
    if (all) {
      result.all = true;
    }
    for (const i of statusClauses) {
      Object.assign(result, i);
    }
    if (result.duration) {
      util.applyDuration(result.statuses, result.duration);
      delete result.duration;
    }
    return result;
  }

// Special case: Some Imperil soul breaks (e.g., Climhazzard Xeno, Ragnarok
// Buster, Whirling Lance) and many stat mods omit "causes" or "grants".
ImplicitStatusEffect
  = & "[" statuses:StatusList statusClauses:StatusClause* {
    const result = { type: 'status', statuses };
    for (const i of statusClauses) {
      Object.assign(result, i);
    }
    if (result.duration) {
      util.applyDuration(result.statuses, result.duration);
      delete result.duration;
    }
    return result;
  }

SetStatusLevel
  = "set"i _ status:StatusNameNoBrackets _ "level" _ "to" _ value:Integer {
    return { type: 'setStatusLevel', status, value };
  }

RandomStatusEffect
  = "randomly"i _ verb:StatusVerb _ head:RandomStatusList tail:(_ "or" _ RandomStatusList)+ {
    return { type: 'randomStatus', verb, statuses: util.pegList(head, tail, 3) };
  }

RandomStatusList
  = head:StatusItem tail:(AndList StatusItem)* _ "(" chance:Integer "%)" _ who:Who? {
    return { status: util.pegList(head, tail, 1, true), chance, who };
  }


// --------------------------------------------------------------------------
// Miscellaneous

Entrust
  = "transfers"i _ "the user's" _ SB _ "points to the target" max:(" (maximum of" _ max:Integer _ "Soul Break points)" { return max; })?{ return { type: 'entrust', max }; }

GainSB
  = "grants"i _ points:Integer _ SB _ "points" _ who:Who? { return { type: 'gainSB', points, who }; }

GainSBOnSuccess
  = "grants"i _ points:Integer _ SB _ "points" _ who:Who? _ "if" _ "successful" "?"? { return { type: 'gainSBOnSuccess', points, who }; }

ResetIfKO
  = "resets" _ "if" _ "KO'd" { return { type: 'resetIfKO' }; }

ResistViaKO
  = "resisted" _ "via" _ "Instant" _ "KO" { return { type: 'resistViaKO' }; }

Reset
  = "reset" { return { type: 'reset' }; }

CastTime
  = "cast" _ "time" _ castTime:DecimalNumberSlashList _ condition:Condition { return { type: 'castTime', castTime, condition }; }

CastTimePerUse
  = "cast" _ "time" _ "-" castTime:DecimalNumber _ "for" _ "each" _ "previous" _ "use" { return { type: 'castTimePerUse', castTimePerUse: -castTime }; }

// Hit rate not associated with an attack
StandaloneAttackExtra
  = extra:AttackExtra { return { type: 'attackExtra', extra }; }

// Arbitrary random skills.  Rather than updating our skill formatting to handle
// everything, we individually list any we need to support.
RandomSkillEffect
  = "Randomly" _ head:RandomSkillEffectClause tail:(("," / _ "or") _ RandomSkillEffectClause)+ {
    return { type: 'randomSkillEffect', effects: util.pegList(head, tail, 2) };
  }

RandomSkillEffectClause = effect:(Heal) _ "(" chance:Integer "%)" { return { effect, chance }; }


// --------------------------------------------------------------------------
// Common status logic (shared between skillParser and statusParser)

StatusClause
  = _ clause:(
    duration:Duration { return { duration }; }
    / who:Who ("," _ / _ "and") _ toCharacter:CharacterNameAndList ", if in the party," ? { return { who, toCharacter }; } // See, e.g., Ward SASB
    / who:WhoList { return { who }; }
    / who:Who { return { who }; }
    / "to" _ toCharacter:CharacterNameAndList { return { toCharacter }; }
    / perUses:PerUses { return { perUses }; }
    / "if successful" { return { ifSuccessful: true }; }
    / "to undeads" { return { ifUndead: true }; }
    / condition:Condition { return { condition }; }
    / ConditionDetail { return {}; }
  ) {
    return clause;
  }

StatusList
  = head:StatusWithPercent tail:(!NextClause conj:StatusListConjunction status:StatusWithPercent { return { ...status, conj }; })* {
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
  / "scaling with" _ ("uses" / "activations") { return { type: 'scaleWithUses' }; }
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
  / "if" _ count:IntegerSlashList "+"? _ ("females" / "female allies") _ "are alive" { return { type: 'femalesAlive', count }; }
  / "if" _ count:Integer _ "or more female allies are alive" { return { type: 'femalesAlive', count, plus: true }; }
  / "if" _ "there" _ "are" _ count:IntegerSlashList "+"? _ realm:Realm _ "characters" _ "in" _ "the" _ "party" { return { type: 'realmCharactersInParty', realm, count }; }
  / "if" _ count:IntegerRangeSlashList plus:"+"? _ realm:Realm _ ("characters are alive" / "character is alive" / "allies are alive" / "members are alive") { return { type: 'realmCharactersAlive', realm, count, plus: !!plus }; }
  / "if" _ count:Integer _ "or more females are in the party" { return { type: 'femalesInParty', count }; }
  / "if" _ count:IntegerSlashList "+"? _ "party" _ "members" _ "are" _ "alive" { return { type: 'charactersAlive', count }; }

  / "if" _ count:IntegerSlashList _ "allies" _ "in" _ "air" { return { type: 'alliesJump', count }; }

  / "if" _ "the" _ "user's" _ ("[Doom]" / "Doom") _ "timer" _ "is" _ "below" _ value:IntegerSlashList { return { type: 'doomTimer', value }; }
  / "if" _ "the" _ "user's" _ "HP" _ ("is" / "are") _ "below" _ value:IntegerSlashList "%" { return { type: 'hpBelowPercent', value }; }
  / "if" _ "the" _ "user's" _ "HP" _ ("is" / "are") _ "at" _ "least" _ value:IntegerSlashList "%" { return { type: 'hpAtLeastPercent', value }; }
  / "if" _ "the"? _ "user" _ "has" _ value:IntegerSlashListOrRange plus:"+"? _ SB _ "points" { return { type: 'soulBreakPoints', value, plus: !!plus }; }

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

NextClause
  = "," _ ("grants" / "causes" / "removes" / "doesn't" _ "remove"
      / "restores" _ "HP"
      / "damages" _ "the" _ "user"
      / "heals" _ "the" _ "user"
      / "casts" _ "the" _ "last" _ "ability" _ "used" _ "by" _ "an" _ "ally"
      / "reset"
  )

Who
  = ("to" / "from") _ who:WhoClause { return who; }

WhoClause
  = "the"? _ "user" { return 'self'; }
  / "the"? _ "user" { return 'self'; }
  / "the target" { return 'target'; }
  / "all enemies" { return 'enemies'; }
  / "a single ally" { return 'ally'; }
  / "all allies" row:(_ "in the" _ row:("front" / "back" / "character's") _ "row" { return row === "character's" ? 'sameRow' : row + 'Row'; })? {
    return row || 'party';
  }
  / "allies in the same row" { return 'sameRow'; }
  / "the lowest HP% ally" { return 'lowestHpAlly'; }
  / "a random ally without status" { return 'allyWithoutStatus'; }
  / "a random ally with negative" _ "status"? _ "effects" { return 'allyWithNegativeStatus'; }
  / "a random ally with KO" { return 'allyWithKO'; }

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

ElementList "element list"
  = head:Element tail:(OrList Element)* { return util.pegList(head, tail, 1, true); }

ElementSlashList "element list"
  = head:Element tail:("/" Element)* { return util.pegList(head, tail, 1, true); }

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

AndList
  = (',' _ 'and'? _) / (_ 'and' _)

OrList
  = (',' _ 'or'? _) / (_ 'or' _)

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


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

PercentInteger "percentage"
  = ([0-9]+ '%' / '?') { return parseInt(text(), 10); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }

IntegerWithNegatives "integer (optionally negative)"
  = sign:'-'? value:[0-9]+ { return parseInt(text(), 10); }


DecimalNumberSlashList "slash-separated decimal numbers"
  = head:DecimalNumber tail:('/' DecimalNumber)* { return util.pegSlashList(head, tail); }

DecimalNumberPercentSlashList "slash-separated decimal numbers"
  = head:DecimalNumber '%'? tail:('/' DecimalNumber '%'?)* { return util.pegSlashList(head, tail); }

IntegerSlashList "slash-separated integers"
  = head:Integer tail:('/' Integer)* { return util.pegSlashList(head, tail); }

IntegerSlashListOrRange "slash-separated integers or range"
  = from:Integer "-" to:Integer { return { from, to }; }
  / IntegerSlashList

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

IntegerWithNegativesSlashList "slash-separated integers (optionally negative)"
  = head:IntegerWithNegatives tail:('/' IntegerWithNegatives)* { return util.pegSlashList(head, tail); }


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


UppercaseWord
  = [A-Z] [A-Za-z]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
