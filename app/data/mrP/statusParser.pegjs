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
}

StatusEffect
  = head:EffectClause tail:(',' _ EffectClause)* {
    return util.pegList(head, tail, 2);
  }
  / "" { return []; }

EffectClause
  = StatMod / CritChance / StatusChance
  / CastSpeed
  / ElementBuff / ElementDebuff / ElementBlink / ElementResist / EnElement / EnElementWithStacking / LoseEnElement / LoseAnyEnElement
  / AbilityDouble
  / CastSkill / GrantStatus
  / ImmuneAttackSkills / ImmuneAttacks
  / TurnDuration
  / BurstToggle / SkillCounter / BurstOnly / BurstReset / Ai


// --------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatList _ value:SignedIntegerOrX "%" ignoreBuffCaps:(_ "(ignoring the buff stacking caps)")? {
    const result = { type: 'statMod', value };
    if (ignoreBuffCaps) {
      result.ignoreBuffCaps = true;
    }
    return result;
  }

CritChance
  = "Critical chance =" value:IntegerOrX "%" { return { type: 'critChance', value }; }

StatusChance
  = "Increases the chance of inflicting Status by" _ value:IntegerOrX "%" { return { type: 'statusChance', value }; }


// --------------------------------------------------------------------------
// Cast speed

CastSpeed
  = "Cast"i _ "speed x" value:DecimalNumber { return { type: 'castSpeed', value }; }


// --------------------------------------------------------------------------
// Element buffs and debuffs

ElementBuff
  = "Increases"i _ element:Element _ "damage dealt by" _ value:Integer _ "%, cumulable" { return { type: 'elementAttack', element, value, cumulable: true }; }

ElementDebuff
  = "Reduces"i _ element:Element _ "damage dealt by" _ value:Integer _ "%, cumulable" { return { type: 'elementAttack', element, value: -value, cumulable: true }; }

ElementBlink
  = "Reduces"i _ "the damage of the next attack that deals" _ element:Element _ "damage to 0" { return { type: 'elementBlink', element, level: 1 }; }

ElementResist
  = element:Element _ "Resistance" _ value:SignedIntegerOrX "%" cumulable:("," _ "cumulable")? { return { type: 'elementResist', value, cumulable: !!cumulable }; }

EnElement
  = "Replaces Attack command, increases" _ element:Element _ "damage dealt by 50/80/120% (abilities) or 80/100/120% (Soul Breaks)," _ element2:Element _ "resistance +20%" {
    return { type: 'enElement', element };
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
// Abilities

AbilityDouble
  = "dualcasts" _ school:School _ "abilities consuming an extra ability use" { return { type: 'abilityDouble', school }; }


// --------------------------------------------------------------------------
// Abilities and status effects

CastSkill
  = "casts"i _ skill:AnySkillName _ trigger:Trigger? _ condition:Condition? { return util.addCondition({ type: 'castSkill', skill, trigger }, condition); }

GrantStatus
  = "grants"i _ status:StatusName _ trigger:Trigger? _ condition:Condition? { return util.addCondition({ type: 'grantsStatus', status, trigger }, condition); }


// --------------------------------------------------------------------------
// Unique statuses

ImmuneAttackSkills
  = "Can't be hit by" _ nonRanged:("non-ranged")? _ skillType:SkillTypeList _ "attacks" {
    return {
      type: 'immune',
      attacks: true,
      skillType,
      nonRanged: !!nonRanged
    }
  }

ImmuneAttacks
  = "Can't be hit by any attack" {
    return {
      type: 'immune',
      attacks: true,
    }
  }


// --------------------------------------------------------------------------
// Special durations

TurnDuration
  = "lasts for" _ value:Integer _ "turn" "s"? { return { type: 'duration', duration: { value, units: 'turns' } }; }


// --------------------------------------------------------------------------
// Other

BurstToggle
  = "Affects"i _ "certain Burst Commands"

SkillCounter
  = "Keeps"i _ "track of the number of uses of" _ skill:AnySkillName { return { type: 'skillCounter', skill }; }

BurstOnly
  = "removed if the user hasn't Burst Mode" { return { type: 'burstOnly' }; }

BurstReset
  = "reset upon refreshing Burst Mode" { return { type: 'burstReset' }; }

Ai
  = "Affects"i _ GenericName _ "behaviour" { return { type: 'ai' }; }


// --------------------------------------------------------------------------
// Triggers

Trigger
  = "after using" _ count:ArticleOrNumberString _ element:ElementList _ "attack" "s"? { return { type: 'elementAttack', element }; }
  / "after using" _ count:ArticleOrNumberString _ ("ability" / "abilities") { return { type: 'anyAbility', count }; }
  / "after using" _ count:ArticleOrNumberString _ school:SchoolList _ ("ability" / "abilities") { return { type: 'schoolAbility', school, count }; }


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

  / "at" _ "rank" _ "1/2/3/4/5" _ "of" _ "the" _ "triggering" _ "ability" { return { type: 'rankBased' }; }

  // Alternate status phrasing.  For example, Stone Press:
  // "One single attack (3.00/4.00/7.00) capped at 99999 at Heavy Charge 0/1/2")
  / "at" _ status:StatusName { return { type: 'status', status, who: 'self' }; }

  // Stat thresolds (e.g., Tiamat, Guardbringer)
  / "at" _ value:IntegerSlashList _ stat:Stat { return { type: 'statThreshold', stat, value }; }


// --------------------------------------------------------------------------
// Lower-level game rules

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

Stat "stat"
  = ("ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA") {
    return text().toLowerCase();
  }

StatList "stat list"
  = head:Stat tail:(AndList Stat)* { return util.pegList(head, tail, 1, true); }

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


UppercaseWord
  = [A-Z] [A-Za-z]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
