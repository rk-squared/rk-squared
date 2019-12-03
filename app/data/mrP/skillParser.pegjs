{
  let parsedNumberString = null;

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
  / DrainHp / RecoilHp / HpAttack / GravityAttack
  / Revive / Heal / HealPercent / DamagesUndead / DispelOrEsuna / RandomEther / SmartEther
  / RandomCastAbility / RandomCastOther / Chain / Mimic
  / StatMod / StatusEffect / ImperilStatusEffect / SetStatusLevel
  / Entrust / GainSBOnSuccess / GainSB / ResetIfKO / ResistViaKO / Reset
  / CastTime / CastTimePerUse / StandaloneAttackExtra

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
    _ overstrike:(","? _ "capped" _ "at" _ "99999")?
    _ isPiercingDef:(_ "that" _ "ignores" _ "DEF")?
    _ isPiercingRes:(_ "that" _ "ignores" _ "RES")? {
    const result = Object.assign({
      type: 'attack',
      numAttacks,
    }, attackMultiplierGroup || {});
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

RandomOneAttack
  = value:NumberString _ chance:("(" c:Integer "%)" { return c; }) { return [value, chance]; }
  / NumberString

AttackMultiplierGroup
  = randomAttackMultiplier:("randomly" _)?
    attackMultiplier:DecimalNumberSlashList
    hybridMultiplier:(_ "or" _ n:DecimalNumber { return n; })?
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
  / "scaling" _ "with" _ "Doom" _ "timer," _ defaultMultiplier:DecimalNumber _ "default" { return { type: 'doomTimer', defaultMultiplier }; }


AttackExtras
  = extras:(","? _ AttackExtra)* {
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
  / PiercingDef
  / PiercingRes
  / ScaleWithAtkAndDef
  / SBMultiplier

// Note: This goes before AdditionalCrit so that it can be greedy with matching "damage"
AdditionalCritDamage
  = additionalCritDamage:IntegerSlashList '%' _ ('additional' / 'add.') _ ('critical' / 'crit.') _ 'damage' condition:(_ Condition)? {
    return util.addCondition({ additionalCritDamage }, condition, 'additionalCritDamageCondition');
  }

AdditionalCrit
  = additionalCrit:IntegerSlashList '%' _ ('additional' / 'add.') _ ('critical' / 'crit.') _ 'chance'? condition:(_ Condition)? {
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
  = ("minimum" _ "damage" / "min.") _ minDamage:Integer { return { minDamage }; }

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
  = "ignores" _ "DEF" { return { isPiercingDef: true }; }

PiercingRes
  = "ignores" _ "RES" { return { isPiercingRes: true }; }

ScaleWithAtkAndDef
  = "damage" _ "scales" _ "with" _ "both" _ "ATK" _ "and" _ "DEF" { return { scalesWithAtkAndDef: true }; }

SBMultiplier
  = "multiplier" _ verb:("increased" / "decreased") _ "by" _ value:DecimalNumber _ "for" _ "every" _ "SB" _ "point" {
    return { sbMultiplierChange: value * (verb === 'increased' ? 1 : -1) };
  }


// --------------------------------------------------------------------------
// Drain HP, recoil HP, HP-based attacks

DrainHp
  = ("heals" _ "to"? / "restores" _ "HP" _ "to") _ "the" _ "user" _ "for" _ healPercent:Integer "%" _ "of" _ "the" _ "damage" _ "dealt" _ condition:Condition? {
    return util.addCondition({
      type: 'drainHp',
      healPercent,
    }, condition);
  }

RecoilHp
  = "damages" _ "the" _ "user" _ "for" _ damagePercent:DecimalNumberSlashList "%"
  _ maxOrCurrent:((Maximum / "current") { return text().startsWith('max') ? 'max' : 'curr'; })
  _ "HP"
  _ condition:Condition? {
    return util.addCondition({
      type: 'recoilHp',
      damagePercent,
      maxOrCurrent,
    }, condition);
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
  = "removes"i _ "KO" _ "(" percentHp:Integer "%" _ "HP)" _ who:Who? {
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
      "HP" _ "(" healFactor:IntegerSlashList ")" { return { healFactor }; }
      / fixedHp:IntegerSlashList _ "HP" { return { fixedHp }; }
    ) _ who:Who? _ condition:Condition? {
    return util.addCondition({
      type: 'heal',
      amount,
      who,
    }, condition);
  }

HealPercent
  = "restores"i _ "HP" _ who:Who? _ "for" _ healPercent:Integer "%" _ "of" _ ("the" _ "user's" / "the" _ "target's" / "their") _ Maximum _ "HP" {
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
  = 'removes'i _ dispelOrEsuna:('negative' / 'positive') _ 'status'? _ 'effects' _ who:Who? {
    return { type: 'dispelOrEsuna', dispelOrEsuna, who };
  }

RandomEther
  = "restores"i _ amount:Integer _ "consumed" _ "ability" _ "use" _ who:Who? {
    return { type: 'randomEther', amount, who };
  }

SmartEther
  = status:SmartEtherStatus _ who:Who? { return Object.assign({}, status, { who }); }

SmartEtherStatus
  = school:School? _ "smart"i _ "ether" _ amount:IntegerSlashList {
    const result = { type: 'smartEther', amount };
    if (school) {
      result.school = school;
    }
    return result;
  }


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
  = verb:StatusVerb _ all:"all"? _ statuses:StatusList {
    const result = { type: 'status', verb, statuses };
    if (all) {
      result.all = true;
    }
    return result;
  }

StatusVerb
  = ("grants"i / "causes"i / "removes"i / "doesn't"i _ "remove") {
    return text().toLowerCase().replace(/\s+/g, ' ');
  }

StatusList
  = head:StatusWithPercent tail:(!NextClause AndList StatusWithPercent)* {
    return util.pegList(head, tail, 2);
  }

StatusWithPercent
  = status:(SmartEtherStatus / StatusLevel / StatusName)
    chance:(_ '(' chanceValue:Integer '%)' { return chanceValue; } )?
    statusClauses:StatusClause*
  {
    const result = {
      status
    };
    if (chance) {
      result.chance = chance;
    }
    for (const i of statusClauses) {
      Object.assign(result, i);
    }
    return result;
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

StatusLevel "status with level"
  = status:StatusName _ "level" _ value:Integer {
    return { type:'statusLevel', status, value };
  }

StatusClause
  = _ clause:(
    duration:Duration { return { duration }; }
    // As a special case, if who isn't followed by a duration, it may
    // apparently apply to previous statuses (so previous statuses can look
    // ahead to this one), while a who that is followed by a duration cannot.
    // See, e.g., Desch SSB or Sarah BSB.
    / who:Who ! (_ Duration) { return { who, whoAllowsLookahead: true }; }
    / who:Who { return { who }; }
    // Flexibility: Support both "two uses" and "second use"
    / "every" _ ("two" _ "uses" / "second" _ "use") { return { perUses: 2 }; }
    / "if" _ "successful" { return { ifSuccessful: true }; }
    / "to" _ "undeads" { return { ifUndead: true }; }
    / condition:Condition { return { condition }; }
  ) {
    return clause;
  }

// Special case: Some Imperil soul breaks omit "causes".  See Climhazzard Xeno,
// Ragnarok Buster, Whirling Lance
ImperilStatusEffect
  = & "Imperil" statuses:StatusList {
    return { type: 'status', verb: 'causes', statuses };
  }

SetStatusLevel
  = "set"i _ status:StatusName _ "level" _ "to" _ value:Integer {
    return { type: 'setStatusLevel', status, value };
  }


// --------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatList _ percent:SignedIntegerSlashList '%' statModClauses:StatModClause* {
    const result = {
      type: 'statMod',
      stats,
      percent,
    };
    for (const i of statModClauses) {
      Object.assign(result, i);
    }
    return result;
  }

StatList
  = HybridStatSet
  / head:Stat tail:(AndList Stat)* {
    return util.pegList(head, tail, 1);
  }

HybridStatSet
  = stat1:Stat stat2:('/' Stat)* _ "or" _ stat3:Stat stat4:('/' Stat)* {
    return [util.pegList(stat1, stat2, 1), util.pegList(stat3, stat4, 1)];
  }

StatModClause
  = _ clause:(
    duration:Duration { return { duration }; }
    / who:Who { return { who }; }
    / condition:Condition { return { condition }; }
  ) {
    return clause;
  }


// --------------------------------------------------------------------------
// Miscellaneous

Entrust
  = "transfers"i _ "the" _ "user's" _ SB _ "points" _ "to" _ "the" _ "target" { return { type: 'entrust' }; }

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


// --------------------------------------------------------------------------
// Lower-level game rules

// These probably don't cover all abilities and characters, but it works for now.
AbilityName
  = UppercaseWord (_ UppercaseWord)* { return text(); }
CharacterName
  = UppercaseWord (_ (UppercaseWord / "of"))* (_ "(" [A-Z] [A-Za-z0-9-]+ ")")? { return text(); }

// Character names, for "if X are in the party."  Return these as text so that
// higher-level code can process them.
CharacterNameList
  = CharacterName ((_ "&" _ / "/" / _ "or" _) CharacterName)* { return text(); }

// Any skill - burst commands, etc.
AnySkillName
  = GenericName

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
        // "for" in particular needs extra logic to ensure that it's part of
        // status words instead of part of the duration.
        / "for" _ GenericNameWord

        / SignedIntegerSlashList [%+]?
        / [=*]? IntegerSlashList [%+]?
        / '(' [A-Za-z-0-9/]+ ')'
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
  / "if" _ value:IntegerSlashList _ "damage" _ "was" _ "dealt" _ "during" _ "the" _ "status" { return { type: 'damageDuringStatus', value }; }
  / "if" _ "the" _ "user" _ "dealt" _ value:IntegerSlashList _ "damage" _ "during" _ "the" _ "status" { return { type: 'damageDuringStatus', value }; }
  // Alternate phrasing - this appears to be an error, so we smooth it out. TODO: Fix upstream.
  / "scaling" _ "with" _ school:School _ "attacks" _ "used" _ "(" _ count:IntegerSlashList _ ")" { return { type: 'abilitiesUsed', count, school }; }

  / "at" _ "rank" _ "1/2/3/4/5" _ "of" _ "the" _ "triggering" _ "ability" { return { type: 'rankBased' }; }

  // Alternate status phrasing.  For example, Stone Press:
  // "One single attack (3.00/4.00/7.00) capped at 99999 at Heavy Charge 0/1/2")
  / "at" _ status:StatusName { return { type: 'status', status, who: 'self' }; }

  // Stat thresolds (e.g., Tiamat, Guardbringer)
  / "at" _ value:IntegerSlashList _ stat:Stat { return { type: 'statThreshold', stat, value }; }

SkillType "skill type"
  = "PHY"
  / "WHT"
  / "BLK"
  / "BLU"
  / "SUM"
  / "NAT"
  / "NIN"

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
  / "Dark"
  / "Poison"
  / "NE"

ElementList "element list"
  = head:Element tail:(OrList Element)* { return util.pegList(head, tail, 1, true); }

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

SchoolList "element list"
  = head:School tail:(OrList School)* { return util.pegList(head, tail, 1, true); }

SB = "Soul" _ "Break" / "SB"
Maximum = "maximum" / "max" "."?

// "x + yn"
UseCount = x:IntegerSlashList y:(_ "+" _ y:Integer _ "n" { return y; }) { return { x, y }; }


// --------------------------------------------------------------------------
// Primitive types

AndList
  = (',' _ 'and'? _) / (_ 'and' _)

OrList
  = (',' _ 'or'? _) / (_ 'or' _)

NumberString "numeric text"
  = numberString:[a-zA-Z\-]+
  & { parsedNumberString = util.parseNumberString(numberString.join('')); return parsedNumberString != null; }
  { return parsedNumberString; }


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }

IntegerWithNegatives "integer (optionally negative)"
  = sign:'-'? value:[0-9]+ { return parseInt(text(), 10); }


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

IntegerWithNegativesSlashList "slash-separated integers (optionally negative)"
  = head:IntegerWithNegatives tail:('/' IntegerWithNegatives)* { return util.pegSlashList(head, tail); }


IntegerAndList "integers separated with commas and 'and'"
  = head:Integer tail:((','? _ 'and' _ /',' _) Integer)* { return util.pegSlashList(head, tail); }


Occurrence
  = "once" { return 1; }
  / "twice" { return 2; }
  / count:NumberString _ "time" "s"? { return count; }


UppercaseWord
  = [A-Z] [A-Za-z]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
